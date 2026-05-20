// frontend-web/src/services/tiendas.ts
import api from './api';
import { KanbanColumn } from '../types/kanban.types';
import { Tienda } from '../types';

// Interfaz para configuración de estaciones
export interface ConfiguracionEstaciones {
    cajas: {
        activo: boolean
        items: Array<{
            id: string
            nombre: string
            seleccionado: boolean
            descripcion?: string
        }>
    }
    drive: {
        activo: boolean
        items: Array<{
            id: string
            nombre: string
            seleccionado: boolean
            descripcion?: string
        }>
    }
    heladeria: {
        activo: boolean
        items: Array<{
            id: string
            nombre: string
            seleccionado: boolean
            descripcion?: string
        }>
    }
    pickUp: boolean
    delivery: {
        activo: boolean
        agregadores: boolean
        canalPropio: boolean
    }
    kioscos: {
        activo: boolean
        items: Array<{
            id: string
            nombre: string
            seleccionado: boolean
        }>
    }
    impresoraLinea: boolean
    impresoraLineaDomi: boolean
    impresoraBar: boolean
    impresoraCocina: boolean
}

export interface DashboardStats {
    totalTiendas: number;
    tiendasActivas: number;
    atrasos: number;
    porEstado: Array<{ _id: string; count: number }>;
    porArea: Array<{ _id: string; count: number }>;
    proximasAperturas: Tienda[];
}

export const tiendasService = {
    // ============= MÉTODOS PRINCIPALES =============

    getAll: async (params?: { estado?: string; ciudad?: string; responsable?: string; page?: number; limit?: number }) => {
        try {
            console.log('📡 Llamando a API /tiendas');
            const response = await api.get('/tiendas', { params });
            console.log('✅ Respuesta de API:', response.data);

            if (response.data && response.data.success && response.data.data) {
                return response.data.data;
            }
            if (Array.isArray(response.data)) {
                return response.data;
            }
            console.warn('⚠️ Formato de respuesta inesperado:', response.data);
            return [];
        } catch (error: any) {
            console.error('❌ Error en getAll:', error);
            throw new Error(error.response?.data?.message || 'Error al cargar tiendas');
        }
    },

    getById: async (id: string) => {
        try {
            const response = await api.get(`/tiendas/${id}`);
            if (response.data && response.data.success && response.data.data) {
                return response.data.data;
            }
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en getById:', error);
            throw new Error(error.response?.data?.message || 'Error al cargar tienda');
        }
    },

    getProcesosKanban: async (tiendaId?: string): Promise<KanbanColumn[]> => {
        try {
            const url = tiendaId ? `/tiendas/${tiendaId}/procesos/kanban` : '/procesos/kanban';
            const response = await api.get(url);
            return response.data.map((col: any) => ({
                id: col.estado,
                title: col.titulo,
                color: col.color || 'gray',
                cards: col.tarjetas.map((card: any) => ({
                    id: card._id,
                    title: card.titulo,
                    description: card.descripcion,
                    labels: card.etiquetas || [],
                    dueDate: card.fechaLimite,
                    comments: card.comentarios?.length || 0,
                    attachments: card.adjuntos?.length || 0,
                    checklists: {
                        completed: card.checklist?.filter((c: any) => c.completado).length || 0,
                        total: card.checklist?.length || 0,
                    },
                    assignees: card.responsables?.map((r: any) => r.iniciales) || [],
                    tiendaId: card.tiendaId,
                    area: card.area,
                })),
            }));
        } catch (error: any) {
            console.error('❌ Error en getProcesosKanban:', error);
            throw new Error(error.response?.data?.message || 'Error al cargar procesos Kanban');
        }
    },

    moverTarjeta: async (cardId: string, nuevoEstado: string) => {
        try {
            const response = await api.patch(`/procesos/${cardId}/estado`, { estado: nuevoEstado });
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en moverTarjeta:', error);
            throw new Error(error.response?.data?.message || 'Error al mover la tarjeta');
        }
    },

    create: async (data: Partial<Tienda>): Promise<Tienda> => {
        try {
            const response = await api.post('/tiendas', data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en create:', error);
            throw new Error(error.response?.data?.message || 'Error al crear tienda');
        }
    },

    update: async (id: string, data: Partial<Tienda>): Promise<Tienda> => {
        try {
            const response = await api.put(`/tiendas/${id}`, data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en update:', error);
            throw new Error(error.response?.data?.message || 'Error al actualizar tienda');
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            console.log('📡 Intentando eliminar tienda:', id);
            const response = await api.delete(`/tiendas/${id}`);
            console.log('✅ Respuesta de eliminación:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en delete:', error);
            if (error.response?.status === 404) {
                console.log('⚠️ Tienda no encontrada en backend (404)');
                throw new Error('not_found');
            }
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Error al eliminar tienda');
        }
    },

    assignResponsable: async (id: string, area: string, usuarioId: string) => {
        try {
            const response = await api.put(`/tiendas/${id}/assign`, { area, usuarioId });
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en assignResponsable:', error);
            throw new Error(error.response?.data?.message || 'Error al asignar responsable');
        }
    },

    updateEstado: async (id: string, estado: string, observaciones?: string) => {
        try {
            const response = await api.put(`/tiendas/${id}/estado`, { estado, observaciones });
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en updateEstado:', error);
            throw new Error(error.response?.data?.message || 'Error al actualizar estado');
        }
    },

    getDashboardStats: async () => {
        try {
            const response = await api.get('/tiendas/stats/dashboard');
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en getDashboardStats:', error);
            throw new Error(error.response?.data?.message || 'Error al cargar estadísticas');
        }
    },

    getTiemposTienda: async (id: string) => {
        try {
            const response = await api.get(`/tiendas/${id}/tiempos`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en getTiemposTienda:', error);
            throw new Error(error.response?.data?.message || 'Error al cargar tiempos');
        }
    },

    getResumenTiempos: async () => {
        try {
            const response = await api.get('/tiendas/tiempos/resumen');
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en getResumenTiempos:', error);
            throw new Error(error.response?.data?.message || 'Error al cargar resumen');
        }
    },

    getUsuariosPorArea: async () => {
        try {
            const response = await api.get('/tiendas/usuarios-por-area');
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en getUsuariosPorArea:', error);
            throw new Error(error.response?.data?.message || 'Error al cargar usuarios');
        }
    },

    getCategoriasPorCadena: async (cadena: string) => {
        try {
            const response = await api.get(`/tiendas/categorias-por-cadena/${cadena}`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en getCategoriasPorCadena:', error);
            throw new Error(error.response?.data?.message || 'Error al cargar categorías');
        }
    },

    recomendarCX: async () => {
        try {
            const response = await api.get('/tiendas/recomendar-cx');
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en recomendarCX:', error);
            throw new Error(error.response?.data?.message || 'Error al recomendar CX');
        }
    },

    // ============= NUEVOS MÉTODOS PARA CONFIGURACIÓN DE ESTACIONES =============

    actualizarConfiguracionEstaciones: async (id: string, configuracion: ConfiguracionEstaciones) => {
        try {
            const response = await api.patch(`/tiendas/${id}/configuracion-estaciones`, {
                configuracionEstaciones: configuracion
            });
            return response.data;
        } catch (error: any) {
            console.error('❌ Error actualizando configuración de estaciones:', error);
            throw new Error(error.response?.data?.message || 'Error al actualizar configuración');
        }
    },

    getConfiguracionCompleta: async (id: string) => {
        try {
            const response = await api.get(`/tiendas/${id}/configuracion-completa`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo configuración completa:', error);
            throw new Error(error.response?.data?.message || 'Error al obtener configuración');
        }
    },

    guardarConfiguracionEstaciones: async (id: string, configuracion: ConfiguracionEstaciones) => {
        try {
            const response = await api.put(`/tiendas/${id}/configuracion-estaciones`, {
                configuracionEstaciones: configuracion
            });
            return response.data;
        } catch (error: any) {
            console.error('❌ Error guardando configuración de estaciones:', error);
            throw new Error(error.response?.data?.message || 'Error al guardar configuración');
        }
    }
};