// Simple admin authentication
const ADMIN_PASSWORD = 'lummie2024'

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('admin_auth') === 'true'
}

export function loginAdmin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem('admin_auth', 'true')
    return true
  }
  return false
}

export function logoutAdmin() {
  localStorage.removeItem('admin_auth')
}
