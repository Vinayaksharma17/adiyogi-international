import express from 'express';
import auth from '../middleware/auth.middleware.js';
import { uploadCollectionImage } from '../middleware/multer.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCollectionSchema, updateCollectionSchema } from '../validators/collections.validator.js';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../controllers/collections.controller.js';

const router = express.Router();

router.get('/', getCollections);
router.post('/', auth, uploadCollectionImage.single('image'), validate(createCollectionSchema), createCollection);
router.put('/:id', auth, uploadCollectionImage.single('image'), validate(updateCollectionSchema), updateCollection);
router.delete('/:id', auth, deleteCollection);

export default router;
