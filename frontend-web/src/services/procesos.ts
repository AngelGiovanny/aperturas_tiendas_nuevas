// frontend-web/src/services/procesos.ts

import api from './api';
import { Proceso, CheckItem, ApiResponse } from "@/types";
import toast from "react-hot-toast"

export const procesoService = {
    // ============= MÉTODOS EXISTENTES =============

    getProcesosByTienda: async (tiendaId: string) => {
        try {
            const response = await api.get<ApiResponse<Proceso[]>>(`/procesos/tienda/${tiendaId}`)
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Error al cargar procesos')
        }
    },

    getProceso: async (id: string) => {
        try {
            const response = await api.get<ApiResponse<Proceso>>(`/procesos/${id}`)
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Error al cargar proceso')
        }
    },

    updateProceso: async (id: string, procesoData: Partial<Proceso>) => {
        try {
            const response = await api.put(`/procesos/${id}`, procesoData)
            toast.success('Proceso actualizado')
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Error al actualizar proceso')
        }
    },

    addChecklistItem: async (procesoId: string, itemData: Partial<CheckItem>) => {
        try {
            const response = await api.post(`/procesos/${procesoId}/checklist`, itemData)
            toast.success('Item agregado')
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Error al agregar item')
        }
    },

    validateChecklistItem: async (procesoId: string, itemId: string, observaciones?: string) => {
        try {
            const response = await api.put(
                `/procesos/${procesoId}/checklist/${itemId}/validate`,
                { observaciones }
            )
            toast.success('Item validado')
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Error al validar item')
        }
    },

    uploadAttachment: async (procesoId: string, itemId: string, file: File) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await api.post(
                `/procesos/${procesoId}/checklist/${itemId}/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            )
            toast.success('Archivo subido')
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Error al subir archivo')
        }
    },

    getMyProcesos: async () => {
        try {
            const response = await api.get<ApiResponse<Proceso[]>>('/procesos/mis-procesos')
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Error al cargar procesos')
        }
    },

    // ============= NUEVOS MÉTODOS PARA EL FLUJO COMPLETO =============

    crearProceso: async (procesoData: any) => {
        try {
            const response = await api.post('/procesos', procesoData)
            toast.success('Proceso creado correctamente')
            return response.data
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al crear proceso'
            toast.error(errorMsg)
            throw new Error(errorMsg)
        }
    },

    getConfiguracionProceso: async (id: string) => {
        try {
            const response = await api.get<ApiResponse<any>>(`/procesos/${id}/configuracion`)
            return response.data
        } catch (error: any) {
            console.error('Error obteniendo configuración:', error)
            throw new Error(error.response?.data?.error || 'Error al cargar configuración')
        }
    },

    iniciarProceso: async (id: string) => {
        try {
            const response = await api.put<ApiResponse<Proceso>>(`/procesos/${id}/iniciar`)
            toast.success('Proceso iniciado correctamente')
            return response.data
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al iniciar proceso'
            toast.error(errorMsg)
            throw new Error(errorMsg)
        }
    },

    actualizarChecklist: async (id: string, checklist: any[]) => {
        try {
            const response = await api.put<ApiResponse<Proceso>>(`/procesos/${id}/checklist`, { checklist })
            toast.success('Checklist actualizado')
            return response.data
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al actualizar checklist'
            toast.error(errorMsg)
            throw new Error(errorMsg)
        }
    },

    pasarARevision: async (id: string) => {
        try {
            const response = await api.put<ApiResponse<Proceso>>(`/procesos/${id}/revision`)
            toast.success('Proceso enviado a revisión')
            return response.data
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al pasar a revisión'
            toast.error(errorMsg)
            throw new Error(errorMsg)
        }
    },

    // 👇 NUEVA FUNCIÓN: Continuar revisión (pendiente_aprobacion -> en_revision)
    continuarRevision: async (id: string) => {
        try {
            const response = await api.put<ApiResponse<Proceso>>(`/procesos/${id}/continuar-revision`)
            toast.success('Proceso devuelto a revisión')
            return response.data
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al continuar revisión'
            toast.error(errorMsg)
            throw new Error(errorMsg)
        }
    },

    finalizarProceso: async (id: string) => {
        try {
            const response = await api.put<ApiResponse<Proceso>>(`/procesos/${id}/finalizar`)
            toast.success('Proceso finalizado correctamente')
            return response.data
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al finalizar proceso'
            toast.error(errorMsg)
            throw new Error(errorMsg)
        }
    },

    validarMultiplesItems: async (id: string, itemsIds: string[]) => {
        try {
            const promises = itemsIds.map(itemId =>
                api.put(`/procesos/${id}/checklist/${itemId}/validate`, {})
            )
            await Promise.all(promises)
            toast.success(`${itemsIds.length} items validados`)
            return { success: true }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al validar items'
            toast.error(errorMsg)
            throw new Error(errorMsg)
        }
    },

    getProcesosFiltrados: async (filters?: {
        estado?: string,
        area?: string,
        tiendaId?: string,
        fechaInicio?: string,
        fechaFin?: string
    }) => {
        try {
            const params = new URLSearchParams()
            if (filters?.estado) params.append('estado', filters.estado)
            if (filters?.area) params.append('area', filters.area)
            if (filters?.tiendaId) params.append('tienda', filters.tiendaId)
            if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio)
            if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin)

            const response = await api.get<ApiResponse<Proceso[]>>('/procesos', { params })
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Error al cargar procesos')
        }
    },

    getEstadisticas: async () => {
        try {
            const response = await api.get('/procesos/estadisticas')
            return response.data
        } catch (error: any) {
            console.error('Error obteniendo estadísticas:', error)
            throw new Error(error.response?.data?.error || 'Error al cargar estadísticas')
        }
    }
}