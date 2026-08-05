'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import styles from './client.module.css'

export const dynamic = 'force-dynamic'

interface Client {
  id: number
  name: string
  email: string
  project_type: string
}

interface Script {
  id: number
  title: string
  status: string
}

export default function ClientDashboard() {
  return (
    <Suspense fallback={<div className={styles.container}><p>Carregando...</p></div>}>
      <ClientDashboardContent />
    </Suspense>
  )
}

function ClientDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [client, setClient] = useState<Client | null>(null)
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Acesso inválido. Link expirou ou inválido.')
      setLoading(false)
      return
    }

    async function loadData() {
      try {
        const clientRes = await fetch(`/api/clients?token=${token}`)

        if (!clientRes.ok) throw new Error('Cliente não encontrado')

        const clientsData = await clientRes.json()
        const clientData = clientsData[0]

        if (!clientData) throw new Error('Cliente não encontrado')

        // Buscar roteiros do cliente
        const scriptsRes = await fetch(`/api/clients/${clientData.id}/scripts`)
        const scriptsData = await scriptsRes.ok ? await scriptsRes.json() : []

        setClient(clientData)
        setScripts(scriptsData || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [token])

  if (loading) {
    return <div className={styles.container}><p>Carregando...</p></div>
  }

  if (error || !client) {
    return (
      <div className={styles.container}>
        <p style={{ color: '#c33', fontSize: '18px' }}>⚠️ {error || 'Acesso inválido'}</p>
        <p style={{ marginTop: '16px' }}>O link de acesso pode ter expirado ou estar incorreto.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.welcome}>
        <h1>Seja bem-vindo<span className={styles.accent}>,</span></h1>
        <p className={styles.clientName}>{client.name}</p>
        <p className={styles.subtitle}>Seu projeto <em>{client.project_type}</em> na LUMMIE</p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>01</span>
          <h2>Seus Roteiros</h2>
        </div>

        {scripts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {scripts.map(script => (
              <Link
                key={script.id}
                href={`/client/script/${script.id}?token=${token}`}
                style={{
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>{script.title}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Status: {script.status}</div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999', fontStyle: 'italic' }}>Nenhum roteiro ainda. Aguarde atualizações do projeto.</p>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>02</span>
          <h2>Documentação</h2>
        </div>
        <p className={styles.docHint}>Brand Book, Raio-X e Briefing em breve por aqui.</p>
      </div>
    </div>
  )
}
