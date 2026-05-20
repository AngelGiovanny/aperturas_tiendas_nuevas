import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import Input from '../components/common/Input'
import { useAuth } from '../hooks/useAuth'
import { tiendasService } from '../services/tiendas'
import { Tienda } from '../types'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    BuildingStorefrontIcon,
    MapPinIcon,
    CalendarIcon,
    ClockIcon,
    XCircleIcon,
    UserIcon  // ✅ AGREGADO: Icono para el técnico
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const Tiendas: React.FC = () => {
    const navigate = useNavigate()
    const { isAdmin, isOperaciones } = useAuth()
    const [tiendas, setTiendas] = useState<Tienda[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [filterEstado, setFilterEstado] = useState('')

    useEffect(() => {
        loadTiendas()
    }, [])

    const loadTiendas = async () => {
        try {
            setLoading(true)
            setError(null)

            console.log('📡 Cargando tiendas desde API...')
            const data = await tiendasService.getAll()
            console.log('✅ Tiendas cargadas:', data)

            // ✅ LOG para verificar datos del técnico
            if (data && data.length > 0) {
                console.log('🔍 Primera tienda - técnico CX:', {
                    codigo: data[0].codigo,
                    responsableCX: data[0].responsableCX,
                    responsable: data[0].responsable,
                    responsables: data[0].responsables,
                    nombreTecnico: data[0].responsables?.cx?.nombre
                })
            }

            if (Array.isArray(data) && data.length > 0) {
                setTiendas(data)
                toast.success(`${data.length} tiendas cargadas correctamente`)
            } else {
                console.warn('No hay tiendas en la base de datos')
                setTiendas([])
                toast('No hay tiendas creadas aún', { icon: 'ℹ️' })
            }

        } catch (error: any) {
            console.error('❌ Error loading tiendas:', error)
            setError(error.message || 'Error al cargar las tiendas')
            setTiendas([])
            toast.error('Error al cargar las tiendas')
        } finally {
            setLoading(false)
        }
    }

    const limpiarError = () => {
        setError(null)
        loadTiendas()
    }

    const calcularDiasRestantes = (fechaApertura?: string): number | null => {
        if (!fechaApertura) return null
        try {
            const hoy = new Date()
            const apertura = new Date(fechaApertura)
            const diffTime = apertura.getTime() - hoy.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays
        } catch (error) {
            return null
        }
    }

    // ✅ FUNCIÓN PARA OBTENER EL NOMBRE DEL TÉCNICO CX
    const getNombreTecnicoCX = (tienda: Tienda): string => {
        // Prioridad: responsables.cx.nombre > responsable > responsableCX (nombre buscado)
        if (tienda.responsables?.cx?.nombre) {
            return tienda.responsables.cx.nombre
        }
        if (tienda.responsable) {
            return tienda.responsable
        }
        return 'No asignado'
    }

    const filteredTiendas = tiendas.filter(tienda => {
        const matchesSearch = search === '' ||
            tienda.codigo?.toLowerCase().includes(search.toLowerCase()) ||
            tienda.nombre?.toLowerCase().includes(search.toLowerCase()) ||
            tienda.direccion?.ciudad?.toLowerCase().includes(search.toLowerCase())

        const matchesFilter = filterEstado === '' || tienda.estadoGeneral === filterEstado

        return matchesSearch && matchesFilter
    })

    const estados = Array.from(new Set(tiendas.map(t => t.estadoGeneral).filter(Boolean)))

    const handleNuevaTienda = () => {
        navigate('/tiendas/nueva')
    }

    const handleVerTienda = (id: string) => {
        navigate(`/tiendas/${id}`)
    }

    const getEstadoColor = (estado: string): 'warning' | 'info' | 'success' | 'error' | 'default' => {
        switch(estado) {
            case 'pendiente': return 'warning'
            case 'en_proceso': return 'info'
            case 'pendiente_aprobacion': return 'warning'
            case 'completado': return 'success'
            case 'cancelado': return 'error'
            default: return 'default'
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfc-red"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tiendas</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            Gestiona todas las tiendas en proceso de apertura
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={loadTiendas}
                            icon={<ArrowPathIcon className="h-4 w-4" />}
                        >
                            Actualizar
                        </Button>
                        {(isAdmin || isOperaciones) && (
                            <Button
                                variant="primary"
                                onClick={handleNuevaTienda}
                                icon={<PlusIcon className="h-4 w-4" />}
                            >
                                Nueva Tienda
                            </Button>
                        )}
                    </div>
                </div>

                {/* Mensaje de error con botón para limpiar */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-red-800 dark:text-red-200 font-medium">
                                    ❌ Error al cargar las tiendas
                                </p>
                                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                                    {error}
                                </p>
                            </div>
                            <button
                                onClick={limpiarError}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg transition-colors"
                                title="Limpiar error"
                            >
                                <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </button>
                        </div>
                        <button
                            onClick={loadTiendas}
                            className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Buscar por código, nombre o ciudad..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                            />
                        </div>
                        <div className="sm:w-64">
                            <select
                                value={filterEstado}
                                onChange={(e) => setFilterEstado(e.target.value)}
                                className="input w-full"
                            >
                                <option value="">Todos los estados</option>
                                {estados.map(estado => (
                                    <option key={estado} value={estado}>
                                        {estado?.replace('_', ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Tiendas Grid */}
                {tiendas.length === 0 ? (
                    <Card className="text-center py-12">
                        <BuildingStorefrontIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No hay tiendas
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {error
                                ? 'Error al cargar las tiendas. Verifica la conexión con el backend.'
                                : 'Comienza creando una nueva tienda'
                            }
                        </p>
                        {error ? (
                            <Button
                                variant="primary"
                                onClick={loadTiendas}
                                className="mt-4"
                                icon={<ArrowPathIcon className="h-4 w-4" />}
                            >
                                Reintentar
                            </Button>
                        ) : (
                            (isAdmin || isOperaciones) && (
                                <Button
                                    variant="primary"
                                    onClick={handleNuevaTienda}
                                    className="mt-4"
                                    icon={<PlusIcon className="h-4 w-4" />}
                                >
                                    Crear primera tienda
                                </Button>
                            )
                        )}
                    </Card>
                ) : (
                    <>
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Mostrando {filteredTiendas.length} de {tiendas.length} tiendas
                            </div>
                            {filteredTiendas.length === 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearch('')
                                        setFilterEstado('')
                                    }}
                                >
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTiendas.map((tienda) => {
                                const diasRestantes = calcularDiasRestantes(tienda.fechaAperturaPlanificada)
                                const atrasada = diasRestantes !== null && diasRestantes < 0
                                const nombreTecnico = getNombreTecnicoCX(tienda)

                                return (
                                    <Card
                                        key={tienda._id}
                                        hoverable
                                        className="cursor-pointer transition-all hover:shadow-lg"
                                        onClick={() => handleVerTienda(tienda._id)}
                                    >
                                        <div className="space-y-4">
                                            {/* Header */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-lg font-bold text-kfc-red dark:text-kfc-red">
                                                        {tienda.codigo || 'N/A'}
                                                    </span>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white mt-1">
                                                        {tienda.nombre || 'Sin nombre'}
                                                    </h3>
                                                </div>
                                                <Badge status={getEstadoColor(tienda.estadoGeneral || 'pendiente')} size="sm">
                                                    {(tienda.estadoGeneral || 'pendiente').replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            {/* ✅ TÉCNICO CX ASIGNADO - NUEVO BLOQUE */}
                                            <div className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <UserIcon className="h-4 w-4 text-kfc-red dark:text-kfc-red" />
                                                <span className="text-gray-600 dark:text-gray-400 font-medium">CX:</span>
                                                <span className="text-gray-900 dark:text-white font-semibold">
                                                    {nombreTecnico}
                                                </span>
                                            </div>

                                            {/* Dirección */}
                                            {tienda.direccion && (
                                                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span>
                                                        {tienda.direccion.calle}, {tienda.direccion.ciudad}, {tienda.direccion.provincia}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Fecha */}
                                            {tienda.fechaAperturaPlanificada && (
                                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <CalendarIcon className="h-4 w-4" />
                                                    <span>
                                                        Apertura: {format(new Date(tienda.fechaAperturaPlanificada), 'dd/MM/yyyy', { locale: es })}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Días restantes */}
                                            {diasRestantes !== null && (
                                                <div className={`flex items-center gap-1 text-sm ${
                                                    atrasada ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                                }`}>
                                                    <ClockIcon className="h-4 w-4" />
                                                    <span className="font-medium">
                                                        {atrasada
                                                            ? `${Math.abs(diasRestantes)} días de atraso`
                                                            : `${diasRestantes} días restantes`
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {/* Progreso */}
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">Progreso</span>
                                                    <span className="font-medium text-kfc-red dark:text-kfc-red">
                                                        {tienda.progreso || 0}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-kfc-red to-red-500 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${tienda.progreso || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>

                        {filteredTiendas.length === 0 && (
                            <Card className="text-center py-12">
                                <BuildingStorefrontIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No se encontraron tiendas
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    No hay tiendas que coincidan con los filtros aplicados
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearch('')
                                        setFilterEstado('')
                                    }}
                                    className="mt-4"
                                >
                                    Limpiar filtros
                                </Button>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}

export default Tiendas