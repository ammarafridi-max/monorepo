import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const show = async (c, proj) => {
  const d = await db.collection(c).find({}, { projection: proj }).toArray();
  console.log(`\n${c} (${d.length}):`);
  d.forEach(x => console.log('  ', JSON.stringify(x).slice(0, 150)));
};
await show('visa-applications', { applicationRef:1, status:1, createdAt:1 });
await show('applicants', { firstName:1, lastName:1, email:1 });
await show('visa-leads', { name:1, email:1, status:1 });
await show('users', { email:1, name:1 });
const docs = await db.collection('application-documents').find({}, { projection: { fileName:1, url:1 } }).toArray();
console.log(`\napplication-documents (${docs.length}): ${docs.filter(d=>/cloudinary/.test(d.url||'')).length} stored in Cloudinary`);
await mongoose.disconnect();
