'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import styles from './client-project.module.css'

interface ProjectFile {
  id: number
  name: string
  file_path: string
  type: 'brand_book' | 'raio_x' | 'briefing'
  file_size: number
  uploaded_at: string
}

interface Script {
  id: number
  title: string
  status: string
}

const FILE_LABELS: Record<string, string> = {
  brand_book: 'Brand Book',
  raio_x: 'Raio-X',
  briefing: 'Briefing',
}

export default function ClientProjectPage({ params }: { params: { id: string } }) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [filesRes, scriptsRes] = await Promise.all([
          fetch(`/api/projects/${params.id}/files`),
          fetch(`/api/projects/${params.id}/scripts`),
        ])

        if (!filesRes.ok || !scriptsRes.ok) {
          throw new Error('Erro ao carregar dados do projeto')
        }

        const filesData = await filesRes.json()
        const scriptsData = await scriptsRes.json()

        setFiles(filesData || [])
        setScripts(scriptsData || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  if (loading) {
    return <div className={styles.container}><p>Carregando...</p></div>
  }

  return (
    <div className={styles.container}>
      <Link href="/client" className={styles.back}>← Voltar aos Projetos</Link>

      <div className={styles.header}>
        <h1>Documentação do Projeto</h1>
        <p className={styles.subtitle}>Acesse os arquivos do seu projeto</p>
      </div>

      {error && <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#fee', color: '#c33', borderRadius: '4px' }}>{error}</div>}

      {files.length > 0 && (
        <>
          <h2 style={{ marginTop: '32px', marginBottom: '16px' }}>Arquivos</h2>
          <div className={styles.fileGrid}>
            {files.map((file) => (
              <div key={file.id} className={styles.fileCard}>
                <h3 className={styles.fileType}>{FILE_LABELS[file.type]}</h3>

                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>{(file.file_size / 1024 / 1024).toFixed(2)} MB</div>
                  <div className={styles.fileDate}>
                    {new Date(file.uploaded_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className={styles.fileActions}>
                  <button
                    className={styles.viewBtn}
                    onClick={() => setSelectedFile(file.file_path)}
                  >
                    Visualizar
                  </button>
                  <a href={`/api/download/${file.file_path}`} className={styles.downloadBtn}>
                    Baixar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {scripts.length > 0 && (
        <>
          <h2 style={{ marginTop: '32px', marginBottom: '16px' }}>Roteiros</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {scripts.map((script) => (
              <Link
                key={script.id}
                href={`/client/project/${params.id}/script/${script.id}`}
                style={{
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ fontWeight: 500 }}>{script.title}</div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>Status: {script.status}</div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Preview Modal */}
      {selectedFile && (
        <div className={styles.modal} onClick={() => setSelectedFile(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedFile(null)}
            >
              ✕
            </button>

            <div className={styles.pdfPreview}>
              <div className={styles.pdfPlaceholder}>
                <div className={styles.pdfIcon}>📄</div>
                <p>Visualizador de PDF</p>
                <p className={styles.pdfHint}>
                  (será implementado com react-pdf)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
