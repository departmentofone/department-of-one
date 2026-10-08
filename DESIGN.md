---
name: Department of One
description: Websites, apps and bots by one developer, in a dark console room on verde marble.
colors:
  verde: "#070d0b"
  verde-deep: "#040807"
  verde-surface: "#0d1713"
  verde-surface-2: "#121f1a"
  ivory: "#ece7dc"
  ivory-muted: "#a9ab9f"
  ivory-faint: "#6f776f"
  border: "rgba(236, 231, 220, 0.09)"
  border-hi: "rgba(236, 231, 220, 0.18)"
  rule: "rgba(236, 231, 220, 0.2)"
  jade: "#7fd3a6"
  jade-hi: "#c6f2d8"
  jade-lo: "#3a9469"
  jade-ink: "#06140e"
  jade-text: "#9fe0bf"
  live: "#5fd08f"
  clay-error: "#e0765a"
typography:
  display:
    fontFamily: "'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.8rem, 4.9vw, 5rem)"
    fontWeight: 560
    lineHeight: 0.98
    letterSpacing: "-0.048em"
  headline:
    fontFamily: "'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.4rem)"
    fontWeight: 560
    lineHeight: 1
    letterSpacing: "-0.045em"
  title:
    fontFamily: "'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.9rem, 3.1vw, 2.9rem)"
    fontWeight: 560
    lineHeight: 1.03
    letterSpacing: "-0.04em"
  body:
    fontFamily: "'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Geist Mono', ui-monospace, 'SFMono-Regular', Consolas, monospace"
    fontSize: "0.74rem to 0.8rem"
    fontWeight: 400
    letterSpacing: "0.04em"
  wordmark:
    fontFamily: "'Geist Mono', ui-monospace, 'SFMono-Regular', Consolas, monospace"
    fontSize: "1.55rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
rounded:
  sm: "8px"
  field: "12px"
  md: "14px"
  console: "20px"
  lg: "24px"
  desk: "32px"
  pill: "999px"
spacing:
  gutter: "clamp(20px, 4vw, 56px)"
  container: "1280px"
  section: "clamp(88px, 11vw, 160px)"
  header: "88px"
components:
  button-primary:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.jade-ink}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  panel:
    backgroundColor: "{colors.verde-surface}"
    rounded: "{rounded.lg}"
  input-field:
    backgroundColor: "{colors.verde-deep}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.field}"
    padding: "14px 16px"
  console:
    backgroundColor: "{colors.verde-surface}"
    rounded: "{rounded.console}"
---

# Design System: Department of One

## Overview

**Creative North Star: "The Console"**

One dark room. The ground is verde marble (ambientCG Marble009, CC0) under a faint 72px grid that fades out toward the edges, with two slow lamp pools drifting over it and a fine grain on top. The page talks the way a terminal does: small mono labels, numbered sections (`01 Services`), and a block cursor that echoes the logo wherever something is being typed. Jade is the only accent and marks anything you can act on. The earlier "front desk of a small hotel" direction (travertine by day, key tags on a steel rail, a framed plaque) was retired on 2026-10-08; the marble, the jade and the cursor carried over, the furniture and the light theme did not.

The hero is the signature moment: a console window where a command is typed (`new website --for "a sauna club"`) and the thing it makes appears under it, as real screens in browser, phone and chat frames. Three tabs (website, app, bot) take over once a visitor clicks, and the rotation stops for good.

Nothing is a flat fill. Panels are slabs of stone with a lit top edge, and hovering one moves a jade spotlight under the pointer. Density is low, headlines are large and tightly tracked, and every block earns its place: real screenshots stand in for decoration, and anything that does not help a visitor decide is cut.

**Key Characteristics:**
- Dark only. Verde ground, ivory text, jade for actions.
- Geist for display and reading, Geist Mono for the wordmark, section indexes, labels, commands and numbers.
- Real work shown in device frames (browser, phone, chat window) over a dotted stage with a jade glow.
- Spotlight panels, grain, grid and lamp falloff on every surface.
- Door-closer easing on everything that moves.

## Colors

A near-monochrome stone palette with jade as the single accent.

- **Verde** (verde, verde-deep, verde-surface, verde-surface-2): the page ground and the panel steps above it.
- **Ivory** (ivory, ivory-muted, ivory-faint): warm off-white text and its two quieter tiers.
- **Jade** (jade, jade-hi, jade-lo, jade-ink, jade-text): the lit radial fill of primary buttons, the CTA pill's border and hover fill, focus rings, selection, the wordmark cursor, tick marks, section index numbers and the mono emphasised word in the H1. Jade text uses the lighter jade-text value.
- **Live** (live): only the pulsing dot beside "Open for projects", "online" and "Live".
- **Clay** (clay-error): invalid field borders and form error text.

### Named Rules
**The Jade Means Act Rule.** A solid jade fill marks a control: buttons, the CTA on hover, focus rings. The blinking cursor is the one decorative jade fill. Jade at hairline weight (section joints, tabs, the process line) is structure and may appear anywhere.

**The Achromatic Reading Rule.** Body copy, panels and text fields stay in stone and ink. Colour arrives through jade edges and glow, never through tinted text blocks.

## Typography

**Display and Body Font:** Geist. **Mono Font:** Geist Mono, the face the logo is drawn in.

Geist at 560 with tight tracking for headings, 400 for reading. Geist Mono carries the logo's voice: the wordmark and its `// ... for now` comment, the emphasised H1 word, section indexes, labels, chips, console text, delivery times and numbers that name things. Running text stays in Geist.

### Named Rules
**The Mono Is the Voice Rule.** Mono is for labels, commands and numbers, never for paragraphs.

**The Blinking Cursor Rule.** The wordmark ends in a solid jade block (0.56em by 0.73em) that blinks on a 1.06s cycle as a pure opacity step. It keeps blinking under reduced motion, since it is the logo. The smaller cursor after the console's typed command and the one in the footer word follow the same cycle.

## Layout

A single 1280px container with a fluid gutter. Sections breathe with clamp(88px, 11vw, 160px) and are joined by a jade hairline that fades out at both ends.

Order on the page: header, hero console, tool strip, four proof facts, Services (three panels with the visual alternating sides and a three-tier package row under each), Selected work (websites two-up, apps four-up, bots two-up, all labelled concepts), FitLog (copy beside the swipeable carousel), Process (four steps with a line that fills on scroll, two notes, a native `<details>` FAQ), About (sticky heading, four house rules), the Ideas slab (id `requests`), Inquiry (sticky intro beside the form), footer with the oversized wordmark.

Responsive behaviour: at 1100px the facts go two-up and the process, about and inquiry grids stack; at 980px the nav links hide behind the menu button, the hero, services and FitLog stack; at 760px work grids and package rows become one column; at 520px body drops to 16px, the header to 64px and the apps grid stays two-up.

The header is sticky and transparent over the hero, then picks up a frosted ground (blur 16px) with a bottom border once the page scrolls. The nav marks the section in view.

## Elevation & Depth

Depth comes from light on stone. Surfaces get a one-pixel inner top highlight plus a long, soft drop shadow, and the console and stages carry a jade-tinted glow underneath. Device frames sit on a stage: a radial jade pool over a dotted grid, masked to fade out.

- **Panel:** `inset 0 1px 0 rgba(255,255,255,.07), 0 1px 0 rgba(0,0,0,.3), 0 30px 60px -30px rgba(0,0,0,.8)`, plus a spotlight (`::before` glow and `::after` 1px jade border, both following the pointer) on hover.
- **Jade Lift** (primary buttons): inner top highlight and bottom shade, a soft drop shadow and a jade glow that widens on hover.
- **Device:** browser frames are outlined at 13% ivory with a deep shadow; phones add a 4px dark bezel; chat windows are rounded 14px.

### Named Rules
**The Never Flat Rule.** Every panel has stone, grain or a lamp gradient behind it and an inner top highlight on it.

**The Heavy Door Rule.** Movement uses `cubic-bezier(0.16, 1, 0.3, 1)` for travel and `cubic-bezier(0.22, 0.8, 0.24, 1)` for colour, with entrances of 1s to 1.3s. Nothing bounces or snaps. Layers in device stages drift opposite the pointer by depth (10 to 34px). Under reduced motion nothing travels, drifts or auto-rotates; fades, the carousel's opacity changes and the cursor blink stay.

## Shapes

Soft-cornered furniture. Actions and chips are full pills. Panels 24px, the console 20px, fields and selects 12px, the Ideas slab 32px, device frames 12px to 14px (phones 12% of their width). Borders are always one pixel.

## Components

### Buttons
Solid pills, lit from above. Primary is the jade radial fill with jade-ink text, 52px high, with a trailing arrow that slides 4px on hover. Ghost is transparent with a rule-coloured border that turns jade on hover. Text links underline with a line that wipes away to the right on hover.

### Console
Window chrome (three dots, `~/studio`, a pulsing "online"), a typed command line with a blinking cursor, a result line (`✓ 7 pages, online booking, Lighthouse 99`), a stage of device frames, and a three-tab bar (Website, App, Bot) with a jade underline on the active tab. Roving tabindex and arrow keys. The result line only announces to screen readers once a visitor picks a tab.

### Service panel
Index (`01 / Websites`), a title, a description, three tick-marked bullets, mono tech tags, a primary CTA that fills the inquiry form and a text link, a device stage on the other side, and a three-column package row (name, scope, typical delivery in jade mono).

### Work card
A panel holding a framed screenshot (browser bar, phone on a stage, or cropped chat) over a name, one line and mono chips. Websites list their measured Lighthouse scores. The image eases to 103% on hover.

### Inquiry form
Reason select (native, restyled) decides which fields appear: a project or a service question reveals "Which service are you inquiring about?", and a project also reveals an optional timeline. Fields slide open on a 0fr to 1fr grid transition and are `inert` while shut. Name (optional), email, message with a live counter and a placeholder that follows the reason. Focus is a jade border with a 4px jade halo; errors are clay. The Cloudflare Turnstile check loads when the form is first touched. A success view replaces the form.

### Inputs
Dark inset fill, 1px border, 12px radius, 14px by 16px padding, 1rem text so iOS does not zoom, label above in Geist 600 at 0.9rem.

## Do's and Don'ts

### Do:
- **Do** keep the wordmark cursor blinking in every motion setting.
- **Do** use a solid jade fill only for things a visitor can press, plus the cursor.
- **Do** show real screens in frames, and label concept work as concepts.
- **Do** give every panel an inner top highlight and light or grain behind it.
- **Do** move things on `cubic-bezier(0.16, 1, 0.3, 1)` and keep scroll reveals to blocks that earn them.
- **Do** use Geist Mono for labels, commands and numbers that name things.

### Don't:
- **Don't** use Geist Mono for running text.
- **Don't** fill decorative shapes with jade or tint body text with it.
- **Don't** ship a flat colour field with no grain, stone or light on it.
- **Don't** add a second accent hue; the live dot's green and clay for errors are the only other colours.
- **Don't** use springy, bouncing or snapping motion.
- **Don't** invent testimonials, client logos, user counts or prices.
