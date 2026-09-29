-- Copy rework, 2026-09-29: drops the free-for-everyone framing (Why it's free, the Pirate Bay
-- and Robin Hood lines, the free/no-premium principles) for plain copy about one person making
-- apps. Run once in the Supabase SQL editor (FitLog project, which owns site_content). Until it
-- runs, content.js keeps pulling the old wording over the new HTML defaults.
insert into site_content (key, value, updated_at) values
  ('hero_title_pre', 'Apps, built by', now()),
  ('hero_lede', 'Department of One is me, a developer doing every job alone, from writing the code to answering the support inbox. I build the apps I want to use, mostly because I enjoy building them.', now()),
  ('fitlog_desc', 'A workout log, a meal and macro tracker and a fasting timer in one app. I built it for my own training, because the trackers I tried felt bloated and I wanted all three in one place.', now()),
  ('deal_title', 'How I work.', now()),
  ('principle_1_title', 'I use what I make', now()),
  ('principle_1_desc', 'Everything here started as something I wanted for myself, so I''m usually the first to notice when it breaks.', now()),
  ('principle_2_title', 'No tricks', now()),
  ('principle_2_desc', 'No fake countdowns and no pop-ups built to wear you down. If something ever costs money, it will say so plainly.', now()),
  ('about_title', 'Who''s behind it.', now()),
  ('about_body_1', 'Just me. I make apps for fun, and I like finishing what I start.', now()),
  ('about_body_2', 'Away from the keyboard I read a lot: Tolkien and Sanderson for fiction, and anything about finance, a world I find fascinating.', now()),
  ('about_support', 'Running FitLog still costs something, between hosting, the database and my time. If it''s earned a spot on your phone, you can buy me a coffee. It''s optional and doesn''t unlock anything.', now()),
  ('request_title', 'Got an idea for an app?', now()),
  ('request_body', 'Tell me what it would do and how you''d use it. I read every message, and good ideas go on the list for what I build next.', now()),
  ('contact_reason_3', 'An idea for an app', now())
on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
