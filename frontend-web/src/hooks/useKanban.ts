import { useState, useEffect, useCallback } from 'react';
import { procesoService } from '../services/procesos';
import { Proceso } from '../types';
import { KanbanColumn, ColumnColor } from '../types/kanban.types';
import toast from 'react-hot-toast';

// Extender KanbanColumn para trabajar directamente con Procesos
export interface ProcesoKanbanColumn extends Omit<KanbanColumn, 'cards'> {
    cards: Proceso[];
}

// Evento personalizado para refrescar el kanban
const KANBAN_REFRESH_EVENT = 'kanban-refresh';

export const useKanban = (tiendaId?: string) => {
    const [columns, setColumns] = useState<ProcesoKanbanColumn[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Definir las columnas del kanban
    const columnasDefinidas: Omit<ProcesoKanbanColumn, 'cards'>[] = [
        {
            id: 'pendiente',
            title: 'Pendiente',
            color: 'gray' as ColumnColor,
            icon: '⏳'
        },
        {
            id: 'en_proceso',
            title: 'En Proceso',
            color: 'blue' as ColumnColor,
            icon: '🔄'
        },
        {
            id: 'pendiente_aprobacion',
            title: 'En Revisión',
            color: 'yellow' as ColumnColor,
            icon: '👁️'
        },
        {
            id: 'completado',
            title: 'Completado',
            color: 'green' as ColumnColor,
            icon: '✅'
        }
    ];

    // Mapa de colores a clases CSS
    const colorClasses: Record<ColumnColor, string> = {
        gray: 'bg-gray-100',
        blue: 'bg-blue-50',
        yellow: 'bg-yellow-50',
        green: 'bg-green-50',
        red: 'bg-red-50'
    };

    // Cargar datos
    const fetchData = useCallback(async () => {
        if (!tiendaId) {
            setColumns(columnasDefinidas.map(col => ({ ...col, cards: [] })));
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await procesoService.getProcesosByTienda(tiendaId);

            if (response.success && response.data) {
                const procesos = response.data;

                // Organizar procesos por estado
                const nuevasColumnas = columnasDefinidas.map(col => ({
                    ...col,
                    cards: procesos.filter(p => p.estado === col.id)
                }));

                setColumns(nuevasColumnas);
                setError(null);
            } else {
                throw new Error('Error al cargar procesos');
            }
        } catch (err: any) {
            setError(err.message || 'Error al cargar el tablero');
            console.error(err);
            setColumns(columnasDefinidas.map(col => ({ ...col, cards: [] })));
        } finally {
            setLoading(false);
        }
    }, [tiendaId]);

    // Escuchar evento de refresco
    useEffect(() => {
        const handleRefresh = () => {
            fetchData();
        };

        window.addEventListener(KANBAN_REFRESH_EVENT, handleRefresh);

        return () => {
            window.removeEventListener(KANBAN_REFRESH_EVENT, handleRefresh);
        };
    }, [fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Mover tarjeta entre columnas
    const moveCard = useCallback(async (
        cardId: string,
        sourceCol: string,
        destCol: string
    ) => {
        if (sourceCol === destCol) return;

        // Optimistic update
        setColumns(prev => {
            const newColumns = [...prev];
            const sourceColumn = newColumns.find(c => c.id === sourceCol);
            const destColumn = newColumns.find(c => c.id === destCol);

            if (!sourceColumn || !destColumn) return prev;

            const cardIndex = sourceColumn.cards.findIndex(c => c._id === cardId);
            if (cardIndex === -1) return prev;

            const [movedCard] = sourceColumn.cards.splice(cardIndex, 1);
            const cardActualizada = { ...movedCard, estado: destCol as Proceso['estado'] };
            destColumn.cards.push(cardActualizada);

            return newColumns;
        });

        try {
            let response;
            switch (destCol) {
                case 'en_proceso':
                    response = await procesoService.iniciarProceso(cardId);
                    break;
                case 'pendiente_aprobacion':
                    response = await procesoService.pasarARevision(cardId);
                    break;
                case 'completado':
                    response = await procesoService.finalizarProceso(cardId);
                    break;
                default:
                    toast.success('Tarjeta movida');
                    break;
            }

            if (response?.success) {
                toast.success(`Proceso movido a ${destCol.replace('_', ' ')}`);
            }

            window.dispatchEvent(new Event(KANBAN_REFRESH_EVENT));

        } catch (err: any) {
            toast.error(err.message || 'Error al mover la tarjeta');
            fetchData();
        }
    }, [fetchData]);

    const refresh = useCallback(() => {
        fetchData();
    }, [fetchData]);

    const getColumnClass = (color: ColumnColor): string => {
        return colorClasses[color] || 'bg-gray-100';
    };

    return {
        columns,
        loading,
        error,
        moveCard,
        refresh,
        getColumnClass
    };
};

// Función helper para disparar el refresco
export const refreshKanban = () => {
    window.dispatchEvent(new Event(KANBAN_REFRESH_EVENT));
};