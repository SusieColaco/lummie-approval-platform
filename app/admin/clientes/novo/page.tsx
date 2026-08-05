'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from '../clientes.module.css'

export default function NovoCliente() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    project_type: 'pontual',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Erro ao criar cliente')

      window.location.href = '/admin/clientes'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Link href="/admin/clientes" style={{ color: '#000', textDecoration: 'none' }}>← Voltar</Link>

      <h1 style={{ marginTop: '24px' }}>Novo Cliente</h1>

      {error && (
        <div style={{ padding: '12px', background: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nome do Cliente *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: ACME Corp"
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="cliente@example.com"
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Tipo de Projeto *</label>
          <select
            name="project_type"
            value={formData.project_type}
            onChange={handleChange}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          >
            <option value="pontual">Pontual (one-time)</option>
            <option value="mensal">Mensal (recorrente)</option>
            <option value="semanal">Semanal (recorrente)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Criando...' : 'Criar Cliente'}
          </button>
          <Link href="/admin/clientes" style={{
            padding: '12px 24px',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center'
          }}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
