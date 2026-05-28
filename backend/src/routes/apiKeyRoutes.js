import express from 'express';
import { 
  getApiKeys, 
  addApiKey, 
  updateApiKey, 
  deleteApiKey 
} from '../controllers/apiKeyController.js';

const router = express.Router();

router.get('/', getApiKeys);
router.post('/', addApiKey);
router.put('/:id', updateApiKey);
router.delete('/:id', deleteApiKey);

export default router;
