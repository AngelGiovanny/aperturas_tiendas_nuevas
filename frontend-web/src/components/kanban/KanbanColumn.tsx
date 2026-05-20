import { KanbanColumn as KanbanColumnType } from '../../types/kanban.types';
import { Proceso } from '../../types';
import { KanbanCard } from './KanbanCard';
import { MoreHorizontal, Plus } from 'lucide-react';

interface KanbanColumnProps {
    column: KanbanColumnType;
    onCardClick?: (cardId: string) => void;
}

const columnColors = {
    gray: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
};

export const KanbanColumn = ({ column, onCardClick }: KanbanColumnProps) => {
    // Type guard para verificar si es un Proceso
    const isProceso = (item: any): item is Proceso => {
        return item && '_id' in item && 'nombre' in item && 'estado' in item;
    };

    // Convertir proceso a formato de tarjeta
    const convertirProcesoACard = (proceso: Proceso) => {
        return {
            id: proceso._id,
            title: proceso.nombre,
            description: proceso.descripcion || 'Sin descripción',
            labels: [proceso.area || 'General', proceso.prioridad],
            dueDate: proceso.fechas?.finEstimado,
            comments: 0,
            attachments: proceso.checklist?.reduce((acc: number, item) =>
                acc + (item.adjuntos?.length || 0), 0) || 0,
            checklists: {
                completed: proceso.checklist?.filter(item => item.validado).length || 0,
                total: proceso.checklist?.length || 0
            },
            assignees: proceso.equipo?.responsables?.map(r =>
                typeof r === 'string' ? r : r._id) || [],
            tiendaId: typeof proceso.tienda === 'string' ? proceso.tienda : proceso.tienda?._id,
            area: proceso.area,
            progreso: proceso.progreso,
            estadoTiempo: proceso.estadoTiempo
        };
    };

    return (
        <div className="flex-shrink-0 w-80 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
            {/* Header */}
            <div className={`p-3 rounded-t-xl border-b ${columnColors[column.color]}`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {column.icon && <span className="text-lg">{column.icon}</span>}
                        <h3 className="font-semibold text-gray-700">{column.title}</h3>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                            {column.cards.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                            <Plus className="h-4 w-4 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
                {column.cards.map((item) => {
                    // Determinar el tipo de item y convertir si es necesario
                    if (isProceso(item)) {
                        const card = convertirProcesoACard(item);
                        return (
                            <KanbanCard
                                key={card.id}
                                card={card}
                                onClick={() => onCardClick?.(card.id)}
                            />
                        );
                    } else {
                        // Si ya es una tarjeta KanbanCard
                        return (
                            <KanbanCard
                                key={item.id}
                                card={item}
                                onClick={() => onCardClick?.(item.id)}
                            />
                        );
                    }
                })}

                {column.cards.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                        Sin tareas
                    </div>
                )}
            </div>
        </div>
    );
};