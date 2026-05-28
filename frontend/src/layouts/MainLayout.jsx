import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import styles from './MainLayout.module.css';
import useStore from '../store/useStore';

const MainLayout = () => {
  const { sidebarOpen } = useStore();

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={`${styles.mainContent} ${!sidebarOpen ? styles.expanded : ''}`}>
        <Navbar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
