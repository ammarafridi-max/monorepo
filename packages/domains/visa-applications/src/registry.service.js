import { AppError } from '@travel-suite/utils';
import { DOCUMENT_SOURCES } from './schemas/documentType.schema.js';
import { AGE_GROUPS, FINANCIAL_SUPPORT, ACCOMMODATION_TYPES, MINOR_TRAVELLING_WITH } from './schemas/checklistTemplate.schema.js';
import { EMPLOYMENT_STATUSES } from './schemas/applicant.schema.js';
import { evaluateTemplate } from './matcher.js';

const CONDITION_ENUMS = {
  ageGroup: AGE_GROUPS,
  employmentStatus: EMPLOYMENT_STATUSES,
  financialSupport: FINANCIAL_SUPPORT,
  accommodationType: ACCOMMODATION_TYPES,
  minorTravellingWith: MINOR_TRAVELLING_WITH,
  isPrimary: 'boolean',
};

const PREVIEW_SAMPLES = [
  { label: 'Adult · employed · self-funded · hotel', ctx: { ageGroup: 'ADULT', employmentStatus: 'EMPLOYED', financialSupport: 'SELF', accommodationType: 'HOTEL', minorTravellingWith: null, isPrimary: true } },
  { label: 'Minor · sponsored · one parent · hotel', ctx: { ageGroup: 'MINOR', employmentStatus: null, financialSupport: 'SPONSORED', accommodationType: 'HOTEL', minorTravellingWith: 'ONE_PARENT', isPrimary: false } },
];

function collectRuleErrors(rules, activeKeys) {
  if (!Array.isArray(rules)) return ['Rules must be an array.'];
  const errors = [];
  rules.forEach((r, i) => {
    const where = `rule #${i + 1}${r?.documentTypeKey ? ` (${r.documentTypeKey})` : ''}`;
    const key = String(r?.documentTypeKey || '').toUpperCase();
    if (!key) errors.push(`${where}: documentTypeKey is required`);
    else if (!activeKeys.has(key)) errors.push(`${where}: documentTypeKey "${key}" is not an existing active DocumentType`);
    const when = r?.when || {};
    for (const [k, v] of Object.entries(when)) {
      if (v === undefined || v === null) continue;
      const allowed = CONDITION_ENUMS[k];
      if (!allowed) { errors.push(`${where}: unknown condition "${k}"`); continue; }
      if (allowed === 'boolean') { if (typeof v !== 'boolean') errors.push(`${where}: condition "isPrimary" must be true or false`); continue; }
      const arr = Array.isArray(v) ? v : [v];
      for (const val of arr) if (!allowed.includes(val)) errors.push(`${where}: "${val}" is not a valid value for "${k}" (allowed: ${allowed.join(', ')})`);
    }
  });
  return errors;
}

export function createRegistryService({ DocumentType, ChecklistTemplate }) {
  async function activeKeySet() {
    const types = await DocumentType.find({ isActive: true }).select('key').lean();
    return new Set(types.map((t) => t.key));
  }

  async function assertValidRules(rules) {
    const errors = collectRuleErrors(rules, await activeKeySet());
    if (errors.length) throw new AppError(`Cannot save rules — ${errors.length} problem(s): ${errors.join('; ')}`, 400);
  }
  async function listDocumentTypes() {
    return DocumentType.find({}).sort({ source: 1, sortOrder: 1, key: 1 }).lean();
  }

  async function createDocumentType(data = {}) {
    const key = String(data.key || '').trim().toUpperCase();
    if (!key) throw new AppError('A document type key is required', 400);
    if (!DOCUMENT_SOURCES.includes(data.source)) throw new AppError(`source must be one of ${DOCUMENT_SOURCES.join(', ')}`, 400);
    if (await DocumentType.exists({ key })) throw new AppError('A document type with that key already exists', 409);
    return DocumentType.create({
      key,
      label: (data.label || '').trim() || key,
      customerHelpText: (data.customerHelpText || '').trim(),
      source: data.source,
      acceptedMimeTypes: Array.isArray(data.acceptedMimeTypes) && data.acceptedMimeTypes.length ? data.acceptedMimeTypes : undefined,
      isActive: data.isActive !== false,
      sortOrder: Number(data.sortOrder) || 0,
    });
  }

  async function updateDocumentType(id, patch = {}) {
    const type = await DocumentType.findById(id);
    if (!type) throw new AppError('Document type not found', 404);
    if (patch.label !== undefined) type.label = String(patch.label).trim();
    if (patch.customerHelpText !== undefined) type.customerHelpText = String(patch.customerHelpText).trim();
    if (patch.source !== undefined) {
      if (!DOCUMENT_SOURCES.includes(patch.source)) throw new AppError(`source must be one of ${DOCUMENT_SOURCES.join(', ')}`, 400);
      type.source = patch.source;
    }
    if (Array.isArray(patch.acceptedMimeTypes) && patch.acceptedMimeTypes.length) type.acceptedMimeTypes = patch.acceptedMimeTypes;
    if (patch.isActive !== undefined) type.isActive = !!patch.isActive;
    if (patch.sortOrder !== undefined) type.sortOrder = Number(patch.sortOrder) || 0;
    await type.save();
    return type;
  }

  async function listTemplates() {
    return ChecklistTemplate.find({}).sort({ visaTypeKey: 1 }).lean();
  }

  async function getTemplate(id) {
    const t = await ChecklistTemplate.findById(id).lean();
    if (!t) throw new AppError('Template not found', 404);
    return t;
  }

  async function upsertTemplate(data = {}) {
    const visaTypeKey = String(data.visaTypeKey || '').trim().toUpperCase();
    if (!visaTypeKey) throw new AppError('visaTypeKey is required', 400);
    if (Array.isArray(data.rules)) await assertValidRules(data.rules);
    const template = (await ChecklistTemplate.findOne({ visaTypeKey })) || new ChecklistTemplate({ visaTypeKey });
    if (data.name !== undefined) template.name = String(data.name).trim();
    if (data.isActive !== undefined) template.isActive = !!data.isActive;
    if (Array.isArray(data.rules)) template.rules = data.rules;
    await template.save();
    return template;
  }

  async function updateTemplate(id, patch = {}) {
    const template = await ChecklistTemplate.findById(id);
    if (!template) throw new AppError('Template not found', 404);
    if (Array.isArray(patch.rules)) await assertValidRules(patch.rules);
    if (patch.name !== undefined) template.name = String(patch.name).trim();
    if (patch.isActive !== undefined) template.isActive = !!patch.isActive;
    if (Array.isArray(patch.rules)) template.rules = patch.rules;
    await template.save();
    return template;
  }

  async function previewTemplate(rules = []) {
    const activeTypes = await DocumentType.find({ isActive: true }).select('key label source').lean();
    const byKey = new Map(activeTypes.map((t) => [t.key, t]));
    const warnings = collectRuleErrors(rules, new Set(byKey.keys()));
    const samples = PREVIEW_SAMPLES.map((s) => {
      const evald = Array.isArray(rules) ? evaluateTemplate(rules, s.ctx) : [];
      const documents = evald.map((e) => {
        const t = byKey.get(String(e.documentTypeKey).toUpperCase());
        return { key: e.documentTypeKey, label: t?.label || e.documentTypeKey, source: t?.source || null, isOptional: !!e.isOptional, unresolved: !t };
      });
      return { label: s.label, documents };
    });
    return { samples, warnings };
  }

  return {
    listDocumentTypes,
    createDocumentType,
    updateDocumentType,
    listTemplates,
    getTemplate,
    upsertTemplate,
    updateTemplate,
    previewTemplate,
  };
}
