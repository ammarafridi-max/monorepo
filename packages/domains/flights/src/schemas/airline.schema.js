import mongoose from 'mongoose';

const AirlineSchema = new mongoose.Schema({
  iataCode: { type: String },
  icaoCode: { type: String },
  businessName: { type: String },
  commonName: { type: String },
  logo: { type: String },
});

export default AirlineSchema;
