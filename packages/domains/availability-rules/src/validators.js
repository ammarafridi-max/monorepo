import { z } from 'zod';

const vehicleSchema = z.object({
  vehicle: z.string().min(1, 'Vehicle ID is required'),
  available: z.boolean().optional().default(true),
});

export const availabilityRuleSchema = z.object({
  name: z
    .string({ required_error: 'Rule name is required' })
    .min(2, 'Rule name must be at least 2 characters'),
  pickupZones: z
    .array(z.string().min(1, 'Pickup zone ID is required'), {
      required_error: 'At least one pickup zone is required',
    })
    .min(1, 'At least one pickup zone is required'),
  dropoffZones: z.array(z.string().min(1, 'Dropoff zone ID is required')).optional().default([]),
  vehicles: z
    .array(vehicleSchema, { required_error: 'At least one vehicle is required' })
    .min(1, 'At least one vehicle is required'),
  isActive: z.boolean().optional().default(true),
});
