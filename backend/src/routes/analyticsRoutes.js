import express from 'express';
import { getAnalytics, getDashboardSummary } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/', getAnalytics);
router.get('/summary', getDashboardSummary);

export default router;
