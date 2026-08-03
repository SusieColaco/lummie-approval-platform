import Link from 'next/link'
import styles from './ClientNav.module.css'

export default function ClientNav() {
  return (
    <nav className={styles.nav}>
      <Link href="/client" className={styles.logo}>
        <span>LUMMIE</span>
        <span className={styles.dot}>.</span>
      </Link>
      <p className={styles.subtitle}>Plataforma de Aprovação</p>
    </nav>
  )
}
