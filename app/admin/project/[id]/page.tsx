'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './project-detail.module.css'

interface Project {
  id: number
  name: string
  client_name: string
  client_email: string
  status: string
}

interface Script {
  id: number
  title: string
  status: string
  content: string
}

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [projectRes, scriptsRes] = await Promise.all([
          fetch(`/api/projects/${params.id}`),
          fetch(`/api/projects/${params.id}/scripts`),
        ])

        if (!projectRes.ok || !scriptsRes.ok) {
          throw new Error('Erro ao carregar dados')
        }

        const projectData = await projectRes.json()
        const scriptsData = await scriptsRes.json()

        setProject(projectData)
        setScripts(scriptsData || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  if (loading) return <div className={styles.container}><p>Carregando...</p></div>
  if (!project) return <div className={styles.container}><p>Projeto não encontrado</p></div>

  const clientLink = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/client?token=${project.id}`

  return (
    <div className={styles.container}>
      <Link href="/admin" className={styles.back}>← Voltar</Link>

      {error && <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#fee', color: '#c33', borderRadius: '4px' }}>{error}</div>}

      <div className={styles.header}>
        <div>
          <h1>{project.name}</h1>
          <p className={styles.subtitle}>Cliente: <strong>{project.client_name}</strong></p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.status}>{project.status}</span>
          <Link href={`/admin/project/${project.id}/edit`} className={styles.editBtn} title="Editar projeto">
            ✏️
          </Link>
          <Link href={`/admin/project/${project.id}/share`} className={styles.shareBtn} title="Compartilhar com cliente">
            📤
          </Link>
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
              <p>{project.client_name}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Email</label>
              <p>{project.client_email}</p>
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
            <h2>Arquivos</h2>
            <Link href={`/admin/project/${project.id}/files`} className={styles.addBtn}>
              📄 Gerenciar
            </Link>
          </div>
          <p className={styles.fileHint}>Brand Book, Raio-X e Briefing</p>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.label}>03</span>
            <h2>Roteiros</h2>
            <Link href={`/admin/project/${project.id}/script/new`} className={styles.addBtn}>
              + Adicionar
            </Link>
          </div>

          <div className={styles.scriptsList}>
            {scripts.length > 0 ? (
              scripts.map((script) => (
                <div key={script.id} className={styles.scriptItem}>
                  <div className={styles.scriptItemHeader}>
                    <h3>{script.title}</h3>
                    <span className={`${styles.scriptStatus} ${styles[script.status.replace(/ /g, '-').toLowerCase()]}`}>
                      {script.status}
                    </span>
                  </div>
                  <p className={styles.scriptItemPreview}>{script.content.substring(0, 100)}...</p>
                  <div className={styles.scriptItemActions}>
                    <Link href={`/admin/project/${project.id}/script/${script.id}`} className={styles.editLink}>
                      Editar
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#666' }}>Nenhum roteiro criado ainda. Clique em "+ Adicionar" para começar.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
