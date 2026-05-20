import React from 'react';

interface CardProps {
    children: React.ReactNode
    className?: string
    onClick?: () => void
    hoverable?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card: React.FC<CardProps> = ({
                                       children,
                                       className = '',
                                       onClick,
                                       hoverable = false,
                                       padding = 'md',
                                   }) => {
    const paddings = {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    }

    return (
        <div
            className={`
        bg-white rounded-xl shadow-lg border border-gray-100
        ${hoverable ? 'hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1' : ''}
        ${paddings[padding]}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </div>
    )
}

export default Card
