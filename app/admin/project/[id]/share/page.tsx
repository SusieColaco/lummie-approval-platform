'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './share.module.css'

export default function ShareProjectPage({ params }: { params: { id: string } }) {
  const projectId = params.id
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lummie-approval-platform.vercel.app'
  const clientLink = `${baseUrl}/client/project/${projectId}`
  const [copied, setCopied] = useState(false)

  function copyToClipboard() {
    navigator.clipboard.writeText(clientLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.container}>
      <Link href={`/admin/project/${projectId}`} className={styles.back}>← Voltar</Link>

      <div className={styles.shareBox}>
        <div className={styles.header}>
          <h1>Compartilhar com Cliente</h1>
          <p>Envie este link para seu cliente acessar o projeto</p>
        </div>

        <div className={styles.linkSection}>
          <div className={styles.linkBox}>
            <input
              type="text"
              value={clientLink}
              readOnly
              className={styles.linkInput}
            />
            <button onClick={copyToClipboard} className={styles.copyBtn}>
              {copied ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>

          <div className={styles.instructions}>
            <h3>📋 Como funciona:</h3>
            <ol>
              <li>Clique em "Copiar" para copiar o link</li>
              <li>Envie o link para seu cliente</li>
              <li>Cliente acessa o link e pode visualizar arquivos</li>
              <li>Cliente deixa feedback e comentários</li>
              <li>Feedback é salvo automaticamente</li>
            </ol>
          </div>

          <div className={styles.preview}>
            <h3>👀 O que o cliente vê:</h3>
            <ul>
              <li>Documentação (Brand Book, Raio-X, Briefing)</li>
              <li>Roteiros para revisar</li>
              <li>Opção de deixar feedback e comentários</li>
              <li>Upload de áudio (opcional)</li>
            </ul>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={copyToClipboard} className={styles.primaryBtn}>
            {copied ? '✓ Link Copiado!' : '📋 Copiar Link'}
          </button>
          <Link href={`/admin/project/${projectId}`} className={styles.cancelBtn}>Voltar</Link>
        </div>
      </div>
    </div>
  )
}
