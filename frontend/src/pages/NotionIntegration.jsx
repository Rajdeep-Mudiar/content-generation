import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  Share2, 
  CheckCircle2, 
  Database, 
  RefreshCcw, 
  ExternalLink,
  Settings,
  AlertTriangle
} from 'lucide-react';
import api from '../api/axios';
import styles from './NotionIntegration.module.css';

const NotionIntegration = () => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const [step, setStep] = useState(1); // 1: Connect, 2: Select DB

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['notion-config'],
    queryFn: async () => {
      const res = await api.get('/notion/config');
      return res.data;
    }
  });

  const { data: databases, isLoading: loadingDBs } = useQuery({
    queryKey: ['notion-databases', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await api.get(`/notion/databases?accessToken=${token}`);
      return res.data;
    },
    enabled: !!token && step === 2
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data) => api.post('/notion/config', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notion-config']);
      setStep(1);
    }
  });

  const handleConnect = () => {
    if (token) setStep(2);
  };

  const handleSelectDB = (dbId) => {
    updateConfigMutation.mutate({
      accessToken: token,
      databaseId: dbId,
      isConnected: true
    });
  };

  if (loadingConfig) return <div className="loading">Loading Notion settings...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Notion Integration</h1>
          <p className={styles.subtitle}>Sync your generated content directly to your Notion workspace.</p>
        </div>
        {config?.isConnected && (
          <div className={styles.connectedBadge}>
            <CheckCircle2 size={18} />
            <span>Connected</span>
          </div>
        )}
      </header>

      <div className={styles.grid}>
        <section className={styles.setupSection}>
          <div className={styles.card}>
            {step === 1 ? (
              <div className={styles.stepContent}>
                <div className={styles.iconCircle}>
                  <Share2 size={32} />
                </div>
                <h2>Connect to Notion</h2>
                <p>Enter your Notion Integration Token to get started.</p>
                <div className={styles.inputGroup}>
                  <label>Integration Token</label>
                  <input 
                    type="password" 
                    placeholder="secret_..."
                    value={token || (config?.accessToken || '')}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className={styles.helpLink}>
                    Where do I find this? <ExternalLink size={12} />
                  </a>
                </div>
                <button 
                  className={styles.primaryBtn} 
                  onClick={handleConnect}
                  disabled={!token && !config?.accessToken}
                >
                  Next: Select Database
                </button>
              </div>
            ) : (
              <div className={styles.stepContent}>
                <div className={styles.iconCircle}>
                  <Database size={32} />
                </div>
                <h2>Select Database</h2>
                <p>Choose the database where you want to sync content.</p>
                
                <div className={styles.dbList}>
                  {loadingDBs ? (
                    <div className={styles.loadingDBs}>Fetching databases...</div>
                  ) : databases?.length > 0 ? (
                    databases.map(db => (
                      <button 
                        key={db.id} 
                        className={styles.dbItem}
                        onClick={() => handleSelectDB(db.id)}
                      >
                        <Database size={16} />
                        <span>{db.title}</span>
                      </button>
                    ))
                  ) : (
                    <div className={styles.noDBs}>
                      <AlertTriangle size={24} />
                      <p>No databases found. Make sure your integration has access to at least one database.</p>
                    </div>
                  )}
                </div>
                
                <button className={styles.secondaryBtn} onClick={() => setStep(1)}>
                  Back
                </button>
              </div>
            )}
          </div>
        </section>

        <section className={styles.infoSection}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Settings size={20} />
              <h3>Sync Settings</h3>
            </div>
            <div className={styles.settingsList}>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h4>Auto-Sync</h4>
                  <p>Automatically sync new content as it's generated.</p>
                </div>
                <div className={styles.toggle}>
                  <input type="checkbox" checked={config?.syncSettings?.autoSync} readOnly />
                  <span className={styles.slider}></span>
                </div>
              </div>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h4>Daily Report</h4>
                  <p>Send a daily summary of generation stats to Notion.</p>
                </div>
                <div className={styles.toggle}>
                  <input type="checkbox" checked />
                  <span className={styles.slider}></span>
                </div>
              </div>
            </div>
            <div className={styles.lastSync}>
              <RefreshCcw size={14} />
              <span>Last sync: {config?.lastSynced ? new Date(config.lastSynced).toLocaleString() : 'Never'}</span>
            </div>
          </div>

          <div className={styles.guideCard}>
            <h3>How it works</h3>
            <ol className={styles.guideList}>
              <li>Create a Notion Integration.</li>
              <li>Share your content database with the integration.</li>
              <li>Enter your token and select the database here.</li>
              <li>Relax! Content will sync automatically every day.</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NotionIntegration;
