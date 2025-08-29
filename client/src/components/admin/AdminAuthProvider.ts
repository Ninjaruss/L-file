import { AuthProvider } from 'react-admin'
import { api } from '../../lib/api'

export const AdminAuthProvider: AuthProvider = {
  login: async ({ username, password }) => {
    try {
      const response = await api.login(username, password)
      
      // Check if user has admin or moderator role
      if (response.user.role !== 'admin' && response.user.role !== 'moderator') {
        throw new Error('Access denied. Admin or moderator role required.')
      }

      localStorage.setItem('auth', JSON.stringify(response.user))
      return Promise.resolve()
    } catch (error: any) {
      return Promise.reject(new Error(error.message || 'Login failed'))
    }
  },

  logout: async () => {
    try {
      await api.logout()
    } catch (error) {
      // Ignore logout errors
    }
    localStorage.removeItem('auth')
    return Promise.resolve()
  },

  checkAuth: async () => {
    try {
      const user = await api.getCurrentUser()
      
      if (user.role !== 'admin' && user.role !== 'moderator') {
        throw new Error('Access denied')
      }

      return Promise.resolve()
    } catch (error) {
      localStorage.removeItem('auth')
      return Promise.reject(new Error('Not authenticated'))
    }
  },

  checkError: (error) => {
    const status = error.status
    if (status === 401 || status === 403) {
      localStorage.removeItem('auth')
      return Promise.reject()
    }
    return Promise.resolve()
  },

  getIdentity: async () => {
    try {
      const user = await api.getCurrentUser()
      return Promise.resolve({
        id: user.id,
        fullName: user.username,
        avatar: undefined,
      })
    } catch (error) {
      return Promise.reject(error)
    }
  },

  getPermissions: async () => {
    try {
      const user = await api.getCurrentUser()
      return Promise.resolve(user.role)
    } catch (error) {
      return Promise.reject(error)
    }
  },
}