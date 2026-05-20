interface KanbanLabelsProps {
    labels: string[];
}

const labelColorMap: Record<string, string> = {
    'infraestructura': 'bg-blue-100 text-blue-800 border-blue-200',
    'alta prioridad': 'bg-red-100 text-red-800 border-red-200',
    'tecnología': 'bg-purple-100 text-purple-800 border-purple-200',
    'bdd': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'cx': 'bg-green-100 text-green-800 border-green-200',
    'validación': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'marketing': 'bg-pink-100 text-pink-800 border-pink-200',
    'operaciones': 'bg-orange-100 text-orange-800 border-orange-200',
};

export const KanbanLabels = ({ labels }: KanbanLabelsProps) => {
    return (
        <div className="flex flex-wrap gap-1 mb-2">
            {labels.map((label, idx) => (
                <span
                    key={idx}
                    className={`text-xs px-2 py-1 rounded-full border ${labelColorMap[label] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                >
          {label}
        </span>
            ))}
        </div>
    );
};