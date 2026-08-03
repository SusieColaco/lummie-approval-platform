'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from '../script.module.css'

export default function EditScript({
  params
}: {
  params: { id: string; scriptId: string }
}) {
  const scripts: Record<string, { title: string; content: string }> = {
    '1': { title: 'Introdução', content: 'Aqui entra o texto do roteiro...' },
    '2': { title: 'Proposta de Valor', content: 'Aqui entra o texto do roteiro...' },
    '3': { title: 'Encerramento', content: 'Aqui entra o texto do roteiro...' },
  }

  const script = scripts[params.scriptId] || { title: '', content: '' }
  const [formData, setFormData] = useState({
    title: script.title,
    content: script.content,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Save to database
    console.log('Updated script:', formData)
    window.location.href = `/admin/project/${params.id}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className={styles.container}>
      <Link href={`/admin/project/${params.id}`} className={styles.back}>← Voltar</Link>

      <div className={styles.header}>
        <h1>Editar Roteiro</h1>
        <p className={styles.subtitle}>Script #{params.scriptId}</p>
      </div>

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
          />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn}>Salvar Alterações</button>
          <Link href={`/admin/project/${params.id}`} className={styles.cancelBtn}>Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
