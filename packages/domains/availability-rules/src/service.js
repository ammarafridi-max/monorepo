function formatRule(rule) {
  if (!rule) return null;

  return {
    ...rule,
    vehicles: rule.vehicles.map((v) => ({
      _id: v.vehicle?._id,
      brand: v.vehicle?.brand,
      model: v.vehicle?.model,
      year: v.vehicle?.year,
      class: v.vehicle?.class,
      name: `${v.vehicle?.brand} ${v.vehicle?.model}`,
      available: v.available,
    })),
  };
}

const VEHICLE_SELECT = 'brand model year class';

export function createAvailabilityRuleService({ AvailabilityRule }) {
  const populated = (queryPromise) =>
    queryPromise
      .populate('pickupZones', 'name')
      .populate('dropoffZones', 'name')
      .populate('vehicles.vehicle', VEHICLE_SELECT);

  // Raw create — returns the unformatted document (mirrors the source controller,
  // which created directly on the model rather than through the formatting service).
  const createRuleRaw = async (data) => AvailabilityRule.create(data);

  const getAllRules = async () => {
    const rules = await populated(AvailabilityRule.find());
    return rules.map((rule) => formatRule(rule.toObject()));
  };

  const getRuleById = async (id) => {
    const rule = await populated(AvailabilityRule.findById(id));
    if (!rule) return null;
    return formatRule(rule.toObject());
  };

  const updateRule = async (id, data) => {
    const rule = await AvailabilityRule.findById(id);
    if (!rule) return null;

    Object.assign(rule, data);
    await rule.save();

    const fresh = await populated(AvailabilityRule.findById(id));
    return formatRule(fresh.toObject());
  };

  const deleteRule = async (id) => {
    const rule = await AvailabilityRule.findByIdAndDelete(id);
    return rule ? true : false;
  };

  const duplicateRule = async (id) => {
    const rule = await AvailabilityRule.findById(id);
    if (!rule) return null;

    const ruleObj = rule.toObject();
    delete ruleObj._id;
    delete ruleObj.createdAt;
    delete ruleObj.updatedAt;
    delete ruleObj.__v;
    delete ruleObj.id;
    ruleObj.name = `${ruleObj.name} (Copy)`;
    ruleObj.pickupZones = ruleObj.pickupZones || [];
    ruleObj.dropoffZones = ruleObj.dropoffZones || [];
    ruleObj.vehicles = ruleObj.vehicles || [];

    const duplicated = await AvailabilityRule.create(ruleObj);
    const fresh = await populated(AvailabilityRule.findById(duplicated._id));
    return formatRule(fresh.toObject());
  };

  return { createRuleRaw, getAllRules, getRuleById, updateRule, deleteRule, duplicateRule };
}
