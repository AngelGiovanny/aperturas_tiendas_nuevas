// services/usuariosService.ts
import axios from 'axios'
import { User } from '@/types'

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

export const usuariosService = {
    // ✅ Obtiene TODOS los usuarios usando all=true
    getAll: async (): Promise<User[]> => {
        console.log('📡 Llamando a GET /users?all=true')
        try {
            const response = await api.get('/users', {
                params: { all: 'true' }
            })
            console.log('📥 Respuesta completa:', response.data)

            if (response.data?.success && Array.isArray(response.data.data)) {
                console.log(`✅ Usuarios recibidos: ${response.data.data.length}`)
                return response.data.data
            }

            if (Array.isArray(response.data)) {
                console.log(`✅ Usuarios recibidos (array): ${response.data.length}`)
                return response.data
            }

            if (response.data?.data && Array.isArray(response.data.data)) {
                console.log(`✅ Usuarios recibidos (data): ${response.data.data.length}`)
                return response.data.data
            }

            console.warn('⚠️ Formato de respuesta no reconocido:', response.data)
            return []
        } catch (error) {
            console.error('❌ Error en getAll:', error)
            throw error
        }
    },

    getById: async (id: string): Promise<User> => {
        console.log(`📡 Llamando a GET /users/${id}`)
        try {
            const response = await api.get(`/users/${id}`)
            if (response.data?.success) {
                return response.data.data
            }
            return response.data
        } catch (error) {
            console.error(`❌ Error en getById ${id}:`, error)
            throw error
        }
    },

    create: async (data: Partial<User>): Promise<User> => {
        console.log('📡 Creando usuario:', { nombre: data.nombre, email: data.email, role: data.role })
        try {
            const response = await api.post('/users', data)
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

    update: async (id: string, data: Partial<User>): Promise<User> => {
        console.log(`📡 Actualizando usuario ${id}:`, { nombre: data.nombre, email: data.email, role: data.role, tienePassword: !!data.password })
        try {
            const response = await api.put(`/users/${id}`, data)
            if (response.data?.success) {
                return response.data.data
            }
            return response.data
        } catch (error) {
            console.error(`❌ Error en update ${id}:`, error)
            throw error
        }
    },

    // ✅ NUEVO MÉTODO: Restablecer contraseña
    resetPassword: async (id: string, nuevaPassword: string): Promise<void> => {
        console.log(`📡 Restableciendo contraseña para usuario ${id}`)
        try {
            const response = await api.post(`/users/${id}/reset-password`, { nuevaPassword })
            console.log('📥 Respuesta resetPassword:', response.data)
            if (!response.data?.success) {
                throw new Error(response.data?.error || 'Error al restablecer contraseña')
            }
        } catch (error) {
            console.error(`❌ Error en resetPassword ${id}:`, error)
            throw error
        }
    },

    delete: async (id: string): Promise<void> => {
        console.log(`📡 Eliminando usuario ${id}`)
        try {
            await api.delete(`/users/${id}`)
            console.log(`✅ Usuario ${id} eliminado`)
        } catch (error) {
            console.error(`❌ Error en delete ${id}:`, error)
            throw error
        }
    },
};