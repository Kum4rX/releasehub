import { Schema, model, Document, Types } from 'mongoose';

export type ChangelogCategory = 'new' | 'improved' | 'fixed';
export type ChangelogStatus = 'draft' | 'published';

export interface IChangelog extends Document {
  title: string;
  slug: string;
  contentMarkdown: string;
  category: ChangelogCategory;
  coverImage?: string;
  publishedAt?: Date;
  status: ChangelogStatus;
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const changelogSchema = new Schema<IChangelog>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    contentMarkdown: {
      type: String,
      required: [true, 'Content markdown is required'],
    },
    category: {
      type: String,
      enum: {
        values: ['new', 'improved', 'fixed'],
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Category is required'],
      index: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published'],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const transformed = { ...ret };
        delete (transformed as Record<string, unknown>).__v;
        return transformed;
      },
    },
  }
);

// Compound index for querying published changelogs by publish date (most recent first)
changelogSchema.index({ status: 1, publishedAt: -1 });
changelogSchema.index({ status: 1, category: 1, publishedAt: -1 });

export const Changelog = model<IChangelog>('Changelog', changelogSchema);
