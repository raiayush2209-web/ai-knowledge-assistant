import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

import {
  extractTextFromFile,
  extractTextFromUrl,
} from '../services/textExtraction.js';

import { indexDocument } from '../services/pinecone.js';
import { Document } from '../models/Document.js';
import { config } from '../config/environment.js';


// ============================================================
// UPLOAD FILE
// ============================================================

export const uploadFile = async (req, res) => {
  const uploadedFiles = [];

  // Multer .fields() puts files inside req.files
  if (req.file) {
    uploadedFiles.push(req.file);
  }

  if (req.files?.file) {
    uploadedFiles.push(...req.files.file);
  }

  if (req.files?.files) {
    uploadedFiles.push(...req.files.files);
  }

  console.log('[UPLOAD] Request received');

  console.log('[UPLOAD] Files:', {
    singleFile: req.file?.originalname || null,
    fileFieldCount: req.files?.file?.length || 0,
    filesFieldCount: req.files?.files?.length || 0,
    total: uploadedFiles.length,
  });

  try {
    // --------------------------------------------------------
    // Check whether files were uploaded
    // --------------------------------------------------------

    if (uploadedFiles.length === 0) {
      console.error('[UPLOAD] No file provided');

      return res.status(400).json({
        success: false,
        error: 'Missing file upload.',
      });
    }

    // --------------------------------------------------------
    // Validate uploaded files
    // --------------------------------------------------------

    const allowedExtensions = new Set([
      '.pdf',
      '.docx',
      '.txt',
      '.md',
      '.markdown',
      '.html',
      '.htm',
    ]);

    for (const file of uploadedFiles) {
      console.log('[UPLOAD] Validating:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      });

      // Check Multer path
      if (!file.path) {
        console.error(
          `[UPLOAD] No path for ${file.originalname}`
        );

        return res.status(500).json({
          success: false,
          error:
            'File upload failed - unable to save file to disk.',
        });
      }

      // Check file actually exists
      try {
        await fs.access(file.path);
      } catch {
        console.error(
          `[UPLOAD] File does not exist: ${file.path}`
        );

        return res.status(500).json({
          success: false,
          error:
            'Uploaded file could not be found on the server.',
        });
      }

      // Validate extension
      const extension = path
        .extname(file.originalname || '')
        .toLowerCase();

      if (!allowedExtensions.has(extension)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported file type: ${extension}`,
        });
      }

      // ------------------------------------------------------
      // Validate binary file signatures
      // ------------------------------------------------------

      if (extension === '.pdf' || extension === '.docx') {
        try {
          const detectedType = await fileTypeFromFile(file.path);

          console.log('[UPLOAD] Detected type:', {
            filename: file.originalname,
            detectedMime: detectedType?.mime || 'unknown',
          });

          if (extension === '.pdf') {
            if (detectedType?.mime !== 'application/pdf') {
              return res.status(400).json({
                success: false,
                error: `${file.originalname} is not a valid PDF file.`,
              });
            }
          }

          if (extension === '.docx') {
            /*
             * DOCX files are ZIP containers internally.
             * file-type commonly detects them as application/zip.
             */
            if (
              detectedType?.mime !== 'application/zip' &&
              detectedType?.mime !==
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ) {
              return res.status(400).json({
                success: false,
                error: `${file.originalname} is not a valid DOCX file.`,
              });
            }
          }
        } catch (typeError) {
          console.warn(
            `[UPLOAD] Could not detect file type for ${file.originalname}:`,
            typeError.message
          );
        }
      }
    }

    // --------------------------------------------------------
    // Namespace derivation from authenticated user
    // --------------------------------------------------------

    const userId = req.user?.id;
    const namespace = userId ? `user_${userId}` : (req.user?.namespace || config.DEFAULT_NAMESPACE);

    const results = [];

    // --------------------------------------------------------
    // Process every uploaded file
    // --------------------------------------------------------

    for (const file of uploadedFiles) {
      const source =
        req.body?.source ||
        file.originalname;

      console.log(
        `[UPLOAD] Processing: ${file.originalname}`
      );

      let text;

      // ------------------------------------------------------
      // Extract text
      // ------------------------------------------------------

    try {
  console.log(`[UPLOAD] Starting extraction: ${file.originalname}`);

  text = await extractTextFromFile(
    file.path,
    file.originalname
  );

  console.log(
    `[UPLOAD] Extraction complete: ${file.originalname} | chars=${text?.length || 0}`
  );
} catch (extractError) {
  console.error('[UPLOAD] EXTRACTION FAILED', {
    filename: file.originalname,
    message: extractError?.message,
    stack: extractError?.stack,
    name: extractError?.name,
  });

  results.push({
    filename: file.originalname,
    success: false,
    error: `Text extraction failed: ${extractError?.message || 'Unknown error'}`,
  });

  continue;
}

      // ------------------------------------------------------
      // Make sure extracted text exists
      // ------------------------------------------------------

      if (!text || text.trim().length === 0) {
  results.push({
    filename: file.originalname,
    success: false,
    error: 'No readable text found in file.',
  });

  continue;
}

      // ------------------------------------------------------
      // Index document into Pinecone
      // ------------------------------------------------------

      try {
        console.log(
    `[UPLOAD] Starting indexing: ${file.originalname}`
  );

  const indexResult = await indexDocument({
    source: req.body?.source || file.originalname,
    text,
    metadata: {
      filename: file.originalname,
      userId,
    },
    namespace,
  });

  console.log(
    `[UPLOAD] INDEXING COMPLETE: ${file.originalname}`,
    indexResult
  );

  // Track document in MongoDB for authenticated user
  if (userId) {
    try {
      await Document.create({
        userId,
        documentId: indexResult.documentId,
        filename: file.originalname,
        source: req.body?.source || file.originalname,
        type: 'upload',
        namespace,
        indexedChunks: indexResult.indexedChunks,
      });
    } catch (dbErr) {
      console.warn(`[UPLOAD] Failed to record document in MongoDB: ${dbErr.message}`);
    }
  }

         results.push({
    filename: file.originalname,
    success: true,
    indexedChunks: indexResult.indexedChunks,
    source: req.body?.source || file.originalname,
    namespace,
  });
      } catch (indexError) {
  console.error('[UPLOAD] INDEXING FAILED', {
    filename: file.originalname,
    message: indexError?.message,
    stack: indexError?.stack,
    name: indexError?.name,
  });

  results.push({
    filename: file.originalname,
    success: false,
    error: `Indexing failed: ${indexError?.message || 'Unknown error'}`,
  });
      }
    }

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    const successfulFiles = results.filter(
      (item) => item.success
    ).length;

    const failedFiles =
      results.length - successfulFiles;

    const allFailed =
      successfulFiles === 0;

    console.log('[UPLOAD] Completed:', {
      totalFiles: uploadedFiles.length,
      successfulFiles,
      failedFiles,
    });

    return res.status(allFailed ? 422 : 200).json({
      success: !allFailed,
      ...(allFailed ? { error: results.map((item) => `${item.filename}: ${item.error}`).join('; ') } : {}),
      files: results,
      totalFiles: uploadedFiles.length,
      successfulFiles,
    });

  } catch (error) {
    console.error(
      '[UPLOAD] Unexpected error:',
      error
    );

    return res.status(500).json({
      success: false,
      error:
        'Upload failed due to an internal server error.',
    });

  } finally {

    // --------------------------------------------------------
    // Delete temporary uploaded files
    // --------------------------------------------------------

    for (const file of uploadedFiles) {
      if (!file.path) continue;

      try {
        await fs.unlink(file.path);

        console.log(
          `[UPLOAD] Deleted temporary file: ${file.path}`
        );
      } catch (unlinkError) {
        console.warn(
          `[UPLOAD] Failed to delete temporary file: ${unlinkError.message}`
        );
      }
    }
  }
};


// ============================================================
// INDEX URL
// ============================================================

export const indexUrl = async (req, res) => {
  try {
    const { url, source } = req.body;

    const userId = req.user?.id;
    const namespace = userId ? `user_${userId}` : (req.user?.namespace || config.DEFAULT_NAMESPACE);

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing url parameter.',
      });
    }

    // --------------------------------------------------------
    // URL validation
    // --------------------------------------------------------

    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format.',
      });
    }

    if (
      parsedUrl.protocol !== 'http:' &&
      parsedUrl.protocol !== 'https:'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid URL protocol. Only HTTP and HTTPS are allowed.',
      });
    }

    // --------------------------------------------------------
    // Basic SSRF protection
    // --------------------------------------------------------

    const hostname =
      parsedUrl.hostname.toLowerCase();

    const blockedHostnames = new Set([
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '169.254.169.254',
    ]);

    if (blockedHostnames.has(hostname)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid URL: private or reserved addresses are not allowed.',
      });
    }

    if (
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid URL: private IP addresses are not allowed.',
      });
    }

    // --------------------------------------------------------
    // Extract URL text
    // --------------------------------------------------------

    const text =
      await extractTextFromUrl(url);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No readable text found at URL.',
      });
    }

    // --------------------------------------------------------
    // Index URL
    // --------------------------------------------------------

    const data = await indexDocument({
      source: source || url,
      text,
      metadata: {
        url,
        userId,
      },
      namespace,
    });

    if (userId) {
      try {
        await Document.create({
          userId,
          documentId: data.documentId,
          filename: url,
          source: source || url,
          type: 'url',
          namespace,
          indexedChunks: data.indexedChunks,
        });
      } catch (dbErr) {
        console.warn(`[INDEX URL] Failed to record document in MongoDB: ${dbErr.message}`);
      }
    }

    return res.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error(
      '[INDEX URL] Error:',
      error
    );

    return res.status(500).json({
      success: false,
      error: 'Failed to index URL.',
    });
  }
};


// ============================================================
// INGEST TEXT
// ============================================================

export const ingestText = async (req, res) => {
  try {
    const { source, text } = req.body;

    const userId = req.user?.id;
    const namespace = userId ? `user_${userId}` : (req.user?.namespace || config.DEFAULT_NAMESPACE);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing text to ingest.',
      });
    }

    const data = await indexDocument({
      source: source || 'manual-text',
      text,
      metadata: {
        source: source || 'manual-text',
        userId,
      },
      namespace,
    });

    if (userId) {
      try {
        await Document.create({
          userId,
          documentId: data.documentId,
          filename: source || 'manual-text',
          source: source || 'manual-text',
          type: 'text',
          namespace,
          indexedChunks: data.indexedChunks,
        });
      } catch (dbErr) {
        console.warn(`[INGEST TEXT] Failed to record document in MongoDB: ${dbErr.message}`);
      }
    }

    return res.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error(
      '[INGEST TEXT] Error:',
      error
    );

    return res.status(500).json({
      success: false,
      error: 'Failed to ingest text.',
    });
  }
};