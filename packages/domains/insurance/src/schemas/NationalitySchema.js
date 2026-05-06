import mongoose from 'mongoose';

const NationalitySchema = new mongoose.Schema({
  id:          { type: String, required: true },
  nationality: { type: String, required: true },
});

export default NationalitySchema;
