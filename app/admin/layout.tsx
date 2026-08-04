'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AdminNav from '@/components/AdminNav'
import { isAdminAuthenticated, logoutAdmin } from '@/lib/auth'
import '@/app/admin/admin.css'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuth, setIsAuth] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = isAdminAuthenticated()
    setIsAuth(auth)
    setLoading(false)

    if (!auth && !pathname.includes('/admin/login')) {
      router.push('/admin/login')
    }
  }, [pathname, router])

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>
  }

  if (!isAuth && !pathname.includes('/admin/login')) {
    return null
  }

  if (pathname.includes('/admin/login')) {
    return <>{children}</>
  }

  return (
    <div className="admin-layout">
      <AdminNav onLogout={() => {
        logoutAdmin()
        router.push('/admin/login')
      }} />
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
