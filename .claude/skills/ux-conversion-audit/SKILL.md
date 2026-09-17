---
name: ux-conversion-audit
description: Run a complete read-only UX and conversion-rate audit of a web product by walking its real funnel on live rendered pages, then produce a scored report with a ranked fix list. Use this whenever the user asks about conversion problems, funnel drop-off, why traffic is not converting, why ads get clicks but no sales, landing page performance, checkout or signup abandonment, CRO, UX review, or wants any website or app audited for usability. Also use it when the user describes a symptom like "clicks but no purchases", "people leave at checkout", "nobody finishes signup", or "traffic is fine but revenue is not", even if they never say the words audit, UX, or conversion.
---

# UX & Conversion Audit

A read-only audit that walks a product's real funnel and produces a scored report with a ranked, specific fix list.

This is a conversion audit, not a design critique. Aesthetic opinions are worth nothing here. Every finding must name a specific thing a real user would hit and say what it costs. If you cannot say what a finding costs, cut it.

## Step 1: Fill the INPUTS block with the user

Read `references/inputs-template.md` and work through it with the user. Do not start auditing until it is filled. Most of these can be inferred from the codebase, but four must come from the user:

- **PRIMARY CONVERSION EVENT** — the single thing that counts as success
- **KNOWN SYMPTOM** — what made them order this audit
- **RISK REVERSAL IN PLACE** — guarantee, refund, trial, or none
- **HOUSE FACTS** — claims that must be true everywhere, so contradictions can be flagged

Ask for these in one batch. Infer the rest and show them your inferences for correction.

Treat KNOWN SYMPTOM as a hypothesis to test, never as established fact. If the user says the landing page is the problem, your job is to confirm or refute that with evidence, not to assume it. An audit that agrees with the brief without testing it is worthless.

`references/example-picturesk.md` shows a fully worked INPUTS block for an AI headshot SaaS with a slow post-payment job. Read it if the user's product has async delivery, or if they want to see what "filled in properly" looks like.

## Step 2: Declare your instruments before any finding

This step is not optional and comes before the audit.

State plainly, at the top of the report:

- **Do you have a real browser** (headless, MCP, or otherwise)? If NO, you cannot see rendered layout, tap targets, visual hierarchy, above-the-fold content, or measure Core Web Vitals.
- **Can you screenshot?** If yes, capture every funnel step at 390px and 1440px.
- **Can you reach the analytics sources** named in INPUTS?

A UX audit run without a browser is a code review wearing UX vocabulary. It still has value, but the report must never present an inferred finding as an observed one.

Tag every finding as **OBSERVED** (you rendered or ran it), **CODE** (you read it), or **INFERRED** (you reasoned from either). Do not blur the three. If you catch yourself writing "the user sees" about something you never rendered, rewrite it as "the code renders" and tag it INFERRED.

## Step 3: Bring up the environment yourself

Start the frontend and backend dev servers. Note the local URLs. Record the branch and commit so the report states exactly what was measured.

If a server fails to start, say so and mark dependent checks "not verified". Never fake a step. Shut everything down cleanly when finished.

**Check whether dev and production share a database before touching anything.** If they do, say so in the report, because it changes what any follow-up fix script can safely do.

## Step 4: Run the phases

Read `references/phases.md` and work through all of them in order. It contains the full checklist for:

0. Discover the stack and map the real funnel from code
1. The funnel walk, including the unhappy paths
2. First screen and message match
3. Trust, objections and risk reversal
4. Forms, checkout and payment
5. States, feedback and failure
6. Mobile and speed as experience
7. Accessibility
8. Analytics-informed findings (only if access provided)
9. Competitor comparison (only if competitors named)

Skip a phase entirely if its inputs are missing. Deleting a phase is better than letting it produce filler.

## Step 5: Score and rank

Score six buckets, each out of 100, then a weighted overall. State the weights.

- Clarity and message match
- Funnel friction
- Trust and risk reversal
- Forms and checkout
- States, feedback and failure handling
- Mobile and performance experience

Justify each in two or three lines with the specific findings that drove it. If a bucket could not be fully assessed, say so and score only what was verified.

Never present a score based on unmeasured work as if it were measured. If the fixes have not been observed working, the score is projected, and the report must call it projected.

## Step 6: Write the fix list

One master table: Issue | Where | Category | Evidence type | Impact | Effort | Fix summary.

Rank high to low by impact. Tie-breakers in order: things that block or break conversion outrank things that merely slow it; at equal impact lower effort ranks higher; fixes that unblock others rank higher.

**Do not propose a redesign.** Every fix must be a specific change to a specific element. "Improve the hero" is not a fix. "Replace the hero headline with one naming the outcome, and swap the illustration for before-and-after output" is a fix.

Where a fix is a copy change, write the actual replacement copy.

End with a "Top 10 highest-leverage fixes" shortlist, and separately a "Test these, don't just ship them" list for any fix where you are genuinely uncertain which direction wins.

## The no-invention rule

Every number, quote, price and claim in the report must come from the codebase, a live render you performed, or a source given in INPUTS.

If you do not have a figure, write that you do not have it. Do not estimate a conversion rate, invent a benchmark, cite an industry average, or attribute a statistic you cannot link. A confident fabricated number is worse than an acknowledged gap, because it will get acted on.

If a source you want to cite cannot be verified, say so and flag it for the user to check by hand rather than citing it anyway.

## Output

Write ONE report to `docs/audits/<BRAND>-UX_AUDIT-<DD-MM-YYYY>.md` and create the directory if needed.

Start with: environment audited (local URLs, branch, commit), what instruments you had, what was and wasn't checked, and the date. Then an executive summary: the six sub-scores, the overall, the single highest-drop-risk step, and the top 10 fixes. Then the detailed phases.

Use tables for the funnel walk, the forms audit and the fix list. Tight prose, no filler, no em dashes.

Modify no other file. This is read-only.

At the end of the run, print to the console: the report path, the six sub-scores plus overall, the highest-drop-risk step, and the top 3 fixes, so the user has them without opening the file.
