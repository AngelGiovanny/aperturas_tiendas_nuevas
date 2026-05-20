import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { authService } from '../services/auth'

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<any>
    logout: () => void
    changePassword: (newPassword: string) => Promise<void>
    isAuthenticated: boolean
    isAdmin: boolean
    isMaster: boolean
    isOperaciones: boolean
    isIT: boolean
    isDSI: boolean
    isCX: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token')
            const storedUser = localStorage.getItem('user')

            if (token && storedUser) {
                try {
                    const userData = JSON.parse(storedUser)
                    setUser(userData)
                    console.log('Usuario cargado desde localStorage:', userData)
                } catch (error) {
                    console.error('Error cargando usuario:', error)
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                }
            }
            setLoading(false)
        }

        initAuth()
    }, [])

    const login = async (email: string, password: string) => {
        try {
            console.log('AuthContext: Iniciando login con:', email)

            const response = await authService.login(email, password)
            console.log('AuthContext: Respuesta de authService:', response)

            if (response && response.token && response.user) {
                const role = response.user.role as User['role']

                const userForState: User = {
                    _id: response.user.id,
                    nombre: response.user.nombre,
                    email: response.user.email,
                    role: role,
                    area: response.user.area,
                    telefono: response.user.telefono || '',
                    activo: true,
                    debeCambiarPassword: response.user.debeCambiarPassword || false
                }

                // Guardar en localStorage
                localStorage.setItem('token', response.token)
                localStorage.setItem('user', JSON.stringify(userForState))

                // Actualizar estado
                setUser(userForState)
                console.log('AuthContext: Login exitoso, usuario:', userForState)

                // ✅ Retornar el usuario para verificar debeCambiarPassword
                return userForState
            } else {
                console.error('AuthContext: Respuesta inválida:', response)
                throw new Error('Respuesta inválida del servidor')
            }
        } catch (error) {
            console.error('AuthContext: Error en login:', error)
            throw error
        }
    }

    // ✅ NUEVA FUNCIÓN: Cambiar contraseña
    const changePassword = async (newPassword: string) => {
        try {
            console.log('AuthContext: Cambiando contraseña')
            await authService.changePassword(newPassword)

            // Actualizar usuario localmente
            if (user) {
                const updatedUser = {
                    ...user,
                    debeCambiarPassword: false,
                    passwordTemporal: false
                }
                setUser(updatedUser)
                localStorage.setItem('user', JSON.stringify(updatedUser))
            }

            console.log('AuthContext: Contraseña cambiada exitosamente')
        } catch (error) {
            console.error('AuthContext: Error cambiando contraseña:', error)
            throw error
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        console.log('AuthContext: Sesión cerrada')
    }

    const value = {
        user,
        loading,
        login,
        logout,
        changePassword,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'admin_master',
        isMaster: user?.role === 'admin_master',
        isOperaciones: user?.role === 'operaciones',
        isIT: user?.role === 'it',
        isDSI: user?.role === 'dsi',
        isCX: user?.role === 'cx',
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}