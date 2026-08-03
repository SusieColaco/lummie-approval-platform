import AdminNav from '@/components/AdminNav'
import '@/app/admin/admin.css'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      <AdminNav />
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
