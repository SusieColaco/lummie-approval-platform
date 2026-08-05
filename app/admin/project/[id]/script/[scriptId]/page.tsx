'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { updateScript, deleteScript } from '@/lib/supabase'
import styles from '../script.module.css'

interface Script {
  id: number
  title: string
  content: string
  status: string
}

export default function EditScript({
  params
}: {
  params: { id: string; scriptId: string }
}) {
  const [script, setScript] = useState<Script | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadScript() {
      try {
        const response = await fetch(`/api/scripts/${params.scriptId}`)
        if (!response.ok) throw new Error('Erro ao carregar roteiro')
        const data = await response.json()
        setScript(data)
        setFormData({ title: data.title, content: data.content })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar roteiro')
      } finally {
        setLoading(false)
      }
    }

    loadScript()
  }, [params.scriptId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await updateScript(Number(params.scriptId), formData.title, formData.content, script?.status || 'Aguardando aprovação')
      window.location.href = `/admin/project/${params.id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar roteiro')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este roteiro?')) return

    setSaving(true)
    setError(null)

    try {
      await deleteScript(Number(params.scriptId))
      window.location.href = `/admin/project/${params.id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar roteiro')
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) return <div className={styles.container}><p>Carregando...</p></div>
  if (!script) return <div className={styles.container}><p>Roteiro não encontrado</p></div>

  return (
    <div className={styles.container}>
      <Link href={`/admin/project/${params.id}`} className={styles.back}>← Voltar</Link>

      <div className={styles.header}>
        <h1>Editar Roteiro</h1>
        <p className={styles.subtitle}>Script #{params.scriptId}</p>
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
            disabled={saving}
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
            disabled={saving}
          />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button type="button" className={styles.deleteBtn} onClick={handleDelete} disabled={saving}>
            Deletar
          </button>
          <Link href={`/admin/project/${params.id}`} className={styles.cancelBtn}>Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
