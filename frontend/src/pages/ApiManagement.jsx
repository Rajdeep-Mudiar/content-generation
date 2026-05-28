import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCcw, 
  ShieldCheck, 
  ShieldAlert,
  Clock,
  ExternalLink
} from 'lucide-react';
import api from '../api/axios';
import styles from './ApiManagement.module.css';

const ApiManagement = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState({ key: '', provider: 'groq', label: '' });

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await api.get('/keys');
      return res.data;
    }
  });

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/keys', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['api-keys']);
      setShowAddModal(false);
      setNewKey({ key: '', provider: 'groq', label: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['api-keys'])
  });

  if (isLoading) return <div className="loading">Loading API keys...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>API Key Management</h1>
          <p className={styles.subtitle}>Manage your AI provider keys and rotation settings.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          <span>Add New Key</span>
        </button>
      </header>

      <div className={styles.keysGrid}>
        {keys?.map((keyDoc) => (
          <div key={keyDoc._id} className={styles.keyCard}>
            <div className={styles.cardHeader}>
              <div className={styles.providerInfo}>
                <span className={`${styles.providerBadge} ${styles[keyDoc.provider]}`}>
                  {keyDoc.provider}
                </span>
                <h3 className={styles.keyLabel}>{keyDoc.label || 'Unnamed Key'}</h3>
              </div>
              <div className={styles.statusBadge}>
                {keyDoc.status === 'active' ? (
                  <span className={styles.active}><ShieldCheck size={14} /> Active</span>
                ) : keyDoc.status === 'cooldown' ? (
                  <span className={styles.cooldown}><Clock size={14} /> Cooldown</span>
                ) : (
                  <span className={styles.failed}><ShieldAlert size={14} /> Failed</span>
                )}
              </div>
            </div>

            <div className={styles.keyPreview}>
              <code>{keyDoc.key.substring(0, 12)}••••••••••••</code>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <label>Requests</label>
                <span>{keyDoc.requestCount}</span>
              </div>
              <div className={styles.stat}>
                <label>Tokens</label>
                <span>{(keyDoc.tokenUsage / 1000).toFixed(1)}k</span>
              </div>
              <div className={styles.stat}>
                <label>Avg Latency</label>
                <span>{keyDoc.avgLatency}ms</span>
              </div>
            </div>

            <footer className={styles.cardFooter}>
              <div className={styles.lastUsed}>
                Last used: {keyDoc.lastUsed ? new Date(keyDoc.lastUsed).toLocaleTimeString() : 'Never'}
              </div>
              <button 
                className={styles.deleteBtn}
                onClick={() => {
                  if (confirm('Are you sure you want to delete this key?')) {
                    deleteMutation.mutate(keyDoc._id);
                  }
                }}
              >
                <Trash2 size={18} />
              </button>
            </footer>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Add New API Key</h2>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Provider</label>
                <select 
                  value={newKey.provider}
                  onChange={(e) => setNewKey({...newKey, provider: e.target.value})}
                >
                  <option value="groq">Groq (Primary)</option>
                  <option value="gemini">Gemini (Fallback)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Label</label>
                <input 
                  type="text" 
                  placeholder="Production Key 1"
                  value={newKey.label}
                  onChange={(e) => setNewKey({...newKey, label: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>API Key</label>
                <input 
                  type="password" 
                  placeholder="sk-..."
                  value={newKey.key}
                  onChange={(e) => setNewKey({...newKey, key: e.target.value})}
                />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.secondaryBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button 
                  className={styles.primaryBtn}
                  onClick={() => addMutation.mutate(newKey)}
                  disabled={!newKey.key}
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiManagement;
