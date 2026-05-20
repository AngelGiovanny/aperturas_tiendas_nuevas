// hooks/useTiendas.ts
import { useState, useEffect, useCallback } from "react";
import { tiendasService } from "../services/tiendas";
import { Tienda } from "../types";

export const useTiendas = () => {
    const [tiendas, setTiendas] = useState<Tienda[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Usar useCallback para evitar recrear la función en cada render
    const loadTiendas = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await tiendasService.getAll()
            // Manejar diferentes formatos de respuesta
            const tiendasArray: Tienda[] = Array.isArray(response) ? response : response?.data || []
            setTiendas(tiendasArray)
            console.log('✅ Tiendas cargadas:', tiendasArray.length)

            // ✅ CORREGIDO: Tipar el parámetro 't' como Tienda
            // Y eliminar la búsqueda específica de K120 (es dinámico)
            // Si quieres log general de la primera tienda como ejemplo:
            if (tiendasArray.length > 0) {
                const primeraTienda = tiendasArray[0]
                console.log('📊 Ejemplo - Tienda:', primeraTienda.codigo, 'Estado:', primeraTienda.estadoGeneral)
            }
        } catch (err: any) {
            console.error('❌ Error cargando tiendas:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    // Cargar tiendas al montar el componente
    useEffect(() => {
        loadTiendas()
    }, [loadTiendas])

    // Escuchar eventos de actualización desde otros componentes
    useEffect(() => {
        const handleRefresh = () => {
            console.log('🔄 Refrescando tiendas por evento')
            loadTiendas()
        }

        // Escuchar eventos personalizados
        window.addEventListener('kanban-refresh', handleRefresh)
        window.addEventListener('tienda-actualizada', handleRefresh)
        window.addEventListener('tienda-editada', handleRefresh)

        return () => {
            window.removeEventListener('kanban-refresh', handleRefresh)
            window.removeEventListener('tienda-actualizada', handleRefresh)
            window.removeEventListener('tienda-editada', handleRefresh)
        }
    }, [loadTiendas])

    return {
        tiendas,
        loading,
        error,
        refresh: loadTiendas,
    }
}