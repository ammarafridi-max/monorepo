import { connectMongo, Order } from '@travel-suite/picturesk-shared';
await connectMongo(process.env.MONGODB_URI);

const ids = process.argv.slice(2);
for (const id of ids) {
  const o = await Order.findById(id).lean();
  if (!o) { console.log(`\n### ${id}  NOT FOUND`); continue; }
  console.log(`\n### ${id}  status=${o.status} tier=${o.tier || '-'}  created=${o.createdAt?.toISOString?.().slice(0,16)}`);
  console.log(`subject: gender=${o.gender} age=${o.ageRange} race=${o.race} facialHair=${o.facialHair || o.derivedFacialHair || '-'}`);
  console.log(`looks=${(o.selectedLooks||[]).join('|')}  attire=${(o.selectedAttire||[]).join('|')}`);
  console.log(`counts: uploaded=${(o.uploadedImageUrls||[]).length} candidates=${(o.resultImageUrls||[]).length} scored=${(o.candidateScores||[]).length} delivered=${(o.deliveredImageUrls||[]).length}`);
  const dump = (label, arr) => {
    if (!arr || !arr.length) return;
    console.log(`-- ${label} (${arr.length}) --`);
    arr.forEach((u, i) => console.log(`[${label[0]}${i}] ${u}`));
  };
  dump('delivered', o.deliveredImageUrls);
  dump('candidates', o.resultImageUrls);
  if (o.candidateScores?.length) console.log(`scores: ${JSON.stringify(o.candidateScores)}`);
  dump('uploaded', o.uploadedImageUrls);
}
process.exit(0);
