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

## Color tokens (Indigo)
- white:      #FFFFFF   (the page ground, everywhere: body, sections, cards)
- ink:        #16163A   (all primary text, and the deepest surface)
- indigo:     #3A3FB0   (the one accent: CTAs, links, focus states, ticks, badges)
- deep:       #2B2F8C   (indigo pressed/hover, and small emphasis marks)
- wash:       #E8E9FB   (indigo at 8%: selected chips, soft highlight fills)
- muted:      #5D5D7A   (captions, ledes, metadata)
- line:       #E2E2EE   (hairline borders, dividers)
- surface:    #F7F7FB   (the one quiet fill: bands, table headers, card grounds)
- sink:       #ECECF5   (a step darker than surface: image frames, inset wells)
- footer:     #1B1C4B   (the only dark surface; nav and hero are white)
- on-dark:    #EEEEFA   (text on the footer and on filled indigo)
- ok:         #1F9D57   (success/delivered)
- warn:       #C4462B   (error/failed/refund)

Rule: one accent, used sparingly. Indigo carries every action, link and tick;
there is no second accent colour, so emphasis comes from weight, size and space
instead. The page is WHITE from the nav to the footer: body, hero, every
marketing section and every card are #FFFFFF, and a card is told apart by its
hairline border, not by a tinted fill. Surface and sink exist for bands and
image wells only, never for body copy backgrounds. The footer is the one dark
surface.

Note: in CSS the original token NAMES were kept to avoid churn, so existing
`var()` refs keep working. `--cobalt` and `--gold` both resolve to indigo
(#3A3FB0), `--ink` to #16163A, `--bone` to WHITE, `--card` to white, `--serif`
to the Commissioner sans stack. Do not read a token's name literally; read its
value here.

## Typography
- One typeface everywhere: **Commissioner** (Google Fonts, variable, 400–800),
  loaded once in the root layout so the site and the admin share it. Headings are
  NOT serif in this identity.
- Text is ink (#16163A). Secondary text is the muted grey above.
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
- DON'T tint the page or card surfaces. They are pure white; colour comes from the
  indigo accent, never from the ground.
