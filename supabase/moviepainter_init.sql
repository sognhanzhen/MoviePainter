-- MoviePainter Supabase initialization
-- 适用目标：
-- 1. 先让当前项目代码能读到 Supabase 海报库
-- 2. 同时把后续要用到的用户、生成、推荐等业务表提前建好
-- 3. 当前不包含 RLS policy；等你切到 Supabase Auth / 前端直连时，再补第二份策略 SQL

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    id,
    display_name,
    role,
    status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1), 'MoviePainter User'),
    'user',
    'active'
  )
  on conflict (id) do nothing;

  insert into public.user_settings (
    user_id,
    preferred_default_mode,
    language,
    notification_enabled
  )
  values (
    new.id,
    'chat',
    'zh-CN',
    true
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'editor', 'admin')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.user_profiles(id) on delete cascade,
  preferred_default_mode text not null default 'chat' check (preferred_default_mode in ('chat', 'draw')),
  language text not null default 'zh-CN',
  notification_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.curated_posters (
  id text primary key,
  slug text not null unique,
  title text not null,
  cover_image_url text not null,
  summary text not null default '',
  description text not null default '',
  genre text not null default '未分类',
  region text not null default '未标注',
  release_year text not null default '2026',
  layout text not null default 'square' check (layout in ('featured', 'square', 'tall', 'wide')),
  source_type text not null default 'editorial',
  publish_status text not null default 'published' check (publish_status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  featured boolean not null default false,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.curated_poster_attributes (
  id uuid primary key default gen_random_uuid(),
  poster_id text not null unique references public.curated_posters(id) on delete cascade,
  character_value text not null default '待补充',
  style_value text not null default '待补充',
  mood_value text not null default '待补充',
  tone_value text not null default '待补充',
  composition_value text not null default '待补充',
  aspect_ratio_value text not null default '2:3 竖版',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null default 'theme',
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poster_tag_relations (
  id uuid primary key default gen_random_uuid(),
  poster_id text not null references public.curated_posters(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poster_id, tag_id)
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  poster_id text not null references public.curated_posters(id) on delete cascade,
  position text not null,
  recommendation_group text not null default 'default',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  mode text not null check (mode in ('chat', 'draw')),
  status text not null default 'draft' check (status in ('draft', 'queued', 'waiting', 'running', 'succeeded', 'failed')),
  source_poster_id text references public.curated_posters(id) on delete set null,
  source_origin text not null default 'workspace',
  prompt_text text not null default '',
  error_message text,
  output_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_draw_inputs (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null unique references public.generation_records(id) on delete cascade,
  character_value text,
  style_value text,
  mood_value text,
  tone_value text,
  composition_value text,
  aspect_ratio_value text,
  selected_modules_json jsonb not null default '[]'::jsonb,
  weights_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_outputs (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generation_records(id) on delete cascade,
  image_url text not null,
  thumbnail_url text,
  width integer,
  height integer,
  output_order integer not null default 0,
  title text,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists idx_curated_posters_sort_order on public.curated_posters(sort_order asc);
create index if not exists idx_curated_posters_publish_status on public.curated_posters(publish_status);
create index if not exists idx_tags_category on public.tags(category);
create index if not exists idx_recommendations_position on public.recommendations(position, sort_order);
create index if not exists idx_generation_records_user_id on public.generation_records(user_id, created_at desc);
create index if not exists idx_generation_records_source_poster_id on public.generation_records(source_poster_id);
create index if not exists idx_generation_outputs_generation_id on public.generation_outputs(generation_id, output_order);

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_curated_posters_updated_at on public.curated_posters;
create trigger trg_curated_posters_updated_at
before update on public.curated_posters
for each row
execute function public.set_updated_at();

drop trigger if exists trg_curated_poster_attributes_updated_at on public.curated_poster_attributes;
create trigger trg_curated_poster_attributes_updated_at
before update on public.curated_poster_attributes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_tags_updated_at on public.tags;
create trigger trg_tags_updated_at
before update on public.tags
for each row
execute function public.set_updated_at();

drop trigger if exists trg_recommendations_updated_at on public.recommendations;
create trigger trg_recommendations_updated_at
before update on public.recommendations
for each row
execute function public.set_updated_at();

drop trigger if exists trg_generation_records_updated_at on public.generation_records;
create trigger trg_generation_records_updated_at
before update on public.generation_records
for each row
execute function public.set_updated_at();

drop trigger if exists trg_generation_draw_inputs_updated_at on public.generation_draw_inputs;
create trigger trg_generation_draw_inputs_updated_at
before update on public.generation_draw_inputs
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values
  ('poster-assets', 'poster-assets', true),
  ('generation-outputs', 'generation-outputs', false),
  ('user-uploads', 'user-uploads', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into public.curated_posters (
  id, slug, title, cover_image_url, summary, description, genre, region, release_year, layout, source_type, publish_status, sort_order, featured
)
values
  (
    'ember-city',
    'ember-city',
    'Ember City',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    '一张把霓虹雨夜、悬疑人物关系和城市压迫感揉在一起的未来惊悚海报。',
    '这组海报适合作为都市悬疑、近未来犯罪、赛博黑色电影的参考样本。人物与城市灯带形成强对比，适合注入 AI Chat 的叙事语境，也适合在 AI Draw 中拆出色调与构图参数。',
    '悬疑',
    '上海 / 东京',
    '2026',
    'featured',
    'editorial',
    'published',
    10,
    true
  ),
  (
    'velvet-sunrise',
    'velvet-sunrise',
    'Velvet Sunrise',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80',
    '带有老电影颗粒感与浪漫空气感的爱情片海报，强调人像与晨光。',
    '适合为爱情、文艺、轻治愈题材提供人物质感参考。整体画面柔和，适合在 AI Draw 模式中提取角色、氛围与色调。',
    '爱情',
    '巴黎',
    '2025',
    'square',
    'editorial',
    'published',
    20,
    false
  ),
  (
    'atlas-machine',
    'atlas-machine',
    'Atlas Machine',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    '机械朋克感很强的动作海报，强调金属比例和疾速运动线。',
    '适合动作、机甲、工业风题材，尤其适合在 AI Draw 模式中抽取构图、比例与风格参考。',
    '动作',
    '首尔',
    '2024',
    'tall',
    'editorial',
    'published',
    30,
    false
  ),
  (
    'summer-dust',
    'summer-dust',
    'Summer Dust',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
    '以广角景别和人物剪影为主的公路片海报，气质自由但带轻微失落。',
    '这张海报特别适合作为氛围参考。它不靠复杂元素，而靠留白、远景和空气颜色建立故事感。',
    '公路',
    '加州',
    '2023',
    'wide',
    'editorial',
    'published',
    40,
    false
  ),
  (
    'opal-archive',
    'opal-archive',
    'Opal Archive',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80',
    '带神秘宗教感和复古拼贴感的奇幻片海报，视觉符号密度更高。',
    '适合作为奇幻、悬秘、女性主角题材的视觉样本。画面层次复杂，很适合 AI Chat 里作为世界观参考对象。',
    '奇幻',
    '布拉格',
    '2026',
    'square',
    'editorial',
    'published',
    50,
    false
  ),
  (
    'monsoon-bird',
    'monsoon-bird',
    'Monsoon Bird',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    '偏作者电影取向的悬疑海报，利用玻璃反射和雨痕制造双层人物叙事。',
    '适合做人物关系海报、雨夜戏剧海报与情绪悬疑海报的基底。尤其适合作为色调与氛围参考。',
    '剧情',
    '香港',
    '2025',
    'tall',
    'editorial',
    'published',
    60,
    false
  ),
  (
    'paper-moon-hotel',
    'paper-moon-hotel',
    'Paper Moon Hotel',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    '轻喜剧和复古旅馆混合的明快海报，用高饱和道具构建记忆点。',
    '适合在 AI Draw 中测试角色、风格、构图三者同时存在时的参数协同。视觉可读性强，很适合做推荐位卡面。',
    '喜剧',
    '台北',
    '2024',
    'wide',
    'editorial',
    'published',
    70,
    false
  )
on conflict (id) do update
set
  slug = excluded.slug,
  title = excluded.title,
  cover_image_url = excluded.cover_image_url,
  summary = excluded.summary,
  description = excluded.description,
  genre = excluded.genre,
  region = excluded.region,
  release_year = excluded.release_year,
  layout = excluded.layout,
  source_type = excluded.source_type,
  publish_status = excluded.publish_status,
  sort_order = excluded.sort_order,
  featured = excluded.featured,
  updated_at = now();

insert into public.curated_poster_attributes (
  poster_id, character_value, style_value, mood_value, tone_value, composition_value, aspect_ratio_value
)
values
  ('ember-city', '孤独调查者与模糊反派关系', '新黑色电影', '压迫、危险、深夜感', '青蓝混合橙红高对比', '人物置中偏下，城市纵深压上来', '2:3 竖版'),
  ('velvet-sunrise', '彼此靠近的恋人双人像', '法式浪漫电影海报', '温柔、轻盈、亲密', '奶油金与暖粉', '半身双人像，轻微对角线', '4:5 竖版'),
  ('atlas-machine', '装备外骨骼的高速行动者', '机械朋克动作海报', '高压、冲击、金属兴奋感', '钢灰、冷蓝、局部熔橙', '低机位仰拍，主体沿对角线冲出', '2:3 竖版'),
  ('summer-dust', '站在旷野中的孤独旅人', '美式公路电影海报', '自由、空旷、微失落', '尘土橙、日落金、褪色蓝', '大留白远景，人物只占小比例', '16:9 横版'),
  ('opal-archive', '带有仪式感的女性主角', '复古拼贴奇幻电影海报', '神秘、史诗、仪式感', '暗红、象牙白、旧金', '人物正中，符号环绕', '1:1 海报版'),
  ('monsoon-bird', '玻璃前后形成关系张力的双人物', '作者电影情绪海报', '潮湿、暧昧、隐秘', '墨绿、酒红、灰蓝', '反射叠层构图', '2:3 竖版'),
  ('paper-moon-hotel', '在复古旅馆场景中的群像人物', '复古明快喜剧海报', '轻盈、热闹、古怪', '薄荷绿、樱桃红、奶油黄', '多角色横向分布，场景叙事', '3:2 横版')
on conflict (poster_id) do update
set
  character_value = excluded.character_value,
  style_value = excluded.style_value,
  mood_value = excluded.mood_value,
  tone_value = excluded.tone_value,
  composition_value = excluded.composition_value,
  aspect_ratio_value = excluded.aspect_ratio_value,
  updated_at = now();

insert into public.tags (name, category, status)
values
  ('Neo-Noir', 'style', 'active'),
  ('霓虹', 'tone', 'active'),
  ('都市压迫', 'mood', 'active'),
  ('高对比', 'tone', 'active'),
  ('Romance', 'style', 'active'),
  ('晨光', 'tone', 'active'),
  ('柔焦', 'style', 'active'),
  ('胶片', 'style', 'active'),
  ('Mecha', 'theme', 'active'),
  ('Industrial', 'style', 'active'),
  ('Action', 'theme', 'active'),
  ('Speed', 'composition', 'active'),
  ('Road Movie', 'theme', 'active'),
  ('Wide Shot', 'composition', 'active'),
  ('Freedom', 'mood', 'active'),
  ('Dust', 'tone', 'active'),
  ('Fantasy', 'theme', 'active'),
  ('Collage', 'style', 'active'),
  ('Mystic', 'mood', 'active'),
  ('Symbol', 'composition', 'active'),
  ('Auteur', 'style', 'active'),
  ('Rain', 'mood', 'active'),
  ('Reflection', 'composition', 'active'),
  ('Drama', 'theme', 'active'),
  ('Comedy', 'theme', 'active'),
  ('Retro', 'style', 'active'),
  ('Set Design', 'composition', 'active'),
  ('Bright', 'tone', 'active')
on conflict (name) do update
set
  category = excluded.category,
  status = excluded.status,
  updated_at = now();

insert into public.poster_tag_relations (poster_id, tag_id)
select relation_map.poster_id, public.tags.id
from (
  values
    ('ember-city', 'Neo-Noir'),
    ('ember-city', '霓虹'),
    ('ember-city', '都市压迫'),
    ('ember-city', '高对比'),
    ('velvet-sunrise', 'Romance'),
    ('velvet-sunrise', '晨光'),
    ('velvet-sunrise', '柔焦'),
    ('velvet-sunrise', '胶片'),
    ('atlas-machine', 'Mecha'),
    ('atlas-machine', 'Industrial'),
    ('atlas-machine', 'Action'),
    ('atlas-machine', 'Speed'),
    ('summer-dust', 'Road Movie'),
    ('summer-dust', 'Wide Shot'),
    ('summer-dust', 'Freedom'),
    ('summer-dust', 'Dust'),
    ('opal-archive', 'Fantasy'),
    ('opal-archive', 'Collage'),
    ('opal-archive', 'Mystic'),
    ('opal-archive', 'Symbol'),
    ('monsoon-bird', 'Auteur'),
    ('monsoon-bird', 'Rain'),
    ('monsoon-bird', 'Reflection'),
    ('monsoon-bird', 'Drama'),
    ('paper-moon-hotel', 'Comedy'),
    ('paper-moon-hotel', 'Retro'),
    ('paper-moon-hotel', 'Set Design'),
    ('paper-moon-hotel', 'Bright')
) as relation_map(poster_id, tag_name)
join public.tags on public.tags.name = relation_map.tag_name
on conflict (poster_id, tag_id) do nothing;

insert into public.recommendations (
  poster_id, position, recommendation_group, sort_order, active
)
values
  ('ember-city', 'landing', 'hero', 10, true),
  ('velvet-sunrise', 'library', 'top_pick', 20, true),
  ('atlas-machine', 'workspace', 'inspiration', 30, true),
  ('opal-archive', 'workspace', 'editorial_focus', 40, true)
on conflict do nothing;
