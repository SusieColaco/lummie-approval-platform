'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './client.module.css'

export default function ClientDashboard() {
  const clientName = 'Cliente Teste'
  const projectName = 'Vídeo Institucional'

  const allScripts = [
    { id: 1, title: 'Introdução', description: 'Apresentação inicial', status: 'Aguardando aprovação', month: '2026-09' },
    { id: 2, title: 'Proposta de Valor', description: 'Diferenciais', status: 'Aprovado', month: '2026-09' },
    { id: 3, title: 'Encerramento', description: 'Call to action', status: 'Pendente de edição', month: '2026-09' },
    { id: 4, title: 'Depoimento', description: 'Cliente falando', status: 'Gravados', month: '2026-08' },
    { id: 5, title: 'Produto', description: 'Showcase', status: 'Aprovado', month: '2026-08' },
  ]

  const monthsWithScripts = [...new Set(allScripts.map(s => s.month))].sort().reverse()
  const [selectedMonth, setSelectedMonth] = useState(monthsWithScripts[0])

  const monthsScripts = allScripts.filter(s => s.month === selectedMonth)
  const statuses = ['Aguardando aprovação', 'Aprovado', 'Gravados', 'Pendente de edição']

  const formatMonth = (m: string) => {
    const [year, month] = m.split('-')
    return new Date(m + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

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
          <h2>Documentação</h2>
        </div>
        <p className={styles.docHint}>Acesse Brand Book, Raio-X e Briefing do projeto</p>
        <Link href="/client/project/1" className={styles.docLink}>
          📄 Ver Arquivos →
        </Link>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>02</span>
          <h2>Seus Roteiros</h2>
        </div>

        <div className={styles.monthSelector}>
          <label htmlFor="month-select">Selecione o mês</label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={styles.monthSelect}
          >
            {monthsWithScripts.map(m => (
              <option key={m} value={m}>{formatMonth(m)}</option>
            ))}
          </select>
        </div>

        <div className={styles.kanban}>
          {statuses.map(status => (
            <div key={status} className={styles.kanbanColumn}>
              <h3 className={styles.columnTitle}>{status}</h3>
              <div className={styles.columnContent}>
                {monthsScripts
                  .filter(s => s.status === status)
                  .map(script => (
                    <Link
                      key={script.id}
                      href={`/client/project/1/script/${script.id}`}
                      className={`${styles.scriptCard} ${styles[status.replace(/ /g, '-').toLowerCase()]}`}
                    >
                      <p className={styles.scriptTitle}>{script.title}</p>
                      <p className={styles.scriptDesc}>{script.description}</p>
                      <p className={styles.scriptAction}>Comentar →</p>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
