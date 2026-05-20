// components/kanban/KanbanTiendaBoard.tsx
import { useTiendas } from '../../hooks/useTiendas';
import { KanbanTiendaColumn } from './KanbanTiendaColumn';
import { RefreshCw } from 'lucide-react';

export const KanbanTiendaBoard = () => {
    const { tiendas, loading, error, refresh } = useTiendas();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-kfc-red"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p className="font-medium">Error: {error}</p>
                <button
                    onClick={refresh}
                    className="mt-2 text-sm bg-red-100 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // Agrupar tiendas por estado
    const tiendasPorEstado = {
        pendiente: tiendas.filter(t => t.estadoGeneral === 'pendiente'),
        en_proceso: tiendas.filter(t => t.estadoGeneral === 'en_proceso'),
        en_revision: tiendas.filter(t => t.estadoGeneral === 'en_revision'),
        pendiente_aprobacion: tiendas.filter(t => t.estadoGeneral === 'pendiente_aprobacion'),
        instalacion: tiendas.filter(t => t.estadoGeneral === 'instalacion'),
        apertura: tiendas.filter(t => t.estadoGeneral === 'apertura'),
        completado: tiendas.filter(t => t.estadoGeneral === 'completado')
    };

    console.log('📊 Tiendas en apertura:', tiendasPorEstado.apertura.length);
    console.log('📊 K120:', tiendas.find(t => t.codigo === 'K120')?.estadoGeneral);

    const columns = [
        { id: 'pendiente', title: 'Pendiente', icon: '📋', color: 'gray' as const, tiendas: tiendasPorEstado.pendiente },
        { id: 'en_proceso', title: 'En Progreso', icon: '🔄', color: 'blue' as const, tiendas: tiendasPorEstado.en_proceso },
        { id: 'en_revision', title: 'En Revisión', icon: '👁️', color: 'purple' as const, tiendas: tiendasPorEstado.en_revision },
        { id: 'pendiente_aprobacion', title: 'Pendiente Aprobación', icon: '⏳', color: 'yellow' as const, tiendas: tiendasPorEstado.pendiente_aprobacion },
        { id: 'instalacion', title: 'Instalación', icon: '🔧', color: 'indigo' as const, tiendas: tiendasPorEstado.instalacion },
        { id: 'apertura', title: 'Apertura', icon: '🚀', color: 'green' as const, tiendas: tiendasPorEstado.apertura },
        { id: 'completado', title: 'Completado', icon: '✅', color: 'gray' as const, tiendas: tiendasPorEstado.completado }
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="bg-kfc-red w-2 h-8 rounded-full"></span>
                        Tablero de Aperturas
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Gestión de tiendas por etapa de apertura
                    </p>
                </div>

                <button
                    onClick={refresh}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    <RefreshCw className="h-5 w-5" />
                    Refrescar
                </button>
            </div>

            {/* Columnas - Scroll horizontal */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map((column) => (
                    <KanbanTiendaColumn key={column.id} {...column} />
                ))}
            </div>
        </div>
    );
};