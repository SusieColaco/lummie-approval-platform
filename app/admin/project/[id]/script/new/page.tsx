'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createScript } from '@/lib/supabase'
import styles from '../script.module.css'

export default function NewScript({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createScript(Number(params.id), formData.title, formData.content)
      window.location.href = `/admin/project/${params.id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar roteiro')
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className={styles.container}>
      <Link href={`/admin/project/${params.id}`} className={styles.back}>← Voltar</Link>

      <div className={styles.header}>
        <h1>Novo Roteiro</h1>
        <p className={styles.subtitle}>Projeto ID: {params.id}</p>
      </div>

      {error && <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#fee', color: '#c33', borderRadius: '4px' }}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Título do Roteiro</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="ex: Introdução, Proposta de Valor..."
            required
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content">Conteúdo do Roteiro</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Digite aqui o conteúdo do roteiro..."
            rows={12}
            required
            disabled={loading}
          />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Roteiro'}
          </button>
          <Link href={`/admin/project/${params.id}`} className={styles.cancelBtn}>Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
