import Link from 'next/link'
import styles from './project-detail.module.css'

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const project = {
    id: params.id,
    name: 'Cliente Teste LUMMIE',
    client: 'Cliente Teste',
    email: 'cliente@teste.com',
    status: 'Em andamento',
    scripts: [
      {
        id: 1,
        title: 'Introdução',
        status: 'Aguardando aprovação',
        content: 'Aqui entra o texto do roteiro...',
      },
      {
        id: 2,
        title: 'Proposta de Valor',
        status: 'Aprovado',
        content: 'Aqui entra o texto do roteiro...',
      },
      {
        id: 3,
        title: 'Encerramento',
        status: 'Pendente de edição',
        content: 'Aqui entra o texto do roteiro...',
      },
    ],
  }

  const clientLink = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/client?token=${project.id}`

  return (
    <div className={styles.container}>
      <Link href="/admin" className={styles.back}>← Voltar</Link>

      <div className={styles.header}>
        <div>
          <h1>{project.name}</h1>
          <p className={styles.subtitle}>Cliente: <strong>{project.client}</strong></p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.status}>{project.status}</span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.label}>01</span>
            <h2>Informações do Projeto</h2>
          </div>

          <div className={styles.infoBox}>
            <div className={styles.infoItem}>
              <label>Cliente</label>
              <p>{project.client}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Email</label>
              <p>{project.email}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Link de Acesso</label>
              <div className={styles.linkBox}>
                <code>{clientLink}</code>
                <button className={styles.copyBtn}>Copiar</button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.label}>02</span>
            <h2>Roteiros</h2>
            <Link href={`/admin/project/${project.id}/script/new`} className={styles.addBtn}>
              + Adicionar
            </Link>
          </div>

          <div className={styles.scriptsList}>
            {project.scripts.map((script) => (
              <div key={script.id} className={styles.scriptItem}>
                <div className={styles.scriptItemHeader}>
                  <h3>{script.title}</h3>
                  <span className={`${styles.scriptStatus} ${styles[script.status.replace(/ /g, '-').toLowerCase()]}`}>
                    {script.status}
                  </span>
                </div>
                <p className={styles.scriptItemPreview}>{script.content}</p>
                <div className={styles.scriptItemActions}>
                  <Link href={`/admin/project/${project.id}/script/${script.id}`} className={styles.editLink}>
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
