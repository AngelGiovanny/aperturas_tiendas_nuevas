import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tiendas from './pages/Tiendas'
import NuevaTienda from './pages/NuevaTienda'
import TiendaDetalle from './pages/TiendaDetalle'
import Procesos from './pages/Procesos'
import Perfil from './pages/Perfil'
import Usuarios from './pages/Admin/Usuarios'
import TableroAperturas from './pages/TableroAperturas'
import ConexionesBDD from './pages/ConexionesBDD'
import Implementaciones from './pages/Implementaciones'
import NuevaImplementacion from './pages/NuevaImplementacion'
import ImplementacionDetalle from './pages/ImplementacionDetalle'
import CambiarPassword from './pages/CambiarPassword'  // ✅ AGREGADO

// Loading Component
const LoadingSpinner = () => (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-kfc-red to-kfc-red-dark">
        <div className="bg-white p-8 rounded-xl shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfc-red mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando sistema...</p>
        </div>
    </div>
)

// Protected Route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return <LoadingSpinner />
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

// Admin Route
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth()

    if (loading) {
        return <LoadingSpinner />
    }

    return isAuthenticated && isAdmin ? <>{children}</> : <Navigate to="/dashboard" />
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* ✅ RUTA PARA CAMBIO DE CONTRASEÑA - SIN PROTECCIÓN (usa sessionStorage) */}
            <Route path="/cambiar-password" element={<CambiarPassword />} />

            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />

            <Route path="/tablero" element={
                <ProtectedRoute>
                    <TableroAperturas />
                </ProtectedRoute>
            } />

            <Route path="/tiendas" element={
                <ProtectedRoute>
                    <Tiendas />
                </ProtectedRoute>
            } />

            <Route path="/tiendas/nueva" element={
                <ProtectedRoute>
                    <NuevaTienda />
                </ProtectedRoute>
            } />

            <Route path="/tiendas/:id" element={
                <ProtectedRoute>
                    <TiendaDetalle />
                </ProtectedRoute>
            } />

            <Route path="/implementaciones" element={
                <ProtectedRoute>
                    <Implementaciones />
                </ProtectedRoute>
            } />

            <Route path="/implementaciones/nueva" element={
                <ProtectedRoute>
                    <NuevaImplementacion />
                </ProtectedRoute>
            } />

            <Route path="/implementaciones/:id" element={
                <ProtectedRoute>
                    <ImplementacionDetalle />
                </ProtectedRoute>
            } />

            <Route path="/procesos" element={
                <ProtectedRoute>
                    <Procesos />
                </ProtectedRoute>
            } />

            <Route path="/conexiones" element={
                <ProtectedRoute>
                    <ConexionesBDD />
                </ProtectedRoute>
            } />

            <Route path="/perfil" element={
                <ProtectedRoute>
                    <Perfil />
                </ProtectedRoute>
            } />

            <Route path="/admin/usuarios" element={
                <AdminRoute>
                    <Usuarios />
                </AdminRoute>
            } />

            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    )
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="h-full w-full">
                    <AppRoutes />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                                borderRadius: '0.5rem',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </div>
            </AuthProvider>
        </Router>
    )
}

export default App