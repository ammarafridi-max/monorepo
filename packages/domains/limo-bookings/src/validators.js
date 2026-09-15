import { z } from 'zod';

export const MIN_LEAD_MINUTES = 120;
const GST_OFFSET_MINUTES = 4 * 60;

// pickupDate is YYYY-MM-DD and pickupTime is "hh:mm AM" in Gulf time, which has no DST.
export function pickupInstant(pickupDate, pickupTime) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(pickupDate || ''));
  const t = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(pickupTime || '').trim());
  if (!d || !t) return null;
  let hours = Number(t[1]) % 12;
  if (t[3].toUpperCase() === 'PM') hours += 12;
  return new Date(Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), hours, Number(t[2])) - GST_OFFSET_MINUTES * 60000);
}

export const createBookingSchema = z
  .object({
    tripType: z.enum(['distance', 'hourly']),
    pickup: z.object({
      id: z.string().optional(),
      zone: z.string().optional(),
      name: z.string().optional(),
      address: z.string().optional(),
      lat: z.number(),
      lng: z.number(),
      type: z.enum(['airport', 'location', 'hotel', 'residence', 'custom']).default('location'),
    }),
    dropoff: z
      .object({
        id: z.string().nullable().optional(),
        zone: z.string().nullable().optional(),
        name: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        lat: z.number().nullable().optional(),
        lng: z.number().nullable().optional(),
        type: z.enum(['airport', 'location', 'hotel', 'residence', 'custom']).nullable().default('location'),
      })
      .nullable()
      .optional(),
    pickupDate: z.string(),
    pickupTime: z.string(),
    hoursBooked: z.number().int().min(1).max(8).nullable().optional(),
    vehicle: z.string().optional(),
    bookingDetails: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phoneNumber: z.object({
        code: z.string().optional(),
        number: z.string().optional(),
      }),
      flightNumber: z.string().optional(),
      arrivalTime: z.string().optional(),
      message: z.string().optional(),
    }),
    payment: z
      .object({
        method: z.enum(['stripe', 'paypal', 'applePay', 'cash']).optional(),
        status: z.enum(['paid', 'unpaid', 'failed', 'pending']).optional().default('unpaid'),
        amount: z.number().optional(),
        currency: z.string().optional(),
      })
      .optional(),
    orderSummary: z
      .object({
        baseFare: z.number().optional(),
        distanceCharge: z.number().optional(),
        hourlyCharge: z.number().optional(),
        addOns: z.number().optional(),
        taxes: z.number().optional(),
        total: z.number().optional(),
        currency: z.string().optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const instant = pickupInstant(data.pickupDate, data.pickupTime);
    if (!instant) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pickupTime'], message: 'Pickup date or time is not valid.' });
    } else if (instant.getTime() - Date.now() < MIN_LEAD_MINUTES * 60000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pickupTime'],
        message: `Pickups need at least ${MIN_LEAD_MINUTES / 60} hours' notice. For anything sooner, message us on WhatsApp.`,
      });
    }
    if (data.tripType === 'hourly' && (data.hoursBooked === null || data.hoursBooked === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hoursBooked'],
        message: 'Hours booked is required for hourly trips.',
      });
    }
  });
