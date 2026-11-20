-- Confusion Waves: save em nuvem por conta. Aditiva: não altera nem remove tabelas do jogo antigo.
create table if not exists public.confusion_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save jsonb not null default '{}'::jsonb,
  version integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.confusion_saves enable row level security;

drop policy if exists confusion_saves_read_self on public.confusion_saves;
create policy confusion_saves_read_self on public.confusion_saves
  for select to authenticated using (auth.uid() = user_id);

-- Escrita só pela API (chave de serviço), nunca direta pelo cliente.
revoke insert, update, delete on public.confusion_saves from anon, authenticated;
grant select on public.confusion_saves to authenticated;
