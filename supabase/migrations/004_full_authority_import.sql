-- PSYWORLD V24 — migração única do save legado para estado autoritativo

alter table public.players add column if not exists psycoin bigint not null default 0 check (psycoin >= 0);
alter table public.players add column if not exists authority_version integer not null default 0;
alter table public.players add column if not exists authority_activated_at timestamptz;

alter table public.wallet_ledger drop constraint if exists wallet_ledger_currency_check;
alter table public.wallet_ledger add constraint wallet_ledger_currency_check check (currency in ('gold','diamonds','psycoin'));

create or replace function public.import_full_legacy_save_once(
  p_user uuid,
  p_trainer_name text,
  p_trainer_level integer,
  p_trainer_xp bigint,
  p_gold bigint,
  p_diamonds bigint,
  p_psycoin bigint,
  p_inventory jsonb,
  p_pokemon jsonb
) returns jsonb
language plpgsql security definer set search_path=public
as $$
declare
  inv record;
  mon jsonb;
  imported_items integer:=0;
  imported_pokemon integer:=0;
  v_uid uuid;
  v_species integer;
begin
  insert into players(user_id,trainer_name)
  values(p_user,left(coalesce(nullif(p_trainer_name,''),'Trainer'),32))
  on conflict(user_id) do nothing;

  perform 1 from players where user_id=p_user for update;

  if exists(select 1 from players where user_id=p_user and authority_version>=1) then
    raise exception 'authority import already completed';
  end if;

  update players set
    trainer_name=left(coalesce(nullif(p_trainer_name,''),'Trainer'),32),
    trainer_level=greatest(1,least(coalesce(p_trainer_level,1),10000)),
    trainer_xp=greatest(0,coalesce(p_trainer_xp,0)),
    gold=greatest(0,coalesce(p_gold,0)),
    diamonds=greatest(0,coalesce(p_diamonds,0)),
    psycoin=greatest(0,coalesce(p_psycoin,0)),
    legacy_imported_at=coalesce(legacy_imported_at,now()),
    authority_version=1,
    authority_activated_at=now(),
    updated_at=now()
  where user_id=p_user;

  delete from player_inventory where user_id=p_user;
  if jsonb_typeof(p_inventory)='object' then
    for inv in select key,value from jsonb_each(p_inventory) loop
      if length(inv.key) between 1 and 120 and jsonb_typeof(inv.value)='number' then
        insert into player_inventory(user_id,item_key,quantity)
        values(p_user,inv.key,greatest(0,least((inv.value::text)::bigint,1000000000)))
        on conflict(user_id,item_key) do update set quantity=excluded.quantity,updated_at=now();
        imported_items:=imported_items+1;
      end if;
    end loop;
  end if;

  delete from player_pokemon where owner_id=p_user and locked_reason is null;
  if jsonb_typeof(p_pokemon)='array' then
    for mon in select value from jsonb_array_elements(p_pokemon) loop
      begin
        v_species:=greatest(1,least(coalesce((mon->>'id')::integer,(mon->>'species_id')::integer,1),100000));
      exception when others then
        v_species:=1;
      end;
      begin
        v_uid:=coalesce(nullif(mon->>'pokemon_uid','')::uuid,gen_random_uuid());
      exception when others then
        v_uid:=gen_random_uuid();
      end;
      insert into player_pokemon(
        pokemon_uid,owner_id,species_id,level,xp,shiny,mega_form,tier,rarity,resets,data
      ) values(
        v_uid,p_user,v_species,
        greatest(1,least(coalesce((mon->>'level')::integer,1),10000)),
        greatest(0,coalesce((mon->>'xp')::bigint,0)),
        coalesce((mon->>'shiny')::boolean,false),
        nullif(mon->>'megaForm',''),
        left(coalesce(nullif(mon->>'tier',''),'E'),16),
        left(coalesce(nullif(mon#>>'{rarity,n}',''),nullif(mon->>'rarity',''),'Lixo'),32),
        greatest(0,coalesce((mon->>'resets')::integer,0)),
        mon
      )
      on conflict(pokemon_uid) do update set
        owner_id=excluded.owner_id,species_id=excluded.species_id,level=excluded.level,xp=excluded.xp,
        shiny=excluded.shiny,mega_form=excluded.mega_form,tier=excluded.tier,rarity=excluded.rarity,
        resets=excluded.resets,data=excluded.data,updated_at=now();
      imported_pokemon:=imported_pokemon+1;
    end loop;
  end if;

  insert into wallet_ledger(user_id,currency,amount,reason,reference_id,idempotency_key,balance_after)
  values
    (p_user,'gold',greatest(0,coalesce(p_gold,0)),'authority_import','v24','authority-v24-gold',greatest(0,coalesce(p_gold,0))),
    (p_user,'diamonds',greatest(0,coalesce(p_diamonds,0)),'authority_import','v24','authority-v24-diamonds',greatest(0,coalesce(p_diamonds,0))),
    (p_user,'psycoin',greatest(0,coalesce(p_psycoin,0)),'authority_import','v24','authority-v24-psycoin',greatest(0,coalesce(p_psycoin,0)))
  on conflict(user_id,idempotency_key) do nothing;

  return jsonb_build_object(
    'ok',true,
    'authority_version',1,
    'items',imported_items,
    'pokemon',imported_pokemon
  );
end $$;

revoke execute on function public.import_full_legacy_save_once(uuid,text,integer,bigint,bigint,bigint,bigint,jsonb,jsonb) from public,anon,authenticated;

create or replace function public.apply_wallet_delta_v24(
  p_user uuid,p_currency text,p_amount bigint,p_reason text,p_reference text,p_idempotency text
) returns bigint
language plpgsql security definer set search_path=public
as $$
declare v_balance bigint;
begin
  if p_currency not in ('gold','diamonds','psycoin') then raise exception 'invalid currency'; end if;
  select balance_after into v_balance from wallet_ledger where user_id=p_user and idempotency_key=p_idempotency;
  if found then return v_balance; end if;

  if p_currency='gold' then
    update players set gold=gold+p_amount,updated_at=now() where user_id=p_user and gold+p_amount>=0 returning gold into v_balance;
  elsif p_currency='diamonds' then
    update players set diamonds=diamonds+p_amount,updated_at=now() where user_id=p_user and diamonds+p_amount>=0 returning diamonds into v_balance;
  else
    update players set psycoin=psycoin+p_amount,updated_at=now() where user_id=p_user and psycoin+p_amount>=0 returning psycoin into v_balance;
  end if;

  if v_balance is null then raise exception 'insufficient balance or missing player'; end if;
  insert into wallet_ledger(user_id,currency,amount,reason,reference_id,idempotency_key,balance_after)
  values(p_user,p_currency,p_amount,p_reason,p_reference,p_idempotency,v_balance);
  return v_balance;
end $$;

revoke execute on function public.apply_wallet_delta_v24(uuid,text,bigint,text,text,text) from public,anon,authenticated;
