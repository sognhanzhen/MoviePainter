-- MoviePainter Supabase RLS / access policies
-- 说明：
-- 1. 这份 SQL 不是当前 server service-role 运行的硬前置条件
-- 2. 但如果你已经完成 init，推荐继续执行这份，为后续 Supabase Auth / 用户归属打底
-- 3. service_role 会绕过 RLS，因此不会影响当前后端读写

create or replace function public.is_admin_or_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and role in ('admin', 'editor')
      and status = 'active'
  );
$$;

alter table public.user_profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.curated_posters enable row level security;
alter table public.curated_poster_attributes enable row level security;
alter table public.tags enable row level security;
alter table public.poster_tag_relations enable row level security;
alter table public.recommendations enable row level security;
alter table public.generation_records enable row level security;
alter table public.generation_draw_inputs enable row level security;
alter table public.generation_outputs enable row level security;

drop policy if exists "profiles_select_own" on public.user_profiles;
create policy "profiles_select_own"
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.user_profiles;
create policy "profiles_update_own"
on public.user_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_admin_read_all" on public.user_profiles;
create policy "profiles_admin_read_all"
on public.user_profiles
for select
to authenticated
using (public.is_admin_or_editor());

drop policy if exists "profiles_admin_manage" on public.user_profiles;
create policy "profiles_admin_manage"
on public.user_profiles
for update
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "settings_select_own" on public.user_settings;
create policy "settings_select_own"
on public.user_settings
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "settings_insert_own" on public.user_settings;
create policy "settings_insert_own"
on public.user_settings
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "settings_update_own" on public.user_settings;
create policy "settings_update_own"
on public.user_settings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "settings_admin_read_all" on public.user_settings;
create policy "settings_admin_read_all"
on public.user_settings
for select
to authenticated
using (public.is_admin_or_editor());

drop policy if exists "posters_public_read_published" on public.curated_posters;
create policy "posters_public_read_published"
on public.curated_posters
for select
to anon, authenticated
using (publish_status = 'published');

drop policy if exists "posters_admin_manage" on public.curated_posters;
create policy "posters_admin_manage"
on public.curated_posters
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "poster_attributes_public_read" on public.curated_poster_attributes;
create policy "poster_attributes_public_read"
on public.curated_poster_attributes
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.curated_posters
    where public.curated_posters.id = curated_poster_attributes.poster_id
      and public.curated_posters.publish_status = 'published'
  )
);

drop policy if exists "poster_attributes_admin_manage" on public.curated_poster_attributes;
create policy "poster_attributes_admin_manage"
on public.curated_poster_attributes
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "tags_public_read_active" on public.tags;
create policy "tags_public_read_active"
on public.tags
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "tags_admin_manage" on public.tags;
create policy "tags_admin_manage"
on public.tags
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "poster_tag_relations_public_read" on public.poster_tag_relations;
create policy "poster_tag_relations_public_read"
on public.poster_tag_relations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.curated_posters
    where public.curated_posters.id = poster_tag_relations.poster_id
      and public.curated_posters.publish_status = 'published'
  )
);

drop policy if exists "poster_tag_relations_admin_manage" on public.poster_tag_relations;
create policy "poster_tag_relations_admin_manage"
on public.poster_tag_relations
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "recommendations_public_read_active" on public.recommendations;
create policy "recommendations_public_read_active"
on public.recommendations
for select
to anon, authenticated
using (
  active = true
  and exists (
    select 1
    from public.curated_posters
    where public.curated_posters.id = recommendations.poster_id
      and public.curated_posters.publish_status = 'published'
  )
);

drop policy if exists "recommendations_admin_manage" on public.recommendations;
create policy "recommendations_admin_manage"
on public.recommendations
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "generation_records_select_own" on public.generation_records;
create policy "generation_records_select_own"
on public.generation_records
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "generation_records_insert_own" on public.generation_records;
create policy "generation_records_insert_own"
on public.generation_records
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "generation_records_update_own" on public.generation_records;
create policy "generation_records_update_own"
on public.generation_records
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "generation_records_admin_read_all" on public.generation_records;
create policy "generation_records_admin_read_all"
on public.generation_records
for select
to authenticated
using (public.is_admin_or_editor());

drop policy if exists "generation_draw_inputs_select_own" on public.generation_draw_inputs;
create policy "generation_draw_inputs_select_own"
on public.generation_draw_inputs
for select
to authenticated
using (
  exists (
    select 1
    from public.generation_records
    where public.generation_records.id = generation_draw_inputs.generation_id
      and public.generation_records.user_id = auth.uid()
  )
);

drop policy if exists "generation_draw_inputs_insert_own" on public.generation_draw_inputs;
create policy "generation_draw_inputs_insert_own"
on public.generation_draw_inputs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.generation_records
    where public.generation_records.id = generation_draw_inputs.generation_id
      and public.generation_records.user_id = auth.uid()
  )
);

drop policy if exists "generation_draw_inputs_update_own" on public.generation_draw_inputs;
create policy "generation_draw_inputs_update_own"
on public.generation_draw_inputs
for update
to authenticated
using (
  exists (
    select 1
    from public.generation_records
    where public.generation_records.id = generation_draw_inputs.generation_id
      and public.generation_records.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.generation_records
    where public.generation_records.id = generation_draw_inputs.generation_id
      and public.generation_records.user_id = auth.uid()
  )
);

drop policy if exists "generation_outputs_select_own" on public.generation_outputs;
create policy "generation_outputs_select_own"
on public.generation_outputs
for select
to authenticated
using (
  exists (
    select 1
    from public.generation_records
    where public.generation_records.id = generation_outputs.generation_id
      and public.generation_records.user_id = auth.uid()
  )
);

drop policy if exists "generation_outputs_admin_manage" on public.generation_outputs;
create policy "generation_outputs_admin_manage"
on public.generation_outputs
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());
