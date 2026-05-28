import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import styles from './MainLayout.module.css';
import useStore from '../store/useStore';
import { Menu } from 'lucide-react';

const MainLayout = () => {
  const { sidebarOpen, toggleSidebar } = useStore();

  return (
    <div className={styles.layout}>
      <div className={`${styles.sidebarWrapper} ${sidebarOpen ? styles.open : ''}`}>
        <Sidebar />
        <div className={styles.overlay} onClick={toggleSidebar}></div>
      </div>
      
      <div className={`${styles.mainContent} ${sidebarOpen ? styles.withSidebar : ''}`}>
        <Navbar />
        <main className={styles.content}>
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>
      </div>
      
      <button className={styles.mobileMenuBtn} onClick={toggleSidebar}>
        <Menu size={24} />
      </button>
    </div>
  );
};

export default MainLayout;
