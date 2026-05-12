import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import { createCanvas } from '@napi-rs/canvas';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createWorker } from 'tesseract.js';
import { PDFParse } from 'pdf-parse';
import { cleanText } from '../utils/helpers.js';

const OCR_MAX_PAGES = Number(process.env.OCR_MAX_PAGES || 10);
const OCR_PAGE_SCALE = Number(process.env.OCR_PAGE_SCALE || 1.5);

let ocrWorker;
let ocrInitialized = false;

const fileTypeFromName = (filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  return ext;
};

const initOCR = async () => {
  if (ocrInitialized) return ocrWorker;

  ocrWorker = createWorker({
    logger: (message) => {
      if (message.status && message.progress != null) {
        console.log(`[OCR] ${message.status} ${Math.round(message.progress * 100)}%`);
      }
    },
  });

  await ocrWorker.load();
  await ocrWorker.loadLanguage('eng');
  await ocrWorker.initialize('eng');
  ocrInitialized = true;
  return ocrWorker;
};

const renderPdfPageToPng = async (page) => {
  const viewport = page.getViewport({ scale: OCR_PAGE_SCALE });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');
  const renderContext = { canvasContext: context, viewport };

  await page.render(renderContext).promise;
  return canvas.toBuffer('image/png');
};

const extractTextFromScannedPdf = async (buffer) => {
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdfDocument = await loadingTask.promise;
  const pageCount = Math.min(pdfDocument.numPages, OCR_MAX_PAGES);
  const worker = await initOCR();

  let text = '';
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    try {
      const page = await pdfDocument.getPage(pageNumber);
      const pngBuffer = await renderPdfPageToPng(page);
      const { data } = await worker.recognize(pngBuffer);
      text += `${data.text || ''}\n`;
    } catch (pageError) {
      console.warn(`[OCR] Failed to process page ${pageNumber}: ${pageError.message}`);
    }
  }

  if (pdfDocument.numPages > OCR_MAX_PAGES) {
    text += `\n[OCR] Note: only first ${OCR_MAX_PAGES} pages were processed. Set OCR_MAX_PAGES higher in .env to process more pages.`;
  }

  return text;
};

export const extractTextFromFile = async (filePath, filename) => {
  const extension = fileTypeFromName(filename);
  const buffer = await fs.readFile(filePath);

  try {
    if (extension === '.pdf') {
      console.log('[PDF] Parsing...');
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      let text = cleanText(data.text || '');
      console.log('[PDF] Parsed text length:', text.length);

      if (!text || text.length < 20) {
        console.log('[PDF] Falling back to OCR for scanned PDF or image-only content...');
        const ocrText = await extractTextFromScannedPdf(buffer);
        text = cleanText(ocrText || '');
        console.log('[PDF] OCR extracted text length:', text.length);
      }

      return text;
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
      $('script, style, noscript, svg, iframe, header, footer, nav, form, link, meta').remove();
      const bodyText = $('body').text() || $.root().text();
      return cleanText(bodyText || '');
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
    const parser = new PDFParse({ data: response.data });
    const data = await parser.getText();
    let text = cleanText(data.text || '');
    if (!text || text.length < 20) {
      console.log('[URL PDF] Falling back to OCR for scanned PDF URL...');
      text = cleanText(await extractTextFromScannedPdf(response.data) || '');
      console.log('[URL PDF] OCR extracted text length:', text.length);
    }
    return text;
  }

  const html = response.data.toString('utf-8');
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, iframe, header, footer, nav, form, link, meta').remove();
  const bodyText = $('body').text() || $.root().text();
  return cleanText(bodyText || '');
};