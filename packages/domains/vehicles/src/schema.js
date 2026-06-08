import mongoose from 'mongoose';

const hourlyRate = { type: Number, default: 0, min: 0 };

const VehicleSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() + 1 },
    description: { type: String, trim: true },
    passengers: { type: Number, required: true, min: 1 },
    luggage: { type: Number, default: 0, min: 0 },
    type: { type: String, enum: ['Sedan', 'Crossover', 'SUV', 'Van'], required: true },
    fuel: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'], required: true },
    class: { type: String, enum: ['Standard', 'Premium', 'Business', 'Luxury'], required: true },
    featuredImage: { type: String },
    images: [{ type: String }],
    pricing: {
      initialPrice: { type: Number, required: true, min: 0 },
      pricePerHour: { type: Number, min: 0 },
      hourlyRates: {
        hour1: hourlyRate,
        hour2: hourlyRate,
        hour3: hourlyRate,
        hour4: hourlyRate,
        hour5: hourlyRate,
        hour6: hourlyRate,
        hour7: hourlyRate,
        hour8: hourlyRate,
      },
      pricePerKm: { type: Number, required: true, min: 0 },
    },
  },
  { timestamps: true },
);

VehicleSchema.virtual('name').get(function () {
  return `${this.brand} ${this.model}`;
});

export default VehicleSchema;
