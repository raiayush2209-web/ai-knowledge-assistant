export const cleanText = (text) => text.replace(/\s+/g, ' ').trim();

export const normalizeSource = (source) => source.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);