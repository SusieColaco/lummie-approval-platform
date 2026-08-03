import Link from 'next/link'
import styles from './admin.module.css'

export default function AdminDashboard() {
  const projects = [
    {
      id: 1,
      name: 'Cliente Teste LUMMIE',
      status: 'Em andamento',
      scripts: 3,
      client: 'Cliente Teste',
      lastUpdate: '2026-08-03',
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Meus Projetos</h1>
          <p className={styles.subtitle}>Gerencie seus projetos e compartilhe com clientes</p>
        </div>
        <Link href="/admin/project/new" className={styles.newProjectBtn}>
          <span>+ Novo Projeto</span>
        </Link>
      </div>

      <div className={styles.projectsGrid}>
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/admin/project/${project.id}`}
            className={styles.projectCard}
          >
            <div className={styles.cardHeader}>
              <h3>{project.name}</h3>
              <span className={styles.status}>{project.status}</span>
            </div>
            <div className={styles.cardBody}>
              <p><strong>Cliente:</strong> {project.client}</p>
              <p><strong>Roteiros:</strong> {project.scripts}</p>
              <p><strong>Atualizado:</strong> {new Date(project.lastUpdate).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.linkText}>Abrir projeto →</span>
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className={styles.emptyState}>
          <p>Nenhum projeto criado ainda.</p>
          <Link href="/admin/project/new" className={styles.emptyStateLink}>
            Crie seu primeiro projeto
          </Link>
        </div>
      )}
    </div>
  )
}
