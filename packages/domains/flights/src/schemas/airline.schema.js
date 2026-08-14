import mongoose from 'mongoose';

const AirlineSchema = new mongoose.Schema({
  // The dedupe path relies on this unique index throwing E11000; build it before adding data.
  iataCode: { type: String, unique: true, sparse: true, index: true },
  icaoCode: { type: String },
  businessName: { type: String },
  commonName: { type: String },
  logo: { type: String },
});

export default AirlineSchema;
