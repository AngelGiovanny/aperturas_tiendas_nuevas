import { Proceso } from './index';

export type ColumnColor = 'gray' | 'blue' | 'yellow' | 'green' | 'red';

export interface KanbanCard {
    id: string;
    title: string;
    description: string;
    labels: string[];
    dueDate?: string;
    comments: number;
    attachments: number;
    checklists: {
        completed: number;
        total: number;
    };
    assignees: string[];
    tiendaId?: string;
    area?: string;
}

export interface KanbanColumn {
    id: string;
    title: string;
    color: ColumnColor;
    cards: KanbanCard[] | Proceso[]; // Acepta ambos tipos
    icon?: string;
}

export interface KanbanBoard {
    id: string;
    title: string;
    columns: KanbanColumn[];
}