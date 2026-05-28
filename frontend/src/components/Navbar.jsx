import { Sun, Moon, Search, Bell, User } from 'lucide-react';
import styles from './Navbar.module.css';
import useStore from '../store/useStore';

const Navbar = () => {
  const { theme, toggleTheme } = useStore();

  return (
    <header className={styles.navbar}>
      <div className={styles.search}>
        <Search size={18} className={styles.searchIcon} />
        <input type="text" placeholder="Search anything..." className={styles.searchInput} />
      </div>

      <div className={styles.actions}>
        <button className={styles.iconBtn} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className={styles.iconBtn}>
          <Bell size={20} />
          <span className={styles.badge}></span>
        </button>
        <div className={styles.profile}>
          <div className={styles.avatar}>
            <User size={20} />
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.name}>Admin User</span>
            <span className={styles.role}>Architect</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
