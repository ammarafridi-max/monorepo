
import mongoose from 'mongoose';
import { getBrand } from '@travel-suite/config';
import { createBrevoMailer } from '@travel-suite/brevo';
import { createLiteApiClient } from '@travel-suite/liteapi';
import { HotelBookingSchema } from '@travel-suite/hotel-bookings';

// Must stay comfortably larger than the run interval: scheduled CI runs are
const SAFETY_MARGIN_MS = 48 * 60 * 60 * 1000;
const STUCK_CLAIM_MS = 15 * 60 * 1000;

const model = (conn, name, schema) => {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
};

function flagValue(argv, name, fallback = null) {
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : fallback;
}

const iso = (date) => (date ? new Date(date).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '—');

function describe(reservation) {
  const hotel = reservation.hotel?.name ?? reservation.destination?.cityName ?? 'hotel';
  return `${reservation.sessionId} · ${hotel} · ${reservation.checkIn} · ${reservation.email}`;
}

function buildReport({ brand, cancelled, failed, overdue, stuck }) {
  const section = (title, rows) =>
    rows.length === 0
      ? ''
      : `<h3 style="font-size:14px;margin:18px 0 6px;">${title} (${rows.length})</h3><ul style="font-size:13px;color:#334155;padding-left:18px;margin:0;">${rows
          .map((r) => `<li style="margin-bottom:4px;">${r}</li>`)
          .join('')}</ul>`;

  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px;background:#f8fafc;">
    <h2 style="font-size:16px;margin:0 0 4px;">Hotel cancellation run — ${brand.name}</h2>
    <p style="font-size:12px;color:#64748b;margin:0;">${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC</p>
    ${section('Needs your attention — cancellation did not come back clean', failed)}
    ${section('Needs your attention — past the free window, not cancelled', overdue)}
    ${section('Needs your attention — booking stuck part-way', stuck)}
    ${section('Cancelled successfully', cancelled)}
  </body></html>`;
}

export async function run({ dryRun = false, argv = [] } = {}) {
  const brandKey = flagValue(argv, 'brand', 'dt365');
  const brand = getBrand(brandKey);
  const adminEmail = brand.emails.support;

  const now = Date.now();
  const actionBefore = new Date(now + SAFETY_MARGIN_MS);

  const conn = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
  const HotelBooking = model(conn, 'hotel-booking', HotelBookingSchema);

  const supplier = createLiteApiClient({ apiKey: process.env.LITEAPI_API_KEY });

  const cancelled = [];
  const failed = [];
  const overdue = [];
  const stuck = [];

  try {
    const due = await HotelBooking.find({
      cancellationStatus: { $in: ['SCHEDULED', 'FAILED'] },
      'supplier.bookingId': { $ne: null },
      freeCancellationUntil: { $ne: null, $lte: actionBefore },
    }).sort({ freeCancellationUntil: 1 });

    console.log(`  ${due.length} reservation(s) inside the ${SAFETY_MARGIN_MS / 3_600_000}h action window`);

    for (const reservation of due) {
      const deadline = reservation.freeCancellationUntil;
      const line = `${describe(reservation)} · free until ${iso(deadline)}`;

      if (deadline.getTime() <= now) {
        overdue.push(line);
        console.log(`  OVERDUE  ${line}`);
        continue;
      }

      if (dryRun) {
        cancelled.push(`${line} (dry run, not cancelled)`);
        console.log(`  WOULD CANCEL  ${line}`);
        continue;
      }

      let result;
      try {
        result = await supplier.cancelBooking(reservation.supplier.bookingId);
      } catch (err) {
        failed.push(`${line} · supplier error: ${err.message}`);
        await HotelBooking.updateOne(
          { sessionId: reservation.sessionId },
          { $set: { cancellationStatus: 'FAILED' }, $inc: { cancellationAttempts: 1 } },
        );
        console.log(`  FAILED  ${line} · ${err.message}`);
        continue;
      }

      const fee = Number(result.cancellationFee ?? 0);
      const clean = result.status === 'CANCELLED' && fee === 0;

      await HotelBooking.updateOne(
        { sessionId: reservation.sessionId },
        {
          $set: {
            cancellationStatus: clean ? 'CANCELLED' : 'FAILED',
            cancelledAt: new Date(),
            cancellationFee: { amount: result.cancellationFee, currency: result.currency },
          },
          $inc: { cancellationAttempts: 1 },
        },
      );

      if (clean) {
        cancelled.push(line);
        console.log(`  CANCELLED  ${line}`);
      } else {
        failed.push(`${line} · returned ${result.status} with a fee of ${result.currency ?? ''} ${fee}`);
        console.log(`  FAILED  ${line} · ${result.status} · fee ${fee}`);
      }
    }

    const stalled = await HotelBooking.find({
      orderStatus: 'PENDING',
      paymentStatus: 'PAID',
      'supplier.bookingId': null,
      'supplier.bookClaimedAt': { $ne: null, $lte: new Date(now - STUCK_CLAIM_MS) },
    });

    for (const reservation of stalled) {
      stuck.push(`${describe(reservation)} · claimed ${iso(reservation.supplier.bookClaimedAt)}`);
      console.log(`  STUCK  ${describe(reservation)}`);
      if (!dryRun) {
        await HotelBooking.updateOne(
          { sessionId: reservation.sessionId },
          { $set: { orderStatus: 'BOOKING_FAILED', 'supplier.bookClaimedAt': null, 'supplier.lastError': 'Booking claim expired without a supplier response' } },
        );
      }
    }

    const needsAttention = failed.length + overdue.length + stuck.length;
    console.log(`  done: ${cancelled.length} cancelled, ${needsAttention} needing attention`);

    if (needsAttention > 0 && !dryRun) {
      const { sendEmail } = createBrevoMailer({
        apiKey: process.env.BREVO_API_KEY,
        sender: { name: brand.name, email: brand.emails.from },
        logger: console,
      });
      await sendEmail({
        email: adminEmail,
        name: brand.name,
        subject: `ACTION NEEDED — ${needsAttention} hotel reservation(s) need you (${brand.name})`,
        htmlContent: buildReport({ brand, cancelled, failed, overdue, stuck }),
      });
      console.log(`  alert sent to ${adminEmail}`);
    }

    if (failed.length > 0 || overdue.length > 0) {
      throw new Error(`${failed.length} failed cancellation(s), ${overdue.length} past the free window`);
    }
  } finally {
    await conn.close();
  }
}

export default run;
