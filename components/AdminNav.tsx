import Link from 'next/link'
import styles from './AdminNav.module.css'

interface AdminNavProps {
  onLogout?: () => void
}

export default function AdminNav({ onLogout }: AdminNavProps) {
  return (
    <nav className={styles.nav}>
      <Link href="/admin" className={styles.logo}>
        <span>LUMMIE</span>
        <span className={styles.dot}>.</span>
      </Link>

      <div className={styles.menu}>
        <Link href="/admin" className={styles.menuItem}>
          <span className={styles.label}>01</span>
          Projetos
        </Link>
        <Link href="/admin/clients" className={styles.menuItem}>
          <span className={styles.label}>02</span>
          Clientes
        </Link>
        <Link href="/admin/settings" className={styles.menuItem}>
          <span className={styles.label}>03</span>
          Configurações
        </Link>
      </div>

      <div className={styles.footer}>
        <p>v0.1.0</p>
        {onLogout && (
          <button onClick={onLogout} className={styles.logoutBtn}>
            Sair
          </button>
        )}
      </div>
    </nav>
  )
}
