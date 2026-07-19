import mongoose from 'mongoose';

const AirlineSchema = new mongoose.Schema({
  // Unique so concurrent flight searches can't insert duplicate airline docs:
  // the enrichment path relies on a duplicate-key error to dedupe (findOne→create
  // and insertMany{ordered:false}). NOTE: if the collection already holds
  // duplicate iataCode values, dedupe them before this index will build.
  iataCode: { type: String, unique: true, sparse: true, index: true },
  icaoCode: { type: String },
  businessName: { type: String },
  commonName: { type: String },
  logo: { type: String },
});

export default AirlineSchema;
