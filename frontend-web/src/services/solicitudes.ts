import api from './api';

export interface Solicitud {
    _id?: string
    tiendaId: string
    tipo: 'punto_emision' | 'codigo_comercio'
    itemId?: string
    nombre: string
    descripcion: string
    archivos?: Array<{
        nombre: string
        url: string
        tipo: string
        tamaño: number
        fechaSubida: string
    }>
    comentarios?: Array<{
        usuario: string
        usuarioId: string
        fecha: string
        texto: string
        archivos?: any[]
    }>
    estado: 'pendiente' | 'en_proceso' | 'resuelto' | 'rechazado'
    prioridad: 'baja' | 'media' | 'alta'
    creadoPor?: string
    createdAt?: string
    updatedAt?: string
}

export const solicitudesService = {
    // Obtener solicitudes de una tienda
    getByTienda: async (tiendaId: string): Promise<Solicitud[]> => {
        try {
            const response = await api.get(`/solicitudes/tienda/${tiendaId}`)
            return response.data
        } catch (error) {
            console.error('Error cargando solicitudes:', error)
            return []
        }
    },

    // Crear nueva solicitud
    create: async (data: Partial<Solicitud>): Promise<Solicitud> => {
        try {
            const response = await api.post('/solicitudes', data)
            return response.data
        } catch (error) {
            console.error('Error creando solicitud:', error)
            throw error
        }
    },

    // Actualizar solicitud
    update: async (id: string, data: Partial<Solicitud>): Promise<Solicitud> => {
        try {
            const response = await api.put(`/solicitudes/${id}`, data)
            return response.data
        } catch (error) {
            console.error('Error actualizando solicitud:', error)
            throw error
        }
    },

    // Subir archivo a solicitud
    subirArchivo: async (solicitudId: string, file: File): Promise<any> => {
        const formData = new FormData()
        formData.append('archivo', file)

        try {
            const response = await api.post(`/solicitudes/${solicitudId}/archivos`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return response.data
        } catch (error) {
            console.error('Error subiendo archivo:', error)
            throw error
        }
    },

    // Agregar comentario
    agregarComentario: async (solicitudId: string, texto: string, archivos?: File[]): Promise<any> => {
        const formData = new FormData()
        formData.append('texto', texto)

        if (archivos) {
            archivos.forEach(file => {
                formData.append('archivos', file)
            })
        }

        try {
            const response = await api.post(`/solicitudes/${solicitudId}/comentarios`, formData)
            return response.data
        } catch (error) {
            console.error('Error agregando comentario:', error)
            throw error
        }
    }
}