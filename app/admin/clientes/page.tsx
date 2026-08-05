'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './clientes.module.css'

interface Client {
  id: number
  name: string
  email: string
  project_type: string
  token: string
  created_at: string
}

export default function ClientesAdmin() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch('/api/clients')
        if (!response.ok) throw new Error('Erro ao carregar clientes')
        const data = await response.json()
        setClients(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [])

  const copyLink = (token: string) => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/client?token=${token}`
    navigator.clipboard.writeText(link)
    alert('Link copiado!')
  }

  if (loading) return <div style={{ padding: '20px' }}>Carregando...</div>

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Meus Clientes</h1>
        <Link href="/admin/clientes/novo" style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: '#000',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          marginTop: '16px'
        }}>
          + Novo Cliente
        </Link>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {clients.length === 0 ? (
        <p style={{ color: '#999' }}>Nenhum cliente cadastrado ainda.</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {clients.map(client => (
            <div key={client.id} style={{
              padding: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>{client.name}</h3>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#666' }}>{client.email}</p>
                <p style={{ margin: '0', fontSize: '14px', color: '#999' }}>
                  Tipo: <strong>{client.project_type}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => copyLink(client.token)}
                  style={{
                    padding: '8px 16px',
                    background: '#f0f0f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copiar Link
                </button>
                <Link href={`/admin/clientes/${client.id}`} style={{
                  padding: '8px 16px',
                  background: '#000',
                  color: '#fff',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}>
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
