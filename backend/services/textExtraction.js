import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import dns from 'dns/promises';
import net from 'net';
import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import { createCanvas } from '@napi-rs/canvas';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createWorker } from 'tesseract.js';
import { PDFParse } from 'pdf-parse';
import { cleanText } from '../utils/helpers.js';

const OCR_MAX_PAGES = Number(process.env.OCR_MAX_PAGES || 10);
const OCR_PAGE_SCALE = Number(process.env.OCR_PAGE_SCALE || 1.5);
const MAX_URL_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;

const isBlockedIp = (address) => {
  if (net.isIP(address) === 4) {
    const [first, second] = address.split('.').map(Number);
    return first === 0 || first === 10 || first === 127 || first === 169 && second === 254
      || first === 192 && second === 168 || first === 172 && second >= 16 && second <= 31
      || first >= 224;
  }

  const normalized = address.toLowerCase();
  return normalized === '::1' || normalized === '::'
    || normalized.startsWith('fc') || normalized.startsWith('fd')
    || normalized.startsWith('fe8') || normalized.startsWith('fe9')
    || normalized.startsWith('fea') || normalized.startsWith('feb')
    || normalized.startsWith('ff') || normalized.startsWith('::ffff:10.')
    || normalized.startsWith('::ffff:192.168.') || normalized.startsWith('::ffff:127.');
};

export const resolveSafeUrl = async (value) => {
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('URL is not allowed');
  }
  if (parsed.hostname === 'localhost' || parsed.hostname.endsWith('.localhost') || parsed.hostname === 'metadata.google.internal') {
    throw new Error('URL host is not allowed');
  }

  const addresses = net.isIP(parsed.hostname)
    ? [{ address: parsed.hostname }]
    : await dns.lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isBlockedIp(address))) {
    throw new Error('URL resolves to a private or reserved network address');
  }
  return { parsed, address: addresses[0].address };
};

let ocrWorker;
let ocrInitialized = false;

const fileTypeFromName = (filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  return ext;
};

const initOCR = async () => {
  if (ocrInitialized) return ocrWorker;

  // tesseract.js v7: createWorker(langs, oem, options) returns a ready worker
  ocrWorker = await createWorker('eng', 1, {
    logger: (message) => {
      if (message.status && message.progress != null) {
        console.log(`[OCR] ${message.status} ${Math.round(message.progress * 100)}%`);
      }
    },
  });

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
  let currentUrl = url;
  let response;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const { parsed, address } = await resolveSafeUrl(currentUrl);
    response = await axios.get(currentUrl, {
      headers: {
        'User-Agent': 'AI-Knowledge-Assistant/1.0',
        Accept: 'text/html,application/xhtml+xml,application/pdf,text/plain',
      },
      responseType: 'arraybuffer',
      timeout: 10000,
      maxContentLength: MAX_URL_BYTES,
      maxBodyLength: MAX_URL_BYTES,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      lookup: (hostname, options, callback) => callback(null, address, net.isIP(address)),
    });

    if (response.status < 300) break;
    if (redirectCount === MAX_REDIRECTS || !response.headers.location) throw new Error('Too many redirects');
    currentUrl = new URL(response.headers.location, parsed).toString();
  }

  const contentType = response.headers['content-type'] || '';
  if (!/(text\/html|application\/xhtml\+xml|application\/pdf|text\/plain)/i.test(contentType)) {
    throw new Error('URL content type is not supported');
  }
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