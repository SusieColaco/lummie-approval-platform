'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { saveFeedback } from '@/lib/supabase'
import styles from './client-script.module.css'

interface Script {
  id: number
  client_id: number
  title: string
  content: string
  status: string
}

const STATUS_LABEL: Record<string, string> = {
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  alteracao: 'Pendente de edição',
}

export default function ClientViewScript({
  params
}: {
  params: { scriptId: string }
}) {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [script, setScript] = useState<Script | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState('padrao')
  const [notes, setNotes] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioPreview, setAudioPreview] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    async function loadScript() {
      try {
        const response = await fetch(`/api/scripts/${params.scriptId}`)
        if (!response.ok) throw new Error('Roteiro não encontrado')
        const data = await response.json()
        setScript(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar roteiro')
      } finally {
        setLoading(false)
      }
    }

    loadScript()
  }, [params.scriptId])

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
      setAudioPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!script) return

    setSubmitError(null)

    const statusMap: Record<string, 'aprovado' | 'reprovado' | 'alteracao'> = {
      aprovado: 'aprovado',
      reprovado: 'reprovado',
      alteracao: 'alteracao',
    }

    if (!statusMap[status]) {
      setSubmitError('Selecione um status de aprovação')
      return
    }

    setIsSubmitted(true)

    try {
      await saveFeedback(script.id, script.client_id, statusMap[status], notes)

      await fetch(`/api/scripts/${script.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: STATUS_LABEL[status] }),
      })

      setTimeout(() => {
        window.location.href = `/client?token=${token}`
      }, 1500)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao enviar feedback')
      setIsSubmitted(false)
    }
  }

  if (loading) {
    return <div className={styles.container}><p>Carregando...</p></div>
  }

  if (error || !script) {
    return (
      <div className={styles.container}>
        <Link href={`/client?token=${token}`} className={styles.back}>← Voltar</Link>
        <p style={{ color: '#c33' }}>{error || 'Roteiro não encontrado'}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Link href={`/client?token=${token}`} className={styles.back}>← Voltar</Link>

      <div className={styles.scriptHeader}>
        <div>
          <h1>{script.title}</h1>
          <p className={styles.subtitle}>Status atual: {script.status}</p>
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

        {submitError && <p style={{ color: '#c33', marginBottom: '16px' }}>{submitError}</p>}

        <div className={styles.formGroup}>
          <label htmlFor="status">Status de Aprovação</label>
          <select
            id="status"
            value={status}
            onChange={e => setStatus(e.target.value)}
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
            value={notes}
            onChange={e => setNotes(e.target.value)}
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
              {audioFile ? `📁 ${audioFile.name}` : '🎙️ Clique para selecionar áudio'}
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
          <Link href={`/client?token=${token}`} className={styles.cancelBtn}>Voltar</Link>
        </div>
      </form>
    </div>
  )
}
