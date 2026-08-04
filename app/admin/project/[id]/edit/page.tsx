'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getProject, updateProject } from '@/lib/supabase'
import styles from './edit.module.css'

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const projectId = parseInt(params.id)
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    clientEmail: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProject()
  }, [projectId])

  async function loadProject() {
    try {
      const project = await getProject(projectId)
      setFormData({
        name: project.name,
        clientName: project.client_name,
        clientEmail: project.client_email,
      })
    } catch (err: any) {
      setError(`Erro ao carregar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!formData.name || !formData.clientName || !formData.clientEmail) {
        setError('Preencha todos os campos')
        setSaving(false)
        return
      }

      await updateProject(projectId, formData.name, formData.clientName, formData.clientEmail)
      router.push('/admin')
    } catch (err: any) {
      setError(`Erro ao salvar: ${err.message}`)
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '20px' }}>Carregando...</div>

  return (
    <div className={styles.container}>
      <Link href={`/admin/project/${projectId}`} className={styles.back}>← Voltar</Link>

      <div className={styles.header}>
        <h1>Editar Projeto</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Nome do Projeto *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            disabled={saving}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Nome do Cliente *</label>
          <input
            type="text"
            value={formData.clientName}
            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
            disabled={saving}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Email do Cliente *</label>
          <input
            type="email"
            value={formData.clientEmail}
            onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
            disabled={saving}
            required
          />
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={saving} className={styles.submitBtn}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <Link href={`/admin/project/${projectId}`} className={styles.cancelBtn}>Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
