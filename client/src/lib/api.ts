const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token)
      } else {
        localStorage.removeItem('accessToken')
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(typeof options.headers === 'object' && options.headers ? options.headers as Record<string, string> : {}),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // Auth methods
  async login(username: string, password: string) {
    const response = await this.post<{
      access_token: string
      user: {
        id: number
        username: string
        email: string
        role: string
        isEmailVerified: boolean
        userProgress: number
      }
    }>('/auth/login', { username, password })
    
    this.setToken(response.access_token)
    return response
  }

  async register(username: string, email: string, password: string) {
    return this.post<{ message: string; userId: string }>('/auth/register', {
      username,
      email,
      password,
    })
  }

  async logout() {
    try {
      await this.post('/auth/logout', {})
    } finally {
      this.setToken(null)
    }
  }

  async getCurrentUser() {
    return this.get<{
      id: number
      username: string
      email: string
      role: string
      isEmailVerified: boolean
      userProgress: number
    }>('/auth/me')
  }

  async refreshToken() {
    const response = await this.post<{
      access_token: string
      user: any
    }>('/auth/refresh', {})
    
    this.setToken(response.access_token)
    return response
  }

  // Content methods
  async getCharacters(params?: {
    page?: number
    limit?: number
    name?: string
    arc?: string
    series?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/characters${query ? `?${query}` : ''}`)
  }

  async getCharacter(id: number) {
    return this.get<any>(`/characters/${id}`)
  }

  async getArcs(params?: {
    page?: number
    limit?: number
    name?: string
    series?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/arcs${query ? `?${query}` : ''}`)
  }

  async getArc(id: number) {
    return this.get<any>(`/arcs/${id}`)
  }

  async getGambles(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/gambles${query ? `?${query}` : ''}`)
  }

  async getGamble(id: number) {
    return this.get<any>(`/gambles/${id}`)
  }

  async getEvents(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/events${query ? `?${query}` : ''}`)
  }

  async getEvent(id: number) {
    return this.get<any>(`/events/${id}`)
  }

  async search(query: string, type?: string, userProgress?: number) {
    const params = new URLSearchParams({ query })
    if (type) params.append('type', type)
    if (userProgress !== undefined) params.append('userProgress', userProgress.toString())
    
    return this.get<{
      results: Array<{
        id: number
        type: string
        title: string
        description: string
        score: number
        hasSpoilers: boolean
        slug: string
        metadata?: any
      }>
      total: number
      page: number
      perPage: number
      totalPages: number
    }>(`/search?${params.toString()}`)
  }

  async getGuides(params?: { page?: number; limit?: number; title?: string }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const query = searchParams.toString()
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/guides${query ? `?${query}` : ''}`)
  }

  async getGuide(id: number) {
    return this.get<any>(`/guides/${id}`)
  }

  async createGuide(data: {
    title: string
    content: string
    tags?: string[]
  }) {
    return this.post<any>('/guides', data)
  }

  async submitMedia(data: {
    url: string
    characterId?: number
    arcId?: number
    description?: string
  }) {
    return this.post<any>('/media', data)
  }

  async updateProfile(data: {
    favoriteQuoteId?: number
    favoriteGambleId?: number
  }) {
    return this.put<any>('/users/profile', data)
  }
}

export const api = new ApiClient(API_BASE_URL)

export default api