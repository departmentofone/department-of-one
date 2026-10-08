-- Editable copy for the services redesign. Run once in the Supabase SQL editor (FitLog project,
-- which owns site_content). The page ships with the same text built in, so nothing breaks until
-- this runs; afterwards admin.html lists these keys and edits go live without a redeploy.
insert into site_content (key, value, updated_at) values
  ('s_hero_lede', 'Department of One is one developer doing every job: the design, the code, the testing and the inbox after launch. If you hire it, you talk to the person who built it.', now()),
  ('s_fitlog_desc', 'A workout log, a meal and macro tracker and a fasting timer in one app. I built it for my own training, because the trackers I tried felt bloated and I wanted all three in one place. Everything I would do for your app, I did here first: the design, the code, the store listing and the support inbox.', now()),
  ('s_about_1', 'Just me. I build apps, sites and bots, and I like finishing what I start.', now()),
  ('s_about_2', 'Away from the keyboard I read a lot: Tolkien and Sanderson for fiction, and anything about finance, a world I find fascinating.', now()),
  ('s_about_support', 'Running FitLog still costs something, between hosting, the database and my time. If it has earned a spot on your phone, you can buy me a coffee. It''s optional and doesn''t unlock anything.', now()),
  ('s_ideas_title', 'Got an idea for an app?', now()),
  ('s_ideas_body', 'Tell me what it would do and how you''d use it. I read every message, and good ideas go on the list for what I build next.', now()),
  ('s_inquiry_intro', 'Everything sent here lands in one inbox, and I read all of it. Pick a reason and I will know what kind of reply to write.', now()),
  ('s_footer_tagline', 'Made by one person, who also wrote this footer.', now())
on conflict (key) do nothing;

-- Optional clean-up: the previous design's keys are no longer used by the site. Run this only when
-- you are happy with the new page; it removes their rows so admin.html stops listing them.
-- delete from site_content where key in (
--   'hero_eyebrow','hero_title_pre','hero_title_em','hero_title_post','hero_lede','work_title',
--   'fitlog_desc','fitlog_extras','fitlog_offline','fitlog_install','fitlog_data','more_soon_text',
--   'deal_title','principle_1_title','principle_1_desc','principle_2_title','principle_2_desc',
--   'principle_3_title','principle_3_desc','principle_4_title','principle_4_desc','about_title',
--   'about_body_1','about_body_2','about_support','request_title','request_body','footer_tagline',
--   'contact_title_pre','contact_title_em','contact_intro','contact_reason_1','contact_reason_2',
--   'contact_reason_3','contact_reason_4'
-- );
