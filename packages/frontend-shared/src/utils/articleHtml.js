const HEADING_RE = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;

const CONTAINERS = [
  "div",
  "section",
  "article",
  "aside",
  "blockquote",
  "table",
  "ul",
  "ol",
  "figure",
];

export function slugifyHeading(text, used = new Set()) {
  const base =
    String(text)
      .toLowerCase()
      .replace(/&[a-z]+;/g, " ")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || "section";

  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

function stripTags(html) {
  return String(html)
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/\s+/g, " ")
    .trim();
}

function isTopLevel(html, index) {
  const head = html.slice(0, index);
  return CONTAINERS.every((tag) => {
    const open = (head.match(new RegExp(`<${tag}\\b`, "gi")) || []).length;
    const close = (head.match(new RegExp(`</${tag}\\s*>`, "gi")) || []).length;
    return open === close;
  });
}

export function prepareArticleHtml(html, options = {}) {
  const { splitAfterHeading = 0, minHeadings = 4 } = options;
  const source = typeof html === "string" ? html : "";

  if (!source) {
    return { headings: [], htmlBefore: "", htmlAfter: "", didSplit: false };
  }

  const used = new Set();
  const headings = [];

  const withIds = source.replace(HEADING_RE, (match, attrs, inner) => {
    const text = stripTags(inner);
    if (!text) return match;

    const existing = /\bid=["']([^"']+)["']/i.exec(attrs);
    const id = existing ? existing[1] : slugifyHeading(text, used);
    if (existing) used.add(id);

    headings.push({ id, text });
    return existing ? match : `<h2${attrs} id="${id}">${inner}</h2>`;
  });

  const canSplit =
    splitAfterHeading > 0 &&
    headings.length >= minHeadings &&
    splitAfterHeading < headings.length;

  if (!canSplit) {
    return { headings, htmlBefore: withIds, htmlAfter: "", didSplit: false };
  }

  const opens = [];
  const finder = /<h2\b/gi;
  let m;
  while ((m = finder.exec(withIds)) !== null) opens.push(m.index);

  const cut = opens[splitAfterHeading];
  if (cut === undefined || !isTopLevel(withIds, cut)) {
    return { headings, htmlBefore: withIds, htmlAfter: "", didSplit: false };
  }

  return {
    headings,
    htmlBefore: withIds.slice(0, cut),
    htmlAfter: withIds.slice(cut),
    didSplit: true,
  };
}
