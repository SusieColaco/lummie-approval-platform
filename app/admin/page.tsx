'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getAllProjects, deleteProject } from '@/lib/supabase'
import styles from './admin.module.css'

interface Project {
  id: number
  name: string
  status: string
  client_name: string
  created_at: string
  updated_at: string
}

export default function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await getAllProjects()
      setProjects(data || [])
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(projectId: number, projectName: string) {
    if (!confirm(`Tem certeza que deseja deletar "${projectName}"?`)) return

    try {
      await deleteProject(projectId)
      setProjects(projects.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('Erro ao deletar projeto:', error)
      alert('Erro ao deletar projeto')
    }
  }

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

      {loading ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Carregando...</p>
      ) : (
        <>
          <div className={styles.projectsGrid}>
            {projects.map((project) => (
              <div key={project.id} className={styles.projectCard}>
                <Link href={`/admin/project/${project.id}`} className={styles.cardLink}>
                  <div className={styles.cardHeader}>
                    <h3>{project.name}</h3>
                    <span className={styles.status}>{project.status}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <p><strong>Cliente:</strong> {project.client_name}</p>
                    <p><strong>Atualizado:</strong> {new Date(project.updated_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.linkText}>Abrir projeto →</span>
                  </div>
                </Link>
                <div className={styles.cardActions}>
                  <Link href={`/admin/project/${project.id}/edit`} className={styles.editBtn} title="Editar">
                    ✏️
                  </Link>
                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    className={styles.deleteBtn}
                    title="Deletar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
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
        </>
      )}
    </div>
  )
}
