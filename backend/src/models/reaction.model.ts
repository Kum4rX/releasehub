import { Schema, model, Document, Types } from 'mongoose';

export type ReactionType = 'heart' | 'celebrate' | 'rocket';

export interface IReaction extends Document {
  user: Types.ObjectId;
  changelog: Types.ObjectId;
  type: ReactionType;
  createdAt: Date;
}

const reactionSchema = new Schema<IReaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for reaction'],
      index: true,
    },
    changelog: {
      type: Schema.Types.ObjectId,
      ref: 'Changelog',
      required: [true, 'Changelog is required for reaction'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['heart', 'celebrate', 'rocket'],
        message: '{VALUE} is not a valid reaction type',
      },
      required: [true, 'Reaction type is required'],
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

// Compound unique index: user + changelog + type
reactionSchema.index({ user: 1, changelog: 1, type: 1 }, { unique: true });

// Aggregate index for counting reactions per changelog
reactionSchema.index({ changelog: 1, type: 1 });

export const Reaction = model<IReaction>('Reaction', reactionSchema);
