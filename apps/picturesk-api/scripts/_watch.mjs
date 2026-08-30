import { connectMongo, Order } from '@travel-suite/picturesk-shared';
const id = process.argv[2];
await connectMongo(process.env.MONGODB_URI);
const first = await Order.findById(id).lean();
if(!first){ console.log('NOT FOUND', id); process.exit(0); }
const startStatus = first.status;
const start = Date.now();
const MAX_MS = 45*60*1000;
const TOKEN = process.env.REPLICATE_API_TOKEN;
const t = () => new Date().toISOString().slice(11,19);
console.log(`${t()} START status=${startStatus} ageMin=${Math.round((Date.now()-new Date(first.createdAt))/60000)}`);
while (true) {
  let o;
  try { o = await Order.findById(id).lean(); } catch (e) { console.log(t(),'poll error',e.message); await new Promise(r=>setTimeout(r,60000)); continue; }
  const tid = o.replicate?.trainingId;
  let rep='';
  if (o.status==='TRAINING' && tid && TOKEN) { try { const r=await fetch(`https://api.replicate.com/v1/trainings/${tid}`,{headers:{Authorization:'Bearer '+TOKEN}}); const j=await r.json(); rep=' replicate='+j.status+(j.started_at?'(running)':'(queued)'); } catch {} }
  console.log(`${t()} ${o.status}${rep} candidates=${(o.resultImageUrls||[]).length} delivered=${(o.deliveredImageUrls||[]).length}`);
  if (o.status==='DELIVERED') { console.log('RESULT DELIVERED images='+(o.deliveredImageUrls||[]).length); process.exit(0); }
  if (o.status==='FAILED') { console.log('RESULT FAILED msg='+(o.error?.message||'')+' refunded='+!!o.refundedAt); process.exit(0); }
  if (o.status!==startStatus) { console.log('RESULT TRANSITION '+startStatus+'->'+o.status); process.exit(0); }
  if (Date.now()-start>MAX_MS) { console.log('RESULT TIMEOUT still='+o.status); process.exit(0); }
  await new Promise(r=>setTimeout(r,60000));
}
