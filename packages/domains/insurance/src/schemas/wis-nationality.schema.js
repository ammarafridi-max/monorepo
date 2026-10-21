import mongoose from 'mongoose';

const WisNationalitySchema = new mongoose.Schema({
  id:          { type: String, required: true },
  nationality: { type: String, required: true },
});

export default WisNationalitySchema;
