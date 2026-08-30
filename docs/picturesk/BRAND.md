# Picturesk — Brand Guidelines

> Read this file before ANY design, UI, styling, layout, or copy work. No exceptions.

## What we are
AI headshots that don't look AI. A studio in your browser. We sell the outcome
(a headshot you'd actually put on LinkedIn), not the technology.

## Positioning
Premium but accessible. We beat a real photographer on price and speed, and we
refuse to look cheap doing it. Every screen should feel like a modern photography
studio's site, not a generic SaaS dashboard.

## Voice
1. Verdict first. Say the outcome, then the detail.
2. No filler, no hype words, no "unleash/effortless/revolutionary".
3. No em dashes. Use short sentences or a comma.
4. Confident, plain, human. Talk like a good studio owner, not a chatbot.

## Color tokens (Forest & Gold)
- sand:       #F5EFE2   (warm off-white, primary background — never pure #FFFFFF)
- deep-green: #163A33   (primary text + light-body ink)
- green:      #0E4A44   (workhorse accent: CTAs, links, focus states, ticks)
- gold:       #E7B24C   (secondary accent: hero CTA, badges, dark-surface labels)
- muted:      #5F6B62   (muted text, captions, metadata)
- line:       #E4DCC8   (hairline borders, dividers)
- card:       #FBF7EC   (raised card surfaces on the sand body)
- dark chrome: nav #14615A, hero #14615A to #0A3833 gradient, footer #0A3833
- ivory:      #F4EEE1   (text on the dark green chrome)
- ok:         #1F9D57   (success/delivered)
- warn:       #C4462B   (error/failed/refund)

Rule: green is the workhorse accent; gold is the second accent, reserved for the
hero CTA, "popular" badge, and labels on dark green. Keep both restrained. The dark
green chrome (nav, hero, footer) frames a light sand body.

Note: in CSS the original token NAMES were kept to avoid churn, so existing
`var()` refs keep working. `--cobalt` now resolves to green (#0E4A44), `--ink` to
deep-green, `--bone` to sand, `--serif` to the Inter sans stack. Do not read a
token's name literally; read its value here.

## Typography
- Display/headlines: Inter, a humanist sans, set heavy (700–800) with tight
  letter-spacing. Headings are NO LONGER serif in this identity.
- UI/body: Inter as well.
- Never all-caps for long text. Generous line-height on body (1.5–1.6).

## Layout principles
1. Space is a feature. Lots of whitespace, few elements per view.
2. Let the photos be the loudest thing on any screen. UI recedes, images dominate.
3. Left-aligned text, clear hierarchy, one primary action per screen.
4. Rounded corners subtle (4–8px), not pill-shaped. Shadows soft and rare.

## Do / Don't
- DO show real before/after and result grids as the hero of the product.
- DO keep the buy action singular and obvious.
- DON'T use gradients, glassmorphism, emoji in UI, or stock "AI" purple.
- DON'T use pure white or pure black. Bone and ink only.
