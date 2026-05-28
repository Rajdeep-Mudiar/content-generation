import cron from 'node-cron';
import ContentService from '../services/ContentService.js';
import { dbLogger } from '../utils/logger.js';

export const initCronJobs = () => {
  // Run daily at 00:00 (midnight)
  cron.schedule('0 0 * * *', async () => {
    try {
      await dbLogger('info', 'Starting scheduled daily content generation', 'cron_job');
      await ContentService.generateDailyContent();
      await dbLogger('info', 'Successfully completed scheduled daily content generation', 'cron_job');
    } catch (error) {
      await dbLogger('error', 'Scheduled daily content generation failed', 'cron_job', { error: error.message });
    }
  });

  // Run health check every hour to re-activate keys on cooldown
  cron.schedule('0 * * * *', async () => {
    try {
      // Logic handled within ProviderManager when fetching keys, 
      // but we could explicitly log or perform maintenance here.
      await dbLogger('info', 'Hourly maintenance check', 'cron_job');
    } catch (error) {
      console.error('Maintenance job failed:', error);
    }
  });

  console.log('Cron jobs initialized');
};
