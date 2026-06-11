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
      // Array (not [[[Number]]]) so both Polygon (3-deep) and MultiPolygon
      // (4-deep) coordinates fit. MongoDB's 2dsphere index validates GeoJSON
      // correctness on write.
      coordinates: {
        type: Array,
        required: true,
      },
    },
  },
  { timestamps: true },
);

ZoneSchema.index({ geometry: '2dsphere' });

export default ZoneSchema;
