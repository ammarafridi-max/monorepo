# DT365 Branding and Design System

Single source of truth for styling the Dummy Ticket 365 frontend. Extracted from the codebase as it stands. If a value here disagrees with the code, the code is correct and this file is stale (open the Maintenance section).

This file is acceptance-tested against the following standard: an AI given ONLY this file should be able to style a new DT365 page that visually matches the rest of the site. That means concrete, copy-pasteable Tailwind class strings, not vague descriptions.

---

## 1. Color palette

Tailwind v4. Tokens live in `src/app/globals.css` inside `@theme inline { … }`. Use the Tailwind utility class (e.g. `bg-primary-500`), not the hex.

### Primary (deep blue)

Brand color. Used for icon badges, breadcrumb hovers, accordion active states, decorative accents. **Not** used for CTAs.

| Token | Hex | Utility class | Used for |
|---|---|---|---|
| primary-50 | `#e5eef8` | `bg-primary-50` | Soft hover surfaces, pill backgrounds |
| primary-100 | `#c8dbf0` | `border-primary-100` | Card borders on tinted wrappers, accordion border states |
| primary-200 | `#a7c5e6` | `bg-primary-200/40` | Hero ambient blob, decorative blur |
| primary-300 | `#7da8d7` | `text-primary-300` | Focus rings, gradient strip start |
| primary-500 | `#1e60a6` | `bg-primary-500`, `text-primary-500` | About IconWithText icon backgrounds, PageHero check icon, accordion active icon |
| primary-600 | `#174b85` | `bg-primary-600`, `text-primary-600` | Process step number, Benefits icon bg, accordion question (open), body link color |
| primary-700 | `#123a6a` | `text-primary-700` | Secondary section title color, RelatedPages hover, blog link hover, TestimonialCard avatar text |

Token also defines `primary-400`, `primary-800`, `primary-900`. Not currently used. Leave them in case future depth is needed.

### Accent (warm orange)

Used for **every CTA** on the site. "Primary" in component names (`PrimaryButton`, `PrimaryLink`) refers to the primary call-to-action, not the brand color.

| Token | Hex | Utility class | Used for |
|---|---|---|---|
| accent-50 | `#e2f7fb` (**see Open Questions**) | (unused inline) | — |
| accent-100 | `#ffece8` | `bg-accent-100/60`, `border-accent-100` | Hero ambient blob, Contact ambient blob, outline-button hover bg |
| accent-200 | `#ffd0c5` | `bg-accent-200/30` | Contact ambient blob |
| accent-500 | `#ff603a` | `bg-accent-500`, `border-accent-500` | All CTAs default bg, all CTA borders |
| accent-600 | `#e7441d` | `hover:bg-accent-600`, `text-accent-600` | All CTA hover bg, outline-button default text |
| accent-700 | `#c42700` | `text-accent-700` | (rare) deeper text |

Token also defines `accent-300`, `accent-400`, `accent-800`, `accent-900`. Not currently used.

### Neutrals (Tailwind defaults)

Canonical text colors:
- **Headings**: `text-gray-900`.
- **Body copy**: `text-gray-600`.
- The `globals.css` body base color (`#111827`, equivalent to `text-gray-900`) is the inherited fallback. Section components override to `text-gray-600` for body paragraphs. Both are correct in their context.

| Class | Used for |
|---|---|
| `text-gray-900` | Hero H1, body H2, card titles, primary text |
| `text-gray-800` | Accordion question text (closed), neutral button text |
| `text-gray-700` | QuickAnswer body, ValuePill text, testimonial body |
| `text-gray-600` | All standard body copy in sections (About, Process, Benefits, PageHero, Contact) |
| `text-gray-500` | RelatedPages blurb, contact muted text, breadcrumb default |
| `text-gray-400` | Placeholders, dim icons |
| `text-gray-300` | Inactive star color, breadcrumb separator |
| `border-gray-100` | Card borders (Process pattern) |
| `border-gray-200` | Input borders, RelatedPages card borders |
| `bg-gray-50/70` | Sectioned-off section backgrounds (Benefits, FAQ) |
| `bg-gray-50/60` | RelatedPages section background |

### Status colors

| Use | Class |
|---|---|
| Star (rating) | `text-amber-400` (filled), `text-gray-200` (empty) |
| Destructive (Danger button) | `bg-red-600 hover:bg-red-700`, `border-red-600`, `text-white` |
| Field required asterisk | `text-red-600` |

### Never use

- Off-palette hex codes inline. If you reach for `text-[#1f2937]` or `bg-[#f5fbfb]`, you are wrong. Either map it to an existing token or open an Open Question to add one.
- New shades of primary or accent. The site already has 5 inconsistent blues (see Open Questions). Do not add a sixth.
- Colors from Tailwind families not listed above (no `purple`, `emerald`, `cyan`, etc.). The two brand families plus `gray`, `red`, `amber` are the entire palette.
- `text-black` for body text. The body baseline is `text-gray-600`. `text-black` is allowed only inside form `<Label>` (where it's `text-black/80`).

---

## 2. Typography

### Font families

Only **Outfit** is loaded by `layout.js` via `next/font/google` (variable `--font-outfit`). Headings (`h1`–`h6`) get Outfit via a base rule in `globals.css`. The `*` selector also sets body to Outfit. So every readable string on the site is Outfit.

Only Outfit is loaded. `--font-nunito` remains as a token in `@theme` (unused, parked for future) but no component should reference `font-nunito` until Nunito is actually loaded via `next/font`.

### Type scale (canonical classes)

**Use the named type tokens. Do not write `text-[XYpx]` or matching `leading-*` for these roles.** Each token encodes size, responsive shifts, and line-height as one unit. Tokens are defined as Tailwind v4 `@utility` blocks in `apps/dt365-frontend/src/app/globals.css` (mirrored in `apps/mdt-frontend/src/app/globals.css` — keep in sync).

Two H1 styles and two H2 styles are intentional and canonical:

- **H1** — `Hero` (46 px bold) is for transactional landing pages with a form. `PageTitle` (36 px medium capitalize) is for utility pages (FAQ, blog index, tag pages).
- **H2** — `SectionTitle` (26-34 px medium capitalize) is the default for every page section. `QuickAnswer` uses the same `text-h2` token and the same weight, tracking, and color, with **one deliberate difference: no `capitalize`**, because the question is a full sentence and title-casing every word reads wrong. Don't introduce a third H2 style.

| Use | Tag | Token | Underlying values | Full canonical class string |
|---|---|---|---|---|
| Landing-page H1 (with form hero) | `<h1>` via `Hero` | `text-h1-landing` | 30 → 46 @md, line-height 1.3 | `text-h1-landing font-bold font-outfit text-gray-900 mb-5` |
| Utility-page H1 | `<h1>` via `PageTitle` | `text-h1-page` | 26 → 36 @md, line-height 32 → 48 | `text-h1-page text-black capitalize font-medium font-outfit` |
| Section heading (default) | `<h2>` via `SectionTitle` | `text-h2` | 26 → 31 @md → 34 @lg, line-height 1.2 | `text-h2 text-gray-900 font-medium font-outfit tracking-[-0.01em] capitalize mb-2.5 text-left` |
| Quick-answer heading | `<h2>` via `QuickAnswer` | `text-h2` | 26 → 31 @md → 34 @lg, line-height 1.2 | `text-h2 text-gray-900 font-medium font-outfit tracking-[-0.01em] text-left mb-2.5` (sentence case, **no `capitalize`** — the question is a full sentence) |
| Content card title (Process, Benefits) | `<h3>` | `text-h3-card` | 20 | `text-h3-card font-normal text-gray-900 capitalize font-outfit text-left mt-4 mb-2` |
| FAQ question | `<h3>` via `FaqAccordion` | `text-h3-faq` | 16 → 18 @sm, line-height 1.375 | `text-h3-faq font-medium` (color flips per state) |
| Related-link card title | `<h3>` via `RelatedPages` | `text-[15px]` (no token, see note) | 15 | `text-[15px] font-bold text-gray-900 group-hover:text-primary-700 transition-colors mb-1.5 leading-snug` |
| Body large (Hero subtitle, QuickAnswer body) | `<p>` | `text-body-lg` | 16 → 18 @md, line-height 1.75rem | `text-body-lg text-gray-600 font-normal` |
| Body standard (sections) | `<p>` | `text-body` | 16, line-height 1.75rem | `text-body text-gray-600 font-light` |
| Card body (Testimonial) | `<p>` | `text-[15px]` (no token, see note) | 15 | `text-[15px] text-gray-700 leading-relaxed font-light py-3` |
| RelatedPages blurb | `<p>` | `text-pill` | 13 | `text-pill text-gray-500 leading-relaxed` |
| Form label | `<label>` via `Label` | `text-small` | 14 | `text-small font-normal text-black/80 capitalize` |
| Breadcrumb | `<nav>` | `text-pill md:text-small` | 13 → 14 @md | `text-pill md:text-small tracking-tight text-gray-500` |
| Pill / chip | `<span>` | `text-pill` | 13 | `text-pill font-medium text-gray-700` |

**Two sizes without a token (intentional, follow-up):** `15px` (RelatedPages h3 title, TestimonialCard body) and `15px → 16px @sm` (FaqAccordion answer). Both are kept as `text-[15px]` / `text-[15px] sm:text-[16px]` for now. If a future change wants to tokenise them, propose names like `text-h3-compact` and `text-body-sm` and add to this table in the same PR.

**Orphaned token (candidate for removal):** `text-h2-compact` is defined as a `@utility` in both `globals.css` files but no longer used by any component (QuickAnswer migrated to `text-h2`). Kept in place pending owner decision. If removed, delete the `@utility` block from both DT365 and MDT `globals.css` and drop this note.

**Why these tokens are utility classes, not CSS variables:** they're Tailwind v4 `@utility` blocks, not `--text-*` vars in `@theme`. This means each token = a single class that bakes in the size, line-height, and breakpoint shifts. Tailwind responsive prefixes (`md:text-XYZ`) **will not override** these tokens — by design. If you need a different size at a different breakpoint, you've picked the wrong token, not the wrong prefix.

Three H3 roles are intentional and canonical:

- **Content card title** (Process, Benefits) — soft, 20 px font-normal capitalize. Long enough to carry a sentence.
- **Accordion question** (FaqAccordion) — 16-18 px font-medium, smaller because it sits inside a clickable button.
- **Related-link card title** (RelatedPages) — 15 px font-bold. Compact card surface where the title doubles as the link anchor.

Don't add a fourth.

### Weight rules

- `font-bold` is reserved for the Hero H1 and the QuickAnswer H2 (and the RelatedPages card title `<p>`).
- `font-medium` for section titles, form labels (no, labels are `font-normal`), and FAQ questions.
- `font-normal` for card titles, form labels, pills.
- `font-light` for body copy and standard subtitles.

### Letter spacing

Headings carry `tracking-[-0.01em]` via the base `h1-h6` rule in `globals.css`. `SectionTitle` repeats it explicitly. No other tracking should be added.

---

## 3. Layout and spacing

### Container

```jsx
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';

<Container>{children}</Container>
```

Renders `w-[90%] md:w-[85%] lg:w-[80%] mx-auto`. No `max-w-*` — percentage-based by design. Always wrap section content in `<Container>` unless intentionally going full-bleed.

For narrow text-only blocks (e.g. quick-answer body), nest a `max-w-3xl mx-auto` inside.

### Section wrapper

```jsx
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';

<PrimarySection className="py-14 md:py-18 lg:py-24" id="benefits">
  <Container>{...}</Container>
</PrimarySection>
```

`PrimarySection` is a passthrough `<section>`. The padding and background are supplied by the consumer.

### Standard section padding

Use `py-14 md:py-18 lg:py-24` for any normal content section (matches Process, Benefits, FAQ, Testimonials, Contact, BlogPosts). Do not invent a new rhythm.

For connector blocks between major sections (QuickAnswer, RelatedPages): `py-12 md:py-16`.

### Hero padding

- `Hero` (landing): `pt-24 pb-14 md:pt-30 md:pb-16 lg:pt-30 lg:pb-20`
- `PageHero` (utility): `pt-24 pb-12 md:pt-28 md:pb-14 lg:pt-28 lg:pb-16`

Do not modify hero padding per page. Use the existing component.

### Grid gaps

- Card grids (Process, Benefits): `gap-5 md:gap-7`
- Wider Contact/About layouts: `gap-8 lg:gap-12`
- RelatedPages 4-up grid: `gap-4`

---

## 4. Components

Every section below is a copy-pasteable canonical usage. All examples are real JSX taken from the codebase.

### Hero (landing pages)

Use for any landing page that needs the booking form. Renders the H1, subtitle, value pills, breadcrumbs, and the form on the right.

```jsx
import Hero from '@travel-suite/frontend-shared/components/sections/v1/Hero';
import AllForms from '@travel-suite/frontend-shared/components/forms/v1/AllForms';

<Hero
  title="Dummy Ticket for X Visa From $13"
  subtitle="One-line description of what this page is for."
  form={<AllForms forms={['ticket']} />}
  pills={[
    'Dummy tickets from $13',
    'Verifiable PNR included',
    'Accepted at VFS and BLS',
    'Delivered in minutes',
  ]}
  breadcrumbPaths={[
    { label: 'Home', href: '/' },
    { label: 'Dummy Ticket for X Visa' },
  ]}
/>
```

### PageHero (utility pages)

Use for non-transactional pages: `/faq`, `/blog`, `/blog/tags`, etc. No form, smaller H1, point-chip pills.

```jsx
import PageHero from '@travel-suite/frontend-shared/components/sections/v1/PageHero';

<PageHero
  paths={[
    { label: 'Home', path: '/' },
    { label: 'FAQs', path: '/faq' },
  ]}
  title="Frequently Asked Questions"
  subtitle="One-line description."
  points={['Optional', 'Bullet', 'Chips']}
/>
```

### SectionTitle

Use for every section heading (h2). Pass `subtitle` for the eyebrow line under it.

```jsx
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';

<SectionTitle
  textAlign="center"
  subtitle="Common questions answered"
  className="mb-10 md:mb-12"
>
  Frequently Asked Questions
</SectionTitle>
```

`type="secondary"` swaps the H2 color from `text-gray-900` to `text-primary-700`. Use sparingly.

### PrimarySection and Container

Always pair them. `PrimarySection` is the outer `<section>` (controls padding and background). `Container` is the inner width-limiter.

```jsx
<PrimarySection className="py-14 md:py-18 lg:py-24 bg-gray-50/70" id="benefits">
  <Container>
    <SectionTitle textAlign="center" className="mb-10 md:mb-12">
      Why Choose DT365?
    </SectionTitle>
    <div className="flex flex-col gap-5 md:grid md:grid-cols-3 md:gap-7">
      {/* cards */}
    </div>
  </Container>
</PrimarySection>
```

### Buttons (PrimaryButton, PrimaryLink, PrimaryButtonOutline)

All CTAs are orange (`bg-accent-500`). "Primary" in the name means primary action, not primary color.

```jsx
import PrimaryButton from '@travel-suite/frontend-shared/components/ui/v1/PrimaryButton';
import PrimaryLink from '@travel-suite/frontend-shared/components/ui/v1/PrimaryLink';
import PrimaryButtonOutline from '@travel-suite/frontend-shared/components/ui/v1/PrimaryButtonOutline';

// Filled CTA — submits forms, primary action on a page
<PrimaryButton size="medium" onClick={handleClick}>Search Flights</PrimaryButton>

// Link CTA — navigates somewhere
<PrimaryLink size="large" href="/booking/select-flights">Continue Booking</PrimaryLink>

// Outline CTA — secondary action
<PrimaryButtonOutline size="small" onClick={...}>Cancel</PrimaryButtonOutline>

// Neutral button — utility (e.g. cancel, close)
<PrimaryButton colorType="neutral" size="small">Cancel</PrimaryButton>

// Danger button — destructive actions
<PrimaryButton colorType="danger" size="small">Delete</PrimaryButton>
```

Sizes: `small` | `medium` (default) | `large`. Both buttons and links accept the same sizes.

### Cards

There is no single Card component. The card pattern is a `div` with these classes (extracted from Benefits/FAQ):

```jsx
<div className="rounded-2xl border border-white bg-white p-7 shadow-[0_14px_35px_rgba(16,24,40,0.08)]">
  {/* contents */}
</div>
```

For cards on white background (Process step pattern):

```jsx
<div className="rounded-2xl border border-gray-100 bg-white p-7 md:p-8 shadow-[0_14px_35px_rgba(16,24,40,0.08)]">
  {/* contents */}
</div>
```

Both card patterns now use the same shadow `shadow-[0_14px_35px_rgba(16,24,40,0.08)]`. Border is the only difference (`border-white` over tinted bg, `border-gray-100` over white).

Card icon badge convention (40px square with white icon on `primary-600`):

```jsx
<div className="w-10 h-10 flex items-center justify-center bg-primary-600 text-white rounded-xl">
  <IconComponent />
</div>
```

### FaqAccordion

```jsx
import FaqAccordion from '@travel-suite/frontend-shared/components/ui/v1/FaqAccordion';

<FaqAccordion question="Is a dummy ticket accepted for a Schengen visa?">
  Yes. EU Visa Code Article 14 lists a flight reservation among the supporting documents…
</FaqAccordion>
```

The shared `<FAQ>` section component slices to 6 items. If a page passes more than 6 FAQs and those are also in the FAQPage schema, render the full list inline using `<FaqAccordion>` directly (see `/dummy-ticket-schengen-visa` and `/onward-ticket` for the inline pattern).

### QuickAnswer (DT365 local)

DT365-specific. Renders directly after `Hero`, before `Process`. Verdict-first answer in 40-80 words. Optimised for featured snippets and AI Overviews.

Layout: wrapped in the standard `<Container>`, then nested in a soft tinted box (`rounded-2xl border border-primary-100 bg-primary-50/40 p-6 md:p-8`) so the block reads as a deliberate "answer card" rather than floating prose. Heading uses the `text-h2` token (matches `SectionTitle`) without `capitalize` — the question is a full sentence. A `HiOutlineQuestionMarkCircle` icon (react-icons/hi2) sits left of the heading at `w-7 h-7 text-primary-500`. Answer paragraph uses `text-body-lg` with `max-w-[760px]` (same width treatment as `SectionTitle` subtitles).

```jsx
import QuickAnswer from '@/components/QuickAnswer';

<QuickAnswer
  question="What is a dummy ticket?"
  answer="A dummy ticket is a real flight reservation with a verifiable PNR, generated through global GDS platforms (Amadeus, Sabre, Travelport). It is used to show proof of onward travel for visa applications, airline check-in, and immigration. You are not paying for the ticket itself, only for the reservation document, which starts at $13."
/>
```

### RelatedPages (DT365 local)

DT365-specific. Drops at the bottom of each landing page, before `Contact`. 3–4 descriptive-anchor internal links as cards.

```jsx
import RelatedPages from '@/components/RelatedPages';

<RelatedPages
  title="Related Dummy Ticket Pages"
  subtitle="Other visa applications we support"
  links={[
    { anchor: 'Dummy ticket for a Schengen visa', href: '/dummy-ticket-schengen-visa', blurb: 'EU Visa Code Article 14 compliant, accepted at VFS, BLS, and TLScontact.' },
    { anchor: 'Dummy ticket for a UK visa', href: '/dummy-ticket-uk-visa', blurb: 'Standard Visitor visa file ready, no paid ticket needed before approval.' },
    { anchor: 'Dummy ticket for an Australia visa', href: '/dummy-ticket-australia-visa', blurb: 'Formatted for the Subclass 600 ImmiAccount upload.' },
    { anchor: 'Dummy ticket for a Japan visa', href: '/dummy-ticket-japan-visa', blurb: 'Round-trip format for embassy and JAPAN eVISA portal submissions.' },
  ]}
/>
```

Anchor text must be descriptive. Never "click here" or "learn more".

### Form inputs

```jsx
import Input from '@travel-suite/frontend-shared/components/form-elements/v1/Input';
import Label from '@travel-suite/frontend-shared/components/form-elements/v1/Label';

<div>
  <Label htmlFor="email" required>Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

Input renders: `w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400`.

The `Select.js` primitive is currently styled differently (see Open Questions). For new forms, prefer `Input` styling: `rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-500`.

### Breadcrumb

```jsx
import Breadcrumb from '@travel-suite/frontend-shared/components/shared/layout/Breadcrumb';

<Breadcrumb paths={[
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Current Post' },
]} />
```

Last item (no `href`) renders as plain text. First item with label `home` (case-insensitive) gets a home icon automatically.

### Process

```jsx
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';

<Process
  title="How to Book Your Dummy Ticket"
  subtitle="Three steps"
  steps={[
    { title: 'Tell us your route', text: '…' },
    { title: 'Choose your validity', text: '…' },
    { title: 'Pay and receive instantly', text: '…' },
  ]}
/>
```

If you don't pass `steps`, a default generic template renders.

### Benefits

```jsx
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import { HiOutlineCheckBadge, HiOutlineGlobeAlt } from 'react-icons/hi2';

<Benefits
  title="Why Choose Us?"
  subtitle="Trusted supplier based in Dubai"
  benefits={[
    { title: '…', text: '…', icon: HiOutlineCheckBadge },
    { title: '…', text: '…', icon: HiOutlineGlobeAlt },
    // 6 items typically
  ]}
/>
```

### About

```jsx
import About from '@travel-suite/frontend-shared/components/sections/v1/About';
import { MdOutlineAirplaneTicket, MdOutlineHotel, MdOutlineHealthAndSafety } from 'react-icons/md';

<About
  title="About DT365"
  text="One-paragraph description."
  services={[
    { icon: <MdOutlineAirplaneTicket />, title: 'Dummy Tickets', description: '…' },
    { icon: <MdOutlineHotel />, title: 'Hotel Reservations', description: '…' },
    { icon: <MdOutlineHealthAndSafety />, title: 'Travel Insurance', description: '…' },
  ]}
/>
```

### Contact

```jsx
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';

<Contact
  title="Questions on our dummy tickets?"
  text="Our team is available 24/7."
  email="info@dummyticket365.com"
/>
```

The `email` prop is required for the CTA button to render.

---

## 5. Interactive states

Already covered per-component above. Common state patterns:

- **Focus rings**: `focus:outline-none focus:ring-2 focus:ring-primary-500` (on form inputs). On dark backgrounds: `focus-visible:ring-white/40`.
- **Hover lift on cards**: `hover:shadow-md transition-all` (RelatedPages); cards in some sections use `hover:-translate-y-1 transition-all duration-300`.
- **Hover color shift on links**: `hover:bg-primary-50 hover:text-primary-700` (light) or `hover:bg-white/10 hover:text-white` (dark).
- **Disabled CTAs**: `disabled:opacity-55 disabled:cursor-not-allowed` (buttons); `disabled:bg-accent-500/50 disabled:opacity-60` (links). **Never disable a primary CTA based on form completeness — validate on submit and surface inline errors instead** (see below).
- **Form validation errors (inline)**: when a required field fails on submit, swap its border to `border border-red-600` and render a short error message under the field via `<FieldError>` (which uses `text-red-700`). Focus and smooth-scroll to the first invalid field. Clear the error the moment the user fills the field. `SelectAirport` and `DatePicker` accept an `error` prop (truthy = red border) and an `inputRef` prop for focus management. Reference implementation: `packages/frontend-shared/src/components/forms/v1/TicketForm.js`.

---

## 6. Iconography

Two libraries available: `react-icons` (4 sub-packages: `hi`, `hi2`, `md`, `fa`) and `lucide-react`. The site currently uses both.

| Convention | Class |
|---|---|
| Inline body icon | `size={12-16}` (lucide) or `text-[13px]-text-[16px]` (react-icons) |
| Card icon badge | 40px square: `w-10 h-10 ... bg-primary-600 text-white rounded-xl` |
| Brand-colored icon | `text-primary-500` (medium emphasis), `text-primary-600` (strong) |
| Muted icon | `text-gray-400` (placeholder), `text-gray-500` (navigation) |
| Status: rating star | `text-amber-400` (filled), `text-gray-200` (empty) |
| Status: success check | `text-primary-500` on light bg, white on `bg-primary-600` badge |

When picking an icon: prefer `react-icons/hi2` (Heroicons v2 outline) for UI affordances; `react-icons/md` for product category icons; `lucide-react` for inline arrows and decorative icons. Pick one library per file; do not mix in a single component.

---

## 7. Radius, shadow, border

### Radius

| Use | Class |
|---|---|
| Standard card | `rounded-2xl` |
| Large card / hero form wrapper | `rounded-3xl` |
| Button | `rounded-lg` |
| Form input | `rounded-xl` |
| Icon badge | `rounded-xl` (square badge) or `rounded-full` (pill/circular) |
| Pill / chip | `rounded-full` (all pills and inline chips) |
| Accordion expand icon | `rounded-full` |

Never use arbitrary radius like `rounded-[7px]`. The asymmetric `rounded-[16px_44px_16px_44px]` on the Contact image is a signature shape; don't replicate elsewhere.

### Shadow

| Use | Class |
|---|---|
| Standard card (all cards) | `shadow-[0_14px_35px_rgba(16,24,40,0.08)]` |
| Hover lift | `hover:shadow-md` or `hover:shadow-xl` |
| Small element (input, ValuePill) | `shadow-sm` |

### Border

| Use | Class |
|---|---|
| Card border (default) | `border border-gray-100` (Process pattern) |
| Card border on tinted bg | `border border-white` (over `bg-gray-50/70`) |
| Input border | `border border-gray-200` |
| Tinted wrapper border | `border border-primary-100` (Contact, About Stat) |

---

## 8. Do's and don'ts

### Do

- Reuse the components in section 4. Don't re-style.
- Use `Container` inside `PrimarySection` for every page section.
- Use `SectionTitle` for every section H2.
- Match the standard section padding `py-14 md:py-18 lg:py-24`.
- Use the existing color tokens. Reference colors as `bg-primary-500`, not the hex.
- Use Outfit (already loaded). Reference via `font-outfit` only when overriding.
- Use the standard card pattern: `rounded-2xl`, `border border-gray-100` or `border border-white`, the shadow tokens above.
- Make all CTAs orange (`bg-accent-500 hover:bg-accent-600`). Use `PrimaryButton`/`PrimaryLink` rather than re-styling buttons.
- Make every internal link's anchor text descriptive ("Dummy ticket for a Canada visa"), never "click here".

### Don't

- Don't add a new color shade. The palette is the palette.
- Don't reach for `text-[XYpx]` inline. Use the named type tokens in section 2 (`text-h1-landing`, `text-h2`, `text-body`, etc.). Each token bakes in size, responsive shifts, and line-height as one unit — so don't pair them with manual `leading-*` or `md:text-XYZ` either. If a new size is genuinely needed, define a new `@utility` block in BOTH `apps/dt365-frontend/src/app/globals.css` AND `apps/mdt-frontend/src/app/globals.css`, add the row to section 2, and reference the token in the component, all in the same PR.
- Don't add a new font. Outfit only.
- Don't hardcode hex codes in components. Inline hex gradients in `Hero`, `Contact`, and `TestimonialCard` are tech debt; do not extend the pattern.
- Don't import `lucide-react` AND `react-icons` in the same file. Pick one.
- Don't use `text-black` for body text. Use `text-gray-900`.
- Don't write a new section component when one of the eight existing ones fits. Compose, don't fork.
- Don't bypass `<Container>` to go full-bleed unless the design genuinely needs it (the Hero blob layer is the only current example).
- Don't change the `<FAQ>` slice cap in the shared component. If your page needs >6 visible FAQs, render inline with `<FaqAccordion>` directly. The cap is load-bearing for MDT and other apps.

---

## 9. Open questions (unresolved drift — needs owner decision)

These are items where two or more correct-looking variants exist in the codebase. The doc cannot be definitive about them until the owner picks a winner. Each carries the same status: blocks normalisation, does not block new feature work.

1. **"Primary" button naming is misleading.** `PrimaryButton`/`PrimaryLink` use accent (orange), not primary (blue). Either rename to `CTAButton` (broader refactor) or accept the convention and document loudly (this doc does the latter).
2. **Inline hex gradients.** Hero / Contact / TestimonialCard each have their own gradient hardcoded. Either promote to named tokens or accept as one-offs.
3. **Two icon libraries.** `react-icons` (4 packages) and `lucide-react`. Pick one for new code.

---

## 10. Maintenance

### How to update this doc

1. Change the code first, in the same PR as the doc change.
2. Update the relevant sections here. Keep examples copy-pasteable; if a class string changes, the example must reflect the new string verbatim.
3. Add a changelog entry below with the date, the section touched, and a one-line "why".
4. If you resolve an Open Question, delete the item (don't strikethrough) and note the resolution in the changelog.
5. Run `grep` for any old class string before considering the change done. Drift starts when the doc says one thing and a component does another.

### Source of truth

If this doc disagrees with the code, the code wins. Open an issue or update the doc.

### Changelog

| Date | Section | Change |
|---|---|---|
| 2026-06-30 | All | Initial extraction. Recorded the system as it stands. 20 Open Questions logged for owner triage. |
| 2026-06-30 | §1 colors, §2 typography, §3 spacing, §4 components, §7 radius/shadow, §9 open questions | Resolved 16 of 20 Open Questions. Code changes: fixed `--color-accent-50` (cyan → `#fff5f2`), removed dead tokens (`--font-merriweather`, `--rounded-input-*`, `--input-box-shadow*`), dropped `font-nunito` from `FaqAccordion` answer, normalised `RelatedPages` border to `border-gray-100`, collapsed Process card shadow to the standard `0_14px_35px_rgba(…0.08)`, aligned About section padding to standard `py-14 md:py-18 lg:py-24`, unified connector-block padding to `py-12 md:py-16` (QuickAnswer + RelatedPages), changed Hero ValuePill to `rounded-full`, aligned `Select.js` primitive to Input styling, made `RelatedPages` card title a proper `<h3>`, aligned QuickAnswer body paragraph to the Hero-subtitle prominent-body class. Doc-only resolutions recorded for H1/H2/H3 variants (intentional) and canonical text colors (gray-900 headings, gray-600 body). Open Questions now: 4 items remaining (button naming, type scale, gradient tokens, icon libraries). |
| 2026-06-30 | §2 typography, §8 do's and don'ts, §9 open questions | Resolved OQ16 (named type scale). Added 10 `@utility` blocks to DT365 and MDT `globals.css` (kept in sync): `text-h1-landing`, `text-h1-page`, `text-h2`, `text-h2-compact`, `text-h3-card`, `text-h3-faq`, `text-body-lg`, `text-body`, `text-small`, `text-pill`. Each bakes in size + responsive shifts + line-height. §2 table updated so every row references the token name as the canonical class; Do/Don't section now enforces "use tokens, never `text-[XYpx]`". Migration is opportunistic: only QuickAnswer migrated in this PR as the reference implementation (`text-[22px] md:text-[26px] ... leading-tight` → `text-h2-compact`; `text-[16px] md:text-[18px] ... leading-7` → `text-body-lg`). Two pixel values (15, 15→16) intentionally not tokenised this round — noted in §2. Open Questions now: 3 items remaining (button naming, gradient tokens, icon libraries). |
| 2026-07-01 | §2 typography, §4 components, §5 interactive states | Two UI fixes. (1) Booking form (`TicketForm`, shared, used by 25 pages across DT365 and MDT): removed the "disabled until valid" gating on the Search Flights CTA so it always renders active accent-500. Validation now fires on submit; missing required fields get `border-red-600` plus a `<FieldError>` underneath, first invalid field is focused and scrolled into view, field errors clear as users fill them. Added optional `error` and `inputRef` props to `SelectAirport` and `DatePicker` primitives (backward-compatible). (2) `QuickAnswer` redesign: removed `max-w-3xl mx-auto` centering, wrapped in standard `<Container>`, left-aligned. Heading now uses `text-h2` (was `text-h2-compact`) matching `SectionTitle` with one deliberate deviation (no `capitalize`, since the question is a full sentence). Added `HiOutlineQuestionMarkCircle` (react-icons/hi2) at `w-7 h-7 text-primary-500` left of the heading. Answer paragraph gets `max-w-[760px]` to match `SectionTitle` subtitle width. `text-h2-compact` is now orphaned (no component uses it); flagged in §2 as a removal candidate, not removed. Added a new §5 entry covering inline form-validation styling with red-600. |
| 2026-07-01 | §4 components | `QuickAnswer` visual follow-up: wrapped content in a soft tinted box (`rounded-2xl border border-primary-100 bg-primary-50/40 p-6 md:p-8`) so the block reads as a deliberate answer card rather than floating prose between the hero and the process section. Reuses the documented `border-primary-100` tinted-wrapper convention from §7. Removed the outer section's `border-b border-gray-100` since the new box self-delineates. |
