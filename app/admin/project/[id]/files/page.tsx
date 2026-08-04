'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { uploadFile, saveFileReference, getProjectFiles, deleteFile } from '@/lib/supabase'
import styles from './files.module.css'

type FileType = 'brand_book' | 'raio_x' | 'briefing'

interface ProjectFile {
  id: number
  type: FileType
  name: string
  file_size: number
  uploaded_at: string
  file_path: string
}

const FILE_TYPES: Record<FileType, { label: string; description: string }> = {
  brand_book: { label: 'Brand Book', description: 'Identidade visual e diretrizes' },
  raio_x: { label: 'Raio-X', description: 'Análise da empresa/projeto' },
  briefing: { label: 'Briefing', description: 'Briefing do projeto' },
}

export default function AdminFilesPage({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id)
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [uploading, setUploading] = useState<FileType | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadFiles()
  }, [projectId])

  async function loadFiles() {
    try {
      const data = await getProjectFiles(projectId)
      setFiles(data || [])
    } catch (err) {
      console.error('Erro ao carregar arquivos:', err)
      setError('Erro ao carregar arquivos')
    }
  }

  async function handleUpload(
    e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>,
    fileType: FileType
  ) {
    e.preventDefault()
    const file = 'dataTransfer' in e ? e.dataTransfer.files[0] : e.target.files?.[0]

    if (!file || !file.type.includes('pdf')) {
      setError('Por favor, selecione um arquivo PDF')
      return
    }

    setUploading(fileType)
    setError('')

    try {
      // Upload para Storage
      const { path, size, name } = await uploadFile(
        projectId.toString(),
        fileType,
        file
      )

      // Salvar referência no banco
      await saveFileReference(projectId, fileType, path, name, size, 'admin@lummie.com')

      // Recarregar arquivos
      await loadFiles()
    } catch (err: any) {
      setError(`Erro ao enviar: ${err.message}`)
    } finally {
      setUploading(null)
    }
  }

  async function handleDelete(filePath: string) {
    if (!confirm('Deseja deletar este arquivo?')) return

    try {
      await deleteFile(filePath)
      await loadFiles()
    } catch (err: any) {
      setError(`Erro ao deletar: ${err.message}`)
    }
  }

  const getFileByType = (type: FileType) => files.find(f => f.type === type)

  return (
    <div className={styles.container}>
      <Link href={`/admin/project/${projectId}`} className={styles.back}>
        ← Voltar
      </Link>

      <div className={styles.header}>
        <h1>Gerenciar Arquivos</h1>
        <p className={styles.subtitle}>Projeto ID: {projectId}</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        {(Object.entries(FILE_TYPES) as [FileType, any][]).map(([type, { label, description }]) => {
          const existingFile = getFileByType(type)
          const isUploading = uploading === type

          return (
            <div key={type} className={styles.fileCard}>
              <div className={styles.cardHeader}>
                <h3>{label}</h3>
                <p className={styles.description}>{description}</p>
              </div>

              {existingFile ? (
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>📄 {existingFile.name}</div>
                  <div className={styles.fileSize}>
                    {(existingFile.file_size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div className={styles.fileDate}>
                    {new Date(existingFile.uploaded_at).toLocaleDateString('pt-BR')}
                  </div>
                  <div className={styles.fileActions}>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(existingFile.file_path)}
                    >
                      🗑️ Deletar
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className={`${styles.uploadArea} ${isUploading ? styles.uploading : ''}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleUpload(e, type)}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleUpload(e, type)}
                    disabled={isUploading}
                    className={styles.fileInput}
                  />
                  <div className={styles.uploadIcon}>📤</div>
                  <div className={styles.uploadText}>
                    {isUploading ? 'Enviando...' : 'Arraste o PDF aqui'}
                  </div>
                  <div className={styles.uploadHint}>ou clique para selecionar</div>
                </label>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
