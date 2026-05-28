import express from 'express';
import { 
  getNotionConfig, 
  updateNotionConfig, 
  fetchDatabases 
} from '../controllers/notionController.js';

const router = express.Router();

router.get('/config', getNotionConfig);
router.post('/config', updateNotionConfig);
router.get('/databases', fetchDatabases);

export default router;
