'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './client-project.module.css'

interface ProjectFile {
  type: 'brand_book' | 'raio_x' | 'briefing'
  name: string
  size: number
  uploadedAt: string
}

const FILE_LABELS: Record<string, string> = {
  brand_book: 'Brand Book',
  raio_x: 'Raio-X',
  briefing: 'Briefing',
}

export default function ClientProjectPage() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // Mock de arquivos (depois virá do Supabase)
  const mockFiles: ProjectFile[] = [
    {
      type: 'brand_book',
      name: 'Brand_Book_LUMMIE.pdf',
      size: 5.2,
      uploadedAt: '2026-08-03',
    },
    {
      type: 'raio_x',
      name: 'Raio_X_Projeto.pdf',
      size: 2.8,
      uploadedAt: '2026-08-02',
    },
    {
      type: 'briefing',
      name: 'Briefing_Executivo.pdf',
      size: 1.5,
      uploadedAt: '2026-08-01',
    },
  ]

  return (
    <div className={styles.container}>
      <Link href="/client" className={styles.back}>← Voltar aos Projetos</Link>

      <div className={styles.header}>
        <h1>Documentação do Projeto</h1>
        <p className={styles.subtitle}>Acesse os arquivos do seu projeto</p>
      </div>

      <div className={styles.fileGrid}>
        {mockFiles.map((file) => (
          <div key={file.type} className={styles.fileCard}>
            <h3 className={styles.fileType}>{FILE_LABELS[file.type]}</h3>

            <div className={styles.fileInfo}>
              <div className={styles.fileName}>{file.name}</div>
              <div className={styles.fileSize}>{file.size} MB</div>
              <div className={styles.fileDate}>
                {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className={styles.fileActions}>
              <button
                className={styles.viewBtn}
                onClick={() => setSelectedFile(file.type)}
              >
                Visualizar
              </button>
              <a href="#download" className={styles.downloadBtn}>
                Baixar
              </a>
            </div>
          </div>
        ))}
      </div>

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
