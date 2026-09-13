import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSafeUrl } from '../services/textExtraction.js';

test('rejects unsupported URL schemes', async () => {
  await assert.rejects(() => resolveSafeUrl('file:///etc/passwd'), /not allowed/);
});

test('rejects loopback and metadata hosts', async () => {
  await assert.rejects(() => resolveSafeUrl('http://127.0.0.1/'), /not allowed|private/);
  await assert.rejects(() => resolveSafeUrl('http://metadata.google.internal/'), /not allowed|private/);
});

test('rejects private IPv4 addresses', async () => {
  await assert.rejects(() => resolveSafeUrl('http://192.168.1.10/'), /private/);
});
