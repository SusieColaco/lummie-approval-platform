'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createProject } from '@/lib/supabase'
import styles from './new-project.module.css'

export default function NewProject() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    clientEmail: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.projectName || !formData.clientName || !formData.clientEmail) {
        setError('Preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }

      await createProject(formData.projectName, formData.clientName, formData.clientEmail)
      router.push('/admin')
    } catch (err: any) {
      setError(`Erro ao criar projeto: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <Link href="/admin" className={styles.back}>← Voltar</Link>

      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Novo Projeto</h1>
          <p>Crie um novo projeto para compartilhar com seu cliente</p>
        </div>

        {error && <div style={{color: '#c33', background: '#fee', padding: '12px', borderRadius: '4px', marginBottom: '20px'}}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="projectName">Nome do Projeto *</label>
            <input
              type="text"
              id="projectName"
              value={formData.projectName}
              onChange={(e) => setFormData({...formData, projectName: e.target.value})}
              placeholder="Ex: Vídeo Institucional"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clientName">Nome do Cliente *</label>
            <input
              type="text"
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              placeholder="Ex: Cliente Teste LUMMIE"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clientEmail">Email do Cliente *</label>
            <input
              type="email"
              id="clientEmail"
              value={formData.clientEmail}
              onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
              placeholder="cliente@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Projeto'}
            </button>
            <Link href="/admin" className={styles.cancelBtn}>Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
