// frontend-web/src/services/pruebasService.ts
import api from './api';

export interface EstacionPrueba {
    id: string;
    nombre: string;
    tipo: string;
    completado: boolean;
    observaciones?: Array<{ texto: string; usuario: string; fecha: string }>;
    archivos?: Array<{ nombre: string; url: string; fechaSubida: string }>;
}

export const pruebasService = {
    // ==================== PRUEBAS FUNCIONALES ====================
    getEstaciones: async (tiendaId: string) => {
        const response = await api.get(`/pruebas/tienda/${tiendaId}/estaciones`);
        return response.data;
    },
    addObservacionEstacion: async (tiendaId: string, estacionId: string, texto: string) => {
        const response = await api.post(`/pruebas/tienda/${tiendaId}/estacion/${estacionId}/observacion`, { texto });
        return response.data;
    },
    completarEstacion: async (tiendaId: string, estacionId: string) => {
        const response = await api.put(`/pruebas/tienda/${tiendaId}/estacion/${estacionId}/completar`);
        return response.data;
    },
    uploadArchivoEstacion: async (tiendaId: string, estacionId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/pruebas/tienda/${tiendaId}/estacion/${estacionId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // ==================== PRUEBAS PRE-APERTURA ====================
    getPreAperturaEstado: async (tiendaId: string) => {
        const response = await api.get(`/pruebas/tienda/${tiendaId}/pre-apertura/estado`);
        return response.data;
    },
    uploadFacturaEfectivo: async (tiendaId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/pruebas/tienda/${tiendaId}/pre-apertura/efectivo/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    uploadFacturaTarjeta: async (tiendaId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/pruebas/tienda/${tiendaId}/pre-apertura/tarjeta/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    addObservacionPreApertura: async (tiendaId: string, tipo: 'efectivo' | 'tarjeta', texto: string) => {
        const response = await api.post(`/pruebas/tienda/${tiendaId}/pre-apertura/observacion`, { tipo, texto });
        return response.data;
    },

    // ==================== APROBACIÓN CONTABILIDAD ====================
    getAprobacion: async (tiendaId: string) => {
        const response = await api.get(`/pruebas/tienda/${tiendaId}/aprobacion`);
        return response.data;
    },
    uploadDocumentoFacturacion: async (tiendaId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/pruebas/tienda/${tiendaId}/aprobacion/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    setRevisado: async (tiendaId: string, revisado: boolean) => {
        const response = await api.put(`/pruebas/tienda/${tiendaId}/aprobacion/revisado`, { revisado });
        return response.data;
    },
    addObservacionAprobacion: async (tiendaId: string, texto: string) => {
        const response = await api.post(`/pruebas/tienda/${tiendaId}/aprobacion/observacion`, { texto });
        return response.data;
    },
    aprobarFacturacion: async (tiendaId: string) => {
        console.log(`📤 Llamando a API: /pruebas/tienda/${tiendaId}/aprobacion/aprobar`);
        const response = await api.post(`/pruebas/tienda/${tiendaId}/aprobacion/aprobar`);
        console.log('📥 Respuesta del servidor:', response.data);
        return response.data;
    },

    // ==================== RESUMEN FINAL ====================
    getResumen: async (tiendaId: string) => {
        const response = await api.get(`/pruebas/tienda/${tiendaId}/resumen`);
        return response.data;
    }
};