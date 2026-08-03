import Link from 'next/link'
import styles from './new-project.module.css'

export default function NewProject() {
  return (
    <div className={styles.container}>
      <Link href="/admin" className={styles.back}>← Voltar</Link>

      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Novo Projeto</h1>
          <p>Crie um novo projeto para compartilhar com seu cliente</p>
        </div>

        <form className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="projectName">Nome do Projeto</label>
            <input
              type="text"
              id="projectName"
              placeholder="Ex: Vídeo Institucional"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clientName">Nome do Cliente</label>
            <input
              type="text"
              id="clientName"
              placeholder="Ex: Cliente Teste LUMMIE"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clientEmail">Email do Cliente</label>
            <input
              type="email"
              id="clientEmail"
              placeholder="cliente@example.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Descrição do Projeto</label>
            <textarea
              id="description"
              placeholder="Descreva o projeto..."
              rows={4}
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.submitBtn}>Criar Projeto</button>
            <Link href="/admin" className={styles.cancelBtn}>Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
