# Design System: Department of One

**Direction: "The Shelf".** A small, friendly app shop where everything is free. Light, modern and a little goofy: warm paper background with a faint dot grid, ink text, one tomato accent, and colourful app tiles that carry most of the colour.

## Tokens (style.css :root)
- Paper `#f6f3ec`, deeper paper `#ede8dd`, surface white, ink `#17171a`, muted `#5f5c55`, faint `#8f8b82`.
- Accent tomato `#ff5a36` (logo, links, focus, selection). Coffee yellow `#ffd84d` only for Buy me a coffee.
- Tile colours: `.t-*` classes (tomato, sky, grass, grape, sun, pink, teal, ink, orange, indigo, paper, mint, rose, lime, slate).
- Type: Bricolage Grotesque (display, 750), Geist (body), Geist Mono (prices, labels).
- Radii 10 / 16 / 24, pills 999px. Shadows are soft and short.

## Motion (Emil Kowalski's rules)
- Ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for everything that enters or responds; transitions stay at 150 to 300ms.
- Pressables scale to 0.97 (cards 0.98) on :active. Hover lifts are gated behind `(hover: hover) and (pointer: fine)`.
- The detail sheet is a native `<dialog>`: fades and scales from 0.96 in 200ms, backdrop blurs 4px. Never from scale(0).
- One short entrance stagger (40ms steps) on first paint only; removed before filtering so it never replays.
- Reduced motion: no movement, fades stay. The logo's eyes still blink.

## Components
- **Card:** an article with an app tile, name, kind, one line and a footer with a struck-through joke price ("$9.99 Free") and a status pill (Open / Soon). One real button in the title is stretched over the card.
- **Detail sheet:** tile, name, kind, about text, "What it does" list, and the main action (Open, or Follow on GitHub for things still in the workshop).
- **Featured:** two large cards, FitLog (green, phone screenshot) and Shan Shui (paper, layered hills).
- **Hero pile:** a loose grid of tilted app tiles beside the heading; hidden under 860px.
- **Tip jar:** the yellow coffee block with a steaming cup.
