import mongoose from 'mongoose';

const ZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    areas: [{ type: String, trim: true }],
    description: { type: String },
    geometry: {
      type: {
        type: String,
        enum: ['Polygon', 'MultiPolygon'],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
  },
  { timestamps: true },
);

ZoneSchema.index({ geometry: '2dsphere' });

export default ZoneSchema;
