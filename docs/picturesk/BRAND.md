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
- white:      #FFFFFF   (the page ground, everywhere: body, sections, cards)
- black:      #000000   (all primary text; the old green-tinted ink is gone)
- green:      #0E4A44   (workhorse accent: CTAs, links, focus states, ticks)
- gold:       #E7B24C   (secondary accent: hero CTA, badges, dark-surface labels)
- muted:      #4B5563   (neutral grey: captions, ledes, metadata)
- line:       #E5E7EB   (neutral hairline borders, dividers)
- band:       #F4F5F6   (the one quiet fill: card backgrounds, table headers)
- footer:     #0A3833   (the only dark surface left; nav and hero are white)
- ivory:      #F4EEE1   (text on green: buttons, the footer, filled panels)
- ok:         #1F9D57   (success/delivered)
- warn:       #C4462B   (error/failed/refund)

Rule: green is the workhorse accent; gold is the second accent, reserved for the
"popular" badge, the step numerals, and labels on the dark footer. Keep both
restrained. The page is WHITE from the nav to the footer: body, hero, every marketing section, and
every card are #FFFFFF, and a card is told apart by its hairline border, not by a
tinted fill. The footer is the one dark green surface. The warm sand ground and the
dark green nav and hero this identity launched with are both gone.

Note: in CSS the original token NAMES were kept to avoid churn, so existing
`var()` refs keep working. `--cobalt` now resolves to green (#0E4A44), `--ink` to
deep-green, `--bone` to WHITE (it doubles as the text colour on the dark green
chrome), `--card` to white, `--serif` to the Commissioner sans stack. Do not read a
token's name literally; read its value here.

## Typography
- One typeface everywhere: **Commissioner** (Google Fonts, variable, 400–800),
  loaded once in the root layout so the site and the admin share it. Headings are
  NOT serif in this identity.
- Text is black. Secondary text is the neutral grey above, never a tinted one.
- Five weights, and only these five:
  - **800** small heavy marks only: the wordmarks, prices, step numerals. Weight
    here reads as a mark, not as type.
  - **700** all real headings: page titles (`.display`, `.content__title`), `.h2`,
    card titles, eyebrows, `strong`, table heads. Size separates H1 from H2, not
    weight.
  - **600** interactive: buttons and the nav CTA pill, form labels, plan names, tabs.
  - **500** quiet UI: nav links, inactive tabs, menu items, small cross-links.
  - **400** all body copy, ledes, captions and metadata.
- Tighten tracking as weight climbs: -0.02em on 700, -0.03em on 800.
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
- DON'T tint the page or card surfaces. They are pure white; warmth comes from the
  green and gold accents, never from the ground.
