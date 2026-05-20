import React, { forwardRef, useId } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
    icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {

        // Genera ID automático si no envían uno
        const generatedId = useId()
        const inputId = id || generatedId

        return (
            <div className="w-full">

                {/* Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        {label}
                    </label>
                )}

                {/* Input container */}
                <div className="relative">

                    {/* Icon */}
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            {icon}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        id={inputId}
                        ref={ref}
                        aria-invalid={!!error}
                        aria-describedby={
                            error
                                ? `${inputId}-error`
                                : helperText
                                    ? `${inputId}-helper`
                                    : undefined
                        }
                        className={`
              w-full px-4 py-2.5 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-kfc-red focus:border-transparent
              transition-all duration-200
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-500' : 'border-gray-300'}
              ${className}
            `}
                        {...props}
                    />
                </div>

                {/* Helper text */}
                {!error && helperText && (
                    <p
                        id={`${inputId}-helper`}
                        className="mt-1 text-sm text-gray-500"
                    >
                        {helperText}
                    </p>
                )}

                {/* Error message */}
                {error && (
                    <p
                        id={`${inputId}-error`}
                        className="mt-1 text-sm text-red-600"
                    >
                        {error}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

export default Input
