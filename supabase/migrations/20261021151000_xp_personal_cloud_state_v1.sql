-- XP personal cloud snapshot MVP. Applied to Supabase XP project on 2026-10-21.
create table if not exists public.xp_personal_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null default '{}'::jsonb,
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now(),
 constraint xp_state_object check (jsonb_typeof(state)='object'),
 constraint xp_state_size check (octet_length(state::text)<=1000000)
);
alter table public.xp_personal_state enable row level security;
create policy "xp_state_read" on public.xp_personal_state for select to authenticated using ((select auth.uid())=user_id);
create policy "xp_state_insert" on public.xp_personal_state for insert to authenticated with check ((select auth.uid())=user_id);
create policy "xp_state_update" on public.xp_personal_state for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update on public.xp_personal_state to authenticated;
create or replace function public.xp_save_personal_state(expected_revision bigint,next_state jsonb)
returns table(saved boolean,current_revision bigint,current_state jsonb)
language plpgsql security invoker set search_path=''
as $$
declare updated_row public.xp_personal_state%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if jsonb_typeof(next_state)<>'object' or octet_length(next_state::text)>1000000 then raise exception 'Invalid state'; end if;
 if expected_revision is null then
  insert into public.xp_personal_state(user_id,state) values(auth.uid(),next_state)
  on conflict do nothing returning * into updated_row;
 else
  update public.xp_personal_state set state=next_state,revision=revision+1,updated_at=now()
  where user_id=auth.uid() and revision=expected_revision returning * into updated_row;
 end if;
 if found then return query select true,updated_row.revision,updated_row.state;
 else return query select false,s.revision,s.state from public.xp_personal_state s where s.user_id=auth.uid(); end if;
end $$;
revoke all on function public.xp_save_personal_state(bigint,jsonb) from public,anon;
grant execute on function public.xp_save_personal_state(bigint,jsonb) to authenticated;
