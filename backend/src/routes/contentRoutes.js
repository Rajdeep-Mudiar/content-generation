import express from 'express';
import { 
  getAllContent, 
  getContentById, 
  generateManualContent, 
  deleteContent 
} from '../controllers/contentController.js';

const router = express.Router();

router.get('/', getAllContent);
router.post('/generate', generateManualContent);
router.get('/:id', getContentById);
router.delete('/:id', deleteContent);

export default router;
