import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>LUMMIE<span className={styles.gold}>.</span></h1>
          <p className={styles.subtitle}>Plataforma de Aprovação de Projetos</p>
        </div>

        <div className={styles.cards}>
          <Link href="/admin" className={styles.card}>
            <span className={styles.label}>01</span>
            <h2>Painel de Administrador</h2>
            <p>Crie projetos, adicione roteiros e acompanhe aprovações</p>
          </Link>

          <Link href="/client" className={styles.card}>
            <span className={styles.label}>02</span>
            <h2>Acesso para Clientes</h2>
            <p>Visualize roteiros, comente e aprove seu projeto</p>
          </Link>
        </div>

        <footer className={styles.footer}>
          <p>© 2026 LUMMIE Studio · Luz que revela</p>
        </footer>
      </div>
    </main>
  )
}
