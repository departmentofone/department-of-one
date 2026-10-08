# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two audiences. People who need something built (a website, a mobile app or a Discord or Telegram bot) and are deciding within seconds whether this developer is worth a message. And people who find the studio through FitLog, a shared link or GitHub, who want to open the app or send an app idea.

## Product Purpose
Department of One is the studio of one developer. The homepage sells three services (websites, mobile apps, bots), proves them with concept work and the live app FitLog, and funnels visitors to one inquiry form. Success: a visitor picks a reason and sends an inquiry; FitLog still gets opened; some people send app ideas.

## Positioning
Every job, from code to the support inbox, is done by the same person. The person reading your message is the one who will write the code.

## Operating Context
Static HTML/CSS/JS on Vercel (department-of-one.vercel.app). Copy on elements with `data-content-key` (keys prefixed `s_`) is overwritten from the Supabase `site_content` table (content.js), edited through admin.html. The inquiry form (inquiry.js) posts to /api/contact, which turns the chosen reason, service and timeline into a subject and a details block, stores it in `contact_messages` and emails a copy. /contact.html redirects to /#inquiry. admin.html and privacy.html reuse the site tokens and `.btn`, `.wrap`, `.wordmark`.

## Capabilities and Constraints
- Services, taken from the Fiverr gig kit (Desktop\Fiverr): websites (Starter, Business, Complete; landing page as a one-page variant), mobile apps in Flutter or React Native (Starter, Full, Launch), Discord and Telegram bots (Essential, Server, Complete). Scope and typical delivery days are shown. Prices are not published; the FAQ says a price follows the inquiry.
- FitLog: workout log, meal and macro tracker, fasting timer, PRs, trend charts, reusable programs, offline logging with sync, installable PWA, full export and account deletion. URL: https://fitlog-two-gamma.vercel.app
- Work shown is ten concept projects (Kiln, Whisk, Parley, Lintel, Fringe, Steep, Polly, Hearth, Ferry, Whenabouts) for made-up businesses, labelled as concepts. Lighthouse figures are the ones measured for the concept sites.
- Dark only. The old light/dark toggle was dropped in the services redesign (2026-10-08).

## Brand Commitments
- Name "Department of One" is a solo-dev joke, not a real department; no bureaucracy props.
- The logo is the lowercase mono wordmark "department of one" with a blinking block cursor and the "// ... for now" comment. Must be kept, and the cursor must visibly blink in every motion setting.
- The Ideas section (id `requests`, inviting app ideas) must be kept.
- Make no pricing promises about FitLog or future apps: no "free forever", "no premium tier" or "no paywall" claims.
- Owner's stated feel: premium, elegant, smooth motion, never flat. Since 2026-10-08 that means a dark "console" room on verde marble with a faint grid, not the hotel front desk.
- Human-facing copy passes the human-writing rules: no em dashes, no AI tells, no sales language.

## Evidence on Hand
- FitLog screenshots, 720x1280: assets/fitlog/1-train to 6-fasting. FitLog icon: assets/fitlog-icon.png.
- Concept project images in assets/work/, converted from the Fiverr kit (website screenshots at 1440x900, app screens, bot chat crops).
- No testimonials, client names, user counts, press or reviews exist. Do not invent any.

## Product Principles
- Honest pricing: if something costs money, say so plainly; don't promise that it never will.
- Show the work instead of claiming quality.
- One person's voice, plain and a little dry.
- Subtract: every block earns its place; real screens beat decoration.
