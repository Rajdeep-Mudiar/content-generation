import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import api from '../api/axios';
import styles from './Logs.module.css';

const Logs = () => {
  const [level, setLevel] = useState('');
  const [context, setContext] = useState('');

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['logs', level, context],
    queryFn: async () => {
      const res = await api.get(`/logs?level=${level}&context=${context}`);
      return res.data;
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Logs</h1>
          <p className={styles.subtitle}>Monitor system events and AI provider activity.</p>
        </div>
        <button className={styles.refreshBtn} onClick={() => refetch()}>
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </header>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Context</label>
          <select value={context} onChange={(e) => setContext(e.target.value)}>
            <option value="">All Contexts</option>
            <option value="cron_job">Cron Job</option>
            <option value="ai_provider">AI Provider</option>
            <option value="notion_sync">Notion Sync</option>
            <option value="content_gen">Content Gen</option>
          </select>
        </div>
      </div>

      <div className={styles.logsWrapper}>
        {isLoading ? (
          <div className={styles.loading}>Loading logs...</div>
        ) : (
          <div className={styles.logsList}>
            {logs?.map((log) => (
              <div key={log._id} className={`${styles.logItem} ${styles[log.level]}`}>
                <div className={styles.logIcon}>
                  {log.level === 'error' ? <AlertCircle size={18} /> : 
                   log.level === 'warn' ? <AlertTriangle size={18} /> : <Info size={18} />}
                </div>
                <div className={styles.logMain}>
                  <div className={styles.logHeader}>
                    <span className={styles.logContext}>[{log.context}]</span>
                    <span className={styles.logTime}>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className={styles.logMsg}>{log.message}</p>
                  {log.details && (
                    <pre className={styles.logDetails}>
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
