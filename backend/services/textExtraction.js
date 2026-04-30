import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import { cleanText } from '../utils/helpers.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const fileTypeFromName = (filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  return ext;
};

export const extractTextFromFile = async (filePath, filename) => {
  const extension = fileTypeFromName(filename);
  const buffer = await fs.readFile(filePath);

  try {
    if (extension === '.pdf') {
      console.log('[PDF] Parsing...');
      let data = typeof pdfParse === 'function' ? await pdfParse(buffer) : await pdfParse.default(buffer);
      console.log('[PDF] Success, length:', data.text?.length || 0);
      return cleanText(data.text || '');
    }

    if (extension === '.docx') {
      console.log('[DOCX] Parsing...');
      const data = await mammoth.extractRawText({ buffer });
      return cleanText(data.value || '');
    }

    if (extension === '.txt' || extension === '.md') {
      return cleanText(buffer.toString('utf-8'));
    }

    if (extension === '.html' || extension === '.htm') {
      const html = buffer.toString('utf-8');
      const $ = cheerio.load(html);
      return cleanText($.root().text() || '');
    }

    return cleanText(buffer.toString('utf-8'));
  } catch (err) {
    console.error(`[EXTRACT] Error on ${extension}:`, err.message);
    throw err;
  }
};

export const extractTextFromUrl = async (url) => {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'AI-Knowledge-Assistant/1.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    responseType: 'arraybuffer',
  });

  const contentType = response.headers['content-type'] || '';
  if (contentType.includes('application/pdf')) {
    let data = typeof pdfParse === 'function' ? await pdfParse(response.data) : await pdfParse.default(response.data);
    return cleanText(data.text || '');
  }

  const html = response.data.toString('utf-8');
  const $ = cheerio.load(html);
  return cleanText($.root().text() || '');
};