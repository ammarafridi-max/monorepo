import mongoose from 'mongoose';


const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

    passwordHash: { type: String, default: null },

    providers: { type: [String], default: [] },

    profile: {
      gender: { type: String, default: '' },
      ageRange: { type: String, default: '' },
      race: { type: String, default: '' },
      facialHair: { type: String, default: '' },
      build: { type: String, default: '' },
      height: { type: String, default: '' },
    },

    lastAnalysis: {
      tool: { type: String, default: '' },
      score: { type: Number, default: null },
      at: { type: Date, default: null },
    },

    emailVerifiedAt: { type: Date, default: null },
    verificationCodeHash: { type: String, default: null },
    verificationExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
