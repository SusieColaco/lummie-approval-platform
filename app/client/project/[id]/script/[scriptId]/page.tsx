'use client'

import Link from 'next/link'
import { useState } from 'react'
import { saveFeedback } from '@/lib/supabase'
import styles from './client-script.module.css'

export default function ClientViewScript({
  params
}: {
  params: { id: string; scriptId: string }
}) {
  const scripts: Record<string, { title: string; content: string; status: string }> = {
    '1': {
      title: 'Introdução',
      content: 'Aqui entra o texto do roteiro...',
      status: 'Aguardando aprovação'
    },
    '2': {
      title: 'Proposta de Valor',
      content: 'Aqui entra o texto do roteiro...',
      status: 'Aprovado'
    },
    '3': {
      title: 'Encerramento',
      content: 'Aqui entra o texto do roteiro...',
      status: 'Pendente de edição'
    },
  }

  const script = scripts[params.scriptId] || { title: '', content: '', status: '' }

  const [formData, setFormData] = useState({
    notes: '',
    audioFile: null as File | null,
    status: script.status === 'Aprovado' ? 'aprovado' : script.status === 'Pendente de edição' ? 'alteracao' : 'padrao',
  })

  const [audioPreview, setAudioPreview] = useState<string>('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, notes: e.target.value }))
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, status: e.target.value }))
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, audioFile: file }))
      setAudioPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)

    try {
      const statusMap: Record<string, 'aprovado' | 'reprovado' | 'alteracao'> = {
        'aprovado': 'aprovado',
        'reprovado': 'reprovado',
        'alteracao': 'alteracao',
      }

      await saveFeedback(
        parseInt(params.scriptId),
        parseInt(params.id),
        statusMap[formData.status] || 'alteracao',
        formData.notes
      )
    } catch (error) {
      console.error('Erro ao salvar feedback:', error)
    }

    setTimeout(() => {
      window.location.href = `/client/project/${params.id}`
    }, 1500)
  }

  const statusOptions = [
    { value: 'aprovado', label: '✓ Aprovado', color: '#4ade80' },
    { value: 'reprovado', label: '✗ Reprovado', color: '#ef4444' },
    { value: 'alteracao', label: '⋯ Com Alteração Solicitada', color: '#f97316' },
  ]

  return (
    <div className={styles.container}>
      <Link href={`/client/project/${params.id}`} className={styles.back}>← Voltar</Link>

      <div className={styles.scriptHeader}>
        <div>
          <h1>{script.title}</h1>
          <p className={styles.subtitle}>Roteiro #{params.scriptId}</p>
        </div>
      </div>

      <div className={styles.scriptContent}>
        <div className={styles.contentBox}>
          <h3>Conteúdo do Roteiro</h3>
          <p>{script.content}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.feedbackForm}>
        <h2>Suas Observações</h2>

        <div className={styles.formGroup}>
          <label htmlFor="status">Status de Aprovação</label>
          <select
            id="status"
            value={formData.status}
            onChange={handleStatusChange}
            className={styles.statusSelect}
          >
            <option value="padrao">Selecione um status...</option>
            <option value="aprovado">✓ Aprovado</option>
            <option value="reprovado">✗ Reprovado</option>
            <option value="alteracao">⋯ Com Alteração Solicitada</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="notes">Anotações e Comentários</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={handleNoteChange}
            placeholder="Deixe aqui suas observações, sugestões ou detalhes sobre o que precisa ser alterado..."
            rows={8}
            className={styles.notesArea}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="audio">Enviar Áudio (opcional)</label>
          <div className={styles.audioInput}>
            <input
              id="audio"
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              className={styles.audioFile}
            />
            <span className={styles.audioLabel}>
              {formData.audioFile ? `📁 ${formData.audioFile.name}` : '🎙️ Clique para selecionar áudio'}
            </span>
          </div>
          {audioPreview && (
            <div className={styles.audioPreview}>
              <audio controls src={audioPreview} />
            </div>
          )}
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitted}>
            {isSubmitted ? '✓ Enviado!' : 'Enviar Feedback'}
          </button>
          <Link href={`/client/project/${params.id}`} className={styles.cancelBtn}>Voltar</Link>
        </div>
      </form>
    </div>
  )
}
