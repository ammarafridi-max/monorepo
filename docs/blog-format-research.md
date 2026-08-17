# Blog format: what the 2026 research says

Why `scripts/lib/formats.mjs` is shaped the way it is. Researched 2026-08-17.

## Findings

**FAQ rich results are gone, FAQ markup is not.** Google added the deprecation
notice on 2026-05-07; the search-appearance filter and Rich Results Test support
went in June, and the Search Console API data in August. `FAQPage` markup stays
valid and is still parsed by AI retrieval systems. So we keep FAQs — for AI
citation, not for SERP boxes — and we do not pad them.
([Search Engine Journal](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/),
[Passionfruit](https://www.getpassionfruit.com/blog/what-changed-with-google-drops-faq-rich-results-and-what-to-do-now))

**Structure drives AI citation.** Pages with structured lists, tables and
statistics show 30–40% higher visibility in AI answers. The practices that lift
citation rates: a direct answer in roughly the first 200 words, 5–7 data points
per piece, plain language, short sentences, comparison tables. ChatGPT cites
only ~15% of the pages it retrieves.
([Search Engine Land](https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142),
[Otterly AI](https://otterly.ai/blog/the-ai-citations-report-2026/))

**Visa advice is YMYL, so trust signals gate ranking.** Every factual claim
needs attribution linking to the specific source. A visible author byline
linked to a credentialed author page; a generic "Staff" byline signals low
quality. A visible "last updated" date, because YMYL content decays fast.
([WebFX](https://www.webfx.com/blog/content-marketing/mastering-ymyl-content/),
[Google Search Central](https://developers.google.com/search/docs/fundamentals/creating-helpful-content))

**Length is the wrong metric.** Long-form (2,000–3,500) converts ~30% better for
service businesses where trust drives the decision, but a 1,200-word post built
on original data beats a 3,000-word post restating what is already published.
([Shopify](https://www.shopify.com/blog/how-long-should-a-blog-post-be),
[SEO.co](https://seo.co/content-length/))

## What we did about it

| Finding | Implementation |
|---|---|
| Answer in the first ~200 words | Every format opens with a 40–80 word verdict-first paragraph |
| Tables and lists get cited | "At a glance" table required in all three formats; costs table in the longer two |
| Question-shaped headings | Every `<h2>` must be a question a real applicant would type |
| Short paragraphs | 2–3 sentences per `<p>`, already enforced |
| FAQs still useful for AI | Kept, count per format (4 short / 5 longer), not padded |
| YMYL attribution | `citationDomains` allowlist, minimum citation count, required Sources section, and a fact-check pass that re-reads each cited page |
| Original data beats length | `field-report` format exists for it, and blocks generation unless real first-party numbers are supplied |

## Not yet done

- **Author page.** The byline renders (name, date, reading time) but there is no
  bio, credentials, or author page, and `admin-users` has no bio field. The YMYL
  guidance wants a credentialed author page linked from the byline.
- **Field Report is unusable.** It needs first-party numbers; `visa-applications`
  is empty, so `formatsByTier.long` points at `sourced-guide` for now.
