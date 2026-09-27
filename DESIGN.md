---
name: Department of One
description: Free apps made by one person, kept at a small hotel's front desk under two lights.
colors:
  travertine: "#e7e5df"
  travertine-deep: "#dbd8d0"
  travertine-surface: "#f2f0eb"
  travertine-surface-2: "#e9e6df"
  day-ink: "#16211d"
  day-ink-muted: "#4b5550"
  day-ink-faint: "#7c827d"
  day-border: "rgba(22, 33, 29, 0.11)"
  day-rule: "rgba(22, 33, 29, 0.26)"
  day-brass: "#a8813f"
  day-brass-hi: "#dcbd84"
  day-brass-lo: "#6f5122"
  day-brass-ink: "#1b150b"
  day-bronze-text: "#7a5520"
  day-live: "#2f8f5f"
  verde: "#0a1310"
  verde-deep: "#060c0a"
  verde-surface: "#0f1a16"
  verde-surface-2: "#13201b"
  verde-slab: "#0b1411"
  night-ivory: "#ece7dc"
  night-ivory-muted: "#a9ab9f"
  night-ivory-faint: "#707870"
  night-border: "rgba(236, 231, 220, 0.09)"
  night-rule: "rgba(236, 231, 220, 0.2)"
  night-brass: "#c29a5b"
  night-brass-hi: "#eed49e"
  night-brass-lo: "#7c5b2b"
  night-brass-ink: "#14100a"
  night-brass-text: "#d9b97f"
  night-live: "#5fd08f"
  desk-ivory-muted: "#b9bcb1"
  clay-error: "#b4543a"
typography:
  display:
    fontFamily: "'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif"
    fontSize: "clamp(3.1rem, 6.7vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.03em"
    fontVariation: "'opsz' 96"
  headline:
    fontFamily: "'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif"
    fontSize: "clamp(2.5rem, 5vw, 4.4rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.028em"
    fontVariation: "'opsz' 96"
  title:
    fontFamily: "'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif"
    fontSize: "clamp(1.55rem, 2.3vw, 1.95rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.02em"
    fontVariation: "'opsz' 48"
  pull:
    fontFamily: "'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif"
    fontSize: "clamp(1.65rem, 2.9vw, 2.45rem)"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.012em"
    fontVariation: "'opsz' 60"
  numeral:
    fontFamily: "'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif"
    fontSize: "2.3rem"
    fontWeight: 400
    lineHeight: 0.95
  caption:
    fontFamily: "'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif"
    fontSize: "1.14rem"
    fontWeight: 400
    lineHeight: 1.3
  lede:
    fontFamily: "'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.1rem, 1.35vw, 1.28rem)"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  button:
    fontFamily: "'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.98rem"
    fontWeight: 600
    letterSpacing: "0.01em"
  label:
    fontFamily: "'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.74rem"
    fontWeight: 500
    letterSpacing: "0.16em"
  wordmark:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Consolas, monospace"
    fontSize: "1.06rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
rounded:
  plaque: "4px"
  sm: "8px"
  screen: "10px"
  field: "12px"
  md: "14px"
  device: "16px"
  lg: "24px"
  desk: "32px"
  pill: "999px"
spacing:
  gutter: "clamp(20px, 4vw, 56px)"
  container: "1280px"
  section: "clamp(96px, 12vw, 168px)"
  card: "clamp(28px, 4vw, 56px)"
  plaque: "clamp(30px, 5vw, 76px)"
  field-gap: "22px"
  header: "76px"
components:
  button-brass:
    backgroundColor: "{colors.day-brass}"
    textColor: "{colors.day-brass-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-brass-night:
    backgroundColor: "{colors.night-brass}"
    textColor: "{colors.night-brass-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.day-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-ghost-hover:
    textColor: "{colors.day-bronze-text}"
  nav-cta:
    backgroundColor: "transparent"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.pill}"
    padding: "9px 18px"
  nav-cta-hover:
    backgroundColor: "{colors.day-brass}"
    textColor: "{colors.day-brass-ink}"
  input-field:
    backgroundColor: "{colors.travertine}"
    textColor: "{colors.day-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "14px 16px"
  card-project:
    backgroundColor: "{colors.travertine-surface}"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.lg}"
    padding: "clamp(28px, 4vw, 56px)"
  plaque:
    textColor: "{colors.day-ink}"
    rounded: "{rounded.plaque}"
    padding: "clamp(30px, 5vw, 76px)"
  desk:
    backgroundColor: "{colors.verde-slab}"
    textColor: "{colors.night-ivory}"
    rounded: "{rounded.desk}"
    padding: "clamp(48px, 8vw, 112px) clamp(26px, 6vw, 92px)"
  status-pill:
    textColor: "{colors.day-ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "7px 13px"
  device-frame:
    rounded: "{rounded.device}"
    padding: "7px"
    width: "clamp(236px, 23vw, 300px)"
---

# Design System: Department of One

## Overview

**Creative North Star: "The Front Desk"**

The studio is the front desk of a small, very well kept hotel with one person behind it. Every app is a numbered brass key on a board, requests are left at the desk, and the house rules hang on a framed plaque. The same set of materials is shown under two lights. At night the room is verde marble (ambientCG Marble009, CC0) lit by warm lamps. By day it is honed travertine (ambientCG Travertine009, CC0) in cool daylight, with brass darkened toward bronze so it still reads on pale stone. The page follows the operating system's colour scheme and a manual toggle can override it.

Nothing is a flat fill. A fixed layer of stone texture sits behind everything, masked as a lamp falloff: fullest in a pool behind the slideshow, dimming toward the edges of the viewport. Two slow lamp pools and one faint shaft of light drift over it, a vignette darkens the corners, and a fine noise grain in soft-light blend covers the whole viewport. Panels carry a top inner highlight and a pool of light in one corner. Density is low: large Bodoni headlines, generous section spacing, and long measure limits on body copy.

Motion is damped and weighted, like a heavy door on a closer. The lights fade up on load and the headline settles line by line, three blocks (key board, plaque, desk) fade in with a short rise as they arrive, slides crossfade over 1.6 seconds, a key fob swings to rest on hover, and nothing snaps. Colour lives at the edges and in the light; reading surfaces and text fields stay achromatic.

**Key Characteristics:**
- Two lights on one set of materials: verde marble at night, travertine by day.
- Brass is the only accent, and a solid brass fill always marks something you can act on.
- Bodoni Moda for display, Hanken Grotesk for reading, JetBrains Mono only in the wordmark.
- Stone grain, lamp falloff and a noise layer on every surface.
- Door-closer easing on everything that moves.

## Colors

A near-monochrome stone palette in two lights, with brass as the single warm accent and one small green for "live".

### Primary
- **Brushed Brass** (day-brass / night-brass): the fill of every primary button, the Contact pill on hover, the live FitLog key fob, the focus ring, text selection and the wordmark cursor. The night value is lighter and warmer; the day value is deeper so the dark ink on it keeps contrast.
- **Brass Highlight** (day-brass-hi / night-brass-hi): the one-pixel top highlight on brass buttons and the key rail, and the inner stroke on the key fob. Never used as a fill on its own.
- **Brass Shadow** (day-brass-lo / night-brass-lo): the hook that holds a key fob.
- **Brass Ink** (day-brass-ink / night-brass-ink): text and icons set on a brass fill.
- **Bronze Text** (day-bronze-text / night-brass-text): brass used as text colour, for link and ghost-button hover states. By day it drops to a dark bronze so it holds contrast on travertine.

### Tertiary
- **Live Green** (day-live / night-live): only the 7px dot inside the "Live" status pill.
- **Clay** (clay-error): invalid field borders and form error text on the contact page.

### Neutral
- **Travertine** (travertine, travertine-deep): the day page ground. **Travertine Surface** (travertine-surface, travertine-surface-2) is the lighter panel stone for cards and the contact form.
- **Verde** (verde, verde-deep): the night page ground, green-black. **Verde Surface** (verde-surface, verde-surface-2) lifts panels one step.
- **Verde Slab** (verde-slab): the Requests desk and the device screen backing, the same in both lights.
- **Day Ink** (day-ink, day-ink-muted, day-ink-faint): green-black text, secondary copy, and the faintest tier for idle numerals and scrollbars.
- **Night Ivory** (night-ivory, night-ivory-muted, night-ivory-faint): warm off-white text and its two quieter tiers. **Desk Ivory Muted** (desk-ivory-muted) is the body text on the desk slab.
- **Border and Rule** (day-border, day-rule, night-border, night-rule): translucent ink hairlines. Border separates list rows and outlines cards; rule is the stronger line under headers of lists and around the plaque.

### Named Rules
**The Brass Means Act Rule.** A solid brass fill marks a control: buttons, the Contact pill on hover, the live key fob, focus rings. The blinking cursor is the one decorative brass fill. Brass at hairline weight (section joints at 45% strength, the device frame edge, the key rail, the dash beside each contact reason) is structure in the world and may appear anywhere.

**The Achromatic Reading Rule.** Body copy, panels and text fields stay in stone and ink. Warmth arrives through lamplight gradients, brass edges and focus states, never through tinted text blocks.

**The Desk Is Always Night Rule.** The Requests desk is a verde marble slab in both themes and pins the night brass values locally, so it reads as one piece of furniture under daylight too.

## Typography

**Display Font:** Bodoni Moda (with Didot, Bodoni 72, Georgia)
**Body Font:** Hanken Grotesk (with ui-sans-serif, system-ui, Segoe UI)
**Label/Mono Font:** JetBrains Mono 600, wordmark only

**Character:** A high-contrast Didone with its optical size axis pushed up for the big settings, paired with a calm grotesk for everything read at length. Italic Bodoni carries the engraved voice: the emphasised word in the hero, key numbers, house-rule numerals and slideshow captions.

### Hierarchy
- **Display** (400, clamp(3.1rem, 6.7vw, 6rem), 0.98, opsz 96): the page H1 on the homepage and contact page, max 11.5ch. One italic word at weight 500 is allowed inside it.
- **Headline** (400, clamp(2.5rem, 5vw, 4.4rem), 1, opsz 96): section H2s, max 14ch. The desk headline uses the same role at up to 4.5rem.
- **Title** (400, clamp(1.55rem, 2.3vw, 1.95rem), 1.08, opsz 48): house-rule headings. The project name runs larger (clamp(2.3rem, 3.6vw, 3rem), opsz 72).
- **Pull** (400, clamp(1.65rem, 2.9vw, 2.45rem), 1.3, opsz 60): the opening paragraph of About, set in the display face.
- **Numeral and Caption** (italic, 2.3rem and 1.14rem): Roman numerals on the plaque, "No. 002", key fob numbers, slideshow captions.
- **Lede** (400, clamp(1.1rem, 1.35vw, 1.28rem), 1.6): the hero paragraph in muted ink, max 42ch.
- **Body** (400, 17px, 1.6; 16px under 520px): all running copy. Long paragraphs cap between 38ch and 56ch.
- **Label** (500 or 600, 0.74rem, 0.16em tracking, uppercase): data labels only, meaning spec list terms, the status pill and the slide counter, with tabular lining numerals where digits appear.
- **Wordmark** (JetBrains Mono 600, 1.06rem, -0.02em; footer version clamp(1.6rem, 8.5vw, 7.4rem) at -0.045em): lowercase "department of one" followed by the cursor.

### Named Rules
**The Mono Is the Logo Rule.** JetBrains Mono appears only in the wordmark, in the header and the oversized footer version. Labels, dates and counters use tracked Hanken Grotesk.

**The Blinking Cursor Rule.** The wordmark ends in a solid brass block (0.56em by 0.73em, 0.14em after the text) that blinks on a 1.06s cycle as a pure opacity step. It keeps blinking under reduced motion, since it is the logo and the owner's own Windows setup reports reduced motion.

## Layout

A single 1280px container with a fluid gutter of clamp(20px, 4vw, 56px). Sections breathe with clamp(96px, 12vw, 168px) of vertical padding and are divided by a brass hairline that fades out at both ends like a joint between two stone slabs.

Content sits in asymmetric two-column grids. The hero is 1.2fr to 0.8fr, with the headline and lede on the left and the device slideshow on the right. Work puts a sticky key board (0.62fr) beside the project card (1.38fr). About puts a sticky H2 (0.8fr) beside the copy (1.6fr). The house rules are a two-column ordered list inside the plaque, each item a numeral column of 3.4rem beside its title and text.

Responsive behaviour: at 1000px the work, about and rules grids collapse to one column and sticky elements go static; at 900px the hero, contact grid and desk stack, with the device at min(260px, 66vw); at 760px the text nav links hide and only the Contact pill and theme toggle remain; at 520px body drops to 16px, the header to 64px, and spec rows stack.

The header is sticky at 76px, transparent over the hero, and picks up a frosted ground (blur 16px, saturate 1.3) with a bottom border once the page scrolls.

## Elevation & Depth

Depth comes from light falling on stone. Surfaces get a one-pixel inner top highlight plus a long, soft drop shadow that starts well below the element, so panels read as slabs resting on a lit floor. Night shadows are deeper and darker; day shadows stay faint and green-grey. The room itself adds depth through the lamp pools, the vignette and a pointer-following lamp (a 420px radial halo) over the hero.

### Shadow Vocabulary
- **Slab** (`box-shadow: inset 0 1px 0 var(--panel-hi), var(--shadow)`, where `--shadow` is `0 1px 1px rgba(22,33,29,.05), 0 28px 56px -28px rgba(22,33,29,.3)` by day and `0 1px 0 rgba(0,0,0,.3), 0 30px 60px -30px rgba(0,0,0,.8)` at night): project card, plaque, contact card, admin login card.
- **Brass Lift** (`inset 0 1px 0 brass-hi at 80%, 0 12px 26px -14px rgba(10,8,4,.45)`; hover deepens to `0 18px 32px -16px`): brass buttons.
- **Device** (`0 50px 80px -44px var(--device-shadow), 0 18px 30px -24px var(--device-shadow)`): the slideshow frame, with a warm halo glow behind it.
- **Desk** (`inset 0 1px 0 rgba(255,255,255,.1), inset 0 0 0 1px rgba(236,231,220,.06), 0 36px 60px -36px rgba(0,0,0,.6)`): the Requests slab.
- **Hanging Key** (`filter: drop-shadow(0 18px 18px rgba(0,0,0,.28))`): key fobs.

### Named Rules
**The Never Flat Rule.** Every panel has stone, grain or a lamp gradient behind it and an inner top highlight on it. A plain fill with no light on it is a bug.

**The Heavy Door Rule.** Movement uses `cubic-bezier(0.16, 1, 0.3, 1)` for travel and `cubic-bezier(0.22, 0.8, 0.24, 1)` for colour, with durations from 0.3s for colour up to 1.1s to 1.6s for entrances and crossfades. Nothing bounces or snaps. Under reduced motion nothing travels, drifts or swings; fades, the slide crossfade and the cursor blink stay.

## Shapes

Rounded, soft-cornered furniture with thin lines. Actions and chips are full pills (999px). Cards and the next-up strip use 24px, the desk 32px (24px on small screens), the device frame 16px around a 10px screen, fields 12px. The plaque is the one near-square object at 4px, with a second hairline border inset 9px inside it like a frame mat. Borders are always one pixel. Key fobs are oval with a brass ring at the top; a dashed outline marks an empty hook or an unbuilt slot.

## Components

### Buttons
Solid pills, lit from above.
- **Shape:** full pill (999px), minimum height 52px, 28px side padding, 12px gap to a trailing arrow.
- **Brass (primary):** brass fill, brass-ink text, Hanken Grotesk 600 at 0.98rem, brass-hi top highlight. Used for "Open FitLog" and "Send a request".
- **Hover / Focus:** the fill warms toward brass-hi, the button rises 1px, the shadow deepens and the arrow slides 4px right, all on the door easing over 0.5s. Press nudges down 1px and scales to 0.99. Focus is a 2px brass outline at 3px offset.
- **Ghost:** transparent with a rule-colour border; on hover the border turns brass and the text turns bronze.
- **Text link:** body text with a 1px underline that wipes away to the right on hover while the text turns bronze.

### Chips
- **Status pill:** label type in muted ink, 1px border, 7px by 13px padding, with a 7px live-green dot before the word.

### Cards / Containers
- **Corner Style:** 24px (project card, contact card), 4px (plaque), 32px (desk).
- **Background:** surface stone with a radial pool of panel light from the top-left corner.
- **Shadow Strategy:** Slab, from Elevation & Depth.
- **Border:** 1px border tone; the plaque uses the stronger rule tone plus its inset inner frame.
- **Internal Padding:** clamp(28px, 4vw, 56px) for the project card, clamp(30px, 5vw, 76px) for the plaque.

### Inputs / Fields
- **Style:** page-ground fill, 1px border, 12px radius, 14px by 16px padding, 1rem text so iOS does not zoom. Label above in Hanken 600 at 0.9rem; hint below at 0.82rem in muted ink.
- **Focus:** border turns brass with a 4px brass halo at 18% strength; no outline.
- **Error / Disabled:** clay border and clay status text; a disabled submit drops to 55% opacity.

### Navigation
- **Style:** Hanken 500 at 0.93rem in muted ink. On hover the link brightens to full ink and a 1px underline grows from the centre.
- **Contact pill:** full ink text in a pill with a brass border at 60%; on hover or on the current page it fills solid brass.
- **Theme toggle:** a 40px circular outline button with a line-drawn sun or moon; it turns 30 degrees on hover.
- **Mobile:** under 760px only the Contact pill and toggle remain beside the wordmark.

### Key Board
The signature object. A 3px brass rail with hooks in brass-lo, and oval key fobs hanging from it. A live app's fob is solid brass with an italic Bodoni number ("001") and the app name in widely tracked caps in ink at 70 to 78%; it links to the app and swings to rest over 2.2s on hover or focus. An upcoming slot is a dashed rule-colour outline with a faint number.

### Device Slideshow
A slim 9:16 frame at room scale with a 1px brass edge, 7px padding and a faint glass sheen, over a warm halo. Real app screens crossfade every 5.2s with a slow 7s settle from 104% scale. Below it: a label-style "n of 6" counter, an italic Bodoni caption, a row of 2px progress ticks that fill with brass, and a round pause button. Autoplay pauses on hover, off screen, or when the user presses pause.

### Requests Desk
A verde marble slab in both themes with a warm lamp in its top-left corner and a diagonal sheen. Ivory headline, desk-muted body, night brass button.

## Do's and Don'ts

### Do:
- **Do** keep both lights in step: any new surface needs a day travertine value and a night verde value, set through the shared custom properties.
- **Do** use a solid brass fill only for things a visitor can press, plus the wordmark cursor.
- **Do** give every panel an inner top highlight and a light gradient or stone behind it.
- **Do** move things on `cubic-bezier(0.16, 1, 0.3, 1)` with entrances of 1.1s to 1.6s, and keep scroll reveals to the few blocks that earn them.
- **Do** keep the wordmark cursor blinking in every motion setting.
- **Do** use italic Bodoni for numbers that name things (key numbers, rule numerals, "No. 002").
- **Do** use real app screens in the device frame, with captions that describe what is on screen.

### Don't:
- **Don't** use JetBrains Mono anywhere except the wordmark.
- **Don't** fill decorative shapes with brass or tint body text with it.
- **Don't** ship a flat colour field with no grain, stone or light on it.
- **Don't** add a second accent hue; green is limited to the live dot and clay to errors.
- **Don't** use springy, bouncing or snapping motion.
- **Don't** add bureaucracy props (stamps, forms, office signage) around the name.
