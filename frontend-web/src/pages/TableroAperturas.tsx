import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { useParams } from 'react-router-dom';

const TableroAperturas = () => {
    const { tiendaId } = useParams<{ tiendaId?: string }>();

    return (
        <div className="p-6 h-full">
            <KanbanBoard tiendaId={tiendaId} />
        </div>
    );
};

export default TableroAperturas;