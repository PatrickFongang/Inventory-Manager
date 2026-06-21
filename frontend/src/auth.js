const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin'
const AUTH_KEY = 'inventory-admin-auth'

export function isAdminAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === 'true'
}

export function loginAdmin(password) {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, 'true')
    return true
  }
  return false
}

export function logoutAdmin() {
  sessionStorage.removeItem(AUTH_KEY)
}
