import { AppError } from '@travel-suite/utils';

function createRuleName(vehicles, pickupZones, dropoffZones) {
  return `${vehicles.map((veh) => `${veh.brand} ${veh.model}`).join(' / ')} - ${pickupZones
    .map((zone) => `${zone.name}`)
    .join(' / ')} to ${dropoffZones.map((zone) => `${zone.name}`).join(' / ')}`;
}

export function createPricingRuleService({ PricingRule, Vehicle, Zone }) {
  const getAllPricingRules = async (query = {}) => {
    const { vehicleId, pickupZoneId, dropoffZoneId, name } = query;
    const filter = {};
    if (vehicleId) filter.vehicles = vehicleId;
    if (pickupZoneId) filter.pickupZones = pickupZoneId;
    if (dropoffZoneId) filter.dropoffZones = dropoffZoneId;
    if (name) filter.name = { $regex: name, $options: 'i' };

    return PricingRule.find(filter).select('-__v').sort({ name: 1 });
  };

  const getPricingRule = async (id) => {
    const rule = await PricingRule.findById(id).select('-__v');
    if (!rule) throw new AppError('No pricing rule found with that ID', 404);
    return rule;
  };

  const buildName = async (body) => {
    const vehicles = await Vehicle.find().where('_id').in(body.vehicles);
    const pickupZones = await Zone.find().where('_id').in(body.pickupZones);
    const dropoffZones = await Zone.find().where('_id').in(body.dropoffZones);
    return createRuleName(vehicles, pickupZones, dropoffZones);
  };

  const createPricingRule = async (body) => {
    body.name = await buildName(body);
    return PricingRule.create(body);
  };

  const updatePricingRule = async (id, body) => {
    body.name = await buildName(body);
    const rule = await PricingRule.findByIdAndUpdate(id, body, { new: true, runValidators: true })
      .populate('pickupZones')
      .populate('dropoffZones')
      .populate('vehicles');
    if (!rule) throw new AppError('No pricing rule found with that ID', 404);
    return rule;
  };

  const deletePricingRule = async (id) => {
    const rule = await PricingRule.findByIdAndDelete(id);
    if (!rule) throw new AppError('No pricing rule found with that ID', 404);
  };

  const duplicatePricingRule = async (id) => {
    const rule = await PricingRule.findById(id);
    if (!rule) throw new AppError('Pricing rule not found', 404);

    const ruleObj = rule.toObject();
    delete ruleObj._id;
    delete ruleObj.createdAt;
    delete ruleObj.updatedAt;
    delete ruleObj.__v;
    delete ruleObj.id;
    ruleObj.name = `${ruleObj.name} Copy`;

    return PricingRule.create(ruleObj);
  };

  return {
    getAllPricingRules,
    getPricingRule,
    createPricingRule,
    updatePricingRule,
    deletePricingRule,
    duplicatePricingRule,
  };
}
