import styles from './client.module.css'

export default function ClientDashboard() {
  const clientName = 'Cliente Teste'
  const projectName = 'Vídeo Institucional'
  const scripts = [
    {
      id: 1,
      title: 'Introdução',
      description: 'Apresentação inicial da marca',
      status: 'Aguardando aprovação',
      lastUpdate: '2026-08-02',
    },
    {
      id: 2,
      title: 'Proposta de Valor',
      description: 'Explicação sobre diferenciais',
      status: 'Aprovado',
      lastUpdate: '2026-08-01',
    },
    {
      id: 3,
      title: 'Encerramento',
      description: 'Call to action e fechamento',
      status: 'Pendente de edição',
      lastUpdate: '2026-07-31',
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.welcome}>
        <h1>Seja bem-vindo<span className={styles.accent}>,</span></h1>
        <p className={styles.clientName}>{clientName}</p>
        <p className={styles.subtitle}>Seu projeto <em>{projectName}</em> na LUMMIE</p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>01</span>
          <h2>Seus Roteiros</h2>
        </div>

        <div className={styles.scriptsGrid}>
          {scripts.map((script) => (
            <div key={script.id} className={styles.scriptCard}>
              <div className={styles.scriptHeader}>
                <h3>{script.title}</h3>
                <span className={`${styles.scriptStatus} ${styles[script.status.replace(/ /g, '-').toLowerCase()]}`}>
                  {script.status}
                </span>
              </div>
              <p className={styles.scriptDescription}>{script.description}</p>
              <div className={styles.scriptFooter}>
                <small>Atualizado em {new Date(script.lastUpdate).toLocaleDateString('pt-BR')}</small>
                <button className={styles.viewBtn}>Visualizar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>02</span>
          <h2>Documentos do Projeto</h2>
        </div>
        <p className={styles.placeholder}>Seus documentos aparecerão aqui em breve.</p>
      </div>
    </div>
  )
}
