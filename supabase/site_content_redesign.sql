-- Copy for the redesigned site. Run once in the Supabase SQL editor (FitLog project, which owns
-- the site_content table - see migration_v24_site_content.sql there). Until this runs, content.js
-- keeps pulling the old wording over the new HTML defaults. Adds two new keys (request_title,
-- request_body) so the "request an app" band is editable from admin.html too.
insert into site_content (key, value, updated_at) values
  ('hero_eyebrow',      'Headcount: 1', now()),
  ('hero_title_pre',    'Software built by', now()),
  ('hero_title_em',     'exactly', now()),
  ('hero_title_post',   'one person.', now()),
  ('hero_lede',         'No team, no investors, no ads. I build the apps I want to use myself, then make them free for everyone. If there''s an app you''d pay for but think shouldn''t cost a thing, tell me about it.', now()),
  ('principle_1_title', 'Free, for good', now()),
  ('principle_1_desc',  'No premium tier, no paywall, no features held back for a subscription. If it ships, everyone gets it.', now()),
  ('principle_2_title', 'No dark patterns', now()),
  ('principle_2_desc',  'No nagging upsells, no fake countdowns, nothing designed to trick you into anything.', now()),
  ('principle_3_title', 'Your data stays yours', now()),
  ('principle_3_desc',  'No ad trackers, and nothing gets sold. Delete your account whenever you like.', now()),
  ('principle_4_title', 'One person, fully accountable', now()),
  ('principle_4_desc',  'I write, test and maintain every line myself. When something breaks, you''re talking to the person who fixes it.', now()),
  ('fitlog_desc',       'A workout log, meal and macro tracker, and fasting timer in one free app. I built it because every alternative I tried was bloated, full of ads, or kept half its features behind a paywall.', now()),
  ('more_soon_text',    'The next app is already in progress.', now()),
  ('about_title',       'Why this exists', now()),
  ('about_body_1',      'I''ve always admired the people behind The Pirate Bay. Not for the controversy, but for the idea underneath it: a handful of people can build something genuinely useful and hand it to everyone for free, with nobody at the door asking for money.', now()),
  ('about_body_2',      'For a long time I didn''t know how I''d give back in a similar way. Building apps turned out to be the answer. Tools anyone can use, free, for good - the way I always wished more software worked.', now()),
  ('request_title',     'Know an app that shouldn''t cost money?', now()),
  ('request_body',      'Tell me which app you''d love to see made free. The best requests become the next thing I build.', now()),
  ('contact_intro',     'Bug reports, feature ideas, app requests, or just saying hi. It all lands in one inbox, and I read every message.', now()),
  ('footer_tagline',    'A one-person software studio. Small, free, and staying that way.', now())
on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
