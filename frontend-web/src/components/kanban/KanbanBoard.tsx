import { KanbanColumn as KanbanColumnComponent } from './KanbanColumn';
import { useKanban } from '../../hooks/useKanban';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface KanbanBoardProps {
    tiendaId?: string;
}

export const KanbanBoard = ({ tiendaId }: KanbanBoardProps) => {
    const { columns, loading, error, refresh } = useKanban(tiendaId);
    const navigate = useNavigate();

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

    const handleCardClick = (procesoId: string) => {
        navigate(`/procesos/${procesoId}`);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header del tablero */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="bg-kfc-red w-2 h-8 rounded-full"></span>
                        Tablero de Procesos
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {tiendaId ? 'Procesos de esta tienda' : 'Seleccione una tienda para ver sus procesos'}
                    </p>
                </div>

                {tiendaId && (
                    <button
                        onClick={refresh}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Refrescar
                    </button>
                )}
            </div>

            {/* Columnas */}
            {columns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {columns.map((column) => (
                        <KanbanColumnComponent
                            key={column.id}
                            column={column}
                            onCardClick={handleCardClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No hay procesos para mostrar</p>
                </div>
            )}
        </div>
    );
};