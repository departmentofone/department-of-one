-- Copy for the redesigned site. Run once in the Supabase SQL editor (FitLog project, which owns
-- the site_content table - see migration_v24_site_content.sql there). Until this runs, content.js
-- keeps pulling the old wording over the new HTML defaults. admin.html can only edit rows that
-- already exist, so this also inserts the new keys.
-- No longer used by the pages (safe to leave in the table): hero_eyebrow.
insert into site_content (key, value, updated_at) values
  ('hero_title_pre',     'Free apps, built by', now()),
  ('hero_title_em',      'one', now()),
  ('hero_title_post',    'person.', now()),
  ('hero_lede',          'Department of One is me, a developer doing every job alone, from writing the code to answering the support inbox. Everything I make is free for everyone, with no paywall and no ads.', now()),
  ('work_title',         'One app so far.', now()),
  ('fitlog_desc',        'A free app that puts a workout log, a meal and macro tracker and a fasting timer in one place. I built it because the ones I tried were bloated, full of ads, or kept half their features behind a paywall.', now()),
  ('fitlog_extras',      'Personal records, trend charts, and workout and meal programs you can reuse', now()),
  ('fitlog_offline',     'Log a workout with no signal. It syncs when you''re back online.', now()),
  ('fitlog_install',     'Runs in the browser, and you can add it to your home screen without going through an app store.', now()),
  ('fitlog_data',        'Export all of it, or delete your account from Settings.', now()),
  ('more_soon_text',     'The second app is already in progress.', now()),
  ('deal_title',         'What free means here.', now()),
  ('principle_1_title',  'Every feature, for everyone', now()),
  ('principle_1_desc',   'There''s no premium tier and nothing to subscribe to. When a feature ships, everybody gets it.', now()),
  ('principle_2_title',  'No ads, no ad trackers', now()),
  ('principle_2_desc',   'You won''t see upsell pop-ups either, since there''s nothing to upsell.', now()),
  ('principle_3_title',  'Your data stays yours', now()),
  ('principle_3_desc',   'Nothing gets sold, to advertisers or to anyone else. You can delete your account whenever you like.', now()),
  ('principle_4_title',  'You''ll reach me', now()),
  ('principle_4_desc',   'There''s no support team to get past. The person reading your bug report is the one who wrote the bug.', now()),
  ('about_title',        'Why it''s free.', now()),
  ('about_body_1',       'I''ve always admired the people behind The Pirate Bay, less for the controversy than for the idea: a few people built something useful and gave it to everyone for free.', now()),
  ('about_body_2',       'For a long time I didn''t know how I''d give something back in the same spirit. Building apps turned out to be my way. I make the ones I''d want to use and give them away, and since there are no investors, the only people I answer to are the ones using them.', now()),
  ('request_title',      'Paying for an app you think should be free?', now()),
  ('request_body',       'Tell me which one and what you use it for. If it''s something I can build, I might make a free version of it. Call it the Robin Hood approach, minus the tights.', now()),
  ('footer_tagline',     'Made by one person, who also wrote this footer.', now()),
  ('contact_title_pre',  'Write to the whole', now()),
  ('contact_title_em',   'department.', now()),
  ('contact_intro',      'That''s me. Everything sent here lands in one inbox, and I read all of it. Good reasons to write:', now()),
  ('contact_reason_1',   'Something in FitLog is broken', now()),
  ('contact_reason_2',   'A feature you''d use', now()),
  ('contact_reason_3',   'An app you pay for that should be free', now()),
  ('contact_reason_4',   'Anything else, including hello', now())
on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
