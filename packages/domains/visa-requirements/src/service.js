import { AppError } from '@travel-suite/utils';
import { OUTCOMES } from './schemas/visa-rule.schema.js';

const ISO2 = /^[A-Za-z]{2}$/;

export function createVisaRequirementsService({ VisaRule, VisaRequirementSearch, providers = [], servicedSlugs = [] }) {
  const serviced = new Set(servicedSlugs);

  const norm = (v) => (v ? String(v).toUpperCase().trim() : null);

  async function check({ nationality, residence, destination }) {
    const nat = norm(nationality);
    const res = norm(residence);
    const dest = norm(destination);

    if (!nat || !ISO2.test(nat)) throw new AppError('A valid nationality is required', 400);
    if (!dest || !ISO2.test(dest)) throw new AppError('A valid destination is required', 400);
    if (res && !ISO2.test(res)) throw new AppError('Residence must be a valid country code', 400);
    if (nat === dest) throw new AppError('Pick a destination different from your nationality', 400);

    let answer = null;
    for (const provider of providers) {
      answer = await provider.resolve({ nationality: nat, residence: res, destination: dest });
      if (answer) break;
    }

    if (!answer) {
      answer = {
        outcome: 'UNKNOWN',
        basis: 'none',
        wasFallback: true,
        source: 'none',
        destination: dest,
        destinationName: null,
        note: '',
      };
    }

    const isServiced = Boolean(answer.visaSlug && serviced.has(answer.visaSlug));

    VisaRequirementSearch.create({
      nationality: nat,
      residence: res,
      destination: dest,
      outcome: answer.outcome,
      source: answer.source,
      isServiced,
      wasFallback: Boolean(answer.wasFallback),
    }).catch(() => {});

    return { ...answer, nationality: nat, residence: res, isServiced };
  }

  async function listDestinations() {
    const rules = await VisaRule.find({ isPublished: true })
      .select('destination destinationName visaSlug')
      .sort({ destinationName: 1 })
      .lean();
    return rules.map((r) => ({
      code: r.destination,
      name: r.destinationName,
      visaSlug: r.visaSlug || null,
      isServiced: Boolean(r.visaSlug && serviced.has(r.visaSlug)),
    }));
  }

  async function getPublicRule(destination) {
    const rule = await VisaRule.findOne({ destination: norm(destination), isPublished: true })
      .select(
        'destination destinationName visaSlug defaultOutcome groups residenceOverrides officialSourceUrl officialSourceName lastVerifiedAt generalNotes',
      )
      .lean();
    if (!rule) return null;
    return {
      ...rule,
      isServiced: Boolean(rule.visaSlug && serviced.has(rule.visaSlug)),
    };
  }

  async function listRules({ published } = {}) {
    const filter = {};
    if (published !== undefined) filter.isPublished = published;
    return VisaRule.find(filter).sort({ destinationName: 1 }).lean();
  }

  async function getRule(destination) {
    const rule = await VisaRule.findOne({ destination: norm(destination) });
    if (!rule) throw new AppError('No rule for that destination', 404);
    return rule;
  }

  function validate(payload) {
    if (!payload.destination || !ISO2.test(payload.destination)) {
      throw new AppError('destination must be a 2-letter country code', 400);
    }
    if (!payload.destinationName?.trim()) throw new AppError('destinationName is required', 400);
    for (const g of payload.groups || []) {
      if (!OUTCOMES.includes(g.outcome)) throw new AppError(`Unknown outcome "${g.outcome}"`, 400);
    }
    for (const o of payload.residenceOverrides || []) {
      if (!OUTCOMES.includes(o.outcome)) throw new AppError(`Unknown outcome "${o.outcome}"`, 400);
      if (!o.residence || !ISO2.test(o.residence)) throw new AppError('Override residence must be a country code', 400);
    }
  }

  async function upsertRule(payload) {
    validate(payload);
    const destination = norm(payload.destination);
    const existing = await VisaRule.findOne({ destination });
    const doc = existing || new VisaRule({ destination });
    Object.assign(doc, payload, { destination });
    doc.lastVerifiedAt = payload.lastVerifiedAt || new Date();
    await doc.save();
    return doc;
  }

  async function deleteRule(destination) {
    const res = await VisaRule.deleteOne({ destination: norm(destination) });
    if (!res.deletedCount) throw new AppError('No rule for that destination', 404);
    return true;
  }

  async function queryStats({ days = 30, limit = 50 } = {}) {
    const since = new Date(Date.now() - days * 86400_000);
    const [corridors, gaps, totals] = await Promise.all([
      VisaRequirementSearch.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { nationality: '$nationality', destination: '$destination' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]),
      VisaRequirementSearch.aggregate([
        { $match: { createdAt: { $gte: since }, wasFallback: true } },
        { $group: { _id: '$destination', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]),
      VisaRequirementSearch.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: 1 }, serviced: { $sum: { $cond: ['$isServiced', 1, 0] } } } },
      ]),
    ]);
    return {
      days,
      total: totals[0]?.total ?? 0,
      serviced: totals[0]?.serviced ?? 0,
      topCorridors: corridors.map((c) => ({ ...c._id, count: c.count })),
      coverageGaps: gaps.map((g) => ({ destination: g._id, count: g.count })),
    };
  }

  return { check, listDestinations, getPublicRule, listRules, getRule, upsertRule, deleteRule, queryStats };
}
