-- PSYWORLD V26 — security lint follow-up
create or replace function public.psy_v26_canonical_type(p_type text) returns text
language sql immutable
set search_path=public,pg_temp
as $$
  select case lower(trim(coalesce(p_type,'normal')))
    when 'normal' then 'Normal'
    when 'fire' then 'Fire' when 'fogo' then 'Fire'
    when 'water' then 'Water' when 'agua' then 'Water' when 'água' then 'Water'
    when 'grass' then 'Grass' when 'planta' then 'Grass' when 'natureza' then 'Grass'
    when 'electric' then 'Electric' when 'eletrico' then 'Electric' when 'elétrico' then 'Electric'
    when 'ice' then 'Ice' when 'gelo' then 'Ice'
    when 'fighting' then 'Fighting' when 'lutador' then 'Fighting'
    when 'poison' then 'Poison' when 'veneno' then 'Poison' when 'venenoso' then 'Poison'
    when 'ground' then 'Ground' when 'terra' then 'Ground'
    when 'flying' then 'Flying' when 'voador' then 'Flying'
    when 'psychic' then 'Psychic' when 'psiquico' then 'Psychic' when 'psíquico' then 'Psychic'
    when 'bug' then 'Bug' when 'inseto' then 'Bug'
    when 'rock' then 'Rock' when 'pedra' then 'Rock'
    when 'ghost' then 'Ghost' when 'fantasma' then 'Ghost'
    when 'dragon' then 'Dragon' when 'dragao' then 'Dragon' when 'dragão' then 'Dragon'
    when 'dark' then 'Dark' when 'sombrio' then 'Dark' when 'noturno' then 'Dark'
    when 'steel' then 'Steel' when 'metal' then 'Steel' when 'aco' then 'Steel' when 'aço' then 'Steel'
    when 'fairy' then 'Fairy' when 'fada' then 'Fairy'
    else 'Normal'
  end
$$;
revoke execute on function public.psy_v26_canonical_type(text) from public,anon,authenticated;
