import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Key, 
  BarChart3, 
  Share2, 
  Settings, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import styles from './Sidebar.module.css';
import useStore from '../store/useStore';

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useStore();

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/content', icon: <FileText size={20} />, label: 'Content' },
    { path: '/api-keys', icon: <Key size={20} />, label: 'API Keys' },
    { path: '/notion', icon: <Share2 size={20} />, label: 'Notion' },
    { path: '/logs', icon: <Activity size={20} />, label: 'Logs' },
  ];

  return (
    <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
      <div className={styles.logoContainer}>
        <div className={styles.logo}>
          <Zap size={24} className={styles.logoIcon} />
          <span className={styles.logoText}>AI Content</span>
        </div>
        <button className={styles.toggleBtn} onClick={toggleSidebar}>
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.proCard}>
          <Zap size={16} />
          <span>Production Ready</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
