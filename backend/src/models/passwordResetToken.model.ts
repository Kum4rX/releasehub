import { Schema, model, Document, Types } from 'mongoose';

export interface IPasswordResetToken extends Document {
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    usedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform: (_doc, ret) => {
        const transformed = { ...ret };
        delete (transformed as Record<string, unknown>).__v;
        return transformed;
      },
    },
  }
);

// TTL index on expiresAt: MongoDB will automatically remove document when expiresAt has passed
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken = model<IPasswordResetToken>(
  'PasswordResetToken',
  passwordResetTokenSchema
);
