import { Schema, model, Document } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  lastViewedChangelogDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never exposed by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'user',
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    lastViewedChangelogDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const transformed = { ...ret };
        delete (transformed as Record<string, unknown>).passwordHash;
        delete (transformed as Record<string, unknown>).emailVerificationToken;
        delete (transformed as Record<string, unknown>).emailVerificationExpires;
        delete (transformed as Record<string, unknown>).__v;
        return transformed;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        const transformed = { ...ret };
        delete (transformed as Record<string, unknown>).passwordHash;
        delete (transformed as Record<string, unknown>).emailVerificationToken;
        delete (transformed as Record<string, unknown>).emailVerificationExpires;
        delete (transformed as Record<string, unknown>).__v;
        return transformed;
      },
    },
  }
);

export const User = model<IUser>('User', userSchema);
