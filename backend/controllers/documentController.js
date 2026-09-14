import mongoose from 'mongoose';
import { Document } from '../models/Document.js';
import { getPineconeIndex } from '../config/database.js';

export const listDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, documents });
  } catch (error) {
    console.error('[DOCUMENTS] List failed:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to list documents.' });
  }
};

export const deleteDocument = async (req, res) => {
  const { documentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(req.user.id) || !documentId || documentId.length > 200) {
    return res.status(400).json({ success: false, error: 'Invalid document ID.' });
  }

  try {
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const namespace = `user_${req.user.id}`;
    await getPineconeIndex(namespace).deleteMany({
      filter: { documentId: document.documentId },
    });
    await Document.deleteOne({ _id: document._id, userId: req.user.id });

    return res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('[DOCUMENTS] Delete failed:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to delete document.' });
  }
};
