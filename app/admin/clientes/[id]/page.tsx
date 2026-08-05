'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './cliente-detalhes.module.css'

interface Client {
  id: number
  name: string
  email: string
  project_type: string
  token: string
  created_at: string
  updated_at: string
}

interface Demand {
  id: number
  client_id: number
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

interface Script {
  id: number
  client_id: number
  demand_id: number | null
  title: string
  content: string
  status: string
  created_at: string
  updated_at: string
}

type Tab = 'info' | 'demandas' | 'roteiros' | 'docs'

export default function ClienteDetalhes({ params }: { params: { id: string } }) {
  const clientId = Number(params.id)
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [client, setClient] = useState<Client | null>(null)
  const [demands, setDemands] = useState<Demand[]>([])
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [editingClient, setEditingClient] = useState(false)
  const [clientForm, setClientForm] = useState({ name: '', email: '', project_type: '' })
  const [newDemand, setNewDemand] = useState({ title: '', description: '' })
  const [newScript, setNewScript] = useState({ title: '', content: '', demand_id: '' })
  const [showDemandForm, setShowDemandForm] = useState(false)
  const [showScriptForm, setShowScriptForm] = useState(false)

  // Load client
  useEffect(() => {
    async function loadClient() {
      try {
        setLoading(true)
        const response = await fetch(`/api/clients/${clientId}`)
        if (!response.ok) throw new Error('Erro ao carregar cliente')
        const data = await response.json()
        setClient(data)
        setClientForm({
          name: data.name,
          email: data.email,
          project_type: data.project_type,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    loadClient()
  }, [clientId])

  // Load demands and scripts
  useEffect(() => {
    async function loadData() {
      try {
        const [demandsRes, scriptsRes] = await Promise.all([
          fetch(`/api/demands?client_id=${clientId}`),
          fetch(`/api/scripts?client_id=${clientId}`),
        ])

        if (demandsRes.ok) {
          const demandsData = await demandsRes.json()
          setDemands(demandsData)
        }

        if (scriptsRes.ok) {
          const scriptsData = await scriptsRes.json()
          setScripts(scriptsData)
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      }
    }

    loadData()
  }, [clientId])

  const handleUpdateClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm),
      })

      if (!response.ok) throw new Error('Erro ao atualizar cliente')
      const updated = await response.json()
      setClient(updated)
      setEditingClient(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
    }
  }

  const handleCreateDemand = async () => {
    if (!newDemand.title.trim()) {
      setError('Título da demanda é obrigatório')
      return
    }

    try {
      const response = await fetch('/api/demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          title: newDemand.title,
          description: newDemand.description,
          status: 'pendente',
        }),
      })

      if (!response.ok) throw new Error('Erro ao criar demanda')
      const demand = await response.json()
      setDemands([demand, ...demands])
      setNewDemand({ title: '', description: '' })
      setShowDemandForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar demanda')
    }
  }

  const handleCreateScript = async () => {
    if (!newScript.title.trim()) {
      setError('Título do roteiro é obrigatório')
      return
    }

    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          demand_id: newScript.demand_id ? Number(newScript.demand_id) : null,
          title: newScript.title,
          content: newScript.content,
          status: 'Aguardando aprovação',
        }),
      })

      if (!response.ok) throw new Error('Erro ao criar roteiro')
      const script = await response.json()
      setScripts([script, ...scripts])
      setNewScript({ title: '', content: '', demand_id: '' })
      setShowScriptForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar roteiro')
    }
  }

  const handleDeleteDemand = async (demandId: number) => {
    if (!confirm('Tem certeza que deseja deletar esta demanda?')) return

    try {
      const response = await fetch(`/api/demands/${demandId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao deletar')
      setDemands(demands.filter(d => d.id !== demandId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar')
    }
  }

  const handleDeleteScript = async (scriptId: number) => {
    if (!confirm('Tem certeza que deseja deletar este roteiro?')) return

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao deletar')
      setScripts(scripts.filter(s => s.id !== scriptId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar')
    }
  }

  if (loading) return <div className={styles.container}>Carregando...</div>
  if (!client) return <div className={styles.container}>Cliente não encontrado</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/clientes" className={styles.backLink}>← Voltar</Link>
        <h1>{client.name}</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tabs}>
        {(['info', 'demandas', 'roteiros', 'docs'] as const).map(tab => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'info' && 'Informações'}
            {tab === 'demandas' && 'Demandas'}
            {tab === 'roteiros' && 'Roteiros'}
            {tab === 'docs' && 'Documentos'}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className={styles.section}>
          {editingClient ? (
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nome</label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tipo de Projeto</label>
                <select
                  value={clientForm.project_type}
                  onChange={e => setClientForm({ ...clientForm, project_type: e.target.value })}
                >
                  <option value="Pontual">Pontual</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Semanal">Semanal</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button onClick={handleUpdateClient} className={styles.primary}>Salvar</button>
                <button onClick={() => setEditingClient(false)} className={styles.secondary}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <strong>Nome:</strong> {client.name}
              </div>
              <div className={styles.infoRow}>
                <strong>Email:</strong> {client.email}
              </div>
              <div className={styles.infoRow}>
                <strong>Tipo:</strong> {client.project_type}
              </div>
              <div className={styles.infoRow}>
                <strong>Token:</strong> <code>{client.token}</code>
              </div>
              <div className={styles.infoRow}>
                <strong>Link do Cliente:</strong> <code>{typeof window !== 'undefined' ? `${window.location.origin}/client?token=${client.token}` : ''}</code>
              </div>
              <button onClick={() => setEditingClient(true)} className={styles.primary}>
                ✏️ Editar
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'demandas' && (
        <div className={styles.section}>
          <div className={styles.header}>
            <h2>Demandas</h2>
            <button onClick={() => setShowDemandForm(!showDemandForm)} className={styles.primary}>
              + Nova Demanda
            </button>
          </div>

          {showDemandForm && (
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Título</label>
                <input
                  type="text"
                  placeholder="Ex: Produção de vídeo"
                  value={newDemand.title}
                  onChange={e => setNewDemand({ ...newDemand, title: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Descrição</label>
                <textarea
                  placeholder="Descrição da demanda..."
                  value={newDemand.description}
                  onChange={e => setNewDemand({ ...newDemand, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className={styles.formActions}>
                <button onClick={handleCreateDemand} className={styles.primary}>Criar</button>
                <button onClick={() => setShowDemandForm(false)} className={styles.secondary}>Cancelar</button>
              </div>
            </div>
          )}

          <div className={styles.list}>
            {demands.length === 0 ? (
              <p className={styles.empty}>Nenhuma demanda cadastrada</p>
            ) : (
              demands.map(demand => (
                <div key={demand.id} className={styles.item}>
                  <div>
                    <h4>{demand.title}</h4>
                    {demand.description && <p className={styles.desc}>{demand.description}</p>}
                    <small className={styles.status}>Status: {demand.status}</small>
                  </div>
                  <button
                    onClick={() => handleDeleteDemand(demand.id)}
                    className={styles.danger}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'roteiros' && (
        <div className={styles.section}>
          <div className={styles.header}>
            <h2>Roteiros</h2>
            <button onClick={() => setShowScriptForm(!showScriptForm)} className={styles.primary}>
              + Novo Roteiro
            </button>
          </div>

          {showScriptForm && (
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Título</label>
                <input
                  type="text"
                  placeholder="Ex: Roteiro do vídeo 1"
                  value={newScript.title}
                  onChange={e => setNewScript({ ...newScript, title: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Demanda Relacionada (opcional)</label>
                <select
                  value={newScript.demand_id}
                  onChange={e => setNewScript({ ...newScript, demand_id: e.target.value })}
                >
                  <option value="">Nenhuma</option>
                  {demands.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Conteúdo</label>
                <textarea
                  placeholder="Conteúdo do roteiro..."
                  value={newScript.content}
                  onChange={e => setNewScript({ ...newScript, content: e.target.value })}
                  rows={6}
                />
              </div>
              <div className={styles.formActions}>
                <button onClick={handleCreateScript} className={styles.primary}>Criar</button>
                <button onClick={() => setShowScriptForm(false)} className={styles.secondary}>Cancelar</button>
              </div>
            </div>
          )}

          <div className={styles.list}>
            {scripts.length === 0 ? (
              <p className={styles.empty}>Nenhum roteiro cadastrado</p>
            ) : (
              scripts.map(script => (
                <div key={script.id} className={styles.item}>
                  <div>
                    <h4>{script.title}</h4>
                    {script.demand_id && (
                      <small className={styles.demand}>
                        Demanda: {demands.find(d => d.id === script.demand_id)?.title}
                      </small>
                    )}
                    {script.content && <p className={styles.desc}>{script.content.substring(0, 100)}...</p>}
                    <small className={styles.status}>Status: {script.status}</small>
                  </div>
                  <button
                    onClick={() => handleDeleteScript(script.id)}
                    className={styles.danger}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className={styles.section}>
          <h2>Documentos</h2>
          <p className={styles.empty}>Gerenciamento de documentos em desenvolvimento</p>
        </div>
      )}
    </div>
  )
}
