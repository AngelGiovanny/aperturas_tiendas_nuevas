import React from 'react';
import Card from "../common/Card";

interface StatsCardProps {
    title: string
    value: number
    icon: React.ElementType
    color: string
    trend?: number
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, trend }) => {
    return (
        <Card hoverable>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                    {trend !== undefined && (
                        <p className={`text-xs mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mes anterior
                        </p>
                    )}
                </div>
                <div className={`${color} p-4 rounded-xl`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </Card>
    )
}

export default StatsCard
