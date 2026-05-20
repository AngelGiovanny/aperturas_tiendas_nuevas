import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import { useAuth } from '../hooks/useAuth'
import { tiendasService } from '../services/tiendas'
import { procesoService } from '../services/procesos'
import { Tienda, Proceso, CheckItem } from '@/types'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    BellIcon,
    UserCircleIcon,
    Cog6ToothIcon,
    CheckCircleIcon,
    CalendarIcon,
    XMarkIcon,
    CheckIcon,
    TrashIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'

// Tipos
interface ChecklistItem {
    id: string
    nombre: string
    completado: boolean
    responsable?: string
    fechaLimite?: string
    aplica?: boolean | null
}

interface Card {
    id: string
    tiendaId: string
    title: string
    description: string
    labels: string[]
    dueDate?: string
    comments: number
    attachments: number
    checklist: {
        items: ChecklistItem[]
        completed: number
        total: number
    }
    assignees: string[]
    tienda: string
    servicios: {
        kds: boolean
        dragonTail: boolean | null
        kioscos: boolean | null
        delivery: boolean
        drive: boolean
        upsellling: boolean
    }
    configuraciones: {
        estaciones: boolean
        impresiones: boolean
        formaPago: boolean
        replicaInicial: boolean
        politicas: boolean
        pickUp: boolean
        usuariosSA: boolean
        mxpSocket: boolean
        mxpCredenciales: boolean
        mxpReportes: boolean
        mxpFacturacion: boolean
        reduccionLogs: boolean
        pasoVersionPOS: boolean
        servicioTarjetas: boolean
        impresionesNetcore: boolean
        codigosComercio: boolean
    }
    pruebas: {
        estado: 'pendiente' | 'en_proceso' | 'completado'
        responsable?: string
        fechaCulminacion?: string
    }
    seguimientoApertura?: {
        activo: boolean
        mensajes: number
        ultimoMensaje?: string
        finalizado: boolean
    }
}

interface Column {
    id: string
    title: string
    color: string
    cards: Card[]
}

// Interfaz para estadísticas calculadas
interface EstadisticasCalculadas {
    totalTiendas: number
    porEstado: {
        pendiente: number
        en_proceso: number
        en_revision: number
        apertura: number
        completado: number
    }
    tiemposPromedio: {
        planeacion: number
        preApertura: number
        pruebas: number
        apertura: number
    }
    cuellosDeBotella: {
        area: string
        tiendasAfectadas: number
        tiempoPromedio: number
    }[]
    tiendasLentas: {
        nombre: string
        tiempo: number
        etapa: string
    }[]
    atrasadas: number
}

// LISTA COMPLETA DE 24 ITEMS DEL CHECKLIST (constante global)
const CHECKLIST_COMPLETO: ChecklistItem[] = [
    { id: '1', nombre: 'Fecha tentativa de salida', completado: false },
    { id: '2', nombre: 'Configuración Estaciones', completado: false },
    { id: '3', nombre: 'Configuración Impresiones', completado: false },
    { id: '4', nombre: 'Configuracion Forma de Pago', completado: false },
    { id: '5', nombre: 'Replica Inicial', completado: false },
    { id: '6', nombre: 'Politicas', completado: false },
    { id: '7', nombre: 'Pick Up', completado: false },
    { id: '8', nombre: 'Usuario Nuevos SA', completado: false },
    { id: '9', nombre: 'kds', completado: false },
    { id: '10', nombre: 'MXP-Socket Despacho', completado: false },
    { id: '11', nombre: 'Mxp-credenciales', completado: false },
    { id: '12', nombre: 'Mxp-reportes', completado: false },
    { id: '13', nombre: 'Mxp-facturación electrónica', completado: false },
    { id: '14', nombre: 'Reducción de Logs', completado: false },
    { id: '15', nombre: 'Paso de version POS', completado: false },
    { id: '16', nombre: 'Dragon Tail', completado: false },
    { id: '17', nombre: 'Upselling', completado: false },
    { id: '18', nombre: 'Kioscos', completado: false },
    { id: '19', nombre: 'Servicio de tarjetas', completado: false },
    { id: '20', nombre: 'servicio de impresiones netcore', completado: false },
    { id: '21', nombre: 'Códigos de Comercio', completado: false },
    { id: '22', nombre: 'Pruebas', completado: false },
    { id: '23', nombre: 'Responsable', completado: false },
    { id: '24', nombre: 'Fecha de culminacion', completado: false },
]

// Modal de Seguimiento de Apertura
interface AperturaModalProps {
    isOpen: boolean
    onClose: () => void
    card: Card | null
    onFinalizar: (cardId: string) => void
}

const AperturaModal: React.FC<AperturaModalProps> = ({ isOpen, onClose, card, onFinalizar }) => {
    const [mensajes, setMensajes] = useState<Array<{ usuario: string; texto: string; fecha: Date }>>([
        { usuario: 'Sistema', texto: 'Inicio del proceso de apertura', fecha: new Date() }
    ])
    const [nuevoMensaje, setNuevoMensaje] = useState('')

    if (!isOpen || !card) return null

    const handleEnviarMensaje = () => {
        if (!nuevoMensaje.trim()) return
        setMensajes([...mensajes, {
            usuario: 'Usuario',
            texto: nuevoMensaje,
            fecha: new Date()
        }])
        setNuevoMensaje('')
    }

    const handleFinalizar = () => {
        if (window.confirm('¿Estás seguro de que deseas finalizar el proceso de apertura?')) {
            onFinalizar(card.id)
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        Seguimiento de Apertura - {card.tienda}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="h-80 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
                        {mensajes.map((msg, idx) => (
                            <div key={idx} className={`mb-3 ${msg.usuario === 'Sistema' ? 'text-center' : ''}`}>
                                {msg.usuario === 'Sistema' ? (
                                    <span className="text-xs bg-gray-200 px-3 py-1 rounded-full">
                                        {msg.texto}
                                    </span>
                                ) : (
                                    <div className="bg-white p-2 rounded-lg shadow-sm max-w-[80%]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium">{msg.usuario}</span>
                                            <span className="text-xs text-gray-400">
                                                {msg.fecha.toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-sm">{msg.texto}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={nuevoMensaje}
                            onChange={(e) => setNuevoMensaje(e.target.value)}
                            placeholder="Escribe una novedad..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none"
                            onKeyPress={(e) => e.key === 'Enter' && handleEnviarMensaje()}
                        />
                        <button
                            onClick={handleEnviarMensaje}
                            className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-kfc-red-600"
                        >
                            Enviar
                        </button>
                    </div>

                    <button
                        onClick={handleFinalizar}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="h-5 w-5" />
                        FINALIZAR APERTURA
                    </button>
                </div>
            </div>
        </div>
    )
}

// Modal para servicios
interface ServiciosModalProps {
    isOpen: boolean
    onClose: () => void
    card: Card | null
    onSave: (cardId: string, servicios: any) => void
}

const ServiciosModal: React.FC<ServiciosModalProps> = ({ isOpen, onClose, card, onSave }) => {
    const [servicios, setServicios] = useState(() => {
        if (card) {
            return {
                kds: card.servicios?.kds || false,
                dragonTail: card.servicios?.dragonTail,
                kioscos: card.servicios?.kioscos,
                delivery: card.servicios?.delivery || false,
                drive: card.servicios?.drive || false,
                upsellling: card.servicios?.upsellling || false
            }
        }
        return {
            kds: false,
            dragonTail: null,
            kioscos: null,
            delivery: false,
            drive: false,
            upsellling: false
        }
    })

    if (!isOpen || !card) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        Configurar Servicios - {card.tienda}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Servicios Principales</h3>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium">KDS</span>
                                <button
                                    onClick={() => setServicios({ ...servicios, kds: !servicios.kds })}
                                    className={`w-12 h-6 rounded-full transition-colors ${servicios.kds ? 'bg-kfc-red' : 'bg-gray-300'
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${servicios.kds ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </label>

                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium">Dragon Tail</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setServicios({ ...servicios, dragonTail: true })}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${servicios.dragonTail === true
                                            ? 'bg-kfc-red text-white'
                                            : 'bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        Aplica
                                    </button>
                                    <button
                                        onClick={() => setServicios({ ...servicios, dragonTail: false })}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${servicios.dragonTail === false
                                            ? 'bg-gray-600 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        No Aplica
                                    </button>
                                </div>
                            </label>

                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium">Kioscos</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setServicios({ ...servicios, kioscos: true })}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${servicios.kioscos === true
                                            ? 'bg-kfc-red text-white'
                                            : 'bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        Aplica
                                    </button>
                                    <button
                                        onClick={() => setServicios({ ...servicios, kioscos: false })}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${servicios.kioscos === false
                                            ? 'bg-gray-600 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        No Aplica
                                    </button>
                                </div>
                            </label>

                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium">Delivery</span>
                                <button
                                    onClick={() => setServicios({ ...servicios, delivery: !servicios.delivery })}
                                    className={`w-12 h-6 rounded-full transition-colors ${servicios.delivery ? 'bg-kfc-red' : 'bg-gray-300'
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${servicios.delivery ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </label>

                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium">Drive</span>
                                <button
                                    onClick={() => setServicios({ ...servicios, drive: !servicios.drive })}
                                    className={`w-12 h-6 rounded-full transition-colors ${servicios.drive ? 'bg-kfc-red' : 'bg-gray-300'
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${servicios.drive ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </label>

                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium">Upselling</span>
                                <button
                                    onClick={() => setServicios({ ...servicios, upsellling: !servicios.upsellling })}
                                    className={`w-12 h-6 rounded-full transition-colors ${servicios.upsellling ? 'bg-kfc-red' : 'bg-gray-300'
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${servicios.upsellling ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            onSave(card.id, servicios)
                            onClose()
                        }}
                        className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-kfc-red-600"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    )
}

// Modal para checklist
interface ChecklistModalProps {
    isOpen: boolean
    onClose: () => void
    card: Card | null
    onSave: (cardId: string, items: ChecklistItem[]) => void
}

const ChecklistModal: React.FC<ChecklistModalProps> = ({ isOpen, onClose, card, onSave }) => {
    // FORZAR siempre usar CHECKLIST_COMPLETO como base
    const [items, setItems] = useState<ChecklistItem[]>(() => {
        // Si hay items en el card, combinarlos pero manteniendo la estructura completa
        if (card?.checklist.items && card.checklist.items.length > 0) {
            // Mapear cada item de CHECKLIST_COMPLETO con el estado del card si existe
            return CHECKLIST_COMPLETO.map(item => {
                const existingItem = card.checklist.items.find(i => i.nombre === item.nombre)
                return existingItem || item
            })
        }
        return CHECKLIST_COMPLETO
    })

    if (!isOpen || !card) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        Checklist - {card.tienda}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <span className="text-sm font-medium">{item.nombre}</span>
                                <button
                                    onClick={() => {
                                        setItems(items.map(i =>
                                            i.id === item.id
                                                ? { ...i, completado: !i.completado }
                                                : i
                                        ))
                                    }}
                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${item.completado
                                        ? 'bg-kfc-red border-kfc-red text-white'
                                        : 'border-gray-300 hover:border-kfc-red'
                                    }`}
                                >
                                    {item.completado && <CheckIcon className="h-4 w-4" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            onSave(card.id, items)
                            onClose()
                        }}
                        className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-kfc-red-600"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    )
}

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

const Dashboard: React.FC = () => {
    const navigate = useNavigate()
    const { user, isAdmin } = useAuth()
    const isMaster = user?.email === 'angel.gualotuna@kfc.com.ec' || isAdmin
    const [tiendas, setTiendas] = useState<Tienda[]>([])
    const [procesos, setProcesos] = useState<Record<string, Proceso>>({})
    const [loading, setLoading] = useState(true)
    const [serviciosModal, setServiciosModal] = useState<{ isOpen: boolean; card: Card | null }>({
        isOpen: false,
        card: null
    })
    const [checklistModal, setChecklistModal] = useState<{ isOpen: boolean; card: Card | null }>({
        isOpen: false,
        card: null
    })
    const [aperturaModal, setAperturaModal] = useState<{ isOpen: boolean; card: Card | null }>({
        isOpen: false,
        card: null
    })
    const [showNotifications, setShowNotifications] = useState(false)

    // Estados para estadísticas calculadas
    const [estadisticas, setEstadisticas] = useState<EstadisticasCalculadas>({
        totalTiendas: 0,
        porEstado: {
            pendiente: 0,
            en_proceso: 0,
            en_revision: 0,
            apertura: 0,
            completado: 0
        },
        tiemposPromedio: {
            planeacion: 0,
            preApertura: 0,
            pruebas: 0,
            apertura: 0
        },
        cuellosDeBotella: [],
        tiendasLentas: [],
        atrasadas: 0
    })

    // FUNCIÓN PARA RESETEAR TODOS LOS DATOS DE CHECKLIST EN LOCALSTORAGE
    const resetearTodosLosChecklists = () => {
        console.log('🔄 RESETEANDO TODOS LOS CHECKLISTS EN LOCALSTORAGE...')
        const keysToRemove: string[] = []

        // Buscar todas las keys de localStorage que contengan 'checklist'
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.includes('checklist') || key.includes('servicios'))) {
                keysToRemove.push(key)
            }
        }

        // Eliminar todas las keys encontradas
        keysToRemove.forEach(key => {
            localStorage.removeItem(key)
            console.log(`🗑️ Eliminado: ${key}`)
        })

        console.log(`✅ ${keysToRemove.length} items eliminados de localStorage`)
    }

    useEffect(() => {
        // AL INICIAR, RESETEAR TODO EL LOCALSTORAGE DE CHECKLISTS
        resetearTodosLosChecklists()
        loadTiendas()
    }, [])

    useEffect(() => {
        if (tiendas.length > 0) {
            // Limpiar storage de tiendas en estado pendiente
            tiendas.forEach(tienda => {
                if (tienda.estadoGeneral === 'pendiente') {
                    limpiarStorageTienda(tienda._id)
                }
            })
            cargarProcesos()
        }
    }, [tiendas])

    useEffect(() => {
        if (tiendas.length > 0) {
            calcularEstadisticas()
        }
    }, [tiendas, procesos])

    // Función para limpiar localStorage de una tienda
    const limpiarStorageTienda = (tiendaId: string) => {
        const keysToRemove = [
            `servicios_tienda_${tiendaId}`,
            `checklist_${tiendaId}`,
            `config_principales_${tiendaId}`,
            `despliegue_servidor_${tiendaId}`,
            `despliegue_cajas_${tiendaId}`,
            `en_revision_${tiendaId}`
        ]

        keysToRemove.forEach(key => {
            localStorage.removeItem(key)
        })
        console.log(`Storage limpiado para tienda ${tiendaId}`)
    }

    const loadTiendas = async () => {
        try {
            setLoading(true)
            const response = await tiendasService.getAll()
            const tiendasData = Array.isArray(response) ? response : response?.data || []
            setTiendas(tiendasData)
        } catch (error) {
            console.error('Error loading tiendas:', error)
        } finally {
            setLoading(false)
        }
    }

    const cargarProcesos = async () => {
        const procesosMap: Record<string, Proceso> = {}

        for (const tienda of tiendas) {
            try {
                const response = await procesoService.getProcesosByTienda(tienda._id)
                if (response.success && response.data && response.data.length > 0) {
                    // Buscar proceso de apertura
                    const proceso = response.data.find(p =>
                        p.tipo === 'apertura' || p.nombre?.toLowerCase().includes('apertura')
                    )
                    if (proceso) {
                        procesosMap[tienda._id] = proceso
                    }
                }
            } catch (error) {
                console.error(`Error cargando proceso para tienda ${tienda._id}:`, error)
            }
        }

        setProcesos(procesosMap)
    }

    const calcularEstadisticas = () => {
        // Datos reales desde tiendas y procesos
        const pendiente = tiendas.filter(t => {
            const estado = procesos[t._id]?.estado || t.estadoGeneral
            return estado === 'pendiente'
        }).length

        const enProceso = tiendas.filter(t => {
            const estado = procesos[t._id]?.estado || t.estadoGeneral
            return estado === 'en_proceso'
        }).length

        const enRevision = tiendas.filter(t => {
            const estado = procesos[t._id]?.estado || t.estadoGeneral
            return estado === 'en_revision' || estado === 'pendiente_aprobacion'
        }).length

        const apertura = tiendas.filter(t => {
            const estado = procesos[t._id]?.estado || t.estadoGeneral
            return estado === 'apertura' || estado === 'instalacion'
        }).length

        const completado = tiendas.filter(t => {
            const estado = procesos[t._id]?.estado || t.estadoGeneral
            return estado === 'completado'
        }).length

        const atrasadas = tiendas.filter(t => t.atrasada).length

        // ✅ CALCULAR TIEMPOS REALES a partir de fechas
        let totalDiasPlaneacion = 0
        let totalDiasPreApertura = 0
        let totalDiasPruebas = 0
        let totalDiasApertura = 0
        let contadorPlaneacion = 0
        let contadorPreApertura = 0
        let contadorPruebas = 0
        let contadorApertura = 0

        tiendas.forEach(tienda => {
            const proceso = procesos[tienda._id]
            if (proceso?.fechas) {
                // Calcular días de planeación (desde created hasta fecha inicio)
                if (proceso.fechas.inicio && proceso.createdAt) {
                    const inicio = new Date(proceso.fechas.inicio)
                    const creado = new Date(proceso.createdAt)
                    const dias = Math.ceil((inicio.getTime() - creado.getTime()) / (1000 * 3600 * 24))
                    if (dias > 0 && dias < 365) {
                        totalDiasPlaneacion += dias
                        contadorPlaneacion++
                    }
                }

                // Calcular días de pre-apertura (desde inicio hasta preApertura)
                if (proceso.fechas.preApertura && proceso.fechas.inicio) {
                    const preApertura = new Date(proceso.fechas.preApertura)
                    const inicio = new Date(proceso.fechas.inicio)
                    const dias = Math.ceil((preApertura.getTime() - inicio.getTime()) / (1000 * 3600 * 24))
                    if (dias > 0 && dias < 365) {
                        totalDiasPreApertura += dias
                        contadorPreApertura++
                    }
                }

                // Calcular días de pruebas
                if (proceso.fechas.pruebas && proceso.fechas.preApertura) {
                    const pruebas = new Date(proceso.fechas.pruebas)
                    const preApertura = new Date(proceso.fechas.preApertura)
                    const dias = Math.ceil((pruebas.getTime() - preApertura.getTime()) / (1000 * 3600 * 24))
                    if (dias > 0 && dias < 365) {
                        totalDiasPruebas += dias
                        contadorPruebas++
                    }
                }

                // Calcular días de apertura
                if (proceso.fechas.finReal && proceso.fechas.pruebas) {
                    const fin = new Date(proceso.fechas.finReal)
                    const pruebas = new Date(proceso.fechas.pruebas)
                    const dias = Math.ceil((fin.getTime() - pruebas.getTime()) / (1000 * 3600 * 24))
                    if (dias > 0 && dias < 365) {
                        totalDiasApertura += dias
                        contadorApertura++
                    }
                }
            }
        })

        // Calcular promedios (si hay datos, usar promedio real, si no, mostrar 0)
        const tiemposPromedio = {
            planeacion: contadorPlaneacion > 0 ? Number((totalDiasPlaneacion / contadorPlaneacion).toFixed(1)) : 0,
            preApertura: contadorPreApertura > 0 ? Number((totalDiasPreApertura / contadorPreApertura).toFixed(1)) : 0,
            pruebas: contadorPruebas > 0 ? Number((totalDiasPruebas / contadorPruebas).toFixed(1)) : 0,
            apertura: contadorApertura > 0 ? Number((totalDiasApertura / contadorApertura).toFixed(1)) : 0
        }

        // ✅ CALCULAR CUELLOS DE BOTELLA REALES (áreas con más demora)
        const demoraPorArea: Record<string, { total: number; count: number }> = {}

        tiendas.forEach(tienda => {
            const proceso = procesos[tienda._id]
            if (proceso?.checklist) {
                // Buscar items del checklist que están retrasados
                proceso.checklist.forEach(item => {
                    if (!item.validado && item.fechaLimite) {
                        const fechaLimite = new Date(item.fechaLimite)
                        const hoy = new Date()
                        if (hoy > fechaLimite) {
                            const area = item.area || 'General'
                            if (!demoraPorArea[area]) {
                                demoraPorArea[area] = { total: 0, count: 0 }
                            }
                            demoraPorArea[area].total += 1
                            demoraPorArea[area].count += 1
                        }
                    }
                })
            }
        })

        const cuellosDeBotella = Object.entries(demoraPorArea)
            .map(([area, data]) => ({
                area,
                tiendasAfectadas: data.count,
                tiempoPromedio: Number((data.total / data.count).toFixed(1))
            }))
            .sort((a, b) => b.tiendasAfectadas - a.tiendasAfectadas)
            .slice(0, 3)

        // ✅ TIENDAS CON MAYOR DEMORA (tiendas que llevan más tiempo sin completarse)
        const tiendasConDuracion = tiendas
            .filter(t => {
                const estado = procesos[t._id]?.estado || t.estadoGeneral
                return estado !== 'completado' && estado !== 'cancelado'
            })
            .map(t => {
                const createdAt = t.createdAt ? new Date(t.createdAt) : new Date()
                const hoy = new Date()
                const dias = Math.ceil((hoy.getTime() - createdAt.getTime()) / (1000 * 3600 * 24))
                const etapa = procesos[t._id]?.estado || t.estadoGeneral || 'pendiente'
                return {
                    nombre: `${t.codigo} - ${t.nombre}`,
                    tiempo: dias,
                    etapa: etapa.replace('_', ' ').toUpperCase()
                }
            })
            .sort((a, b) => b.tiempo - a.tiempo)
            .slice(0, 3)

        setEstadisticas({
            totalTiendas: tiendas.length,
            porEstado: {
                pendiente,
                en_proceso: enProceso,
                en_revision: enRevision,
                apertura,
                completado
            },
            tiemposPromedio,
            cuellosDeBotella,
            tiendasLentas: tiendasConDuracion,
            atrasadas
        })
    }

    const handleEliminarTienda = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!isMaster) {
            alert('Solo el usuario master puede eliminar tiendas')
            return
        }

        const tienda = tiendas.find(t => t._id === id)
        const nombreTienda = tienda ? `${tienda.codigo} - ${tienda.nombre}` : 'esta tienda'

        if (window.confirm(`¿Estás seguro de que deseas eliminar ${nombreTienda}? Esta acción no se puede deshacer.`)) {
            try {
                setLoading(true)

                console.log('🗑️ Eliminando tienda del backend:', id)
                await tiendasService.delete(id)

                console.log('🧹 Limpiando localStorage para tienda:', id)
                const keysToRemove = [
                    `servicios_tienda_${id}`,
                    `checklist_${id}`,
                    `config_principales_${id}`,
                    `despliegue_servidor_${id}`,
                    `despliegue_cajas_${id}`,
                    `en_revision_${id}`,
                    `chat_apertura_${id}`,
                    `puntos_emision_${id}`,
                    `pruebas_${id}`,
                    ...Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
                        .filter(key => key && key.includes(id))
                ]

                keysToRemove.forEach(key => {
                    if (key) {
                        localStorage.removeItem(key)
                        console.log(`   ✅ Eliminado: ${key}`)
                    }
                })

                setTiendas(prevTiendas => prevTiendas.filter(t => t._id !== id))
                setProcesos(prevProcesos => {
                    const newProcesos = { ...prevProcesos }
                    delete newProcesos[id]
                    return newProcesos
                })

                console.log('✅ Tienda eliminada exitosamente:', id)

                setTimeout(() => {
                    window.location.reload()
                }, 500)

            } catch (error: any) {
                console.error('❌ Error deleting tienda:', error)

                if (error.message === 'not_found' || error.response?.status === 404) {
                    console.log('⚠️ Tienda no encontrada en backend, eliminando solo del frontend')

                    const keysToRemove = [
                        `servicios_tienda_${id}`,
                        `checklist_${id}`,
                        `config_principales_${id}`,
                        `despliegue_servidor_${id}`,
                        `despliegue_cajas_${id}`,
                        `en_revision_${id}`,
                        `chat_apertura_${id}`,
                        `puntos_emision_${id}`,
                        `pruebas_${id}`
                    ]

                    keysToRemove.forEach(key => {
                        localStorage.removeItem(key)
                    })

                    setTiendas(prevTiendas => prevTiendas.filter(t => t._id !== id))
                    setProcesos(prevProcesos => {
                        const newProcesos = { ...prevProcesos }
                        delete newProcesos[id]
                        return newProcesos
                    })

                    alert('Tienda eliminada del listado (no existía en backend)')

                    setTimeout(() => {
                        window.location.reload()
                    }, 500)
                } else {
                    alert('Error al eliminar la tienda. Por favor intenta de nuevo.')
                }
            } finally {
                setLoading(false)
            }
        }
    }

    const handleFinalizarApertura = async (cardId: string) => {
        try {
            const proceso = procesos[cardId]
            if (proceso) {
                console.log('Finalizando apertura para proceso:', proceso._id)
                alert('Funcionalidad de actualización pendiente de implementar en el servicio')
            }
        } catch (error) {
            console.error('Error finalizando apertura:', error)
        }
    }

    const convertirTiendaACard = (tienda: Tienda, proceso?: Proceso): Card => {
        const estadoProceso = proceso?.estado || tienda.estadoGeneral
        const estaPendiente = estadoProceso === 'pendiente'

        // ===== CHECKLIST: FORZAR 24 ITEMS SIEMPRE =====
        let checklistItems: ChecklistItem[] = [...CHECKLIST_COMPLETO]

        if (!estaPendiente && proceso?.checklist && proceso.checklist.length > 0) {
            proceso.checklist.forEach((item: CheckItem) => {
                const index = checklistItems.findIndex(i =>
                    i.nombre.toLowerCase() === item.item.toLowerCase()
                )
                if (index !== -1) {
                    checklistItems[index] = {
                        ...checklistItems[index],
                        id: item._id,
                        completado: item.validado,
                        responsable: typeof item.responsable === 'string' ? item.responsable : item.responsable?.nombre,
                        fechaLimite: proceso.fechas?.finEstimado
                    }
                }
            })
        }

        const progresoChecklist = checklistItems.filter(item => item.completado).length
        const totalChecklist = checklistItems.length

        // ===== SERVICIOS =====
        let servicios = {
            kds: false,
            dragonTail: null,
            kioscos: null,
            delivery: tienda.configuraciones?.delivery || false,
            drive: tienda.configuraciones?.drive || false,
            upsellling: false
        }

        if (!estaPendiente) {
            const savedServicios = localStorage.getItem(`servicios_tienda_${tienda._id}`)
            if (savedServicios) {
                try {
                    const parsed = JSON.parse(savedServicios)
                    servicios = {
                        ...servicios,
                        ...parsed
                    }
                } catch (error) {
                    console.error('Error parsing saved servicios:', error)
                }
            }
        }

        // ===== CONFIGURACIONES =====
        const configuraciones = {
            estaciones: false,
            impresiones: false,
            formaPago: false,
            replicaInicial: false,
            politicas: false,
            pickUp: tienda.configuraciones?.delivery || false,
            usuariosSA: false,
            mxpSocket: false,
            mxpCredenciales: false,
            mxpReportes: false,
            mxpFacturacion: false,
            reduccionLogs: false,
            pasoVersionPOS: false,
            servicioTarjetas: false,
            impresionesNetcore: false,
            codigosComercio: false
        }

        // ===== PRUEBAS =====
        const pruebasEstado = estaPendiente
            ? 'pendiente'
            : proceso?.checklist?.find((item: CheckItem) => item.item === 'Pruebas')?.validado
                ? 'completado'
                : proceso?.estado === 'en_proceso' ? 'en_proceso' : 'pendiente'

        return {
            id: tienda._id,
            tiendaId: tienda._id,
            title: `${tienda.codigo} - ${tienda.nombre}`,
            description: proceso?.descripcion || '',
            labels: [estadoProceso === 'pendiente_aprobacion' ? 'apertura' : estadoProceso],
            dueDate: proceso?.fechas?.finEstimado || tienda.fechaAperturaPlanificada,
            comments: 0,
            attachments: 0,
            checklist: {
                items: checklistItems,
                completed: progresoChecklist,
                total: totalChecklist
            },
            assignees: ['AG'],
            tienda: tienda.codigo,
            servicios,
            configuraciones,
            pruebas: {
                estado: pruebasEstado,
                fechaCulminacion: proceso?.fechas?.finReal
            },
            seguimientoApertura: estadoProceso === 'pendiente_aprobacion' ? {
                activo: true,
                mensajes: 0,
                finalizado: false
            } : undefined
        }
    }

    // Función para mapear estados (usada en calcularEstadisticas)
    const obtenerEstadoTarjeta = (estadoGeneral: string): string => {
        const estadoMap: Record<string, string> = {
            'pendiente': 'pendiente',
            'pendiente': 'pendiente',
            'en_proceso': 'en_proceso',
            'en_revision': 'en_revision',
            'pendiente_aprobacion': 'en_revision',
            'instalacion': 'apertura',
            'apertura': 'apertura',
            'completado': 'completado',
            'en_espera_proveedor': 'en_proceso',
            'en_espera_cliente': 'en_proceso',
            'bloqueado': 'en_proceso',
            'cerrado': 'completado',
            'cancelado': 'completado'
        }
        return estadoMap[estadoGeneral] || 'pendiente'
    }

    // Columnas del Kanban
    const columns: Column[] = [
        {
            id: 'pendiente',
            title: 'Pendiente',
            color: 'gray',
            cards: tiendas
                .filter(t => {
                    const estado = procesos[t._id]?.estado || t.estadoGeneral
                    return estado === 'pendiente'
                })
                .map(t => convertirTiendaACard(t, procesos[t._id]))
        },
        {
            id: 'en_proceso',
            title: 'En Progreso',
            color: 'blue',
            cards: tiendas
                .filter(t => {
                    const estado = procesos[t._id]?.estado || t.estadoGeneral
                    return estado === 'en_proceso'
                })
                .map(t => convertirTiendaACard(t, procesos[t._id]))
        },
        {
            id: 'en_revision',
            title: 'En Revisión',
            color: 'yellow',
            cards: tiendas
                .filter(t => {
                    const estado = procesos[t._id]?.estado || t.estadoGeneral
                    return estado === 'en_revision' || estado === 'pendiente_aprobacion'
                })
                .map(t => convertirTiendaACard(t, procesos[t._id]))
        },
        {
            id: 'apertura',
            title: 'Apertura',
            color: 'orange',
            cards: tiendas
                .filter(t => {
                    const estado = procesos[t._id]?.estado || t.estadoGeneral
                    return estado === 'apertura' || estado === 'instalacion'
                })
                .map(t => convertirTiendaACard(t, procesos[t._id]))
        },
        {
            id: 'completado',
            title: 'Completado',
            color: 'green',
            cards: tiendas
                .filter(t => {
                    const estado = procesos[t._id]?.estado || t.estadoGeneral
                    return estado === 'completado'
                })
                .map(t => convertirTiendaACard(t, procesos[t._id]))
        }
    ]

    const getLabelColor = (label: string) => {
        const colors: Record<string, string> = {
            'pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'en_proceso': 'bg-blue-100 text-blue-800 border-blue-200',
            'en_revision': 'bg-purple-100 text-purple-800 border-purple-200',
            'apertura': 'bg-orange-100 text-orange-800 border-orange-200',
            'completado': 'bg-green-100 text-green-800 border-green-200',
        }
        return colors[label] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getColumnColor = (color: string) => {
        const colors = {
            gray: 'bg-gray-50 border-gray-200',
            blue: 'bg-blue-50 border-blue-200',
            yellow: 'bg-yellow-50 border-yellow-200',
            orange: 'bg-orange-50 border-orange-200',
            green: 'bg-green-50 border-green-200'
        }
        return colors[color as keyof typeof colors] || colors.gray
    }

    const handleServiciosSave = async (cardId: string, serviciosActualizados: any) => {
        try {
            const tienda = tiendas.find(t => t._id === cardId)

            if (tienda?.estadoGeneral === 'pendiente') {
                alert('No se pueden guardar servicios en una tienda en estado pendiente')
                return
            }

            localStorage.setItem(`servicios_tienda_${cardId}`, JSON.stringify(serviciosActualizados))
            console.log('Servicios guardados en localStorage:', cardId, serviciosActualizados)
            window.location.reload()
        } catch (error) {
            console.error('Error guardando servicios:', error)
        }
    }

    const handleChecklistSave = async (cardId: string, items: ChecklistItem[]) => {
        try {
            const tienda = tiendas.find(t => t._id === cardId)

            if (tienda?.estadoGeneral === 'pendiente') {
                alert('No se puede guardar checklist en una tienda en estado pendiente')
                return
            }

            localStorage.setItem(`checklist_${cardId}`, JSON.stringify(items))
            console.log('Checklist guardado en localStorage:', cardId, items)
            window.location.reload()
        } catch (error) {
            console.error('Error guardando checklist:', error)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="h-full w-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfc-red"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="h-full flex flex-col overflow-hidden">
                {/* Header con título */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 flex-shrink-0">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                            Tablero de Aperturas
                        </h1>
                        <p className="text-gray-600 text-xs mt-0.5">
                            Gestiona los procesos de apertura de tiendas
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="w-48 pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-kfc-red focus:ring-1 focus:ring-kfc-red/20 outline-none"
                            />
                        </div>

                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg relative"
                        >
                            <BellIcon className="h-4 w-4 text-gray-600" />
                            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-kfc-red rounded-full"></span>
                        </button>

                        <button
                            onClick={() => navigate('/perfil')}
                            className="flex items-center gap-1 p-1.5 hover:bg-gray-100 rounded-lg"
                        >
                            <UserCircleIcon className="h-4 w-4 text-gray-600" />
                            <span className="text-xs font-medium hidden sm:inline">{user?.nombre?.split(' ')[0] || 'Usuario'}</span>
                        </button>

                        {isMaster && (
                            <button
                                onClick={() => navigate('/admin/usuarios')}
                                className="p-1.5 hover:bg-gray-100 rounded-lg"
                            >
                                <Cog6ToothIcon className="h-4 w-4 text-gray-600" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tarjetas de estadísticas superiores */}
                <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5 mb-2 flex-shrink-0">
                    <StatsCard title="Total" value={estadisticas.totalTiendas} icon={ChartBarIcon} color="bg-blue-500" />
                    <StatsCard title="Pendiente" value={estadisticas.porEstado.pendiente} icon={ClockIcon} color="bg-gray-500" />
                    <StatsCard title="Progreso" value={estadisticas.porEstado.en_proceso} icon={ClockIcon} color="bg-yellow-500" />
                    <StatsCard title="Revisión" value={estadisticas.porEstado.en_revision} icon={ClockIcon} color="bg-purple-500" />
                    <StatsCard title="Apertura" value={estadisticas.porEstado.apertura} icon={ChatBubbleLeftIcon} color="bg-orange-500" />
                    <StatsCard title="Completado" value={estadisticas.porEstado.completado} icon={CheckCircleIcon} color="bg-green-500" />
                    <StatsCard title="Atrasadas" value={estadisticas.atrasadas} icon={ExclamationTriangleIcon} color="bg-red-500" />
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
                                    <div className={`p-2 rounded-t-lg border-b flex-shrink-0 ${getColumnColor(column.color)}`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-medium text-gray-700 text-sm">{column.title}</h3>
                                                <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                                                    {column.cards.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => navigate('/tiendas/nueva')}
                                                className="p-0.5 hover:bg-gray-200 rounded"
                                            >
                                                <PlusIcon className="h-3.5 w-3.5 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                                        {column.cards.map((card) => (
                                            <div
                                                key={card.id}
                                                className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group"
                                                onClick={() => {
                                                    // 🔥 CORREGIDO: Para TODAS las columnas, navegar a TiendaDetalle
                                                    // Los modales de instalación y chat están dentro de TiendaDetalle
                                                    navigate(`/tiendas/${card.id}`)
                                                }}
                                            >
                                                {isMaster && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            handleEliminarTienda(card.id, e)
                                                        }}
                                                        className="absolute top-1 right-1 p-1.5 bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 z-50 shadow-sm border border-red-200"
                                                        title="Eliminar tienda"
                                                    >
                                                        <TrashIcon className="h-3.5 w-3.5 text-red-600" />
                                                    </button>
                                                )}

                                                <div className="flex flex-wrap gap-0.5 mb-1 pr-6">
                                                    {card.labels.map((label, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`text-[10px] px-1 py-0.5 rounded-full border ${getLabelColor(label)}`}
                                                        >
                                                            {label}
                                                        </span>
                                                    ))}
                                                </div>

                                                <h4 className="font-medium text-gray-900 text-xs mb-0.5 pr-4">{card.title}</h4>
                                                <p className="text-[10px] text-kfc-red mb-1">{card.tienda}</p>

                                                {column.id === 'apertura' && (
                                                    <div className="mb-1 p-1 bg-orange-50 rounded border border-orange-100">
                                                        <span className="text-[10px] font-medium text-orange-800 flex items-center gap-0.5">
                                                            <ChatBubbleLeftIcon className="h-2.5 w-2.5" />
                                                            En seguimiento
                                                        </span>
                                                    </div>
                                                )}

                                                {column.id !== 'apertura' && (
                                                    <>
                                                        <div className="mb-1">
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-0.5">
                                                                <CheckCircleIcon className="h-2.5 w-2.5" />
                                                                <span>{card.checklist.completed}/{card.checklist.total}</span>
                                                            </div>
                                                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-kfc-red rounded-full"
                                                                    style={{ width: `${(card.checklist.completed / card.checklist.total) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-1 mb-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setServiciosModal({ isOpen: true, card })
                                                                }}
                                                                className="flex-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 py-0.5 px-1 rounded"
                                                            >
                                                                Servicios
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setChecklistModal({ isOpen: true, card })
                                                                }}
                                                                className="flex-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 py-0.5 px-1 rounded"
                                                            >
                                                                Checklist
                                                            </button>
                                                        </div>
                                                    </>
                                                )}

                                                {column.id === 'apertura' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            // Mantener el modal de apertura como respaldo, pero ahora navega a TiendaDetalle
                                                            // setAperturaModal({ isOpen: true, card })
                                                            navigate(`/tiendas/${card.id}`)
                                                        }}
                                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-semibold py-1 px-2 rounded mb-1 flex items-center justify-center gap-1"
                                                    >
                                                        <ChatBubbleLeftIcon className="h-3 w-3" />
                                                        Seguimiento
                                                    </button>
                                                )}

                                                <div className="flex items-center justify-between text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        {card.dueDate && (
                                                            <div className="flex items-center gap-0.5 text-[10px]">
                                                                <CalendarIcon className="h-2.5 w-2.5" />
                                                                <span>{new Date(card.dueDate).toLocaleDateString('es-EC', {
                                                                    day: '2-digit',
                                                                    month: '2-digit'
                                                                })}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex -space-x-1.5">
                                                        {card.assignees.slice(0, 3).map((assignee, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="w-4 h-4 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[8px] font-medium text-gray-700"
                                                            >
                                                                {assignee}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {column.cards.length === 0 && (
                                            <div className="text-center py-4 text-gray-400 text-[10px] border border-dashed border-gray-200 rounded-lg">
                                                Sin tareas
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Panel de Estadísticas Detalladas - 30% */}
                    <div className="w-[30%] overflow-y-auto space-y-2 pr-1">
                        {/* Cuadro 1: Distribución */}
                        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 text-xs mb-1.5">Distribución de Tiendas</h3>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                                        <span className="text-gray-600">Pendiente</span>
                                    </div>
                                    <span className="font-medium">{estadisticas.porEstado.pendiente}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-gray-600">En Progreso</span>
                                    </div>
                                    <span className="font-medium">{estadisticas.porEstado.en_proceso}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                        <span className="text-gray-600">En Revisión</span>
                                    </div>
                                    <span className="font-medium">{estadisticas.porEstado.en_revision}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                                        <span className="text-gray-600">Apertura</span>
                                    </div>
                                    <span className="font-medium">{estadisticas.porEstado.apertura}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-gray-600">Completado</span>
                                    </div>
                                    <span className="font-medium">{estadisticas.porEstado.completado}</span>
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
                                        <span className="font-medium">{estadisticas.tiemposPromedio.planeacion.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                        <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${(estadisticas.tiemposPromedio.planeacion / 15) * 100}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] mb-0.5">
                                        <span className="text-gray-600">Pre-Apertura</span>
                                        <span className="font-medium">{estadisticas.tiemposPromedio.preApertura.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                        <div className="bg-yellow-500 h-1 rounded-full" style={{ width: `${(estadisticas.tiemposPromedio.preApertura / 15) * 100}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] mb-0.5">
                                        <span className="text-gray-600">Pruebas</span>
                                        <span className="font-medium">{estadisticas.tiemposPromedio.pruebas.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                        <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${(estadisticas.tiemposPromedio.pruebas / 15) * 100}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] mb-0.5">
                                        <span className="text-gray-600">Apertura</span>
                                        <span className="font-medium">{estadisticas.tiemposPromedio.apertura.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                        <div className="bg-green-500 h-1 rounded-full" style={{ width: `${(estadisticas.tiemposPromedio.apertura / 15) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cuadro 3: Cuellos de Botella */}
                        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 text-xs mb-1.5">Cuellos de Botella</h3>
                            <div className="space-y-1.5">
                                {estadisticas.cuellosDeBotella.length > 0 ? (
                                    estadisticas.cuellosDeBotella.map((item, idx) => (
                                        <div key={idx} className="p-1.5 bg-red-50 rounded">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-900 text-[10px]">{item.area}</span>
                                                <span className="text-[10px] font-medium text-red-600">{item.tiempoPromedio}d</span>
                                            </div>
                                            <p className="text-[9px] text-gray-500">{item.tiendasAfectadas} tiendas</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-gray-400 text-center py-1">Sin cuellos de botella</p>
                                )}
                            </div>
                        </div>

                        {/* Cuadro 4: Mayor Demora */}
                        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 text-xs mb-1.5">Tiendas con Mayor Demora</h3>
                            <div className="space-y-1">
                                {estadisticas.tiendasLentas.length > 0 ? (
                                    estadisticas.tiendasLentas.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-1 bg-gray-50 rounded">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-medium text-gray-900 truncate">{item.nombre}</p>
                                                <p className="text-[9px] text-gray-500">{item.etapa}</p>
                                            </div>
                                            <span className="text-[10px] font-medium text-orange-600 ml-1">{item.tiempo}d</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-gray-400 text-center py-1">Sin datos</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales */}
            <ServiciosModal
                isOpen={serviciosModal.isOpen}
                onClose={() => setServiciosModal({ isOpen: false, card: null })}
                card={serviciosModal.card}
                onSave={handleServiciosSave}
            />

            <ChecklistModal
                isOpen={checklistModal.isOpen}
                onClose={() => setChecklistModal({ isOpen: false, card: null })}
                card={checklistModal.card}
                onSave={handleChecklistSave}
            />

            <AperturaModal
                isOpen={aperturaModal.isOpen}
                onClose={() => setAperturaModal({ isOpen: false, card: null })}
                card={aperturaModal.card}
                onFinalizar={handleFinalizarApertura}
            />
        </Layout>
    )
}

export default Dashboard