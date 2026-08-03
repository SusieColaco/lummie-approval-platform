import ClientNav from '@/components/ClientNav'
import '@/app/client/client.css'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="client-layout">
      <ClientNav />
      <main className="client-main">
        {children}
      </main>
    </div>
  )
}
