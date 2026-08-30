import { connectMongo, Order } from '@travel-suite/picturesk-shared';
const id = process.argv[2];
await connectMongo(process.env.MONGODB_URI);
const o = await Order.findById(id).lean();
if(!o){ console.log('NOT FOUND'); process.exit(0); }
const now = Date.now();
const mins = (d) => d ? Math.round((now - new Date(d))/60000) : null;
const tid = o.replicate?.trainingId;
let rep = null;
if (tid && process.env.REPLICATE_API_TOKEN) {
  try { const r = await fetch(`https://api.replicate.com/v1/trainings/${tid}`,{headers:{Authorization:'Bearer '+process.env.REPLICATE_API_TOKEN}}); const j = await r.json();
    rep = { status:j.status, created:j.created_at, started:j.started_at, completed:j.completed_at, error:j.error, logs_tail:(j.logs||'').split('\n').slice(-4).join(' | ') }; } catch(e){ rep={fetchError:e.message}; }
}
console.log(JSON.stringify({
  status:o.status, ageMin:mins(o.createdAt), updatedMinAgo:mins(o.updatedAt),
  paidAt:o.paidAt, trainingStartedAt:o.trainingStartedAt, trainingMinAgo:mins(o.trainingStartedAt),
  tier:o.tier, deliverCount:o.deliverCount,
  trainingId:tid, trainedModelVersion:o.replicate?.trainedModelVersion, trainingRestarts:o.replicate?.trainingRestarts,
  generationIds:(o.replicate?.generationIds||[]).length, candidates:(o.resultImageUrls||[]).length, delivered:(o.deliveredImageUrls||[]).length,
  error:o.error, refundedAt:o.refundedAt,
  replicate:rep
},null,2));
process.exit(0);
