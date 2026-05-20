import { KanbanCard as KanbanCardType } from '../../types/kanban.types';
import { Calendar, MessageSquare, Paperclip, CheckSquare, Users } from 'lucide-react';

interface KanbanCardProps {
    card: KanbanCardType;
    onClick?: () => void;
}

export const KanbanCard = ({ card, onClick }: KanbanCardProps) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit' });
    };

    const getPriorityColor = (label: string) => {
        const priority = label.toLowerCase();
        if (priority.includes('alta') || priority.includes('critica')) return 'bg-red-100 text-red-700';
        if (priority.includes('media')) return 'bg-yellow-100 text-yellow-700';
        if (priority.includes('baja')) return 'bg-green-100 text-green-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all hover:border-kfc-red/30"
        >
            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{card.title}</h4>

            {card.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{card.description}</p>
            )}

            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {card.labels.map((label, index) => (
                        <span
                            key={index}
                            className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(label)}`}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            )}

            {/* Métricas */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                    {card.dueDate && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(card.dueDate)}</span>
                        </div>
                    )}

                    {card.comments > 0 && (
                        <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{card.comments}</span>
                        </div>
                    )}

                    {card.attachments > 0 && (
                        <div className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            <span>{card.attachments}</span>
                        </div>
                    )}

                    {card.checklists.total > 0 && (
                        <div className="flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            <span>{card.checklists.completed}/{card.checklists.total}</span>
                        </div>
                    )}
                </div>

                {card.assignees && card.assignees.length > 0 && (
                    <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{card.assignees.length}</span>
                    </div>
                )}
            </div>

            {/* Progreso del checklist si existe */}
            {card.checklists.total > 0 && (
                <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                            className="bg-kfc-red h-1.5 rounded-full"
                            style={{ width: `${(card.checklists.completed / card.checklists.total) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};