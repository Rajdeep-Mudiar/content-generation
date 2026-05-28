import { useQuery, useMutation } from '@tanstack/react-query';
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
  <div className={`${styles.statCard} glass-card`}>
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
  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get('/analytics/summary');
      return res.data;
    }
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post('/content/generate'),
    onSuccess: () => {
      refetch();
      alert('Content generation started!');
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
          <p className={styles.subtitle}>Your AI content pipeline is optimized and running.</p>
        </div>
        <button 
          className={styles.primaryBtn}
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          <Zap size={18} />
          <span>{generateMutation.isPending ? 'Generating...' : 'Generate Day 1 Content'}</span>
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
        <section className={`${styles.section} glass-card`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Provider Usage</h2>
            <Activity size={18} className={styles.sectionIcon} />
          </div>
          <div className={styles.usageCard}>
            <div className={styles.usageItem}>
              <div className={styles.usageInfo}>
                <span>DeepSeek (Highest Priority)</span>
                <span>{summary?.today?.providerUsage?.deepseek || 0} requests</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progress} 
                  style={{ 
                    width: `${Math.min(100, ((summary?.today?.providerUsage?.deepseek || 0) / (summary?.today?.totalGenerated || 1)) * 100)}%`, 
                    background: 'var(--accent)',
                    color: 'var(--accent)'
                  }}
                ></div>
              </div>
            </div>
            <div className={styles.usageItem}>
              <div className={styles.usageInfo}>
                <span>Groq (Secondary)</span>
                <span>{summary?.today?.providerUsage?.groq || 0} requests</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progress} 
                  style={{ 
                    width: `${Math.min(100, ((summary?.today?.providerUsage?.groq || 0) / (summary?.today?.totalGenerated || 1)) * 100)}%`, 
                    background: 'var(--primary)',
                    color: 'var(--primary)'
                  }}
                ></div>
              </div>
            </div>
            <div className={styles.usageItem}>
              <div className={styles.usageInfo}>
                <span>Gemini (Fallback)</span>
                <span>{summary?.today?.providerUsage?.gemini || 0} requests</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progress} 
                  style={{ 
                    width: `${Math.min(100, ((summary?.today?.providerUsage?.gemini || 0) / (summary?.today?.totalGenerated || 1)) * 100)}%`, 
                    background: 'var(--success)',
                    color: 'var(--success)'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} glass-card`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <Clock size={18} className={styles.sectionIcon} />
          </div>
          <div className={styles.logsList}>
            {logs?.length > 0 ? logs.map((log, i) => (
              <div key={i} className={styles.logItem}>
                <div className={`${styles.logDot} ${styles[log.level]}`}></div>
                <div className={styles.logContent}>
                  <p className={styles.logMsg}>{log.message}</p>
                  <span className={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            )) : (
              <p className={styles.emptyLogs}>No activity recorded yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
