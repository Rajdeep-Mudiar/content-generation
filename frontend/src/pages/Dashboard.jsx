import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  Activity
} from 'lucide-react';
import api from '../api/axios';
import styles from './Dashboard.module.css';

const StatCard = ({ title, value, icon, color, trend }) => (
  <div className={styles.statCard}>
    <div className={`${styles.iconContainer} ${styles[color]}`}>
      {icon}
    </div>
    <div className={styles.statInfo}>
      <span className={styles.statTitle}>{title}</span>
      <div className={styles.statValueRow}>
        <h3 className={styles.statValue}>{value}</h3>
        {trend && <span className={styles.trend}>+{trend}%</span>}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get('/analytics/summary');
      return res.data;
    }
  });

  const { data: logs } = useQuery({
    queryKey: ['recent-logs'],
    queryFn: async () => {
      const res = await api.get('/logs?limit=5');
      return res.data;
    }
  });

  if (isLoading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, Architect</h1>
          <p className={styles.subtitle}>Here's what's happening with your AI content pipeline.</p>
        </div>
        <button className={styles.primaryBtn}>
          <Zap size={18} />
          <span>Generate Now</span>
        </button>
      </header>

      <div className={styles.statsGrid}>
        <StatCard 
          title="Total Posts" 
          value={summary?.overallTotal || 0} 
          icon={<FileText size={24} />} 
          color="indigo"
          trend="12"
        />
        <StatCard 
          title="Today's Content" 
          value={summary?.today?.totalGenerated || 0} 
          icon={<Clock size={24} />} 
          color="blue"
        />
        <StatCard 
          title="Active Keys" 
          value="8" 
          icon={<CheckCircle2 size={24} />} 
          color="green"
        />
        <StatCard 
          title="Failed Keys" 
          value="1" 
          icon={<XCircle size={24} />} 
          color="red"
        />
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Provider Usage</h2>
            <Activity size={18} className={styles.sectionIcon} />
          </div>
          <div className={styles.usageCard}>
            <div className={styles.usageItem}>
              <div className={styles.usageInfo}>
                <span>Groq (Primary)</span>
                <span>{summary?.today?.providerUsage?.groq || 0} requests</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progress} style={{ width: '85%', background: 'var(--primary)' }}></div>
              </div>
            </div>
            <div className={styles.usageItem}>
              <div className={styles.usageInfo}>
                <span>Gemini (Fallback)</span>
                <span>{summary?.today?.providerUsage?.gemini || 0} requests</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progress} style={{ width: '15%', background: 'var(--success)' }}></div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <Clock size={18} className={styles.sectionIcon} />
          </div>
          <div className={styles.logsList}>
            {logs?.map((log, i) => (
              <div key={i} className={styles.logItem}>
                <div className={`${styles.logDot} ${styles[log.level]}`}></div>
                <div className={styles.logContent}>
                  <p className={styles.logMsg}>{log.message}</p>
                  <span className={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
