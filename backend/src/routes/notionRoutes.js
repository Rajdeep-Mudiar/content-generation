import express from 'express';
import { 
  getNotionConfig, 
  updateNotionConfig, 
  fetchDatabases,
  autoSetupNotion
} from '../controllers/notionController.js';

const router = express.Router();

router.get('/config', getNotionConfig);
router.post('/config', updateNotionConfig);
router.get('/databases', fetchDatabases);
router.post('/auto-setup', autoSetupNotion);

export default router;
