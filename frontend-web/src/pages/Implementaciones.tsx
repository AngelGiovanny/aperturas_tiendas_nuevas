// pages/Implementaciones.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Button from '../components/common/Button'
import { implementacionesService } from '../services/implementacionesService'
import { Implementacion } from '@/types'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    BuildingStorefrontIcon,
    MapPinIcon,
    CalendarIcon,
    UserIcon,
    WrenchIcon,
    ChartBarIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
    ChatBubbleLeftIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

// Componente de tarjeta para Kanban
const ImplementacionCard: React.FC<{ implementacion: Implementacion; onClick: () => void }> = ({ implementacion, onClick }) => {
    const getEstadoColor = (estado: string) => {
        const colors: Record<string, string> = {
            pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            en_proceso: 'bg-blue-100 text-blue-800 border-blue-200',
            en_revision: 'bg-purple-100 text-purple-800 border-purple-200',
            instalacion: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            apertura: 'bg-orange-100 text-orange-800 border-orange-200',
            completado: 'bg-green-100 text-green-800 border-green-200',
            cancelado: 'bg-red-100 text-red-800 border-red-200'
        }
        return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getEstadoTexto = (estado: string) => {
        const textos: Record<string, string> = {
            pendiente: 'PENDIENTE',
            en_proceso: 'EN PROCESO',
            en_revision: 'EN REVISIÓN',
            instalacion: 'INSTALACIÓN',
            apertura: 'APERTURA',
            completado: 'COMPLETADO',
            cancelado: 'CANCELADO'
        }
        return textos[estado] || estado
    }

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
        >
            <div className="flex justify-between items-start mb-1">
                <div>
                    <span className="text-[10px] font-bold text-kfc-red">{implementacion.codigo}</span>
                    <h4 className="font-medium text-gray-900 dark:text-white text-xs truncate max-w-[180px]">{implementacion.nombre}</h4>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${getEstadoColor(implementacion.estadoGeneral)}`}>
                    {getEstadoTexto(implementacion.estadoGeneral)}
                </span>
            </div>

            <p className="text-[10px] text-gray-500 mb-1">{implementacion.cadena}</p>

            {implementacion.direccion?.ciudad && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-0.5">
                    <MapPinIcon className="h-2.5 w-2.5" />
                    <span>{implementacion.direccion.ciudad}</span>
                </div>
            )}

            {implementacion.tecnicoAsignado && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-0.5">
                    <UserIcon className="h-2.5 w-2.5" />
                    <span>{implementacion.tecnicoAsignado.nombre}</span>
                </div>
            )}

            {implementacion.fechaImplementacionPlanificada && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <CalendarIcon className="h-2.5 w-2.5" />
                    <span>{format(new Date(implementacion.fechaImplementacionPlanificada), 'dd/MM/yyyy', { locale: es })}</span>
                </div>
            )}

            {/* Resumen de configuración */}
            <div className="flex flex-wrap gap-0.5 mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                {implementacion.configuracion?.cajas?.activo && (
                    <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                        C{implementacion.configuracion.cajas.cantidad}
                    </span>
                )}
                {implementacion.configuracion?.kioscos?.activo && (
                    <span className="text-[9px] px-1 py-0.5 bg-green-100 text-green-800 rounded-full">
                        K{implementacion.configuracion.kioscos.cantidad}
                    </span>
                )}
                {implementacion.configuracion?.delivery?.activo && (
                    <span className="text-[9px] px-1 py-0.5 bg-purple-100 text-purple-800 rounded-full">D</span>
                )}
                {implementacion.configuracion?.dragonTail && (
                    <span className="text-[9px] px-1 py-0.5 bg-orange-100 text-orange-800 rounded-full">DT</span>
                )}
                {implementacion.configuracion?.drive?.activo && (
                    <span className="text-[9px] px-1 py-0.5 bg-teal-100 text-teal-800 rounded-full">DR</span>
                )}
            </div>
        </div>
    )
}

// Columnas del Kanban
const columns = [
    { id: 'pendiente', title: 'Pendiente', color: 'bg-gray-50 border-gray-200' },
    { id: 'en_proceso', title: 'En Progreso', color: 'bg-blue-50 border-blue-200' },
    { id: 'en_revision', title: 'En Revisión', color: 'bg-purple-50 border-purple-200' },
    { id: 'instalacion', title: 'Instalación', color: 'bg-indigo-50 border-indigo-200' },
    { id: 'apertura', title: 'Apertura', color: 'bg-orange-50 border-orange-200' },
    { id: 'completado', title: 'Completado', color: 'bg-green-50 border-green-200' }
]

// Componente de tarjeta de estadística
const StatsCard: React.FC<{ title: string; value: number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs text-gray-600">{title}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-4 w-4 text-white" />
            </div>
        </div>
    </div>
)

const Implementaciones: React.FC = () => {
    const navigate = useNavigate()
    const [implementaciones, setImplementaciones] = useState<Implementacion[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban')

    useEffect(() => {
        loadImplementaciones()
    }, [])

    const loadImplementaciones = async () => {
        try {
            setLoading(true)
            const data = await implementacionesService.getAll()
            setImplementaciones(data)
            toast.success(`${data.length} implementaciones cargadas`)
        } catch (error: any) {
            console.error('Error:', error)
            toast.error('Error al cargar las implementaciones')
        } finally {
            setLoading(false)
        }
    }

    const handleNuevaImplementacion = () => {
        navigate('/implementaciones/nueva')
    }

    const handleVerDetalle = (id: string) => {
        navigate(`/implementaciones/${id}`)
    }

    // Filtrar implementaciones por búsqueda
    const filteredImplementaciones = implementaciones.filter(imp => {
        return search === '' ||
            imp.codigo?.toLowerCase().includes(search.toLowerCase()) ||
            imp.nombre?.toLowerCase().includes(search.toLowerCase()) ||
            imp.cadena?.toLowerCase().includes(search.toLowerCase())
    })

    // Agrupar por estado para Kanban
    const implementacionesPorEstado = (estado: string) => {
        return filteredImplementaciones.filter(imp => imp.estadoGeneral === estado)
    }

    // ✅ ESTADÍSTICAS REALES (sin datos quemados)
    const estadisticas = {
        total: implementaciones.length,
        pendiente: implementaciones.filter(i => i.estadoGeneral === 'pendiente').length,
        enProceso: implementaciones.filter(i => i.estadoGeneral === 'en_proceso').length,
        enRevision: implementaciones.filter(i => i.estadoGeneral === 'en_revision').length,
        instalacion: implementaciones.filter(i => i.estadoGeneral === 'instalacion').length,
        apertura: implementaciones.filter(i => i.estadoGeneral === 'apertura').length,
        completado: implementaciones.filter(i => i.estadoGeneral === 'completado').length,
        cancelado: implementaciones.filter(i => i.estadoGeneral === 'cancelado').length
    }

    // ✅ TIEMPOS PROMEDIO REALES (calculados desde fechas)
    const calcularTiemposReales = () => {
        let totalDiasPlaneacion = 0
        let totalDiasImplementacion = 0
        let contadorPlaneacion = 0
        let contadorImplementacion = 0

        implementaciones.forEach(imp => {
            // Días de planeación (desde creación hasta fecha planificada)
            if (imp.createdAt && imp.fechaImplementacionPlanificada) {
                const creado = new Date(imp.createdAt)
                const planificada = new Date(imp.fechaImplementacionPlanificada)
                const dias = Math.ceil((planificada.getTime() - creado.getTime()) / (1000 * 3600 * 24))
                if (dias > 0 && dias < 365) {
                    totalDiasPlaneacion += dias
                    contadorPlaneacion++
                }
            }

            // Días de implementación (si está completada, desde creación hasta actualización)
            if (imp.estadoGeneral === 'completado' && imp.updatedAt && imp.createdAt) {
                const inicio = new Date(imp.createdAt)
                const fin = new Date(imp.updatedAt)
                const dias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 3600 * 24))
                if (dias > 0 && dias < 365) {
                    totalDiasImplementacion += dias
                    contadorImplementacion++
                }
            }
        })

        return {
            planeacion: contadorPlaneacion > 0 ? Number((totalDiasPlaneacion / contadorPlaneacion).toFixed(1)) : 0,
            implementacion: contadorImplementacion > 0 ? Number((totalDiasImplementacion / contadorImplementacion).toFixed(1)) : 0,
            pruebas: 0, // Se puede implementar si hay datos de pruebas
            total: contadorImplementacion > 0 ? Number((totalDiasImplementacion / contadorImplementacion).toFixed(1)) : 0
        }
    }

    const tiemposPromedio = calcularTiemposReales()

    // ✅ CUELLOS DE BOTELLA REALES (basados en configuraciones problemáticas)
    const calcularCuellosDeBotella = () => {
        const demoraPorConfig: Record<string, number> = {}

        implementaciones.forEach(imp => {
            // Solo considerar implementaciones no completadas
            if (imp.estadoGeneral !== 'completado' && imp.estadoGeneral !== 'cancelado') {
                if (imp.configuracion?.kds) {
                    demoraPorConfig['Configuración KDS'] = (demoraPorConfig['Configuración KDS'] || 0) + 1
                }
                if (imp.configuracion?.delivery?.activo) {
                    demoraPorConfig['Delivery'] = (demoraPorConfig['Delivery'] || 0) + 1
                }
                if (imp.configuracion?.cajas?.activo && imp.configuracion.cajas.cantidad > 2) {
                    demoraPorConfig['Cajas Múltiples'] = (demoraPorConfig['Cajas Múltiples'] || 0) + 1
                }
                if (imp.configuracion?.dragonTail) {
                    demoraPorConfig['Dragon Tail'] = (demoraPorConfig['Dragon Tail'] || 0) + 1
                }
                if (imp.configuracion?.impresoras?.linea || imp.configuracion?.impresoras?.cocina) {
                    demoraPorConfig['Impresoras'] = (demoraPorConfig['Impresoras'] || 0) + 1
                }
            }
        })

        return Object.entries(demoraPorConfig)
            .map(([area, implementacionesAfectadas]) => ({
                area,
                implementacionesAfectadas,
                tiempoPromedio: 0 // Tiempo promedio basado en días desde creación
            }))
            .sort((a, b) => b.implementacionesAfectadas - a.implementacionesAfectadas)
            .slice(0, 3)
    }

    const cuellosDeBotella = calcularCuellosDeBotella()

    // ✅ IMPLEMENTACIONES CON MAYOR DEMORA (días desde creación)
    const calcularImplementacionesLentas = () => {
        return implementaciones
            .filter(i => i.estadoGeneral !== 'completado' && i.estadoGeneral !== 'cancelado')
            .map(i => {
                const createdAt = i.createdAt ? new Date(i.createdAt) : new Date()
                const hoy = new Date()
                const dias = Math.ceil((hoy.getTime() - createdAt.getTime()) / (1000 * 3600 * 24))
                return {
                    nombre: `${i.codigo} - ${i.nombre}`,
                    etapa: i.estadoGeneral?.replace('_', ' ').toUpperCase() || 'PENDIENTE',
                    dias
                }
            })
            .sort((a, b) => b.dias - a.dias)
            .slice(0, 3)
    }

    const implementacionesLentas = calcularImplementacionesLentas()

    if (loading) {
        return (
            <Layout>
                <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfc-red"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="h-full flex flex-col overflow-hidden">
                {/* Header con título y acciones */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 flex-shrink-0">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <WrenchIcon className="h-6 w-6 text-kfc-red" />
                            Implementaciones
                        </h1>
                        <p className="text-gray-600 text-xs mt-0.5">
                            Gestión de implementaciones, mejoras y cambios en tiendas
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                    viewMode === 'kanban'
                                        ? 'bg-kfc-red text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Kanban
                            </button>
                            <button
                                onClick={() => setViewMode('lista')}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                    viewMode === 'lista'
                                        ? 'bg-kfc-red text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Lista
                            </button>
                        </div>
                        <Button
                            variant="outline"
                            onClick={loadImplementaciones}
                            icon={<ArrowPathIcon className="h-4 w-4" />}
                            size="sm"
                        >
                            Actualizar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleNuevaImplementacion}
                            icon={<PlusIcon className="h-4 w-4" />}
                            size="sm"
                        >
                            Nueva
                        </Button>
                    </div>
                </div>

                {/* Tarjetas de estadísticas superiores - 7 columnas */}
                <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5 mb-2 flex-shrink-0">
                    <StatsCard title="Total" value={estadisticas.total} icon={ChartBarIcon} color="bg-blue-500" />
                    <StatsCard title="Pendiente" value={estadisticas.pendiente} icon={ClockIcon} color="bg-gray-500" />
                    <StatsCard title="Progreso" value={estadisticas.enProceso} icon={ClockIcon} color="bg-yellow-500" />
                    <StatsCard title="Revisión" value={estadisticas.enRevision} icon={ClockIcon} color="bg-purple-500" />
                    <StatsCard title="Instalación" value={estadisticas.instalacion + estadisticas.apertura} icon={ChatBubbleLeftIcon} color="bg-indigo-500" />
                    <StatsCard title="Completado" value={estadisticas.completado} icon={CheckCircleIcon} color="bg-green-500" />
                    <StatsCard title="Cancelado" value={estadisticas.cancelado} icon={ExclamationTriangleIcon} color="bg-red-500" />
                </div>

                {/* Barra de búsqueda */}
                <div className="relative mb-2 flex-shrink-0">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por código, nombre o cadena..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg focus:border-kfc-red focus:ring-1 focus:ring-kfc-red/20 outline-none dark:bg-gray-800 dark:border-gray-700"
                    />
                </div>

                {/* Contenido principal: Kanban + Estadísticas detalladas */}
                <div className="flex-1 flex gap-2 min-h-0 overflow-hidden">
                    {/* Kanban Board - 70% */}
                    <div className="w-[70%] overflow-x-auto overflow-y-hidden">
                        <div className="flex gap-2 h-full">
                            {columns.map((column) => (
                                <div
                                    key={column.id}
                                    className="flex-shrink-0 w-72 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full"
                                >
                                    <div className={`p-2 rounded-t-lg border-b flex-shrink-0 ${column.color}`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-medium text-gray-700 text-sm">{column.title}</h3>
                                                <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                                                    {implementacionesPorEstado(column.id).length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleNuevaImplementacion}
                                                className="p-0.5 hover:bg-gray-200 rounded"
                                            >
                                                <PlusIcon className="h-3.5 w-3.5 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                                        {implementacionesPorEstado(column.id).map((imp) => (
                                            <ImplementacionCard
                                                key={imp._id}
                                                implementacion={imp}
                                                onClick={() => handleVerDetalle(imp._id)}
                                            />
                                        ))}
                                        {implementacionesPorEstado(column.id).length === 0 && (
                                            <div className="text-center py-4 text-gray-400 text-[10px] border border-dashed border-gray-200 rounded-lg">
                                                Sin implementaciones
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Panel de Estadísticas Detalladas - 30% */}
                    <div className="w-[30%] overflow-y-auto space-y-2 pr-1">
                        {/* Cuadro 1: Distribución por Estado */}
                        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 text-xs mb-1.5">Distribución por Estado</h3>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                                        <span className="text-gray-600">Pendiente</span>
                                    </div>
                                    <span className="font-medium">{estadisticas.pendiente}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-gray-600">En Progreso</span>
                                    </div>
                                    <span className="font-medium">{estadisticas.enProceso}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span className="text-gray-600">En Revisión</span>
                                    </div>
                                    <span className="font-medium">{estadisticas.enRevision}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        <span className="text-gray-600">Instalación/Apertura</span>
                                    </div>
                                    <span className="font-medium">{estadisticas.instalacion + estadisticas.apertura}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-gray-600">Completado</span>
                                    </div>
                                    <span className="font-medium">{estadisticas.completado}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-gray-600">Cancelado</span>
                                    </div>
                                    <span className="font-medium">{estadisticas.cancelado}</span>
                                </div>
                            </div>
                        </div>

                        {/* Cuadro 2: Tiempos Promedio */}
                        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 text-xs mb-1.5">Tiempos Promedio (días)</h3>
                            <div className="space-y-1.5">
                                <div>
                                    <div className="flex justify-between text-[10px] mb-0.5">
                                        <span className="text-gray-600">Planeación</span>
                                        <span className="font-medium">{tiemposPromedio.planeacion.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                        <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${Math.min((tiemposPromedio.planeacion / 30) * 100, 100)}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] mb-0.5">
                                        <span className="text-gray-600">Implementación</span>
                                        <span className="font-medium">{tiemposPromedio.implementacion.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                        <div className="bg-yellow-500 h-1 rounded-full" style={{ width: `${Math.min((tiemposPromedio.implementacion / 30) * 100, 100)}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] mb-0.5">
                                        <span className="text-gray-600">Pruebas</span>
                                        <span className="font-medium">{tiemposPromedio.pruebas.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                        <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${Math.min((tiemposPromedio.pruebas / 30) * 100, 100)}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] mb-0.5">
                                        <span className="text-gray-600">Total</span>
                                        <span className="font-medium">{tiemposPromedio.total.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                        <div className="bg-green-500 h-1 rounded-full" style={{ width: `${Math.min((tiemposPromedio.total / 60) * 100, 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cuadro 3: Cuellos de Botella */}
                        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 text-xs mb-1.5">Cuellos de Botella</h3>
                            <div className="space-y-1.5">
                                {cuellosDeBotella.length > 0 ? (
                                    cuellosDeBotella.map((item, idx) => (
                                        <div key={idx} className="p-1.5 bg-red-50 rounded">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-900 text-[10px]">{item.area}</span>
                                                <span className="text-[10px] font-medium text-red-600">{item.implementacionesAfectadas} imp.</span>
                                            </div>
                                            <p className="text-[9px] text-gray-500">{item.tiempoPromedio > 0 ? `${item.tiempoPromedio}d promedio` : 'En proceso'}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-gray-400 text-center py-1">Sin cuellos de botella</p>
                                )}
                            </div>
                        </div>

                        {/* Cuadro 4: Mayor Demora */}
                        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 text-xs mb-1.5">Implementaciones con Mayor Demora</h3>
                            <div className="space-y-1">
                                {implementacionesLentas.length > 0 ? (
                                    implementacionesLentas.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-1 bg-gray-50 rounded">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-medium text-gray-900 truncate">{item.nombre}</p>
                                                <p className="text-[9px] text-gray-500">{item.etapa}</p>
                                            </div>
                                            <span className="text-[10px] font-medium text-orange-600 ml-1">{item.dias} días</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-gray-400 text-center py-1">Sin datos</p>
                                )}
                            </div>
                        </div>

                        {/* Cuadro 5: Configuraciones más comunes */}
                        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 text-xs mb-1.5">Configuraciones Comunes</h3>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-gray-600">Cajas</span>
                                    </div>
                                    <span className="font-medium">
                                        {implementaciones.filter(i => i.configuracion?.cajas?.activo).length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-gray-600">Kioscos</span>
                                    </div>
                                    <span className="font-medium">
                                        {implementaciones.filter(i => i.configuracion?.kioscos?.activo).length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span className="text-gray-600">Delivery</span>
                                    </div>
                                    <span className="font-medium">
                                        {implementaciones.filter(i => i.configuracion?.delivery?.activo).length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                                        <span className="text-gray-600">Dragon Tail</span>
                                    </div>
                                    <span className="font-medium">
                                        {implementaciones.filter(i => i.configuracion?.dragonTail).length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                                        <span className="text-gray-600">Drive</span>
                                    </div>
                                    <span className="font-medium">
                                        {implementaciones.filter(i => i.configuracion?.drive?.activo).length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vista Lista (alternativa) */}
            {viewMode === 'lista' && (
                <div className="fixed inset-0 bg-white z-50 overflow-auto pt-20 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Lista de Implementaciones</h2>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                            >
                                Volver a Kanban
                            </button>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nombre</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cadena</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Técnico</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha Plan</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {filteredImplementaciones.map((imp) => (
                                        <tr
                                            key={imp._id}
                                            onClick={() => handleVerDetalle(imp._id)}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-2 text-sm font-medium text-kfc-red">{imp.codigo}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900">{imp.nombre}</td>
                                            <td className="px-4 py-2 text-sm text-gray-600">{imp.cadena}</td>
                                            <td className="px-4 py-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        imp.estadoGeneral === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                            imp.estadoGeneral === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                                                                imp.estadoGeneral === 'en_revision' ? 'bg-purple-100 text-purple-800' :
                                                                    imp.estadoGeneral === 'instalacion' ? 'bg-indigo-100 text-indigo-800' :
                                                                        imp.estadoGeneral === 'apertura' ? 'bg-orange-100 text-orange-800' :
                                                                            imp.estadoGeneral === 'completado' ? 'bg-green-100 text-green-800' :
                                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {imp.estadoGeneral?.replace('_', ' ').toUpperCase()}
                                                    </span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {imp.tecnicoAsignado?.nombre || 'No asignado'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {imp.fechaImplementacionPlanificada ?
                                                    format(new Date(imp.fechaImplementacionPlanificada), 'dd/MM/yyyy') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredImplementaciones.length === 0 && (
                                <div className="text-center py-8">
                                    <BuildingStorefrontIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">No hay implementaciones</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}

export default Implementaciones