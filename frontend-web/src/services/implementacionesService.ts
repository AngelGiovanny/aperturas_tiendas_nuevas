// services/implementacionesService.ts
import axios from 'axios'
import { Implementacion, CrearImplementacionDTO } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export const implementacionesService = {
    getAll: async (params?: { estado?: string }): Promise<Implementacion[]> => {
        console.log('📡 Llamando a GET /implementaciones', params)
        try {
            const response = await api.get('/implementaciones', { params })
            console.log('📥 Respuesta recibida:', response.data)
            // ✅ Manejar formato { success: true, data: [...] }
            if (response.data?.success && Array.isArray(response.data.data)) {
                return response.data.data
            }
            return response.data
        } catch (error) {
            console.error('❌ Error en getAll:', error)
            throw error
        }
    },

    getById: async (id: string): Promise<Implementacion> => {
        console.log(`📡 Llamando a GET /implementaciones/${id}`)
        try {
            const response = await api.get(`/implementaciones/${id}`)
            if (response.data?.success) {
                return response.data.data
            }
            return response.data
        } catch (error) {
            console.error(`❌ Error en getById ${id}:`, error)
            throw error
        }
    },

    create: async (data: CrearImplementacionDTO): Promise<Implementacion> => {
        console.log('📡 Creando implementación:', data)
        try {
            const response = await api.post('/implementaciones', data)
            console.log('📥 Respuesta create:', response.data)
            if (response.data?.success) {
                return response.data.data
            }
            return response.data
        } catch (error: any) {
            console.error('❌ Error en create:', error.response?.data || error.message)
            throw error
        }
    },

    update: async (id: string, data: Partial<CrearImplementacionDTO>): Promise<Implementacion> => {
        console.log(`📡 Actualizando implementación ${id}:`, data)
        try {
            const response = await api.put(`/implementaciones/${id}`, data)
            if (response.data?.success) {
                return response.data.data
            }
            return response.data
        } catch (error) {
            console.error(`❌ Error en update ${id}:`, error)
            throw error
        }
    },

    delete: async (id: string): Promise<void> => {
        console.log(`📡 Eliminando implementación ${id}`)
        try {
            await api.delete(`/implementaciones/${id}`)
            console.log(`✅ Implementación ${id} eliminada`)
        } catch (error) {
            console.error(`❌ Error en delete ${id}:`, error)
            throw error
        }
    },

    cambiarEstado: async (id: string, estado: string): Promise<Implementacion> => {
        console.log(`📡 Cambiando estado de ${id} a ${estado}`)
        try {
            const response = await api.patch(`/implementaciones/${id}/estado`, { estado })
            if (response.data?.success) {
                return response.data.data
            }
            return response.data
        } catch (error) {
            console.error(`❌ Error en cambiarEstado ${id}:`, error)
            throw error
        }
    },

    asignarTecnico: async (id: string, tecnicoId: string): Promise<Implementacion> => {
        console.log(`📡 Asignando técnico ${tecnicoId} a implementación ${id}`)
        try {
            const response = await api.patch(`/implementaciones/${id}/asignar-tecnico`, { tecnicoId })
            if (response.data?.success) {
                return response.data.data
            }
            return response.data
        } catch (error) {
            console.error(`❌ Error en asignarTecnico ${id}:`, error)
            throw error
        }
    },
}