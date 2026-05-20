// services/auth.ts
import api from './api';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        nombre: string;
        email: string;
        role: string;
        area: string;
        telefono?: string;
        debeCambiarPassword?: boolean;
        createdAt?: string;
    };
}

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            console.log('authService: Enviando login a /auth/login');

            const response = await api.post('/auth/login', { email, password });

            console.log('authService: Respuesta raw:', response.data);

            // Adaptar la estructura del backend ({ success: true, data: {...} })
            if (response.data.success && response.data.data) {
                const userData = response.data.data;

                return {
                    token: userData.token,
                    user: {
                        id: userData._id,
                        nombre: userData.nombre,
                        email: userData.email,
                        role: userData.role,
                        area: userData.area || 'general',
                        telefono: userData.telefono,
                        debeCambiarPassword: userData.debeCambiarPassword || false,
                        createdAt: userData.createdAt
                    }
                };
            } else {
                throw new Error('Credenciales inválidas');
            }
        } catch (error) {
            console.error('authService: Error en login:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // ✅ CORREGIDO: Cambiar contraseña (solo envía newPassword)
    changePassword: async (newPassword: string): Promise<void> => {
        try {
            console.log('authService: Enviando cambio de contraseña');

            const response = await api.put('/auth/change-password', { newPassword });

            console.log('authService: Respuesta cambio contraseña:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error al cambiar la contraseña');
            }

            // Actualizar el usuario en localStorage
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                currentUser.debeCambiarPassword = false;
                localStorage.setItem('user', JSON.stringify(currentUser));
            }

            return response.data;
        } catch (error) {
            console.error('authService: Error cambiando contraseña:', error);
            throw error;
        }
    },

    // ✅ NUEVO MÉTODO: Restablecer contraseña (para admin)
    resetPassword: async (userId: string, nuevaPassword: string): Promise<void> => {
        try {
            console.log('authService: Restableciendo contraseña para usuario:', userId);

            const response = await api.post(`/users/${userId}/reset-password`, { nuevaPassword });

            console.log('authService: Respuesta reset password:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error al restablecer la contraseña');
            }
        } catch (error) {
            console.error('authService: Error restableciendo contraseña:', error);
            throw error;
        }
    }
};