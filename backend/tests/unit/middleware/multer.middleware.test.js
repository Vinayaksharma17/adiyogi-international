/**
 * Unit tests for: multer middleware
 * Module path:    src/middleware/multer.middleware.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Capture internal callbacks via vi.hoisted + mocked multer ──────────────────
// vi.mock is hoisted before imports, so we use vi.hoisted() to share state
// between the mock factory and the test suite.
const state = vi.hoisted(() => ({
  fileFilters: [],      // imageFilter instances captured per multer() call
  storageOpts: [],      // diskStorage callback objects
  multerOpts: [],       // full opts passed to multer()
}));

vi.mock('multer', () => {
  const diskStorage = vi.fn().mockImplementation((opts) => {
    state.storageOpts.push(opts);
    return { _isStorage: true };
  });

  const multer = vi.fn().mockImplementation((opts) => {
    state.fileFilters.push(opts.fileFilter);
    state.multerOpts.push(opts);
    return { single: vi.fn(), array: vi.fn(), fields: vi.fn() };
  });

  multer.diskStorage = diskStorage;
  return { default: multer };
});

vi.mock('fs', () => ({ mkdirSync: vi.fn() }));

import multer from 'multer';
import { uploadProductImages, uploadCollectionImage } from '../../../src/middleware/multer.middleware.js';

describe('multer.middleware', () => {
  // imageFilter is the same function reused for both multer instances
  // state.fileFilters[0] = products, state.fileFilters[1] = collections
  let imageFilter;

  beforeEach(() => {
    // Both instances share the same imageFilter function
    imageFilter = state.fileFilters[0];
  });

  // ── Module exports ─────────────────────────────────────────────────────────
  describe('exports', () => {
    it('should export uploadProductImages as a multer instance', () => {
      expect(uploadProductImages).toBeDefined();
      expect(typeof uploadProductImages.single).toBe('function');
    });

    it('should export uploadCollectionImage as a multer instance', () => {
      expect(uploadCollectionImage).toBeDefined();
      expect(typeof uploadCollectionImage.single).toBe('function');
    });

    it('should create two separate multer instances (one per upload type)', () => {
      expect(multer).toHaveBeenCalledTimes(2);
    });
  });

  // ── File size limit ────────────────────────────────────────────────────────
  describe('file size limit', () => {
    it('should enforce a 10 MB file size limit for product images', () => {
      const opts = state.multerOpts[0];
      expect(opts.limits.fileSize).toBe(10 * 1024 * 1024);
    });

    it('should enforce a 10 MB file size limit for collection images', () => {
      const opts = state.multerOpts[1];
      expect(opts.limits.fileSize).toBe(10 * 1024 * 1024);
    });
  });

  // ── imageFilter ────────────────────────────────────────────────────────────
  describe('imageFilter', () => {
    it('should call cb(null, true) for image/jpeg files', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'image/jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should call cb(null, true) for image/png files', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'image/png' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should call cb(null, true) for image/webp files', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'image/webp' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should call cb(Error) for application/pdf files', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'application/pdf' }, cb);
      expect(cb).toHaveBeenCalledTimes(1);
      const [err] = cb.mock.calls[0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Only image files allowed');
    });

    it('should call cb(Error) for text/plain files', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'text/plain' }, cb);
      const [err] = cb.mock.calls[0];
      expect(err).toBeInstanceOf(Error);
    });

    it('should call cb(Error) for video/mp4 files', () => {
      const cb = vi.fn();
      imageFilter({}, { mimetype: 'video/mp4' }, cb);
      const [err] = cb.mock.calls[0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Only image files allowed');
    });
  });

  // ── diskStorage ────────────────────────────────────────────────────────────
  describe('diskStorage', () => {
    it('should create disk storage for the "products" subfolder', () => {
      expect(multer.diskStorage).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: expect.any(Function),
          filename: expect.any(Function),
        }),
      );
    });

    it('filename callback should return a string with the original file extension', () => {
      const storageOpts = state.storageOpts[0];
      const cb = vi.fn();
      storageOpts.filename({}, { originalname: 'photo.jpg' }, cb);

      expect(cb).toHaveBeenCalledTimes(1);
      const [err, filename] = cb.mock.calls[0];
      expect(err).toBeNull();
      expect(filename).toMatch(/\.jpg$/);
    });

    it('filename callback should generate a unique name each call', () => {
      const storageOpts = state.storageOpts[0];
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      storageOpts.filename({}, { originalname: 'a.png' }, cb1);
      storageOpts.filename({}, { originalname: 'b.png' }, cb2);

      const [, name1] = cb1.mock.calls[0];
      const [, name2] = cb2.mock.calls[0];
      expect(name1).not.toBe(name2);
    });
  });
});
