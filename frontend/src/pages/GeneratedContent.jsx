import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Copy, 
  ExternalLink, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';
import styles from './GeneratedContent.module.css';

const GeneratedContent = () => {
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [page, setPage] = useState(1);
  const [selectedContent, setSelectedContent] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['content', search, platform, page],
    queryFn: async () => {
      const res = await api.get(`/content?search=${search}&platform=${platform}&page=${page}`);
      return res.data;
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (isLoading) return <div className="loading">Loading content...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Generated Content</h1>
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search content..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className={styles.select}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">All Platforms</option>
            <option value="Quora">Quora</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Medium">Medium</option>
          </select>
        </div>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Platform</th>
              <th>Topic</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.content.map((item) => (
              <tr key={item._id}>
                <td>
                  <div className={styles.contentTitle}>{item.title}</div>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[item.platform.toLowerCase()]}`}>
                    {item.platform}
                  </span>
                </td>
                <td>{item.topic}</td>
                <td>
                  <span className={`${styles.status} ${styles[item.status]}`}>
                    {item.status}
                  </span>
                </td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className={styles.actions}>
                    <button onClick={() => setSelectedContent(item)} className={styles.actionBtn}>
                      <Eye size={18} />
                    </button>
                    <button onClick={() => copyToClipboard(item.generatedContent)} className={styles.actionBtn}>
                      <Copy size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
          className={styles.pageBtn}
        >
          <ChevronLeft size={18} />
        </button>
        <span className={styles.pageInfo}>Page {page} of {data?.totalPages || 1}</span>
        <button 
          disabled={page === data?.totalPages} 
          onClick={() => setPage(p => p + 1)}
          className={styles.pageBtn}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {selectedContent && (
        <div className={styles.modal} onClick={() => setSelectedContent(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h2>{selectedContent.title}</h2>
              <button onClick={() => setSelectedContent(null)}>✕</button>
            </header>
            <div className={styles.modalBody}>
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <label>SEO Title</label>
                  <p>{selectedContent.seoTitle}</p>
                </div>
                <div className={styles.metaItem}>
                  <label>Keywords</label>
                  <p>{selectedContent.keywords?.join(', ')}</p>
                </div>
              </div>
              <div className={styles.contentArea}>
                <label>Generated Content</label>
                <div className={styles.markdown}>
                  <ReactMarkdown>{selectedContent.generatedContent}</ReactMarkdown>
                </div>
              </div>
              <div className={styles.metaItem}>
                <label>Image Prompt</label>
                <p className={styles.promptText}>{selectedContent.imagePrompt}</p>
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <button className={styles.secondaryBtn} onClick={() => copyToClipboard(selectedContent.generatedContent)}>
                <Copy size={16} /> Copy Content
              </button>
              <button className={styles.primaryBtn}>
                <ExternalLink size={16} /> View in Notion
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedContent;
