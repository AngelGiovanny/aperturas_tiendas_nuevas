import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
    HomeIcon,
    BuildingStorefrontIcon,
    ClipboardDocumentListIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    BellIcon,
    ChevronDownIcon,
    WrenchIcon,
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
    const { user, logout, isAdmin } = useAuth()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Tiendas', href: '/tiendas', icon: BuildingStorefrontIcon },
        { name: 'Implementaciones', href: '/implementaciones', icon: WrenchIcon },
        { name: 'Procesos', href: '/procesos', icon: ClipboardDocumentListIcon },
    ]

    return (
        <nav className="bg-kfc-red shadow-lg flex-shrink-0">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo y navegación */}
                    <div className="flex items-center space-x-8">
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <span className="text-white font-bold text-xl tracking-tight">
                                KFC<span className="text-yellow-300">Aperturas</span>
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className="text-white hover:bg-white hover:bg-opacity-20 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            ))}
                            {isAdmin && (
                                <Link
                                    to="/admin/usuarios"
                                    className="text-white hover:bg-white hover:bg-opacity-20 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center space-x-4">
                        {/* Notificaciones */}
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative text-white hover:text-gray-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                        >
                            <BellIcon className="h-5 w-5" />
                            <span className="absolute -top-1 -right-1 bg-yellow-400 text-kfc-red text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                3
                            </span>
                        </button>

                        {/* Menú de usuario */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-2 text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                            >
                                <UserCircleIcon className="h-5 w-5" />
                                <span className="text-sm font-medium hidden md:block">
                                    {user?.nombre?.split(' ')[0]}
                                </span>
                                <ChevronDownIcon className="h-4 w-4" />
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-1 border border-gray-200 z-50 animate-in">
                                    <Link
                                        to="/perfil"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <UserCircleIcon className="h-4 w-4 inline mr-2" />
                                        Mi Perfil
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false)
                                            logout()
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <ArrowRightOnRectangleIcon className="h-4 w-4 inline mr-2" />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar