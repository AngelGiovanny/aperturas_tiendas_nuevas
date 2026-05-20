import React from 'react';

interface BadgeProps {
    status?: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
    children?: React.ReactNode
    showIcon?: boolean
}

const Badge: React.FC<BadgeProps> = ({
                                         status = 'default',
                                         size = 'md',
                                         className = '',
                                         children,
                                         showIcon = true
                                     }) => {
    const getStatusConfig = (status: string) => {
        const config: Record<string, { color: string; text: string; icon?: string }> = {
            // Estados de proceso
            pendiente: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente', icon: '⏳' },
            en_proceso: { color: 'bg-blue-100 text-blue-800', text: 'En Proceso', icon: '🔄' },
            completado: { color: 'bg-green-100 text-green-800', text: 'Completado', icon: '✅' },
            en_espera_proveedor: { color: 'bg-orange-100 text-orange-800', text: 'Espera Proveedor', icon: '⏱️' },
            en_espera_cliente: { color: 'bg-purple-100 text-purple-800', text: 'Espera Cliente', icon: '👤' },
            pendiente_aprobacion: { color: 'bg-indigo-100 text-indigo-800', text: 'Pendiente Aprobación', icon: '📋' },
            cancelado: { color: 'bg-red-100 text-red-800', text: 'Cancelado', icon: '❌' },
            bloqueado: { color: 'bg-red-100 text-red-800', text: 'Bloqueado', icon: '🔒' },
            cerrado: { color: 'bg-gray-100 text-gray-800', text: 'Cerrado', icon: '🔒' },

            // Estados generales
            success: { color: 'bg-green-100 text-green-800', text: 'Éxito', icon: '✓' },
            warning: { color: 'bg-yellow-100 text-yellow-800', text: 'Advertencia', icon: '⚠️' },
            error: { color: 'bg-red-100 text-red-800', text: 'Error', icon: '✗' },
            info: { color: 'bg-blue-100 text-blue-800', text: 'Información', icon: 'ℹ️' },

            // Valor por defecto
            default: { color: 'bg-gray-100 text-gray-800', text: 'Default', icon: '📌' }
        }

        return config[status] || config.default
    }

    const config = getStatusConfig(status)

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base'
    }

    const sizeClass = sizeClasses[size] || sizeClasses.md

    return (
        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.color} ${sizeClass} ${className}`}>
            {showIcon && config.icon && <span>{config.icon}</span>}
            {children || config.text}
        </span>
    )
}

export default Badge