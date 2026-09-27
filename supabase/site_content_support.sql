-- Adds the About section's coffee paragraph (about_support) so admin.html can edit it. Run once in
-- the Supabase SQL editor (FitLog project, which owns site_content). Until it runs, the page shows
-- the text already in index.html. The Buy me a coffee link itself isn't editable copy.
insert into site_content (key, value, updated_at) values
  ('about_support', 'Keeping them running still costs something: hosting, the database, and the hours. If one of them has earned a spot on your phone, you can buy me a coffee. It''s optional and doesn''t unlock anything.', now())
on conflict (key) do nothing;
