import React, { useState } from 'react'
import Layout from '../components/layout/Layout'
import Card from '../components/common/Card'
import Badge from '../components/common/Badge'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'
import {
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline'

interface ProcesoCompleto {
    id: string
    etapa: string
    actividad: string
    responsable: string
    area: string
    requiereValidacion: boolean
    tiempoEstimado: number
    activo: boolean
}

const PROCESOS_COMPLETOS: ProcesoCompleto[] = [
    // Planeación
    { id: '1', etapa: 'Planeación', actividad: 'Recepción de solicitud de nueva tienda', responsable: 'Operaciones', area: 'Operaciones', requiereValidacion: true, tiempoEstimado: 8, activo: true },
    { id: '2', etapa: 'Planeación', actividad: 'Fecha de apertura', responsable: 'Operaciones', area: 'Operaciones', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '3', etapa: 'Planeación', actividad: 'Asignación de código de tienda', responsable: 'Operaciones', area: 'Operaciones', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '4', etapa: 'Planeación', actividad: 'Visita técnica al local', responsable: 'IT', area: 'IT', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '5', etapa: 'Planeación', actividad: 'Revisión y aprobación de planos', responsable: 'IT', area: 'IT', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '6', etapa: 'Planeación', actividad: 'Instalación de puntos de red, energía y racks', responsable: 'IT', area: 'IT', requiereValidacion: true, tiempoEstimado: 0, activo: true },

    // Pre-Apertura
    { id: '7', etapa: 'Pre-Apertura', actividad: 'Creación de tienda en MXP', responsable: 'DSI', area: 'DSI', requiereValidacion: true, tiempoEstimado: 0.02, activo: true },
    { id: '8', etapa: 'Pre-Apertura', actividad: 'Creación de tienda en SIR', responsable: 'Operaciones', area: 'Operaciones', requiereValidacion: true, tiempoEstimado: 0.02, activo: true },
    { id: '9', etapa: 'Pre-Apertura', actividad: 'Emisión de Check List RUC', responsable: 'IT', area: 'IT', requiereValidacion: true, tiempoEstimado: 8, activo: true },
    { id: '10', etapa: 'Pre-Apertura', actividad: 'Configuración según Check List RUC', responsable: 'DSI', area: 'DSI', requiereValidacion: false, tiempoEstimado: 151, activo: true },
    { id: '11', etapa: 'Pre-Apertura', actividad: 'Solicitud de Pinpad y Homologación', responsable: 'Contabilidad', area: 'Contabilidad', requiereValidacion: true, tiempoEstimado: 0.3, activo: true },
    { id: '12', etapa: 'Pre-Apertura', actividad: 'Configuración de tienda en el SWT', responsable: 'DSI', area: 'DSI', requiereValidacion: false, tiempoEstimado: 0, activo: true },
    { id: '13', etapa: 'Pre-Apertura', actividad: 'Configuración de políticas restaurante', responsable: 'DSI', area: 'DSI', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '14', etapa: 'Pre-Apertura', actividad: 'Configuración estaciones / Mesas', responsable: 'DSI', area: 'DSI', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '15', etapa: 'Pre-Apertura', actividad: 'Configuración de métodos de pago', responsable: 'DSI', area: 'DSI', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '16', etapa: 'Pre-Apertura', actividad: 'Configuración de domicilios', responsable: 'DSI', area: 'DSI', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '17', etapa: 'Pre-Apertura', actividad: 'Creación de usuarios de tienda', responsable: 'IT: Mesa de Servicio', area: 'IT', requiereValidacion: false, tiempoEstimado: 0, activo: true },
    { id: '18', etapa: 'Pre-Apertura', actividad: 'Confirmación de conexión a los equipos', responsable: 'IT', area: 'IT', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '19', etapa: 'Pre-Apertura', actividad: 'Réplica inicial', responsable: 'DSI', area: 'DSI', requiereValidacion: true, tiempoEstimado: 0.3, activo: true },
    { id: '20', etapa: 'Pre-Apertura', actividad: 'Notificación a Trade para kioscos y APP', responsable: 'DSI', area: 'DSI', requiereValidacion: true, tiempoEstimado: 8, activo: true },
    { id: '21', etapa: 'Pre-Apertura', actividad: 'Validación de sincronización de tiendas', responsable: 'Trade', area: 'Trade', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '22', etapa: 'Pre-Apertura', actividad: 'Instalación de equipos POS', responsable: 'IT', area: 'IT', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '23', etapa: 'Pre-Apertura', actividad: 'Conexión a red de la tienda', responsable: 'IT', area: 'IT', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '24', etapa: 'Pre-Apertura', actividad: 'Configuración de impresoras fiscales', responsable: 'IT', area: 'IT', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '25', etapa: 'Pre-Apertura', actividad: 'Solicitud de servicio Dragon Tail', responsable: 'DSI', area: 'DSI', requiereValidacion: false, tiempoEstimado: 0.15, activo: true },
    { id: '26', etapa: 'Pre-Apertura', actividad: 'Confirmación de servicio Dragon Tail', responsable: 'DSI', area: 'DSI', requiereValidacion: false, tiempoEstimado: 0.05, activo: true },
    { id: '27', etapa: 'Pre-Apertura', actividad: 'Despliegue de servicios Server', responsable: 'DSI', area: 'DSI', requiereValidacion: true, tiempoEstimado: 1.5, activo: true },
    { id: '28', etapa: 'Pre-Apertura', actividad: 'Paso de servicios Cajas', responsable: 'DSI', area: 'DSI', requiereValidacion: true, tiempoEstimado: 1.5, activo: true },

    // Pruebas UAT
    { id: '29', etapa: 'Pruebas UAT', actividad: 'Prueba técnica de sistemas', responsable: 'IT', area: 'IT', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '30', etapa: 'Pruebas UAT', actividad: 'Monitoreo de sistemas', responsable: 'DSI', area: 'DSI', requiereValidacion: true, tiempoEstimado: 0, activo: true },
    { id: '31', etapa: 'Pruebas UAT', actividad: 'Prueba de emisión de primera factura', responsable: 'IT', area: 'IT', requiereValidacion: true, tiempoEstimado: 0.15, activo: true },
    { id: '32', etapa: 'Pruebas UAT', actividad: 'Envío de la primera factura a contabilidad', responsable: 'Contabilidad', area: 'Contabilidad', requiereValidacion: true, tiempoEstimado: 3, activo: true },
    { id: '33', etapa: 'Pruebas UAT', actividad: 'Entrega de Checklist RUC', responsable: 'IT', area: 'IT', requiereValidacion: true, tiempoEstimado: 16, activo: true },

    // Apertura
    { id: '34', etapa: 'Apertura', actividad: 'Acompañamiento en día de apertura', responsable: 'IT', area: 'IT', requiereValidacion: false, tiempoEstimado: 8, activo: true },
    { id: '35', etapa: 'Apertura', actividad: 'Acompañamiento en día de apertura', responsable: 'DSI', area: 'DSI', requiereValidacion: false, tiempoEstimado: 8, activo: true },

    // Post-apertura
    { id: '36', etapa: 'Post-apertura', actividad: 'Monitoreo de sistema en primeras', responsable: 'IT', area: 'IT', requiereValidacion: false, tiempoEstimado: 24, activo: true },
    { id: '37', etapa: 'Post-apertura', actividad: 'Monitoreo de sistema en primeras', responsable: 'DSI', area: 'DSI', requiereValidacion: false, tiempoEstimado: 24, activo: true },

    // Cierre
    { id: '38', etapa: 'Cierre', actividad: 'Cierre de apertura', responsable: 'IT', area: 'IT', requiereValidacion: false, tiempoEstimado: 8, activo: true },
]

const Procesos: React.FC = () => {
    const { isAdmin } = useAuth()
    const [procesos, setProcesos] = useState<ProcesoCompleto[]>(PROCESOS_COMPLETOS)
    const [search, setSearch] = useState('')
    const [filterEtapa, setFilterEtapa] = useState('')
    const [editando, setEditando] = useState<string | null>(null)
    const [nuevoProceso, setNuevoProceso] = useState<Partial<ProcesoCompleto>>({})

    const etapas = ['', ...Array.from(new Set(procesos.map(p => p.etapa)))]

    const filteredProcesos = procesos.filter(proceso => {
        const matchesSearch = search === '' ||
            proceso.actividad.toLowerCase().includes(search.toLowerCase()) ||
            proceso.responsable.toLowerCase().includes(search.toLowerCase())

        const matchesFilter = filterEtapa === '' || proceso.etapa === filterEtapa

        return matchesSearch && matchesFilter && proceso.activo
    })

    const formatTiempo = (horas: number) => {
        if (horas === 0) return 'Inmediato'
        if (horas < 1) return `${Math.round(horas * 60)} min`
        if (horas === 1) return '1 hora'
        if (horas < 24) return `${horas} horas`
        const dias = Math.floor(horas / 24)
        const horasRestantes = horas % 24
        if (horasRestantes === 0) return `${dias} día${dias > 1 ? 's' : ''}`
        return `${dias}d ${horasRestantes}h`
    }

    const handleToggleActivo = (id: string) => {
        if (!isAdmin) return
        setProcesos(procesos.map(p =>
            p.id === id ? { ...p, activo: !p.activo } : p
        ))
    }

    const handleEdit = (proceso: ProcesoCompleto) => {
        if (!isAdmin) return
        setEditando(proceso.id)
        setNuevoProceso(proceso)
    }

    const handleSave = () => {
        if (!isAdmin || !editando) return
        setProcesos(procesos.map(p =>
            p.id === editando ? { ...p, ...nuevoProceso } : p
        ))
        setEditando(null)
        setNuevoProceso({})
    }

    const handleDelete = (id: string) => {
        if (!isAdmin) return
        if (window.confirm('¿Estás seguro de eliminar este proceso?')) {
            setProcesos(procesos.filter(p => p.id !== id))
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestión de Procesos</h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Administra los procesos de apertura de tiendas
                        </p>
                    </div>
                    {isAdmin && (
                        <Button
                            variant="primary"
                            onClick={() => {/* Agregar nuevo proceso */}}
                            icon={<PlusIcon className="h-4 w-4" />}
                        >
                            Nuevo Proceso
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Buscar por actividad o responsable..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                            />
                        </div>
                        <div className="sm:w-64">
                            <select
                                value={filterEtapa}
                                onChange={(e) => setFilterEtapa(e.target.value)}
                                className="input"
                            >
                                <option value="">Todas las etapas</option>
                                {etapas.filter(e => e).map(etapa => (
                                    <option key={etapa} value={etapa}>{etapa}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Tabla de procesos */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Etapa</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actividad</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable / Área</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Requiere Validación</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tiempo Estimado</th>
                                {isAdmin && (
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                )}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {filteredProcesos.map((proceso) => (
                                <tr key={proceso.id} className="hover:bg-gray-50">
                                    {editando === proceso.id ? (
                                        // Modo edición
                                        <>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={nuevoProceso.etapa || ''}
                                                    onChange={(e) => setNuevoProceso({...nuevoProceso, etapa: e.target.value})}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={nuevoProceso.actividad || ''}
                                                    onChange={(e) => setNuevoProceso({...nuevoProceso, actividad: e.target.value})}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={nuevoProceso.responsable || ''}
                                                    onChange={(e) => setNuevoProceso({...nuevoProceso, responsable: e.target.value})}
                                                    placeholder="Responsable"
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-1"
                                                />
                                                <input
                                                    type="text"
                                                    value={nuevoProceso.area || ''}
                                                    onChange={(e) => setNuevoProceso({...nuevoProceso, area: e.target.value})}
                                                    placeholder="Área"
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={nuevoProceso.requiereValidacion}
                                                    onChange={(e) => setNuevoProceso({...nuevoProceso, requiereValidacion: e.target.checked})}
                                                    className="rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={nuevoProceso.tiempoEstimado || 0}
                                                    onChange={(e) => setNuevoProceso({...nuevoProceso, tiempoEstimado: parseFloat(e.target.value)})}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2">
                                                    <Button size="sm" variant="primary" onClick={handleSave}>
                                                        Guardar
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => setEditando(null)}>
                                                        Cancelar
                                                    </Button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        // Modo vista
                                        <>
                                            <td className="px-4 py-3 text-sm text-gray-900">{proceso.etapa}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{proceso.actividad}</td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-900">{proceso.responsable}</div>
                                                <div className="text-xs text-gray-500">{proceso.area}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {proceso.requiereValidacion ? (
                                                    <Badge status="warning" size="sm">Sí</Badge>
                                                ) : (
                                                    <Badge status="default" size="sm">No</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-900">
                                                {formatTiempo(proceso.tiempoEstimado)}
                                            </td>
                                            {isAdmin && (
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(proceso)}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                            title="Editar"
                                                        >
                                                            <PencilIcon className="h-4 w-4 text-gray-600" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(proceso.id)}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <TrashIcon className="h-4 w-4 text-red-600" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleActivo(proceso.id)}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                            title={proceso.activo ? "Desactivar" : "Activar"}
                                                        >
                                                            {proceso.activo ? (
                                                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <XCircleIcon className="h-4 w-4 text-red-600" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </>
                                    )}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </Layout>
    )
}

export default Procesos