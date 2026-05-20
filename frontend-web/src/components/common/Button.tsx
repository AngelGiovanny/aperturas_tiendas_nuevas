import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    fullWidth?: boolean
    icon?: React.ReactNode
    children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
                                           variant = 'primary',
                                           size = 'md',
                                           loading = false,
                                           fullWidth = false,
                                           icon,
                                           children,
                                           className = '',
                                           disabled,
                                           ...props
                                       }) => {
    const variants = {
        primary: 'bg-kfc-red hover:bg-kfc-red-dark text-white shadow-md hover:shadow-lg active:scale-95',
        secondary: 'bg-white hover:bg-gray-100 text-kfc-red border-2 border-kfc-red shadow-sm hover:shadow-md active:scale-95',
        outline: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300 hover:shadow-md active:scale-95',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
    }

    return (
        <button
            className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}
        font-semibold rounded-lg transition-all duration-200
        flex items-center justify-center gap-2
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {icon && !loading && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </button>
    )
}

export default Button