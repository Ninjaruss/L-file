import { DataProvider, HttpError } from 'react-admin'
import { api } from '../../lib/api'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const AdminDataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 20 }
    const { field, order } = params.sort || { field: 'id', order: 'ASC' }
    const query = {
      page: page.toString(),
      limit: perPage.toString(),
      sort: field,
      order: order,
      ...params.filter,
    }

    try {
      const response = await api.get<any>(`/${resource}?${new URLSearchParams(query).toString()}`)
      
      return {
        data: (response.data || []).map((item: any) => ({ ...item, id: item.id })),
        total: response.total || 0,
      }
    } catch (error: any) {
      throw new HttpError(error.message, error.status || 500)
    }
  },

  getOne: async (resource, params) => {
    try {
      const response = await api.get<any>(`/${resource}/${params.id}`)
      return { data: { ...response, id: response.id } as any }
    } catch (error: any) {
      throw new HttpError(error.message, error.status || 500)
    }
  },

  getMany: async (resource, params) => {
    try {
      const responses = await Promise.all(
        params.ids.map((id) => api.get<any>(`/${resource}/${id}`))
      )
      return { data: responses.map((response, index) => ({ ...response, id: params.ids[index] })) as any[] }
    } catch (error: any) {
      throw new HttpError(error.message, error.status || 500)
    }
  },

  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 20 }
    const { field, order } = params.sort || { field: 'id', order: 'ASC' }
    const query = {
      page: page.toString(),
      limit: perPage.toString(),
      sort: field,
      order: order,
      [params.target]: params.id.toString(),
      ...params.filter,
    }

    try {
      const response = await api.get<any>(`/${resource}?${new URLSearchParams(query).toString()}`)
      
      return {
        data: (response.data || []).map((item: any) => ({ ...item, id: item.id })),
        total: response.total || 0,
      }
    } catch (error: any) {
      throw new HttpError(error.message, error.status || 500)
    }
  },

  create: async (resource, params) => {
    try {
      const response = await api.post<any>(`/${resource}`, params.data)
      return { data: { ...response, id: response.id } as any }
    } catch (error: any) {
      throw new HttpError(error.message, error.status || 500)
    }
  },

  update: async (resource, params) => {
    try {
      await api.put(`/${resource}/${params.id}`, params.data)
      return { data: { ...params.data, id: params.id } as any }
    } catch (error: any) {
      throw new HttpError(error.message, error.status || 500)
    }
  },

  updateMany: async (resource, params) => {
    try {
      await Promise.all(
        params.ids.map((id) => api.put(`/${resource}/${id}`, params.data))
      )
      return { data: params.ids }
    } catch (error: any) {
      throw new HttpError(error.message, error.status || 500)
    }
  },

  delete: async (resource, params) => {
    try {
      await api.delete(`/${resource}/${params.id}`)
      return { data: params.previousData as any }
    } catch (error: any) {
      throw new HttpError(error.message, error.status || 500)
    }
  },

  deleteMany: async (resource, params) => {
    try {
      await Promise.all(
        params.ids.map((id) => api.delete(`/${resource}/${id}`))
      )
      return { data: params.ids }
    } catch (error: any) {
      throw new HttpError(error.message, error.status || 500)
    }
  },
}