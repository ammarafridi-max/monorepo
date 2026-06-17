// apps/emirateslimo-backend/scripts/sync-pricing.js
//
// Reads the pricing Google Sheet and creates/updates pricing rules directly on
// the PricingRule model. The "Vehicle Group" cell holds vehicle names in
// "Brand Model / Brand Model" format (one rule can cover several vehicles); each
// name is resolved against the Vehicle collection. Replicates the package's
// createRuleName() so synced rules read identically to admin-made ones.
// On success it ticks the row's "Added" checkbox, which is also the dedupe key:
// only un-ticked rows are processed, so re-runs never duplicate.
//
// Run:  node --env-file=apps/emirateslimo-backend/.env.production apps/emirateslimo-backend/scripts/sync-pricing.js
//       add --dry to resolve + report without writing anything.
//
// Service account needs EDITOR access on the sheet (it writes the Added column).

import mongoose from "mongoose";
import { google } from "googleapis";

import { PricingRuleSchema } from "@travel-suite/pricing-rules";
import { ZoneSchema } from "@travel-suite/zones";
import { VehicleSchema } from "@travel-suite/vehicles";

// ───────────────────────── CONFIG (review this block) ─────────────────────────
const CONFIG = {
  sheetId: process.env.PRICING_SHEET_ID,
  sheetTab: process.env.PRICING_SHEET_TAB || "Sheet1",

  // Header names as they appear in row 1 of the sheet (matched case-insensitively).
  columns: {
    from: "From",
    vehicleGroup: "Vehicle Group",
    zone: "Zone",
    sp: "SP",
    added: "Added",
  },

  // return is required by the schema but your sheet has no round-trip price and
  // the quote engine ignores it today. 'same' => return = oneWay. 'double' => 2x.
  returnStrategy: "double",
};
// Vehicle names are matched against the DB by "<brand> <model>", split on "/".
// No mapping table needed — but the names in the sheet must match your Vehicle
// records. Mismatches are listed (with the full DB vehicle list) on a dry run.
// ───────────────────────────────────────────────────────────────────────────────

const DRY = process.argv.includes("--dry");

// Verbatim from packages/domains/pricing-rules/src/service.js so the name matches.
function createRuleName(vehicles, pickupZones, dropoffZones) {
  return `${vehicles.map((veh) => `${veh.brand} ${veh.model}`).join(" / ")} - ${pickupZones
    .map((zone) => `${zone.name}`)
    .join(" / ")} to ${dropoffZones.map((zone) => `${zone.name}`).join(" / ")}`;
}

const model = (conn, name, schema) => {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
const tight = (s) => norm(s).replace(/[\s-]/g, "");

function parseMoney(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isTicked(v) {
  if (v === true) return true;
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  return ["true", "yes", "1", "y", "checked", "✓"].includes(s);
}

function colLetter(index0) {
  let n = index0;
  let s = "";
  do {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

const idOf = (x) => String(x?._id ?? x);
function sameIdSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = new Set(a.map(idOf));
  return b.every((x) => sa.has(idOf(x)));
}

async function getSheetsClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, "base64").toString(
        "utf8",
      )
    : null;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON (base64) is required");
  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"], // read-write: ticks Added
  });
  return google.sheets({ version: "v4", auth });
}

async function resolveOneZone(Zone, text) {
  const name = String(text).trim();
  if (!name) return null;
  const rx = new RegExp(`^${escapeRegex(name)}$`, "i");
  return (
    (await Zone.findOne({ name: rx })) || (await Zone.findOne({ areas: rx }))
  );
}

// A "From"/"Zone" cell can list several zones separated by "/". Resolve each.
async function resolveZoneCell(Zone, text) {
  const tokens = String(text)
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  const docs = [];
  const missing = [];
  for (const tk of tokens) {
    const z = await resolveOneZone(Zone, tk);
    if (z) docs.push(z);
    else missing.push(tk);
  }
  return { docs, missing };
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  if (!CONFIG.sheetId) throw new Error("PRICING_SHEET_ID is required");

  const sheets = await getSheetsClient();

  // 1. Read the sheet
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: CONFIG.sheetId,
    range: `${CONFIG.sheetTab}!A1:Z100000`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const rows = res.data.values || [];
  if (rows.length < 2) {
    console.log("[sync] sheet has no data rows. Nothing to do.");
    return;
  }

  // 2. Map headers -> column indexes
  const header = rows[0].map((h) =>
    String(h || "")
      .trim()
      .toLowerCase(),
  );
  const colIdx = {};
  for (const [key, label] of Object.entries(CONFIG.columns)) {
    const i = header.indexOf(label.toLowerCase());
    if (i === -1)
      throw new Error(`Column "${label}" not found in the sheet header`);
    colIdx[key] = i;
  }
  const addedColLetter = colLetter(colIdx.added);

  // 3. Connect DB + register models on this connection
  await mongoose.connect(process.env.MONGO_URI);
  const conn = mongoose.connection;
  const PricingRule = model(conn, "PricingRule", PricingRuleSchema);
  const Zone = model(conn, "Zone", ZoneSchema);
  const Vehicle = model(conn, "Vehicle", VehicleSchema);

  // Preload the fleet and index it by "<brand> <model>" for name matching.
  const allVehicles = await Vehicle.find().select("_id brand model");
  const byName = new Map();
  const byTight = new Map();
  for (const v of allVehicles) {
    const full = `${v.brand} ${v.model}`;
    byName.set(norm(full), v);
    byTight.set(tight(full), v);
  }
  const resolveVehicle = (token) =>
    byName.get(norm(token)) || byTight.get(tight(token)) || null;

  const stats = {
    created: 0,
    updated: 0,
    alreadyAdded: 0,
    skippedIncomplete: 0,
    missing: { from: 0, zone: 0, vehicles: 0, sp: 0 },
    unmatchedZone: new Set(),
    unmatchedVehicle: new Set(),
    errors: [],
  };
  const ticks = [];
  const xMarks = []; // rows skipped because a vehicle/zone isn't in the DB yet

  // 4. Process rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const sheetRow = i + 1; // 1-indexed; header is row 1

    if (isTicked(row[colIdx.added])) {
      stats.alreadyAdded++;
      continue;
    }

    const fromText = String(row[colIdx.from] ?? "").trim();
    const zoneText = String(row[colIdx.zone] ?? "").trim();
    const groupText = String(row[colIdx.vehicleGroup] ?? "").trim();
    const oneWay = parseMoney(row[colIdx.sp]);

    if (!fromText || !zoneText || !groupText || oneWay === null) {
      if (!fromText) stats.missing.from++;
      if (!zoneText) stats.missing.zone++;
      if (!groupText) stats.missing.vehicles++;
      if (oneWay === null) stats.missing.sp++;
      stats.skippedIncomplete++;
      continue;
    }

    try {
      // Resolve every vehicle named in the cell (split on "/").
      const tokens = groupText
        .split("/")
        .map((s) => s.trim())
        .filter(Boolean);
      const resolved = tokens.map((t) => ({ t, v: resolveVehicle(t) }));
      const missingTokens = resolved.filter((r) => !r.v).map((r) => r.t);
      if (missingTokens.length) {
        missingTokens.forEach((t) => stats.unmatchedVehicle.add(t));
        xMarks.push(sheetRow);
        continue;
      }
      const vehicleDocs = resolved.map((r) => r.v);

      const [pickup, dropoff] = await Promise.all([
        resolveZoneCell(Zone, fromText),
        resolveZoneCell(Zone, zoneText),
      ]);
      const missingZones = [...pickup.missing, ...dropoff.missing];
      if (missingZones.length) {
        missingZones.forEach((z) => stats.unmatchedZone.add(z));
        xMarks.push(sheetRow);
        continue;
      }
      const pickupZones = pickup.docs;
      const dropoffZones = dropoff.docs;

      const vehicleIds = vehicleDocs.map((v) => v._id);
      const pickupIds = pickupZones.map((z) => z._id);
      const dropoffIds = dropoffZones.map((z) => z._id);
      const returnPrice =
        CONFIG.returnStrategy === "double" ? oneWay * 2 : oneWay;
      const body = {
        name: createRuleName(vehicleDocs, pickupZones, dropoffZones),
        pickupZones: pickupIds,
        dropoffZones: dropoffIds,
        vehicles: vehicleIds,
        pricing: { oneWay, return: returnPrice },
      };

      // Dedupe guard: a rule with the exact same pickup set, dropoff set, and
      // vehicle set already exists -> update its price instead of duplicating.
      const candidates = await PricingRule.find({
        pickupZones: { $all: pickupIds },
        dropoffZones: { $all: dropoffIds },
      }).select("_id pickupZones dropoffZones vehicles");
      const match = candidates.find(
        (c) =>
          sameIdSet(c.pickupZones, pickupIds) &&
          sameIdSet(c.dropoffZones, dropoffIds) &&
          sameIdSet(c.vehicles, vehicleIds),
      );

      if (DRY) {
        match ? stats.updated++ : stats.created++;
        ticks.push(sheetRow);
        continue;
      }

      if (match) {
        await PricingRule.findByIdAndUpdate(match._id, body, {
          new: true,
          runValidators: true,
        });
        stats.updated++;
      } else {
        await PricingRule.create(body);
        stats.created++;
      }
      ticks.push(sheetRow);
    } catch (err) {
      stats.errors.push(`row ${sheetRow}: ${err.message}`);
    }
  }

  // 5. Write back: TRUE on synced rows, "x" on rows missing a car/zone (batch)
  if (!DRY && (ticks.length || xMarks.length)) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: CONFIG.sheetId,
      requestBody: {
        valueInputOption: "RAW",
        data: [
          ...ticks.map((r) => ({
            range: `${CONFIG.sheetTab}!${addedColLetter}${r}`,
            values: [[true]],
          })),
          ...xMarks.map((r) => ({
            range: `${CONFIG.sheetTab}!${addedColLetter}${r}`,
            values: [["x"]],
          })),
        ],
      },
    });
  }

  await mongoose.disconnect();

  // 6. Report
  const m = stats.missing;
  console.log(`\n[sync] ${DRY ? "(dry run) " : ""}done`);
  console.log(`  created:           ${stats.created}`);
  console.log(`  updated:           ${stats.updated}`);
  console.log(`  ticked Added (synced):  ${ticks.length}`);
  console.log(`  marked x (missing dep): ${xMarks.length}`);
  console.log(`  already added:          ${stats.alreadyAdded}`);
  console.log(
    `  skipped (missing):      ${stats.skippedIncomplete}  [from:${m.from} zone:${m.zone} vehicles:${m.vehicles} sp:${m.sp}]`,
  );
  if (stats.unmatchedZone.size)
    console.log(
      `  ZONE NAMES not found in DB (create them first): ${[...stats.unmatchedZone].join(" | ")}`,
    );
  if (stats.unmatchedVehicle.size) {
    console.log(
      `  VEHICLE NAMES not found in DB: ${[...stats.unmatchedVehicle].join(" | ")}`,
    );
    const names = allVehicles.map((v) => `${v.brand} ${v.model}`).sort();
    console.log(
      `  -- your DB has ${names.length} vehicles:\n     ${names.join("\n     ")}`,
    );
  }
  if (stats.errors.length)
    console.log(`  errors:\n    ${stats.errors.join("\n    ")}`);
}

main().catch((err) => {
  console.error("[sync] FAILED:", err.message);
  process.exit(1);
});
