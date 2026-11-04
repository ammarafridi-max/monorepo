const UA_REF = { value: 'travel-suite airline-logo-harvest/1.0' };
const SPARQL = 'https://query.wikidata.org/sparql';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const TARGET = 500;
const SPARQL_CHUNK = 60;
const COMMONS_CHUNK = 40;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chunk = (list, size) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

async function getJson(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'User-Agent': UA_REF.value, ...(options.headers || {}) } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

const SUBSIDIARY_WORDS = ['cargo', 'kargo', 'freight', 'skycargo', 'holidays', 'express', 'connect', 'regional', 'link', 'charter', 'jetz'];
const GENERIC_WORDS = new Set(['airlines', 'airline', 'airways', 'air', 'international', 'intl', 'national', 'aviation', 'group', 'company']);

function normaliseName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b(airlines|airline|airways|air|company|co|ltd|limited|group|plc|inc|the)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function nameScore(ourName, theirLabel) {
  const a = normaliseName(ourName);
  const b = normaliseName(theirLabel);
  if (!a || !b) return 0;
  const ax = a.replace(/ /g, '');
  const bx = b.replace(/ /g, '');
  if (!ax || !bx) return 0;
  if (a === b || ax === bx) return 60;
  if (bx.startsWith(ax) || ax.startsWith(bx)) return 45;
  if (bx.includes(ax) || ax.includes(bx)) return 35;
  const aWords = new Set(a.split(' ').filter(Boolean));
  const bWords = b.split(' ').filter(Boolean);
  if (!aWords.size || !bWords.length) return 0;
  const shared = bWords.filter((w) => aWords.has(w)).length;
  return Math.round((shared / Math.max(aWords.size, bWords.length)) * 35);
}

function distinctiveTokens(name) {
  return normaliseName(name)
    .split(' ')
    .filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w));
}

const OFF_TOPIC_WORDS = [
  'flight', 'force', 'party', 'society', 'seal', 'crash', 'accident', 'route', 'destination',
  'map', 'path', 'museum', 'university', 'football', 'stadium', 'army', 'navy', 'police',
  'ministry', 'emblem', 'republic', 'airport', 'livery', 'aircraft', 'fleet',
];

function titleMentionsAirline(title, ourName) {
  const clean = normaliseName(title);
  const haystack = clean.replace(/ /g, '');
  if (!/logo|wordmark/.test(clean)) return false;
  if (OFF_TOPIC_WORDS.some((w) => clean.includes(w))) return false;
  const tokens = distinctiveTokens(ourName);
  if (!tokens.length) return false;
  const hits = tokens.filter((t) => haystack.includes(t));
  return hits.length >= 2 || hits.some((t) => t.length >= 6);
}

function subsidiaryPenalty(ourName, theirLabel) {
  const ours = normaliseName(ourName);
  const theirs = normaliseName(theirLabel);
  return SUBSIDIARY_WORDS.some((w) => theirs.includes(w) && !ours.includes(w)) ? 40 : 0;
}

function deliveredSize(mime, width, height) {
  if (!width || !height) return { width: null, height: null };
  if (mime === 'image/svg+xml') {
    return { width: TARGET, height: Math.round((height / width) * TARGET) };
  }
  const scale = Math.min(TARGET / width, TARGET / height, 1);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function scoreCandidate({ ourName, label, mime, width, height, lowRes, fromSearch }) {
  let score = 50;
  const matched = nameScore(ourName, label);
  score += matched;
  score -= subsidiaryPenalty(ourName, label);
  if (label && matched === 0) score -= 25;
  if (fromSearch) score -= 20;
  if (mime === 'image/svg+xml') score += 25;
  if (lowRes) score -= 60;
  if (width && height) {
    const aspect = Math.max(width, height) / Math.min(width, height);
    if (aspect > 6) score -= 15;
    else if (aspect > 4) score -= 6;
    if (!lowRes && Math.max(width, height) < 200) score -= 20;
  }
  return score;
}

function httpsUrl(url) {
  return String(url).replace(/^http:\/\//, 'https://');
}

function fileTitleOf(url) {
  const match = decodeURIComponent(String(url)).match(/Special:FilePath\/(.+)$/);
  return match ? `File:${match[1].replace(/_/g, ' ')}` : null;
}

async function queryWikidata(codes) {
  const values = codes.map((c) => `"${c}"`).join(' ');
  const query = `
    SELECT ?iata ?airline ?airlineLabel ?logo WHERE {
      VALUES ?iata { ${values} }
      ?airline wdt:P229 ?iata ;
               wdt:P31/wdt:P279* wd:Q46970 ;
               wdt:P154 ?logo .
      FILTER NOT EXISTS { ?airline wdt:P576 ?dissolved }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
    }`;
  const json = await getJson(`${SPARQL}?query=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/sparql-results+json' },
  });
  return json.results.bindings.map((b) => ({
    iata: b.iata.value,
    label: b.airlineLabel?.value || null,
    entity: b.airline?.value || null,
    logo: b.logo.value,
  }));
}

async function fetchCommonsMeta(titles) {
  const meta = new Map();
  for (const group of chunk(titles, COMMONS_CHUNK)) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata',
      titles: group.join('|'),
    });
    const json = await getJson(`${COMMONS}?${params}`);
    for (const page of Object.values(json.query?.pages || {})) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      meta.set(page.title, {
        mime: info.mime || null,
        width: info.width || null,
        height: info.height || null,
        licence: info.extmetadata?.LicenseShortName?.value || null,
        sourcePage: info.descriptionurl || null,
      });
    }
    await sleep(250);
  }
  return meta;
}

async function commonsSearch(name) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'search',
    srsearch: `${name} logo filemime:image/svg+xml`,
    srnamespace: '6',
    srlimit: '5',
  });
  const json = await getJson(`${COMMONS}?${params}`);
  return (json.query?.search || []).map((hit) => hit.title);
}

async function airlabsFallback(code) {
  const url = `https://airlabs.co/img/airline/m/${code}.png`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA_REF.value } });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 200) return null;
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    return {
      url,
      source: 'airlabs',
      sourceLabel: null,
      sourcePage: null,
      licence: null,
      mime: 'image/png',
      width,
      height,
      lowRes: true,
    };
  } catch {
    return null;
  }
}


export const NEEDS_LOGO_FILTER = {
  $or: [
    { logo: { $in: [null, ''] } },
    { logo: { $exists: false } },
    { logo: { $regex: '^/airlines/' } },
  ],
};

export async function harvestLogoCandidates({ collection, userAgent, only = null, log = () => {} }) {
  if (userAgent) UA_REF.value = userAgent;

  const filter = only ? { ...NEEDS_LOGO_FILTER, iataCode: { $in: [...only] } } : NEEDS_LOGO_FILTER;
  const airlines = await collection
    .find(filter)
    .project({ iataCode: 1, commonName: 1, businessName: 1, logo: 1 })
    .toArray();

  const codes = airlines.map((a) => a.iataCode).filter(Boolean);
  const nameByCode = new Map(airlines.map((a) => [a.iataCode, a.commonName || a.businessName || a.iataCode]));
  const byCode = new Map();
  if (!codes.length) return { codes, nameByCode, byCode };

  const rows = [];
  for (const group of chunk(codes, SPARQL_CHUNK)) {
    try {
      rows.push(...(await queryWikidata(group)));
    } catch (err) {
      log(`  ! wikidata chunk failed (${group.length} codes): ${err.message}`);
    }
    await sleep(400);
  }

  const titles = [...new Set(rows.map((r) => fileTitleOf(r.logo)).filter(Boolean))];
  let meta = new Map();
  try {
    meta = await fetchCommonsMeta(titles);
  } catch (err) {
    log(`  ! commons metadata lookup failed: ${err.message}`);
  }

  for (const row of rows) {
    const info = meta.get(fileTitleOf(row.logo)) || {};
    const fitted = deliveredSize(info.mime, info.width, info.height);
    const candidate = {
      url: `${httpsUrl(row.logo)}?width=${TARGET}`,
      source: 'wikimedia',
      sourceLabel: row.label,
      sourcePage: info.sourcePage || null,
      licence: info.licence || null,
      mime: info.mime || null,
      width: fitted.width,
      height: fitted.height,
      lowRes: false,
    };
    candidate.score = scoreCandidate({
      ourName: nameByCode.get(row.iata),
      label: row.label,
      mime: info.mime,
      width: fitted.width,
      height: fitted.height,
      lowRes: false,
    });
    if (!byCode.has(row.iata)) byCode.set(row.iata, []);
    byCode.get(row.iata).push(candidate);
  }

  const searchTitles = new Map();
  for (const code of codes.filter((c) => !byCode.has(c))) {
    const ourName = nameByCode.get(code);
    try {
      const hits = (await commonsSearch(ourName)).filter((title) => titleMentionsAirline(title, ourName));
      if (hits.length) searchTitles.set(code, hits);
    } catch (err) {
      log(`  ! commons search failed for ${code}: ${err.message}`);
    }
    await sleep(250);
  }

  let searchMeta = new Map();
  if (searchTitles.size) {
    try {
      searchMeta = await fetchCommonsMeta([...new Set([...searchTitles.values()].flat())]);
    } catch (err) {
      log(`  ! commons search metadata lookup failed: ${err.message}`);
    }
  }

  for (const [code, titleList] of searchTitles) {
    const ourName = nameByCode.get(code);
    const candidates = [];
    for (const title of titleList) {
      const info = searchMeta.get(title);
      if (!info) continue;
      const fitted = deliveredSize(info.mime, info.width, info.height);
      const candidate = {
        url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title.replace(/^File:/, ''))}?width=${TARGET}`,
        source: 'wikimedia-search',
        sourceLabel: title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
        sourcePage: info.sourcePage || null,
        licence: info.licence || null,
        mime: info.mime || null,
        width: fitted.width,
        height: fitted.height,
        lowRes: false,
      };
      candidate.score = scoreCandidate({
        ourName,
        label: null,
        mime: info.mime,
        width: fitted.width,
        height: fitted.height,
        lowRes: false,
        fromSearch: true,
      });
      candidates.push(candidate);
    }
    if (candidates.length) byCode.set(code, candidates);
  }

  for (const code of codes.filter((c) => !byCode.has(c))) {
    const fallback = await airlabsFallback(code);
    if (!fallback) continue;
    fallback.score = scoreCandidate({ ...fallback, ourName: nameByCode.get(code), label: null });
    byCode.set(code, [fallback]);
    await sleep(150);
  }

  for (const list of byCode.values()) list.sort((a, b) => b.score - a.score);

  return { codes, nameByCode, byCode };
}

export function reportHarvest({ codes, nameByCode, byCode }, log = console.log) {
  const linked = codes.filter((c) => byCode.get(c)?.some((x) => x.source === 'wikimedia'));
  const searchOnly = codes.filter(
    (c) => byCode.get(c)?.length && byCode.get(c).every((x) => x.source === 'wikimedia-search'),
  );
  const lowResOnly = codes.filter((c) => byCode.get(c)?.length && byCode.get(c).every((x) => x.lowRes));
  const none = codes.filter((c) => !byCode.get(c)?.length);
  const highConfidence = codes.filter((c) => {
    const top = byCode.get(c)?.[0];
    return top && top.source === 'wikimedia' && !top.lowRes && (top.score ?? 0) >= 100;
  });

  log('  code  our name                        n  top pick                                  size      licence');
  log('  ----  ------------------------------  -  ----------------------------------------  --------  -------------------');
  for (const code of codes) {
    const list = byCode.get(code) || [];
    const top = list[0];
    const name = String(nameByCode.get(code)).slice(0, 30);
    if (!top) {
      log(`  ${code.padEnd(4)}  ${name.padEnd(30)}  0  -`);
      continue;
    }
    const pick = `${top.sourceLabel || top.source}${top.lowRes ? ' (70px fallback)' : ''}`.slice(0, 40);
    const size = top.width && top.height ? `${top.width}x${top.height}` : '?';
    log(
      `  ${code.padEnd(4)}  ${name.padEnd(30)}  ${String(list.length)}  ${pick.padEnd(40)}  ${size.padEnd(8)}  ${(top.licence || '-').slice(0, 19)}`,
    );
  }

  log(`\n  wikidata-linked logo   : ${linked.length}`);
  log(`  commons search only    : ${searchOnly.length}${searchOnly.length ? ` (${searchOnly.join(', ')})` : ''}`);
  log(`  only a 70px fallback   : ${lowResOnly.length}${lowResOnly.length ? ` (${lowResOnly.join(', ')})` : ''}`);
  log(`  nothing found          : ${none.length}${none.length ? ` (${none.join(', ')})` : ''}`);
  log(`  needing manual upload  : ${lowResOnly.length + none.length}`);
  log(`  bulk-approvable (>=100): ${highConfidence.length}`);

  return { linked, searchOnly, lowResOnly, none, highConfidence };
}

export function candidateWriteOps({ byCode }) {
  return [...byCode.entries()].map(([iataCode, candidates]) => ({
    updateOne: {
      filter: { iataCode },
      update: { $set: { logoCandidates: candidates, logoCandidatesAt: new Date() } },
    },
  }));
}
