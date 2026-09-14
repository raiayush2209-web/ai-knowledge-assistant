import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentId: {
      type: String,
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['upload', 'url', 'text'],
      default: 'upload',
    },
    namespace: {
      type: String,
      required: true,
    },
    indexedChunks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ userId: 1, documentId: 1 });

export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
