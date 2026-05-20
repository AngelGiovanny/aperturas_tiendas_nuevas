// pages/ImplementacionDetalle.tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Button from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'
import { implementacionesService } from '../services/implementacionesService'
import { tiendasService } from '../services/tiendas'
import { usuariosService } from '../services/usuariosService'
import { Implementacion, User } from '@/types'
import {
    ArrowUturnLeftIcon,
    UserCircleIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    WrenchIcon,
    ChatBubbleLeftIcon,
    CubeIcon,
    BuildingOfficeIcon,
    ClipboardDocumentListIcon,
    CalendarIcon,
    PaperClipIcon,
    CogIcon,
    ArrowRightIcon,
    CreditCardIcon,
    PrinterIcon,
    TruckIcon,
    BuildingStorefrontIcon,
    CakeIcon,
    UserGroupIcon,
    PhotoIcon,
    ArrowDownTrayIcon,
    PlusCircleIcon,
    UserIcon,
    ArrowPathIcon,
    ChartBarIcon  // ✅ AGREGADO para el resumen
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

// Tipos para el flujo
type EstadoImplementacion = 'pendiente' | 'en_proceso' | 'en_revision' | 'instalacion' | 'apertura' | 'completado' | 'cancelado'

interface MensajeImplementacion {
    id: string
    usuario: string
    usuarioId?: string
    fecha: string
    texto: string
    tipo: 'novedad' | 'consulta' | 'respuesta' | 'finalizacion' | 'archivo' | 'observacion'
    archivos?: ArchivoAdjunto[]
}

interface ArchivoAdjunto {
    id: string
    nombre: string
    url: string
    tamaño: number
    tipo: string
    fechaSubida: string
    categoria?: string
}

interface ObservacionItem {
    id: string
    texto: string
    usuario: string
    usuarioId?: string
    fecha: string
    etapa: string
}

// Configuración de Estaciones
interface EstacionConfig {
    id: string
    nombre: string
    tipo: string
    completado: boolean
}

// Configuración de Usuarios
interface UsuarioConfig {
    id: string
    nombre: string
    tipo: 'tienda' | 'kiosco' | 'delivery' | 'pickup' | 'agregador'
    usuarioAsignado?: string
    creado: boolean
    activo: boolean
}

// Configuración de Impresoras
interface ImpresoraConfig {
    id: string
    nombre: string
    tipo: string
    completado: boolean
}

// Despliegue de Servicios
interface DespliegueItem {
    id: string
    nombre: string
    completado: boolean
    aplica: boolean
}

interface MKTContabilidadConfig {
    deUna: {
        check: boolean
        observaciones?: ObservacionItem[]
    }
    puntosEmisionCodigos: {
        check: boolean
        observaciones?: ObservacionItem[]
    }
}

interface PruebaItem {
    id: string
    nombre: string
    check: boolean
    observaciones?: string
}

// Componente Badge simple
const StatusBadge: React.FC<{ status: EstadoImplementacion }> = ({ status }) => {
    const colors: Record<string, string> = {
        pendiente: 'bg-yellow-100 text-yellow-800',
        en_proceso: 'bg-blue-100 text-blue-800',
        en_revision: 'bg-purple-100 text-purple-800',
        instalacion: 'bg-indigo-100 text-indigo-800',
        apertura: 'bg-orange-100 text-orange-800',
        completado: 'bg-green-100 text-green-800',
        cancelado: 'bg-red-100 text-red-800'
    }

    const labels: Record<string, string> = {
        pendiente: 'PENDIENTE',
        en_proceso: 'EN PROCESO',
        en_revision: 'EN REVISIÓN',
        instalacion: 'INSTALACIÓN',
        apertura: 'APERTURA',
        completado: 'COMPLETADO',
        cancelado: 'CANCELADO'
    }

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
            {labels[status] || status}
        </span>
    )
}

const ImplementacionDetalle: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const isMaster = user?.email === 'angel.gualotuna@kfc.com.ec' || user?.role === 'admin_master'

    // Estados principales
    const [implementacion, setImplementacion] = useState<Implementacion | null>(null)
    const [tiendaAsociada, setTiendaAsociada] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [estadoActual, setEstadoActual] = useState<EstadoImplementacion>('pendiente')

    // Estados para archivos adjuntos (repositorio)
    const [archivosAdjuntos, setArchivosAdjuntos] = useState<ArchivoAdjunto[]>([])

    // Estados para observaciones por sección
    const [observacionesGenerales, setObservacionesGenerales] = useState<ObservacionItem[]>([])

    // Estados para inputs de observaciones dentro de modales
    const [nuevaObservacionConfig, setNuevaObservacionConfig] = useState('')
    const [nuevaObservacionUsuarios, setNuevaObservacionUsuarios] = useState('')
    const [nuevaObservacionDespliegue, setNuevaObservacionDespliegue] = useState('')
    const [nuevaObservacionPruebas, setNuevaObservacionPruebas] = useState('')
    const [nuevaObservacionDeUna, setNuevaObservacionDeUna] = useState('')
    const [nuevaObservacionPuntos, setNuevaObservacionPuntos] = useState('')

    // Estado para observaciones por prueba específica
    const [observacionesPorPrueba, setObservacionesPorPrueba] = useState<{ [key: string]: string }>({})

    // Estados para reasignación de técnico
    const [tecnicosDisponibles, setTecnicosDisponibles] = useState<User[]>([])
    const [showReasignarTecnicoModal, setShowReasignarTecnicoModal] = useState(false)
    const [reasignandoTecnico, setReasignandoTecnico] = useState(false)

    // ✅ NUEVOS ESTADOS PARA RESUMEN FINAL
    const [showResumenModal, setShowResumenModal] = useState(false)
    const [resumenData, setResumenData] = useState<any>(null)

    // Estados para configuraciones (SIN archivos adjuntos)
    const [estaciones, setEstaciones] = useState<EstacionConfig[]>([])
    const [usuarios, setUsuarios] = useState<UsuarioConfig[]>([])
    const [impresoras, setImpresoras] = useState<ImpresoraConfig[]>([])
    const [despliegueItems, setDespliegueItems] = useState<DespliegueItem[]>([])
    const [mktContabilidad, setMktContabilidad] = useState<MKTContabilidadConfig>(() => {
        const saved = localStorage.getItem(`mktContabilidad_imp_${id}`)
        if (saved) {
            const parsed = JSON.parse(saved)
            return {
                deUna: { check: parsed.deUna?.check || false, observaciones: parsed.deUna?.observaciones || [] },
                puntosEmisionCodigos: { check: parsed.puntosEmisionCodigos?.check || false, observaciones: parsed.puntosEmisionCodigos?.observaciones || [] }
            }
        }
        return { deUna: { check: false, observaciones: [] }, puntosEmisionCodigos: { check: false, observaciones: [] } }
    })

    const [pruebas, setPruebas] = useState<PruebaItem[]>([
        { id: 'conexion', nombre: 'Prueba de Conexión', check: false, observaciones: '' },
        { id: 'pagos', nombre: 'Prueba de Pagos', check: false, observaciones: '' },
        { id: 'facturacion', nombre: 'Prueba de Facturación', check: false, observaciones: '' },
        { id: 'impresion', nombre: 'Prueba de Impresión', check: false, observaciones: '' }
    ])
    const [instalacionCompletada, setInstalacionCompletada] = useState(false)

    // CHAT DE SEGUIMIENTO
    const [mensajesImplementacion, setMensajesImplementacion] = useState<MensajeImplementacion[]>(() => {
        const saved = localStorage.getItem(`chat_implementacion_${id}`)
        return saved ? JSON.parse(saved) : [{ id: '1', usuario: 'Sistema', usuarioId: 'system', fecha: new Date().toISOString(), texto: 'Inicio del proceso de implementación', tipo: 'finalizacion' }]
    })
    const [nuevoMensaje, setNuevoMensaje] = useState('')
    const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
    const [implementacionFinalizada, setImplementacionFinalizada] = useState(false)

    // Estados de UI para modales
    const [showChatModal, setShowChatModal] = useState(false)
    const [showConfiguracionesModal, setShowConfiguracionesModal] = useState(false)
    const [showUsuariosModal, setShowUsuariosModal] = useState(false)
    const [showDespliegueModal, setShowDespliegueModal] = useState(false)
    const [showMKTContabilidadModal, setShowMKTContabilidadModal] = useState(false)
    const [showPruebasModal, setShowPruebasModal] = useState(false)
    const [showEstadoModal, setShowEstadoModal] = useState(false)

    // ===== FUNCIÓN PARA GENERAR CONFIGURACIÓN DESDE LA IMPLEMENTACIÓN =====
    const generarConfiguracionDesdeImplementacion = (imp: Implementacion) => {
        const config = imp.configuracion

        const nuevasEstaciones: EstacionConfig[] = []
        const nuevosUsuarios: UsuarioConfig[] = []
        const nuevasImpresoras: ImpresoraConfig[] = []
        const nuevosDespliegueItems: DespliegueItem[] = []

        nuevosUsuarios.push({
            id: 'tienda',
            nombre: 'Usuario Local',
            tipo: 'tienda',
            usuarioAsignado: 'local',
            creado: false,
            activo: true
        })

        // CAJAS
        if (config?.cajas?.activo && config.cajas.cantidad > 0) {
            for (let i = 1; i <= config.cajas.cantidad; i++) {
                nuevasEstaciones.push({ id: `caja_${i}`, nombre: `Caja ${i}`, tipo: 'caja', completado: false })
                nuevasImpresoras.push({ id: `impresora_caja_${i}`, nombre: `Impresora Caja ${i}`, tipo: 'caja', completado: false })
            }
            nuevosDespliegueItems.push({ id: 'cajas_tarjetas', nombre: 'Cajas - Servicio Tarjetas', completado: false, aplica: true })
            nuevosDespliegueItems.push({ id: 'cajas_impresion', nombre: 'Cajas - Servicio Impresión', completado: false, aplica: true })
        }

        // KIOSCOS
        if (config?.kioscos?.activo && config.kioscos.cantidad > 0) {
            for (let i = 1; i <= config.kioscos.cantidad; i++) {
                nuevasEstaciones.push({ id: `kiosco_${i}`, nombre: `Kiosco ${i}`, tipo: 'kiosco', completado: false })
                nuevosUsuarios.push({ id: `kiosco_${i}`, nombre: `KIOSCO${i}`, tipo: 'kiosco', usuarioAsignado: `kiosco${i}`, creado: false, activo: true })
                nuevasImpresoras.push({ id: `impresora_kiosco_${i}`, nombre: `Impresora Kiosco ${i}`, tipo: 'kiosco', completado: false })
            }
            nuevosDespliegueItems.push({ id: 'kioscos', nombre: 'Kioscos - Configuración', completado: false, aplica: true })
        }

        // DELIVERY
        if (config?.delivery?.activo) {
            nuevasEstaciones.push({ id: 'delivery', nombre: 'Delivery', tipo: 'delivery', completado: false })
            nuevosUsuarios.push({ id: 'delivery_mxp', nombre: 'DELIVERYMXP', tipo: 'delivery', usuarioAsignado: 'delivery_mxp', creado: false, activo: true })
            if (config.delivery.tipo === 'agregadores' || config.delivery.tipo === 'ambos') {
                nuevosUsuarios.push({ id: 'delivery_agregadores', nombre: 'DELIVERYMXP1', tipo: 'agregador', usuarioAsignado: 'delivery_mxp1', creado: false, activo: true })
            }
            nuevasImpresoras.push({ id: 'impresora_domi', nombre: 'Impresora DOMI', tipo: 'domi', completado: false })
            nuevosDespliegueItems.push({ id: 'delivery', nombre: 'Delivery - Impresión', completado: false, aplica: true })
        }

        // DRIVE
        if (config?.drive?.activo) {
            nuevasEstaciones.push({ id: 'drive', nombre: 'Drive', tipo: 'drive', completado: false })
            nuevosDespliegueItems.push({ id: 'drive', nombre: 'Drive - Configuración', completado: false, aplica: true })
        }

        // PICK UP
        if (config?.pickUp) {
            nuevasEstaciones.push({ id: 'pickup', nombre: 'Pick Up', tipo: 'pickup', completado: false })
            nuevosUsuarios.push({ id: 'pickup', nombre: 'PICKUP1', tipo: 'pickup', usuarioAsignado: 'pickup1', creado: false, activo: true })
            nuevosDespliegueItems.push({ id: 'pickup', nombre: 'Pick Up - Configuración', completado: false, aplica: true })
        }

        // HELADERÍAS
        if (config?.heladerias) {
            nuevasEstaciones.push({ id: 'heladeria', nombre: 'Heladería', tipo: 'heladeria', completado: false })
        }

        // IMPRESORAS ADICIONALES
        if (config?.impresoras?.linea) nuevasImpresoras.push({ id: 'linea', nombre: 'Impresora de Línea', tipo: 'linea', completado: false })
        if (config?.impresoras?.lineaDomi) nuevasImpresoras.push({ id: 'lineaDomi', nombre: 'Impresora de Línea Domi', tipo: 'lineaDomi', completado: false })
        if (config?.impresoras?.bar) nuevasImpresoras.push({ id: 'bar', nombre: 'Impresora de Bar', tipo: 'bar', completado: false })
        if (config?.impresoras?.cocina) nuevasImpresoras.push({ id: 'cocina', nombre: 'Impresora de Cocina', tipo: 'cocina', completado: false })
        if (config?.impresoras?.parrilla) nuevasImpresoras.push({ id: 'parrilla', nombre: 'Impresora de Parrilla', tipo: 'parrilla', completado: false })
        if (config?.impresoras?.personalizada && config.impresoras.personalizadaNombre) {
            nuevasImpresoras.push({ id: 'personalizada', nombre: config.impresoras.personalizadaNombre, tipo: 'personalizada', completado: false })
        }

        setEstaciones(nuevasEstaciones)
        setUsuarios(nuevosUsuarios)
        setImpresoras(nuevasImpresoras)
        setDespliegueItems(nuevosDespliegueItems)
    }

    // ===== FUNCIÓN PARA CARGAR TÉCNICOS DISPONIBLES =====
    const cargarTecnicosDisponibles = async () => {
        try {
            const usuariosData = await usuariosService.getAll()
            const tecnicos = usuariosData.filter(u =>
                (u.role?.toLowerCase() === 'cx' || u.role?.toLowerCase() === 'admin_master') && u.activo === true
            )
            setTecnicosDisponibles(tecnicos)
        } catch (error) {
            console.error('Error cargando técnicos:', error)
        }
    }

    // ===== FUNCIÓN PARA REASIGNAR TÉCNICO =====
    const handleReasignarTecnico = async (nuevoTecnicoId: string) => {
        if (!implementacion) return
        setReasignandoTecnico(true)
        try {
            const nuevoTecnico = tecnicosDisponibles.find(t => t._id === nuevoTecnicoId)
            if (!nuevoTecnico) throw new Error('Técnico no encontrado')

            const updateData = {
                tecnicoAsignadoId: nuevoTecnicoId,
                tecnicoAsignado: {
                    nombre: `${nuevoTecnico.nombre} ${nuevoTecnico.apellido || ''}`.trim(),
                    email: nuevoTecnico.email
                }
            }

            await implementacionesService.update(id!, updateData)

            setImplementacion(prev => prev ? {
                ...prev,
                tecnicoAsignadoId: nuevoTecnicoId,
                tecnicoAsignado: updateData.tecnicoAsignado
            } : null)

            agregarObservacionGeneral(`Técnico reasignado de ${implementacion.tecnicoAsignado?.nombre || 'No asignado'} a ${updateData.tecnicoAsignado.nombre}`, 'Reasignación')

            toast.success(`Técnico reasignado a ${updateData.tecnicoAsignado.nombre}`)
            setShowReasignarTecnicoModal(false)
        } catch (error) {
            console.error('Error reasignando técnico:', error)
            toast.error('Error al reasignar el técnico')
        } finally {
            setReasignandoTecnico(false)
        }
    }

    // ===== FUNCIONES PARA REPOSITORIO Y OBSERVACIONES =====
    const cargarArchivosRepositorio = () => {
        const savedArchivos = localStorage.getItem(`implementacion_archivos_${id}`)
        if (savedArchivos) {
            setArchivosAdjuntos(JSON.parse(savedArchivos))
        }
    }

    const cargarObservacionesGenerales = () => {
        const savedObservaciones = localStorage.getItem(`implementacion_observaciones_${id}`)
        if (savedObservaciones) {
            setObservacionesGenerales(JSON.parse(savedObservaciones))
        }
    }

    const agregarObservacionGeneral = (texto: string, etapa: string = estadoActual) => {
        if (!texto.trim()) return

        const nuevaObs: ObservacionItem = {
            id: Date.now().toString(),
            texto: texto.trim(),
            usuario: user?.nombre || 'Usuario',
            usuarioId: user?._id,
            fecha: new Date().toISOString(),
            etapa: etapa
        }

        const nuevasObservaciones = [...observacionesGenerales, nuevaObs]
        setObservacionesGenerales(nuevasObservaciones)
        localStorage.setItem(`implementacion_observaciones_${id}`, JSON.stringify(nuevasObservaciones))

        // También agregar al chat
        agregarMensajeImplementacion(`📝 Observación: ${texto}`, 'observacion')
    }

    // ===== FUNCIÓN PARA AGREGAR OBSERVACIÓN ESPECÍFICA DE UNA PRUEBA =====
    const handleAgregarObservacionPruebaEspecifica = (pruebaId: string) => {
        const texto = observacionesPorPrueba[pruebaId]
        if (!texto || !texto.trim()) {
            toast.error('Escribe una observación antes de agregar')
            return
        }

        // Buscar el nombre de la prueba
        const prueba = pruebas.find(p => p.id === pruebaId)
        const nombrePrueba = prueba?.nombre || 'Prueba'

        // Agregar a observaciones generales con el nombre de la prueba
        agregarObservacionGeneral(`${nombrePrueba}: ${texto}`, 'Pruebas')

        // También agregar al textarea de novedades de la prueba
        const nuevasPruebas = pruebas.map(p =>
            p.id === pruebaId
                ? { ...p, observaciones: p.observaciones ? `${p.observaciones}\n- ${texto}` : `- ${texto}` }
                : p
        )
        setPruebas(nuevasPruebas)
        localStorage.setItem(`pruebas_imp_${id}`, JSON.stringify(nuevasPruebas))

        // Limpiar el input
        setObservacionesPorPrueba(prev => ({ ...prev, [pruebaId]: '' }))
        toast.success('Observación agregada')
    }

    // ===== FUNCIONES DE CARGA DE DATOS =====
    const loadData = async () => {
        if (!id) return
        try {
            setLoading(true)
            const data = await implementacionesService.getById(id)
            setImplementacion(data)
            setEstadoActual(data.estadoGeneral)

            generarConfiguracionDesdeImplementacion(data)

            if (data.tiendaAsociada?.id) {
                const tiendaData = await tiendasService.getById(data.tiendaAsociada.id)
                setTiendaAsociada(tiendaData)
            }

            cargarDatosGuardados()
            cargarArchivosRepositorio()
            cargarObservacionesGenerales()
            cargarTecnicosDisponibles()
        } catch (error) {
            console.error('Error cargando implementación:', error)
            toast.error('Error al cargar los datos')
        } finally {
            setLoading(false)
        }
    }

    const cargarDatosGuardados = () => {
        try {
            const savedEstaciones = localStorage.getItem(`estaciones_imp_${id}`)
            if (savedEstaciones) setEstaciones(JSON.parse(savedEstaciones))

            const savedUsuarios = localStorage.getItem(`usuarios_imp_${id}`)
            if (savedUsuarios) setUsuarios(JSON.parse(savedUsuarios))

            const savedImpresoras = localStorage.getItem(`impresoras_imp_${id}`)
            if (savedImpresoras) setImpresoras(JSON.parse(savedImpresoras))

            const savedDespliegue = localStorage.getItem(`despliegue_imp_${id}`)
            if (savedDespliegue) setDespliegueItems(JSON.parse(savedDespliegue))

            const savedMKT = localStorage.getItem(`mktContabilidad_imp_${id}`)
            if (savedMKT) setMktContabilidad(JSON.parse(savedMKT))

            const savedPruebas = localStorage.getItem(`pruebas_imp_${id}`)
            if (savedPruebas) setPruebas(JSON.parse(savedPruebas))

            const savedInstalacion = localStorage.getItem(`instalacion_imp_${id}`)
            if (savedInstalacion) setInstalacionCompletada(JSON.parse(savedInstalacion))
        } catch (error) {
            console.error(error)
        }
    }

    // ===== FUNCIÓN UNIFICADA PARA SUBIR ARCHIVOS =====
    const handleSubirArchivo = (file: File, categoria: string) => {
        const nuevoArchivo: ArchivoAdjunto = {
            id: Date.now().toString(),
            nombre: file.name,
            url: URL.createObjectURL(file),
            tamaño: file.size,
            tipo: file.type,
            fechaSubida: new Date().toISOString(),
            categoria: categoria
        }

        const nuevosArchivos = [...archivosAdjuntos, nuevoArchivo]
        setArchivosAdjuntos(nuevosArchivos)
        localStorage.setItem(`implementacion_archivos_${id}`, JSON.stringify(nuevosArchivos))
        toast.success(`Archivo subido a ${categoria}`)
    }

    const handleSubirArchivoChat = (file: File) => {
        const nuevoArchivo: ArchivoAdjunto = {
            id: Date.now().toString(),
            nombre: file.name,
            url: URL.createObjectURL(file),
            tamaño: file.size,
            tipo: file.type,
            fechaSubida: new Date().toISOString(),
            categoria: 'Chat'
        }

        const nuevosArchivos = [...archivosAdjuntos, nuevoArchivo]
        setArchivosAdjuntos(nuevosArchivos)
        localStorage.setItem(`implementacion_archivos_${id}`, JSON.stringify(nuevosArchivos))

        const nuevoMensajeChat: MensajeImplementacion = {
            id: Date.now().toString(),
            usuario: user?.nombre || 'Usuario',
            usuarioId: user?._id,
            fecha: new Date().toISOString(),
            texto: `Archivo adjunto: ${file.name}`,
            tipo: 'archivo',
            archivos: [nuevoArchivo]
        }
        setMensajesImplementacion(prev => [...prev, nuevoMensajeChat])
        localStorage.setItem(`chat_implementacion_${id}`, JSON.stringify([...mensajesImplementacion, nuevoMensajeChat]))

        toast.success('Archivo subido al chat')
    }

    // ===== FUNCIONES DE CONFIGURACIÓN =====
    const handleGuardarConfiguraciones = () => {
        localStorage.setItem(`estaciones_imp_${id}`, JSON.stringify(estaciones))
        localStorage.setItem(`impresoras_imp_${id}`, JSON.stringify(impresoras))
        setShowConfiguracionesModal(false)
        toast.success('Configuración guardada')
    }

    const handleGuardarUsuarios = () => {
        localStorage.setItem(`usuarios_imp_${id}`, JSON.stringify(usuarios))
        setShowUsuariosModal(false)
        toast.success('Usuarios guardados')
    }

    const handleGuardarDespliegue = () => {
        localStorage.setItem(`despliegue_imp_${id}`, JSON.stringify(despliegueItems))
        setShowDespliegueModal(false)
        toast.success('Despliegue guardado')
    }

    const handleGuardarMKTContabilidad = () => {
        localStorage.setItem(`mktContabilidad_imp_${id}`, JSON.stringify(mktContabilidad))
        setShowMKTContabilidadModal(false)
        toast.success('MKT-Contabilidad guardado')
    }

    const handleGuardarPruebas = () => {
        localStorage.setItem(`pruebas_imp_${id}`, JSON.stringify(pruebas))
        setShowPruebasModal(false)
        toast.success('Pruebas guardadas')
    }

    // ===== FUNCIONES DE OBSERVACIONES DENTRO DE MODALES =====
    const handleAgregarObservacionConfig = () => {
        if (!nuevaObservacionConfig.trim()) {
            toast.error('Escribe una observación antes de agregar')
            return
        }
        agregarObservacionGeneral(nuevaObservacionConfig, 'Configuración')
        setNuevaObservacionConfig('')
        toast.success('Observación agregada')
    }

    const handleAgregarObservacionUsuarios = () => {
        if (!nuevaObservacionUsuarios.trim()) {
            toast.error('Escribe una observación antes de agregar')
            return
        }
        agregarObservacionGeneral(nuevaObservacionUsuarios, 'Usuarios')
        setNuevaObservacionUsuarios('')
        toast.success('Observación agregada')
    }

    const handleAgregarObservacionDespliegue = () => {
        if (!nuevaObservacionDespliegue.trim()) {
            toast.error('Escribe una observación antes de agregar')
            return
        }
        agregarObservacionGeneral(nuevaObservacionDespliegue, 'Despliegue')
        setNuevaObservacionDespliegue('')
        toast.success('Observación agregada')
    }

    const handleAgregarObservacionDeUna = () => {
        if (!nuevaObservacionDeUna.trim()) {
            toast.error('Escribe una observación antes de agregar')
            return
        }
        const nuevaObs: ObservacionItem = {
            id: Date.now().toString(),
            texto: nuevaObservacionDeUna.trim(),
            usuario: user?.nombre || 'Usuario',
            usuarioId: user?._id,
            fecha: new Date().toISOString(),
            etapa: 'MKT-Contabilidad DE-UNA'
        }
        setMktContabilidad(prev => ({
            ...prev,
            deUna: {
                ...prev.deUna,
                observaciones: [...(prev.deUna.observaciones || []), nuevaObs]
            }
        }))
        agregarObservacionGeneral(nuevaObservacionDeUna, 'MKT-Contabilidad DE-UNA')
        setNuevaObservacionDeUna('')
        toast.success('Observación agregada')
    }

    const handleAgregarObservacionPuntos = () => {
        if (!nuevaObservacionPuntos.trim()) {
            toast.error('Escribe una observación antes de agregar')
            return
        }
        const nuevaObs: ObservacionItem = {
            id: Date.now().toString(),
            texto: nuevaObservacionPuntos.trim(),
            usuario: user?.nombre || 'Usuario',
            usuarioId: user?._id,
            fecha: new Date().toISOString(),
            etapa: 'MKT-Contabilidad Puntos Emisión'
        }
        setMktContabilidad(prev => ({
            ...prev,
            puntosEmisionCodigos: {
                ...prev.puntosEmisionCodigos,
                observaciones: [...(prev.puntosEmisionCodigos.observaciones || []), nuevaObs]
            }
        }))
        agregarObservacionGeneral(nuevaObservacionPuntos, 'MKT-Contabilidad Puntos Emisión')
        setNuevaObservacionPuntos('')
        toast.success('Observación agregada')
    }

    const handleAgregarObservacionPruebas = () => {
        if (!nuevaObservacionPruebas.trim()) {
            toast.error('Escribe una observación antes de agregar')
            return
        }
        agregarObservacionGeneral(nuevaObservacionPruebas, 'Pruebas')
        setNuevaObservacionPruebas('')
        toast.success('Observación agregada')
    }

    // ===== FUNCIONES DE SELECCIÓN MASIVA =====
    const handleSeleccionarTodasEstaciones = () => {
        setEstaciones(estaciones.map(e => ({ ...e, completado: true })))
    }

    const handleSeleccionarTodosUsuarios = () => {
        setUsuarios(usuarios.map(u => ({ ...u, creado: true })))
    }

    const handleSeleccionarTodasImpresoras = () => {
        setImpresoras(impresoras.map(i => ({ ...i, completado: true })))
    }

    const handleSeleccionarTodoDespliegue = () => {
        setDespliegueItems(despliegueItems.map(d => ({ ...d, completado: true })))
    }

    // ===== FUNCIONES PARA CHAT =====
    const agregarMensajeImplementacion = (texto: string, tipo: MensajeImplementacion['tipo'] = 'novedad') => {
        if (!texto.trim() && tipo !== 'archivo') return
        const nuevo: MensajeImplementacion = {
            id: Date.now().toString(),
            usuario: user?.nombre || 'Usuario',
            usuarioId: user?._id,
            fecha: new Date().toISOString(),
            texto,
            tipo
        }
        const nuevosMensajes = [...mensajesImplementacion, nuevo]
        setMensajesImplementacion(nuevosMensajes)
        localStorage.setItem(`chat_implementacion_${id}`, JSON.stringify(nuevosMensajes))
    }

    const handleEnviarMensaje = () => {
        if (!nuevoMensaje.trim() && !archivoSeleccionado) return
        if (archivoSeleccionado) {
            handleSubirArchivoChat(archivoSeleccionado)
            setArchivoSeleccionado(null)
        }
        if (nuevoMensaje.trim()) {
            agregarMensajeImplementacion(nuevoMensaje)
            setNuevoMensaje('')
        }
    }

    // ===== FUNCIONES DE ESTADO - FLUJO CORREGIDO =====
    const verificarConfiguracionCompleta = (): boolean => {
        const estacionesOk = estaciones.length === 0 || estaciones.every(e => e.completado)
        const usuariosOk = usuarios.filter(u => u.activo).length === 0 || usuarios.filter(u => u.activo).every(u => u.creado)
        const impresorasOk = impresoras.length === 0 || impresoras.every(i => i.completado)
        const despliegueOk = despliegueItems.length === 0 || despliegueItems.every(d => d.completado)
        const mktOk = mktContabilidad.deUna.check && mktContabilidad.puntosEmisionCodigos.check
        return estacionesOk && usuariosOk && impresorasOk && despliegueOk && mktOk
    }

    const verificarRevisionCompleta = (): boolean => pruebas.every(p => p.check)

    const verificarInstalacionCompleta = (): boolean => {
        return instalacionCompletada === true
    }

    const handleSiguienteEstado = async () => {
        // Caso 1: EN PROCESO -> REVISIÓN
        if (estadoActual === 'en_proceso' && verificarConfiguracionCompleta()) {
            if (window.confirm('¿Estás seguro de que todos los items han sido completados? Esta acción moverá a REVISIÓN.')) {
                await implementacionesService.cambiarEstado(id!, 'en_revision')
                setEstadoActual('en_revision')
                agregarMensajeImplementacion('✅ Configuración completada. Pasando a REVISIÓN')
                toast.success('✅ Pasando a revisión')
            }
            return
        }

        // Caso 2: REVISIÓN -> INSTALACIÓN
        if (estadoActual === 'en_revision' && verificarRevisionCompleta()) {
            if (window.confirm('¿Estás seguro de que todas las pruebas han sido completadas? Esta acción moverá a INSTALACIÓN.')) {
                await implementacionesService.cambiarEstado(id!, 'instalacion')
                setEstadoActual('instalacion')
                agregarMensajeImplementacion('✅ Pruebas completadas. Pasando a INSTALACIÓN')
                toast.success('✅ Pasando a instalación')
            }
            return
        }

        // Caso 3: INSTALACIÓN -> APERTURA
        if (estadoActual === 'instalacion' && verificarInstalacionCompleta()) {
            if (window.confirm('¿Estás seguro de que la instalación ha sido completada? Esta acción moverá a APERTURA.')) {
                await implementacionesService.cambiarEstado(id!, 'apertura')
                setEstadoActual('apertura')
                agregarMensajeImplementacion('✅ Instalación completada. Pasando a APERTURA')
                toast.success('✅ Pasando a apertura')
            }
            return
        }

        // Caso 4: APERTURA -> COMPLETADO
        if (estadoActual === 'apertura') {
            if (window.confirm('¿Estás seguro de que deseas finalizar la implementación?')) {
                await implementacionesService.cambiarEstado(id!, 'completado')
                setEstadoActual('completado')
                setImplementacionFinalizada(true)
                agregarMensajeImplementacion('🎉 Implementación finalizada exitosamente!', 'finalizacion')
                toast.success('🎉 Implementación finalizada!')
            }
            return
        }

        // Mostrar mensajes de error si faltan items
        const faltantes = []
        if (estadoActual === 'en_proceso') {
            if (!verificarConfiguracionCompleta()) faltantes.push('Completa la configuración')
        } else if (estadoActual === 'en_revision') {
            if (!verificarRevisionCompleta()) faltantes.push('Completa todas las pruebas')
        } else if (estadoActual === 'instalacion') {
            if (!verificarInstalacionCompleta()) faltantes.push('Marca la instalación como completada')
        }

        if (faltantes.length > 0) {
            toast.error(`❌ No se puede continuar. ${faltantes.join(', ')}`)
        } else {
            toast.error(`❌ No se puede pasar al siguiente estado en ${estadoActual}`)
        }
    }

    const handleCambiarEstadoManual = async (nuevoEstado: EstadoImplementacion) => {
        try {
            await implementacionesService.cambiarEstado(id!, nuevoEstado)
            setEstadoActual(nuevoEstado)
            setShowEstadoModal(false)
            agregarMensajeImplementacion(`Estado cambiado manualmente a ${nuevoEstado.replace('_', ' ')}`)
            toast.success(`Estado cambiado a ${nuevoEstado.replace('_', ' ')}`)
            agregarObservacionGeneral(`Estado cambiado a ${nuevoEstado.replace('_', ' ')}`, 'Cambio de estado')
        } catch (error) {
            console.error('Error cambiando estado:', error)
            toast.error('Error al cambiar el estado')
        }
    }

    // ===== FUNCIÓN PARA CARGAR RESUMEN FINAL =====
    const cargarResumenFinal = async () => {
        try {
            console.log('📊 Cargando resumen final para implementación:', id)

            const implementacionActual = implementacion
            if (!implementacionActual) {
                toast.error('No se encontraron datos de la implementación')
                return
            }

            // Obtener fechas del historial
            const fechaInicio = implementacionActual.createdAt ? new Date(implementacionActual.createdAt) : null
            const fechaFin = implementacionActual.updatedAt ? new Date(implementacionActual.updatedAt) : new Date()

            // Calcular tiempos por etapa basado en el historial
            let horasConfiguracion = 0
            let horasPruebas = 0
            let horasInstalacion = 0
            let horasApertura = 0

            // Si hay historial de cambios de estado, calcular tiempos
            if (implementacionActual.historial && implementacionActual.historial.length > 0) {
                let lastDate: Date | null = null
                let currentStage = ''

                implementacionActual.historial.forEach((entry: any) => {
                    const entryDate = new Date(entry.fecha)
                    const estado = entry.estadoNuevo || entry.estado || ''

                    if (lastDate && currentStage) {
                        const diffHoras = (entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60)

                        switch (currentStage) {
                            case 'en_proceso':
                                horasConfiguracion += diffHoras
                                break
                            case 'en_revision':
                                horasPruebas += diffHoras
                                break
                            case 'instalacion':
                                horasInstalacion += diffHoras
                                break
                            case 'apertura':
                                horasApertura += diffHoras
                                break
                        }
                    }

                    lastDate = entryDate
                    currentStage = estado
                })

                if (fechaFin && lastDate && implementacionActual.estadoGeneral === 'completado') {
                    const diffFinal = (fechaFin.getTime() - lastDate.getTime()) / (1000 * 60 * 60)
                    if (currentStage === 'apertura') horasApertura += diffFinal
                    else if (currentStage === 'instalacion') horasInstalacion += diffFinal
                }
            }

            const totalHoras = horasConfiguracion + horasPruebas + horasInstalacion + horasApertura

            // Recopilar observaciones
            const observaciones = [...observacionesGenerales]

            // Agregar observaciones de configuraciones
            if (mktContabilidad.deUna.observaciones?.length) {
                mktContabilidad.deUna.observaciones.forEach(obs => {
                    observaciones.push({
                        id: obs.id,
                        texto: obs.texto,
                        usuario: obs.usuario,
                        fecha: obs.fecha,
                        etapa: 'MKT-Contabilidad DE-UNA'
                    } as ObservacionItem)
                })
            }
            if (mktContabilidad.puntosEmisionCodigos.observaciones?.length) {
                mktContabilidad.puntosEmisionCodigos.observaciones.forEach(obs => {
                    observaciones.push({
                        id: obs.id,
                        texto: obs.texto,
                        usuario: obs.usuario,
                        fecha: obs.fecha,
                        etapa: 'MKT-Contabilidad Puntos Emisión'
                    } as ObservacionItem)
                })
            }

            // Filtrar contratiempos
            const contratiempos = observaciones.filter(obs =>
                obs.texto?.toLowerCase().includes('problema') ||
                obs.texto?.toLowerCase().includes('error') ||
                obs.texto?.toLowerCase().includes('demora') ||
                obs.texto?.toLowerCase().includes('retraso') ||
                obs.texto?.toLowerCase().includes('pendiente')
            )

            // Preparar checklist
            const checklist = {
                estaciones: verificarConfiguracionCompleta(),
                usuarios: usuarios.filter(u => u.activo).every(u => u.creado),
                impresoras: impresoras.every(i => i.completado),
                despliegue: despliegueItems.every(d => d.completado),
                mkt: mktContabilidad.deUna.check && mktContabilidad.puntosEmisionCodigos.check,
                pruebas: verificarRevisionCompleta(),
                instalacion: verificarInstalacionCompleta()
            }

            // Resumen del chat
            const chatResumen = mensajesImplementacion
                .filter(m => m.usuario !== 'Sistema')
                .slice(-50)
                .map(m => ({
                    usuario: m.usuario,
                    mensaje: m.texto,
                    fecha: m.fecha,
                    archivos: m.archivos
                }))

            setResumenData({
                implementacion: {
                    id: implementacionActual._id,
                    codigo: implementacionActual.codigo,
                    nombre: implementacionActual.nombre,
                    cadena: implementacionActual.cadena,
                    estadoGeneral: implementacionActual.estadoGeneral,
                    tecnicoAsignado: implementacionActual.tecnicoAsignado,
                    fechaImplementacionPlanificada: implementacionActual.fechaImplementacionPlanificada
                },
                tiendaAsociada: tiendaAsociada,
                fechas: {
                    inicio: fechaInicio?.toISOString(),
                    fin: fechaFin?.toISOString()
                },
                tiempos: {
                    horasConfiguracion: Math.round(horasConfiguracion * 10) / 10,
                    horasPruebas: Math.round(horasPruebas * 10) / 10,
                    horasInstalacion: Math.round(horasInstalacion * 10) / 10,
                    horasApertura: Math.round(horasApertura * 10) / 10,
                    totalHoras: Math.round(totalHoras * 10) / 10,
                    totalDias: Math.round((totalHoras / 8) * 10) / 10
                },
                observaciones: observaciones,
                contratiempos: contratiempos,
                archivosAdjuntos: archivosAdjuntos,
                chatResumen: chatResumen,
                checklist: checklist,
                instalacionCompletada: verificarInstalacionCompleta()
            })

            setShowResumenModal(true)
            toast.success('Resumen generado exitosamente')

        } catch (error) {
            console.error('Error cargando resumen:', error)
            toast.error('Error al cargar el resumen')
        }
    }

    // ===== FUNCIÓN PARA GENERAR INFORME WORD DE IMPLEMENTACIÓN =====
    const generarInformeWordImplementacion = (resumenData: any, _implementacionData: Implementacion | null) => {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Informe Técnico de Implementación - ${resumenData.implementacion?.codigo}</title>
                <style>
                    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #cc0000; padding-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #cc0000; }
                    .title { font-size: 18px; color: #666; margin-top: 5px; }
                    h2 { color: #cc0000; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-top: 25px; }
                    h3 { color: #333; margin-top: 20px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                    .info-item { margin-bottom: 8px; }
                    .info-label { font-weight: bold; width: 120px; display: inline-block; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #cc0000; color: white; }
                    .tiempos { display: flex; justify-content: space-between; margin: 15px 0; }
                    .tiempo-card { background: #f0f0f0; padding: 10px; border-radius: 8px; text-align: center; flex: 1; margin: 0 5px; }
                    .tiempo-valor { font-size: 24px; font-weight: bold; color: #cc0000; }
                    .observacion { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
                    .contratiempo { background: #f8d7da; border-left: 4px solid #dc3545; padding: 10px; margin: 10px 0; }
                    .checklist-item { display: flex; align-items: center; gap: 8px; margin: 5px 0; }
                    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
                    .image-container { text-align: center; margin: 20px 0; }
                    .image-container img { max-width: 100%; max-height: 300px; border: 1px solid #ddd; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">KFC Implementaciones</div>
                    <div class="title">Informe Técnico de Implementación</div>
                </div>
                
                <h2>1. Información General</h2>
                <div class="info-grid">
                    <div class="info-item"><span class="info-label">Código:</span> ${resumenData.implementacion?.codigo || 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Nombre:</span> ${resumenData.implementacion?.nombre || 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Cadena:</span> ${resumenData.implementacion?.cadena || 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Tienda Asociada:</span> ${resumenData.tiendaAsociada?.codigo || 'N/A'} - ${resumenData.tiendaAsociada?.nombre || 'No asociada'}</div>
                    <div class="info-item"><span class="info-label">Técnico Asignado:</span> ${resumenData.implementacion?.tecnicoAsignado?.nombre || 'No asignado'}</div>
                    <div class="info-item"><span class="info-label">Fecha Planificada:</span> ${resumenData.implementacion?.fechaImplementacionPlanificada ? new Date(resumenData.implementacion.fechaImplementacionPlanificada).toLocaleDateString('es-EC') : 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Fecha Inicio:</span> ${resumenData.fechas?.inicio ? new Date(resumenData.fechas.inicio).toLocaleString('es-EC') : 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Fecha Finalización:</span> ${resumenData.fechas?.fin ? new Date(resumenData.fechas.fin).toLocaleString('es-EC') : 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Estado Final:</span> ${resumenData.implementacion?.estadoGeneral?.toUpperCase() || 'COMPLETADO'}</div>
                </div>
                
                <h2>2. Tiempos del Proceso</h2>
                <div class="tiempos">
                    <div class="tiempo-card"><div class="tiempo-valor">${resumenData.tiempos?.totalHoras || 0}h</div><div>Tiempo Total</div><small>(${resumenData.tiempos?.totalDias || 0} días)</small></div>
                    <div class="tiempo-card"><div class="tiempo-valor">${resumenData.tiempos?.horasConfiguracion || 0}h</div><div>Configuración</div></div>
                    <div class="tiempo-card"><div class="tiempo-valor">${resumenData.tiempos?.horasPruebas || 0}h</div><div>Pruebas</div></div>
                    <div class="tiempo-card"><div class="tiempo-valor">${resumenData.tiempos?.horasInstalacion || 0}h</div><div>Instalación</div></div>
                    <div class="tiempo-card"><div class="tiempo-valor">${resumenData.tiempos?.horasApertura || 0}h</div><div>Apertura</div></div>
                </div>
                
                <h2>3. Checklist de Configuración</h2>
                <div class="info-grid">
                    <div class="checklist-item"><span>${resumenData.checklist?.estaciones ? '✅' : '❌'}</span> Estaciones configuradas</div>
                    <div class="checklist-item"><span>${resumenData.checklist?.usuarios ? '✅' : '❌'}</span> Usuarios creados</div>
                    <div class="checklist-item"><span>${resumenData.checklist?.impresoras ? '✅' : '❌'}</span> Impresoras configuradas</div>
                    <div class="checklist-item"><span>${resumenData.checklist?.despliegue ? '✅' : '❌'}</span> Despliegue completado</div>
                    <div class="checklist-item"><span>${resumenData.checklist?.mkt ? '✅' : '❌'}</span> MKT-Contabilidad</div>
                    <div class="checklist-item"><span>${resumenData.checklist?.pruebas ? '✅' : '❌'}</span> Pruebas funcionales</div>
                    <div class="checklist-item"><span>${resumenData.checklist?.instalacion ? '✅' : '❌'}</span> Instalación completada</div>
                </div>
                
                <h2>4. Contratiempos y Novedades</h2>
                ${resumenData.contratiempos && resumenData.contratiempos.length > 0 ?
            resumenData.contratiempos.map((obs: any) => `
                        <div class="contratiempo">
                            <strong>${obs.etapa}</strong><br>
                            ${obs.texto}<br>
                            <small>Registrado: ${obs.usuario ? `Por: ${obs.usuario} - ` : ''}${obs.fecha ? new Date(obs.fecha).toLocaleString('es-EC') : ''}</small>
                        </div>
                    `).join('') :
            '<p>No se registraron contratiempos durante el proceso.</p>'
        }
                
                <h2>5. Observaciones del Proceso</h2>
                ${resumenData.observaciones && resumenData.observaciones.length > 0 ?
            resumenData.observaciones.map((obs: any) => `
                        <div class="observacion">
                            <strong>${obs.etapa}</strong><br>
                            ${obs.texto}<br>
                            <small>Registrado: ${obs.usuario ? `Por: ${obs.usuario} - ` : ''}${obs.fecha ? new Date(obs.fecha).toLocaleString('es-EC') : ''}</small>
                        </div>
                    `).join('') :
            '<p>No se registraron observaciones durante el proceso.</p>'
        }
                
                <h2>6. Documentos Adjuntos</h2>
                ${resumenData.archivosAdjuntos && resumenData.archivosAdjuntos.length > 0 ?
            `<ul>
                        ${resumenData.archivosAdjuntos.map((arch: any) => `
                            <li>${arch.nombre} ${arch.categoria ? `(${arch.categoria})` : ''}</li>
                        `).join('')}
                    </ul>` :
            '<p>No se adjuntaron documentos.</p>'
        }
                
                <h2>7. Registro de Novedades (Chat)</h2>
                ${resumenData.chatResumen && resumenData.chatResumen.length > 0 ?
            `<table>
                        <thead>
                            <tr><th>Usuario</th><th>Mensaje</th><th>Fecha</th></tr>
                        </thead>
                        <tbody>
                            ${resumenData.chatResumen.map((msg: any) => `
                                <tr>
                                    <td>${msg.usuario}</td>
                                    <td>${msg.mensaje}</td>
                                    <td>${new Date(msg.fecha).toLocaleString('es-EC')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>` :
            '<p>No hay registros en el chat.</p>'
        }
                
                <div class="footer">
                    <p>Documento generado automáticamente por el Sistema de Implementaciones KFC</p>
                    <p>Fecha de generación: ${new Date().toLocaleString('es-EC')}</p>
                </div>
            </body>
            </html>
        `

        const blob = new Blob([htmlContent], { type: 'application/msword' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Informe_Implementacion_${resumenData.implementacion?.codigo}_${new Date().toISOString().split('T')[0]}.doc`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleRegresar = () => navigate('/implementaciones')

    useEffect(() => {
        if (id) {
            loadData()
        }
    }, [id])

    // Verificar si hay elementos para mostrar
    const tieneEstaciones = estaciones.length > 0
    const tieneUsuarios = usuarios.filter(u => u.activo && u.id !== 'tienda').length > 0
    const tieneImpresoras = impresoras.length > 0
    const tieneDespliegue = despliegueItems.length > 0
    const tieneArchivos = archivosAdjuntos.length > 0
    const puedeReasignarTecnico = estadoActual === 'pendiente' || estadoActual === 'en_proceso'

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfc-red"></div>
                </div>
            </Layout>
        )
    }

    if (!implementacion) {
        return (
            <Layout>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Implementación no encontrada</h2>
                    <Button variant="primary" onClick={handleRegresar}>Volver a Implementaciones</Button>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* HEADER */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={handleRegresar} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <ArrowUturnLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                        {implementacion.codigo} - {implementacion.nombre}
                                    </h1>
                                    <StatusBadge status={estadoActual} />
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Implementación - {implementacion.cadena}
                                    {tiendaAsociada && ` | Tienda: ${tiendaAsociada.codigo} - ${tiendaAsociada.nombre}`}
                                </p>
                                {implementacion.fechaImplementacionPlanificada && (
                                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                                        <CalendarIcon className="h-4 w-4" />
                                        Fecha planificada: {format(new Date(implementacion.fechaImplementacionPlanificada), 'dd/MM/yyyy', { locale: es })}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                                <UserCircleIcon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                    Técnico: {implementacion.tecnicoAsignado?.nombre || 'No asignado'}
                                </span>
                                {puedeReasignarTecnico && (
                                    <button
                                        onClick={() => setShowReasignarTecnicoModal(true)}
                                        className="text-kfc-red hover:text-red-700 text-xs flex items-center gap-1 ml-1"
                                        title="Reasignar técnico"
                                    >
                                        <ArrowPathIcon className="h-3 w-3" /> Cambiar
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setShowEstadoModal(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600" title="Cambiar estado">
                                <CogIcon className="h-5 w-5" />
                            </button>
                            {/* ✅ BOTÓN VER RESUMEN en COMPLETADO */}
                            {estadoActual === 'completado' && (
                                <button onClick={cargarResumenFinal} className="p-2 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 transition-colors" title="Ver resumen">
                                    <ChartBarIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* REPOSITORIO DE ARCHIVOS - PANTALLA PRINCIPAL */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <PaperClipIcon className="h-5 w-5 text-gray-500" />
                        Documentos Adjuntos ({archivosAdjuntos.length})
                    </h4>
                    {tieneArchivos ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {archivosAdjuntos.map((archivo, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {archivo.tipo?.startsWith('image/') ?
                                            <PhotoIcon className="h-4 w-4 text-blue-500 flex-shrink-0" /> :
                                            <PaperClipIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                        }
                                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{archivo.nombre}</span>
                                        {archivo.categoria && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                archivo.categoria === 'Chat' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                                {archivo.categoria}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        <a href={archivo.url} download className="text-kfc-red hover:underline text-sm flex items-center gap-1">
                                            <ArrowDownTrayIcon className="h-4 w-4" /> Descargar
                                        </a>
                                        {archivo.tipo?.startsWith('image/') && (
                                            <button
                                                onClick={() => window.open(archivo.url, '_blank')}
                                                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                            >
                                                <PhotoIcon className="h-4 w-4" /> Ver
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No hay documentos adjuntos</p>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <input type="file" id="repositorio-file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => {
                            if (e.target.files?.[0]) {
                                handleSubirArchivo(e.target.files[0], 'Repositorio')
                                e.target.value = ''
                            }
                        }} />
                        <button
                            onClick={() => document.getElementById('repositorio-file')?.click()}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                        >
                            <PaperClipIcon className="h-4 w-4" /> Subir documento
                        </button>
                    </div>
                </div>

                {/* Debug - Estado actual */}
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm">
                        <span className="font-semibold">Estado actual:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                            estadoActual === 'en_revision' ? 'bg-purple-100 text-purple-800' :
                                estadoActual === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                                    estadoActual === 'instalacion' ? 'bg-indigo-100 text-indigo-800' :
                                        estadoActual === 'apertura' ? 'bg-orange-100 text-orange-800' :
                                            estadoActual === 'completado' ? 'bg-green-100 text-green-800' :
                                                'bg-yellow-100 text-yellow-800'
                        }`}>
                            {estadoActual?.toUpperCase() || 'PENDIENTE'}
                        </span>
                    </p>
                </div>

                {/* Botón iniciar implementación */}
                {estadoActual === 'pendiente' && (
                    <div className="flex justify-center">
                        <button
                            onClick={() => handleCambiarEstadoManual('en_proceso')}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-3"
                        >
                            <CheckCircleIcon className="h-6 w-6" /> INICIAR IMPLEMENTACIÓN
                        </button>
                    </div>
                )}

                {/* EN PROCESO - Botones de configuración */}
                {estadoActual === 'en_proceso' && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {tieneEstaciones && (
                                <button
                                    onClick={() => setShowConfiguracionesModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <BuildingOfficeIcon className="h-5 w-5" /> CONFIGURACIONES
                                </button>
                            )}
                            {tieneUsuarios && (
                                <button
                                    onClick={() => setShowUsuariosModal(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <UserGroupIcon className="h-5 w-5" /> USUARIOS
                                </button>
                            )}
                            {tieneDespliegue && (
                                <button
                                    onClick={() => setShowDespliegueModal(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <CubeIcon className="h-5 w-5" /> DESPLIEGUE
                                </button>
                            )}
                            <button
                                onClick={() => setShowMKTContabilidadModal(true)}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <DocumentTextIcon className="h-5 w-5" /> MKT-CONTABILIDAD
                            </button>
                        </div>
                        {verificarConfiguracionCompleta() ? (
                            <div className="flex justify-center mt-4">
                                <button onClick={handleSiguienteEstado} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                                    <ArrowRightIcon className="h-5 w-5" /> PASAR A REVISIÓN
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-center mt-4">
                                <button className="bg-gray-400 cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2">
                                    <ArrowRightIcon className="h-5 w-5" /> PASAR A REVISIÓN (Completa la configuración)
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* EN REVISIÓN - Pruebas */}
                {estadoActual === 'en_revision' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={() => setShowPruebasModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg">
                                <ClipboardDocumentListIcon className="h-6 w-6" /> PRUEBAS FUNCIONALES
                            </button>
                        </div>
                        {verificarRevisionCompleta() ? (
                            <div className="flex justify-center mt-4">
                                <button onClick={handleSiguienteEstado} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                                    <ArrowRightIcon className="h-5 w-5" /> PASAR A INSTALACIÓN
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-center mt-4">
                                <button className="bg-gray-400 cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2">
                                    <ArrowRightIcon className="h-5 w-5" /> PASAR A INSTALACIÓN (Completa las pruebas)
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* INSTALACIÓN - CORREGIDO CON ESTILOS DARK MODE */}
                {estadoActual === 'instalacion' && (
                    <>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <WrenchIcon className="h-5 w-5 text-kfc-red" />
                                Instalación de Equipos
                            </h3>
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={instalacionCompletada}
                                        onChange={(e) => {
                                            setInstalacionCompletada(e.target.checked)
                                            localStorage.setItem(`instalacion_imp_${id}`, JSON.stringify(e.target.checked))
                                            if (e.target.checked) {
                                                agregarMensajeImplementacion('✅ Instalación completada')
                                            }
                                        }}
                                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-kfc-red focus:ring-kfc-red dark:focus:ring-offset-gray-800"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Instalación de equipos completada
                                    </span>
                                </label>

                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-start gap-2">
                                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            ⚙️ Verifica que todos los equipos estén correctamente instalados y configurados antes de marcar como completado.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center mt-4">
                            {verificarInstalacionCompleta() ? (
                                <button
                                    onClick={handleSiguienteEstado}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <ArrowRightIcon className="h-5 w-5" /> INICIAR APERTURA
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2 opacity-60"
                                >
                                    <ArrowRightIcon className="h-5 w-5" /> INICIAR APERTURA (Completa instalación)
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* APERTURA - Seguimiento y Finalización */}
                {estadoActual === 'apertura' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                    Finalización
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Una vez que la apertura esté completa, puedes finalizar la implementación.
                                </p>
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        ⚠️ Asegúrate de que todo esté funcionando correctamente antes de finalizar.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowChatModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"
                            >
                                <ChatBubbleLeftIcon className="h-6 w-6" /> SEGUIMIENTO
                            </button>
                        </div>
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={handleSiguienteEstado}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <CheckCircleIcon className="h-5 w-5" /> FINALIZAR IMPLEMENTACIÓN
                            </button>
                        </div>
                    </>
                )}

                {/* COMPLETADO */}
                {estadoActual === 'completado' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                Implementación Completada
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Finalizado</span>
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={() => setShowChatModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                                    <ChatBubbleLeftIcon className="h-4 w-4" /> VER REGISTRO
                                </button>
                                <button onClick={cargarResumenFinal} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                                    <ChartBarIcon className="h-4 w-4" /> VER RESUMEN
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== MODAL RESUMEN FINAL ===== */}
                {showResumenModal && resumenData && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <ChartBarIcon className="h-6 w-6 text-kfc-red" />
                                        Informe Final de Implementación - {resumenData.implementacion?.codigo} {resumenData.implementacion?.nombre}
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => generarInformeWordImplementacion(resumenData, implementacion)}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                                        >
                                            <DocumentTextIcon className="h-5 w-5" />
                                            Descargar Informe
                                        </button>
                                        <button onClick={() => setShowResumenModal(false)} className="text-gray-500 hover:text-gray-700">
                                            <XCircleIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                {/* Información General */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <BuildingStorefrontIcon className="h-5 w-5 text-blue-600" />
                                        Información General
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div><span className="font-medium">Código:</span> {resumenData.implementacion?.codigo}</div>
                                        <div><span className="font-medium">Nombre:</span> {resumenData.implementacion?.nombre}</div>
                                        <div><span className="font-medium">Cadena:</span> {resumenData.implementacion?.cadena}</div>
                                        <div><span className="font-medium">Tienda Asociada:</span> {resumenData.tiendaAsociada?.codigo} - {resumenData.tiendaAsociada?.nombre || 'No asociada'}</div>
                                        <div><span className="font-medium">Técnico Asignado:</span> {resumenData.implementacion?.tecnicoAsignado?.nombre || 'No asignado'}</div>
                                        <div><span className="font-medium">Fecha Planificada:</span> {resumenData.implementacion?.fechaImplementacionPlanificada ? format(new Date(resumenData.implementacion.fechaImplementacionPlanificada), 'dd/MM/yyyy') : 'No definida'}</div>
                                        <div><span className="font-medium">Fecha Inicio:</span> {resumenData.fechas?.inicio ? format(new Date(resumenData.fechas.inicio), 'dd/MM/yyyy HH:mm') : 'No registrada'}</div>
                                        <div><span className="font-medium">Fecha Finalización:</span> {resumenData.fechas?.fin ? format(new Date(resumenData.fechas.fin), 'dd/MM/yyyy HH:mm') : 'No registrada'}</div>
                                        <div><span className="font-medium">Estado Final:</span> <span className="text-green-600 font-bold">{resumenData.implementacion?.estadoGeneral?.toUpperCase() || 'COMPLETADO'}</span></div>
                                    </div>
                                </div>

                                {/* Tiempos */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Total</p>
                                        <p className="text-2xl font-bold text-green-600">{resumenData.tiempos?.totalHoras || 0} horas</p>
                                        <p className="text-xs text-gray-500">({resumenData.tiempos?.totalDias || 0} días)</p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Tareas Completadas</p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {Object.values(resumenData.checklist || {}).filter(v => v === true).length} / {Object.values(resumenData.checklist || {}).length}
                                        </p>
                                    </div>
                                </div>

                                {/* Tiempo por Etapa */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Desglose de Tiempo por Etapa</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Configuración</span>
                                                <span className="font-medium">{resumenData.tiempos?.horasConfiguracion || 0} horas</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${((resumenData.tiempos?.horasConfiguracion || 0) / (resumenData.tiempos?.totalHoras || 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Pruebas</span>
                                                <span className="font-medium">{resumenData.tiempos?.horasPruebas || 0} horas</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${((resumenData.tiempos?.horasPruebas || 0) / (resumenData.tiempos?.totalHoras || 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Instalación</span>
                                                <span className="font-medium">{resumenData.tiempos?.horasInstalacion || 0} horas</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${((resumenData.tiempos?.horasInstalacion || 0) / (resumenData.tiempos?.totalHoras || 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Apertura</span>
                                                <span className="font-medium">{resumenData.tiempos?.horasApertura || 0} horas</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((resumenData.tiempos?.horasApertura || 0) / (resumenData.tiempos?.totalHoras || 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Checklist de Configuración */}
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                        Checklist de Configuración
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div className="flex items-center gap-2">
                                            {resumenData.checklist?.estaciones ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-400" />}
                                            <span className="text-sm">Estaciones configuradas</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {resumenData.checklist?.usuarios ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-400" />}
                                            <span className="text-sm">Usuarios creados</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {resumenData.checklist?.impresoras ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-400" />}
                                            <span className="text-sm">Impresoras configuradas</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {resumenData.checklist?.despliegue ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-400" />}
                                            <span className="text-sm">Despliegue completado</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {resumenData.checklist?.mkt ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-400" />}
                                            <span className="text-sm">MKT-Contabilidad</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {resumenData.checklist?.pruebas ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-400" />}
                                            <span className="text-sm">Pruebas funcionales</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {resumenData.checklist?.instalacion ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <XCircleIcon className="h-4 w-4 text-red-400" />}
                                            <span className="text-sm">Instalación completada</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contratiempos */}
                                {resumenData.contratiempos && resumenData.contratiempos.length > 0 && (
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                                            Contratiempos y Novedades
                                        </h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {resumenData.contratiempos.map((obs: any, idx: number) => (
                                                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-2 text-sm border-l-4 border-red-400">
                                                    <p className="text-gray-700 dark:text-gray-300">{obs.texto}</p>
                                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                        <span>{obs.etapa}</span>
                                                        <span>{obs.usuario && `Por: ${obs.usuario}`} {obs.fecha && format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Observaciones Generales */}
                                {resumenData.observaciones && resumenData.observaciones.length > 0 && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <DocumentTextIcon className="h-5 w-5 text-yellow-600" />
                                            Observaciones del Proceso
                                        </h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {resumenData.observaciones.map((obs: any, idx: number) => (
                                                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-2 text-sm">
                                                    <p className="text-gray-700 dark:text-gray-300">{obs.texto}</p>
                                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                        <span>{obs.etapa}</span>
                                                        <span>{obs.usuario && `Por: ${obs.usuario}`} {obs.fecha && format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Archivos Adjuntos */}
                                {resumenData.archivosAdjuntos && resumenData.archivosAdjuntos.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <PaperClipIcon className="h-5 w-5 text-gray-500" />
                                            Documentos Adjuntos ({resumenData.archivosAdjuntos.length})
                                        </h4>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {resumenData.archivosAdjuntos.map((archivo: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        {archivo.tipo?.startsWith('image/') ?
                                                            <PhotoIcon className="h-4 w-4 text-blue-500" /> :
                                                            <PaperClipIcon className="h-4 w-4 text-gray-500" />
                                                        }
                                                        <span className="text-sm">{archivo.nombre}</span>
                                                        {archivo.categoria && (
                                                            <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">{archivo.categoria}</span>
                                                        )}
                                                    </div>
                                                    <a href={archivo.url} download className="text-kfc-red hover:underline text-sm">Descargar</a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Registro de Novedades (Chat) */}
                                {resumenData.chatResumen && resumenData.chatResumen.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <ChatBubbleLeftIcon className="h-5 w-5 text-kfc-red" />
                                            Registro de Novedades ({resumenData.chatResumen.length} mensajes)
                                        </h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {resumenData.chatResumen.map((msg: any, idx: number) => (
                                                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-2 text-sm border-l-4 border-kfc-red">
                                                    <p className="text-gray-800 dark:text-gray-200">{msg.mensaje}</p>
                                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                        <span>{msg.usuario}</span>
                                                        <span>{format(new Date(msg.fecha), 'dd/MM/yyyy HH:mm')}</span>
                                                    </div>
                                                    {msg.archivos?.map((arch: any, aidx: number) => (
                                                        <a key={aidx} href={arch.url} download className="text-xs text-kfc-red hover:underline flex items-center gap-1 mt-1">
                                                            <PaperClipIcon className="h-3 w-3" /> {arch.nombre}
                                                        </a>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 p-4 pt-0 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                                <button onClick={() => setShowResumenModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300">
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => generarInformeWordImplementacion(resumenData, implementacion)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <DocumentTextIcon className="h-5 w-5" />
                                    Descargar Informe Técnico
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== MODAL CONFIGURACIONES ===== */}
                {showConfiguracionesModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" style={{ alignItems: 'flex-start' }}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BuildingOfficeIcon className="h-6 w-6 text-kfc-red" />
                                        Configuraciones - {implementacion.codigo}
                                    </h3>
                                    <button onClick={() => setShowConfiguracionesModal(false)} className="text-gray-500 hover:text-gray-700">
                                        <XCircleIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-8">
                                {/* ESTACIONES */}
                                {tieneEstaciones && (
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />
                                                Estaciones
                                            </h4>
                                            <button
                                                onClick={handleSeleccionarTodasEstaciones}
                                                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                                            >
                                                <CheckCircleIcon className="h-4 w-4 inline mr-1" /> Marcar todas
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {estaciones.map((estacion) => (
                                                <div key={estacion.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {estacion.tipo === 'caja' && <CreditCardIcon className="h-5 w-5 text-blue-500" />}
                                                        {estacion.tipo === 'kiosco' && <BuildingStorefrontIcon className="h-5 w-5 text-green-500" />}
                                                        {estacion.tipo === 'delivery' && <PrinterIcon className="h-5 w-5 text-purple-500" />}
                                                        {estacion.tipo === 'drive' && <TruckIcon className="h-5 w-5 text-orange-500" />}
                                                        {estacion.tipo === 'pickup' && <BuildingStorefrontIcon className="h-5 w-5 text-indigo-500" />}
                                                        {estacion.tipo === 'heladeria' && <CakeIcon className="h-5 w-5 text-pink-500" />}
                                                        <span>{estacion.nombre}</span>
                                                    </div>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={estacion.completado}
                                                            onChange={(e) => setEstaciones(estaciones.map(e => e.id === estacion.id ? { ...e, completado: e.target.checked } : e))}
                                                            className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                                        />
                                                        <span className="text-sm">Configurada</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* IMPRESORAS */}
                                {tieneImpresoras && (
                                    <div className="mt-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <PrinterIcon className="h-5 w-5 text-purple-500" />
                                                Impresoras
                                            </h4>
                                            <button onClick={handleSeleccionarTodasImpresoras} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg">
                                                <CheckCircleIcon className="h-4 w-4 inline mr-1" /> Marcar todas
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {impresoras.map((impresora) => (
                                                <div key={impresora.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <PrinterIcon className="h-5 w-5 text-purple-500" />
                                                        <span>{impresora.nombre}</span>
                                                    </div>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={impresora.completado}
                                                            onChange={(e) => setImpresoras(impresoras.map(i => i.id === impresora.id ? { ...i, completado: e.target.checked } : i))}
                                                            className="w-4 h-4 rounded border-gray-300 text-kfc-red"
                                                        />
                                                        <span className="text-sm">Configurada</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* OBSERVACIONES DE CONFIGURACIÓN */}
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500" />
                                        Observaciones de configuración
                                    </h4>
                                    {observacionesGenerales.filter(o => o.etapa === 'Configuración').map((obs) => (
                                        <div key={obs.id} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 mb-2">
                                            <p className="text-sm">{obs.texto}</p>
                                            <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={nuevaObservacionConfig}
                                            onChange={(e) => setNuevaObservacionConfig(e.target.value)}
                                            placeholder="Escribe una observación..."
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                        />
                                        <button
                                            onClick={handleAgregarObservacionConfig}
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-4 border-t">
                                <button onClick={() => setShowConfiguracionesModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">Cancelar</button>
                                <button onClick={handleGuardarConfiguraciones} className="px-4 py-2 bg-kfc-red text-white rounded-lg">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== MODAL USUARIOS ===== */}
                {showUsuariosModal && tieneUsuarios && (
                    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" style={{ alignItems: 'flex-start' }}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <UserGroupIcon className="h-6 w-6 text-kfc-red" />
                                        Gestión de Usuarios - {implementacion.codigo}
                                    </h3>
                                    <button onClick={() => setShowUsuariosModal(false)} className="text-gray-500 hover:text-gray-700">
                                        <XCircleIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-gray-600">Usuarios generados automáticamente según la configuración</p>
                                    <button onClick={handleSeleccionarTodosUsuarios} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg">
                                        <CheckCircleIcon className="h-4 w-4 inline mr-1" /> Marcar todos
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {usuarios.filter(u => u.activo && u.id !== 'tienda').map((usuario) => (
                                        <div key={usuario.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                                            <div>
                                                <span className="font-medium">{usuario.nombre}</span>
                                                {usuario.usuarioAsignado && (
                                                    <span className="ml-2 text-xs text-gray-500">({usuario.usuarioAsignado})</span>
                                                )}
                                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                                    usuario.tipo === 'kiosco' ? 'bg-green-100 text-green-800' :
                                                        usuario.tipo === 'delivery' ? 'bg-purple-100 text-purple-800' :
                                                            usuario.tipo === 'pickup' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {usuario.tipo.toUpperCase()}
                                                </span>
                                            </div>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={usuario.creado}
                                                    onChange={(e) => setUsuarios(usuarios.map(u => u.id === usuario.id ? { ...u, creado: e.target.checked } : u))}
                                                    className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                                />
                                                <span className="text-sm">Creado</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                {/* OBSERVACIONES DE USUARIOS */}
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <ChatBubbleLeftIcon className="h-5 w-5 text-green-500" />
                                        Observaciones de usuarios
                                    </h4>
                                    {observacionesGenerales.filter(o => o.etapa === 'Usuarios').map((obs) => (
                                        <div key={obs.id} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 mb-2">
                                            <p className="text-sm">{obs.texto}</p>
                                            <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={nuevaObservacionUsuarios}
                                            onChange={(e) => setNuevaObservacionUsuarios(e.target.value)}
                                            placeholder="Escribe una observación..."
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                        />
                                        <button
                                            onClick={handleAgregarObservacionUsuarios}
                                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-4 border-t">
                                <button onClick={() => setShowUsuariosModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium">Cancelar</button>
                                <button onClick={handleGuardarUsuarios} className="px-4 py-2 bg-kfc-red text-white rounded-lg font-medium">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== MODAL DESPLIEGUE ===== */}
                {showDespliegueModal && tieneDespliegue && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <CubeIcon className="h-6 w-6 text-kfc-red" />
                                        Despliegue de Servicios - {implementacion.codigo}
                                    </h3>
                                    <button onClick={() => setShowDespliegueModal(false)} className="text-gray-500 hover:text-gray-700">
                                        <XCircleIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-gray-600">Marca los items que han sido desplegados</p>
                                    <button onClick={handleSeleccionarTodoDespliegue} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg">
                                        <CheckCircleIcon className="h-4 w-4 inline mr-1" /> Marcar todos
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {despliegueItems.map((item, idx) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                {item.id.includes('cajas') && <CreditCardIcon className="h-5 w-5 text-blue-500" />}
                                                {item.id.includes('kioscos') && <BuildingStorefrontIcon className="h-5 w-5 text-green-500" />}
                                                {item.id.includes('delivery') && <PrinterIcon className="h-5 w-5 text-purple-500" />}
                                                {item.id.includes('drive') && <TruckIcon className="h-5 w-5 text-orange-500" />}
                                                {item.id.includes('pickup') && <BuildingStorefrontIcon className="h-5 w-5 text-indigo-500" />}
                                                <span>{item.nombre}</span>
                                            </div>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={item.completado}
                                                    onChange={() => {
                                                        const nuevos = [...despliegueItems]
                                                        nuevos[idx].completado = !nuevos[idx].completado
                                                        setDespliegueItems(nuevos)
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-kfc-red"
                                                />
                                                <span className="text-sm">Completado</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                {/* OBSERVACIONES DE DESPLIEGUE */}
                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <ChatBubbleLeftIcon className="h-5 w-5 text-purple-500" />
                                        Observaciones de despliegue
                                    </h4>
                                    {observacionesGenerales.filter(o => o.etapa === 'Despliegue').map((obs) => (
                                        <div key={obs.id} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 mb-2">
                                            <p className="text-sm">{obs.texto}</p>
                                            <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={nuevaObservacionDespliegue}
                                            onChange={(e) => setNuevaObservacionDespliegue(e.target.value)}
                                            placeholder="Escribe una observación..."
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                        />
                                        <button
                                            onClick={handleAgregarObservacionDespliegue}
                                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-4 border-t">
                                <button onClick={() => setShowDespliegueModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium">Cancelar</button>
                                <button onClick={handleGuardarDespliegue} className="px-4 py-2 bg-kfc-red text-white rounded-lg font-medium">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL MKT-CONTABILIDAD */}
                {showMKTContabilidadModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <DocumentTextIcon className="h-6 w-6 text-kfc-red" />
                                        MKT-Contabilidad - {implementacion.codigo}
                                    </h3>
                                    <button onClick={() => setShowMKTContabilidadModal(false)} className="text-gray-500 hover:text-gray-700"><XCircleIcon className="h-6 w-6" /></button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                {/* DE-UNA */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                                        DE-UNA
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={mktContabilidad.deUna.check}
                                                onChange={(e) => {
                                                    const nuevo = { ...mktContabilidad, deUna: { ...mktContabilidad.deUna, check: e.target.checked } }
                                                    setMktContabilidad(nuevo)
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                            />
                                            <span className="text-sm">Configuración DE-UNA completada</span>
                                        </label>

                                        {/* Observaciones DE-UNA */}
                                        {mktContabilidad.deUna.observaciones && mktContabilidad.deUna.observaciones.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones:</p>
                                                {mktContabilidad.deUna.observaciones.map((obs, idx) => (
                                                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-sm">
                                                        <p className="text-gray-600 dark:text-gray-300">{obs.texto}</p>
                                                        <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-3">
                                            <textarea
                                                value={nuevaObservacionDeUna}
                                                onChange={(e) => setNuevaObservacionDeUna(e.target.value)}
                                                placeholder="Escribe una observación..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                                rows={2}
                                            />
                                            <button
                                                onClick={handleAgregarObservacionDeUna}
                                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                Agregar Observación
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Puntos de Emisión */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-green-500">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <DocumentTextIcon className="h-5 w-5 text-green-500" />
                                        Puntos de Emisión y Códigos de Comercio
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={mktContabilidad.puntosEmisionCodigos.check}
                                                onChange={(e) => {
                                                    const nuevo = { ...mktContabilidad, puntosEmisionCodigos: { ...mktContabilidad.puntosEmisionCodigos, check: e.target.checked } }
                                                    setMktContabilidad(nuevo)
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                            />
                                            <span className="text-sm">Configuración completada</span>
                                        </label>

                                        {/* Observaciones Puntos de Emisión */}
                                        {mktContabilidad.puntosEmisionCodigos.observaciones && mktContabilidad.puntosEmisionCodigos.observaciones.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones:</p>
                                                {mktContabilidad.puntosEmisionCodigos.observaciones.map((obs, idx) => (
                                                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-sm">
                                                        <p className="text-gray-600 dark:text-gray-300">{obs.texto}</p>
                                                        <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-3">
                                            <textarea
                                                value={nuevaObservacionPuntos}
                                                onChange={(e) => setNuevaObservacionPuntos(e.target.value)}
                                                placeholder="Escribe una observación..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                                rows={2}
                                            />
                                            <button
                                                onClick={handleAgregarObservacionPuntos}
                                                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                            >
                                                Agregar Observación
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-4 border-t">
                                <button onClick={() => setShowMKTContabilidadModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium">Cancelar</button>
                                <button onClick={handleGuardarMKTContabilidad} className="px-4 py-2 bg-kfc-red text-white rounded-lg font-medium">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL PRUEBAS FUNCIONALES - CORREGIDO CON BOTÓN DE AGREGAR OBSERVACIÓN */}
                {showPruebasModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <ClipboardDocumentListIcon className="h-6 w-6 text-kfc-red" />
                                        Pruebas Funcionales - {implementacion.codigo}
                                    </h3>
                                    <button onClick={() => setShowPruebasModal(false)} className="text-gray-500 hover:text-gray-700">
                                        <XCircleIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                {pruebas.map((prueba, index) => (
                                    <div key={prueba.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{prueba.nombre}</h4>
                                        <div className="space-y-3">
                                            {/* Checkbox de completado */}
                                            <label className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                                                <input
                                                    type="checkbox"
                                                    checked={prueba.check}
                                                    onChange={(e) => {
                                                        const nuevas = [...pruebas];
                                                        nuevas[index].check = e.target.checked;
                                                        setPruebas(nuevas);
                                                        localStorage.setItem(`pruebas_imp_${id}`, JSON.stringify(nuevas));
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                                />
                                                <span className="text-sm font-medium">Prueba completada</span>
                                            </label>

                                            {/* Área de texto para novedades */}
                                            <div className="mt-3">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Novedades presentadas
                                                </label>
                                                <textarea
                                                    value={prueba.observaciones || ''}
                                                    onChange={(e) => {
                                                        const nuevas = [...pruebas];
                                                        nuevas[index].observaciones = e.target.value;
                                                        setPruebas(nuevas);
                                                        localStorage.setItem(`pruebas_imp_${id}`, JSON.stringify(nuevas));
                                                    }}
                                                    placeholder="Escribe las novedades o incidencias de esta prueba..."
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                                    rows={3}
                                                />
                                            </div>

                                            {/* Botón para agregar observación específica de esta prueba */}
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    type="text"
                                                    value={observacionesPorPrueba[prueba.id] || ''}
                                                    onChange={(e) => setObservacionesPorPrueba(prev => ({ ...prev, [prueba.id]: e.target.value }))}
                                                    placeholder="Escribe una observación para esta prueba..."
                                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                                />
                                                <button
                                                    onClick={() => handleAgregarObservacionPruebaEspecifica(prueba.id)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                                                >
                                                    <PlusCircleIcon className="h-4 w-4" />
                                                    Agregar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Observaciones generales de pruebas */}
                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <ChatBubbleLeftIcon className="h-5 w-5 text-teal-500" />
                                        Observaciones generales de pruebas
                                    </h4>
                                    {observacionesGenerales.filter(o => o.etapa === 'Pruebas').map((obs) => (
                                        <div key={obs.id} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 mb-2">
                                            <p className="text-sm">{obs.texto}</p>
                                            <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={nuevaObservacionPruebas}
                                            onChange={(e) => setNuevaObservacionPruebas(e.target.value)}
                                            placeholder="Escribe una observación general..."
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                        />
                                        <button
                                            onClick={handleAgregarObservacionPruebas}
                                            className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 p-4 border-t">
                                <button onClick={() => setShowPruebasModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium">Cancelar</button>
                                <button onClick={handleGuardarPruebas} className="px-4 py-2 bg-kfc-red text-white rounded-lg font-medium">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL CHAT */}
                {showChatModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <ChatBubbleLeftIcon className="h-6 w-6 text-kfc-red" />
                                        Seguimiento - {implementacion.codigo}
                                        {implementacionFinalizada && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Finalizado</span>}
                                    </h3>
                                    <button onClick={() => setShowChatModal(false)} className="text-gray-500 hover:text-gray-700">
                                        <XCircleIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3 mb-4">
                                    {mensajesImplementacion.map((mensaje) => (
                                        <div key={mensaje.id} className={`flex ${mensaje.usuario === 'Sistema' ? 'justify-center' : mensaje.usuarioId === user?._id ? 'justify-end' : 'justify-start'}`}>
                                            {mensaje.usuario === 'Sistema' ? (
                                                <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs py-1 px-3 rounded-full">
                                                    {mensaje.texto}
                                                </div>
                                            ) : mensaje.usuarioId === user?._id ? (
                                                <div className="max-w-[70%] bg-kfc-red text-white rounded-2xl rounded-tr-sm p-3 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <UserCircleIcon className="h-3 w-3 text-white/70" />
                                                        <span className="text-xs font-medium text-white/80">Yo</span>
                                                        <span className="text-xs text-white/50">{format(new Date(mensaje.fecha), 'HH:mm', { locale: es })}</span>
                                                    </div>
                                                    <p className="text-sm text-white">{mensaje.texto}</p>
                                                    {mensaje.archivos?.map(archivo => (
                                                        <div key={archivo.id} className="mt-2 flex items-center gap-2 text-xs bg-white/10 rounded p-2">
                                                            <PaperClipIcon className="h-3 w-3" />
                                                            <span className="text-white/80">{archivo.nombre}</span>
                                                            <a href={archivo.url} download className="text-white hover:underline ml-auto">Descargar</a>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="max-w-[70%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm p-3 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <UserCircleIcon className="h-3 w-3 text-gray-500" />
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{mensaje.usuario}</span>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(mensaje.fecha), 'HH:mm', { locale: es })}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200">{mensaje.texto}</p>
                                                    {mensaje.archivos?.map(archivo => (
                                                        <div key={archivo.id} className="mt-2 flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-700 rounded p-2">
                                                            <PaperClipIcon className="h-3 w-3 text-gray-500" />
                                                            <span className="text-gray-600 dark:text-gray-400">{archivo.nombre}</span>
                                                            <a href={archivo.url} download className="text-kfc-red hover:underline ml-auto">Descargar</a>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {!implementacionFinalizada && estadoActual !== 'completado' && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <div className="flex gap-2 mb-2">
                                            <input type="file" onChange={(e) => setArchivoSeleccionado(e.target.files?.[0] || null)} className="hidden" id="chat-file-upload" />
                                            <label htmlFor="chat-file-upload" className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
                                                <PaperClipIcon className="h-5 w-5" />
                                            </label>
                                            <input
                                                type="text"
                                                value={nuevoMensaje}
                                                onChange={(e) => setNuevoMensaje(e.target.value)}
                                                placeholder="Escribe una novedad..."
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                onKeyPress={(e) => e.key === 'Enter' && handleEnviarMensaje()}
                                            />
                                            <button onClick={handleEnviarMensaje} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700">
                                                Enviar
                                            </button>
                                        </div>
                                        {archivoSeleccionado && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <PaperClipIcon className="h-3 w-3" /> {archivoSeleccionado.name}
                                                <button onClick={() => setArchivoSeleccionado(null)} className="text-red-500 hover:text-red-700">
                                                    <XCircleIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 p-4 pt-0">
                                <button onClick={() => setShowChatModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL REASIGNAR TÉCNICO */}
                {showReasignarTecnicoModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <UserIcon className="h-6 w-6 text-kfc-red" />
                                    Reasignar Técnico
                                </h3>
                                <button onClick={() => setShowReasignarTecnicoModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <XCircleIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Técnico actual: <span className="font-semibold">{implementacion.tecnicoAsignado?.nombre || 'No asignado'}</span>
                            </p>
                            <div className="space-y-3">
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none"
                                    defaultValue=""
                                    onChange={(e) => e.target.value && handleReasignarTecnico(e.target.value)}
                                    disabled={reasignandoTecnico}
                                >
                                    <option value="">Seleccionar nuevo técnico</option>
                                    {tecnicosDisponibles.map(tecnico => (
                                        <option key={tecnico._id} value={tecnico._id}>
                                            {tecnico.nombre} {tecnico.apellido || ''} - {tecnico.email}
                                        </option>
                                    ))}
                                </select>
                                {reasignandoTecnico && (
                                    <div className="text-center py-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-kfc-red mx-auto"></div>
                                        <p className="text-xs text-gray-500 mt-1">Reasignando...</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button onClick={() => setShowReasignarTecnicoModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium">Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL CAMBIAR ESTADO */}
                {showEstadoModal && isMaster && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cambiar Estado Manualmente</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Estado actual: <span className="font-bold text-kfc-red">{estadoActual?.toUpperCase()}</span></p>
                            <div className="space-y-3">
                                <button onClick={() => handleCambiarEstadoManual('pendiente')} className="w-full py-3 px-4 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg font-medium">📋 Pendiente</button>
                                <button onClick={() => handleCambiarEstadoManual('en_proceso')} className="w-full py-3 px-4 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-medium">🔄 En Proceso</button>
                                <button onClick={() => handleCambiarEstadoManual('en_revision')} className="w-full py-3 px-4 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg font-medium">👁️ En Revisión</button>
                                <button onClick={() => handleCambiarEstadoManual('instalacion')} className="w-full py-3 px-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg font-medium">🔧 Instalación</button>
                                <button onClick={() => handleCambiarEstadoManual('apertura')} className="w-full py-3 px-4 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg font-medium">🚀 Apertura</button>
                                <button onClick={() => handleCambiarEstadoManual('completado')} className="w-full py-3 px-4 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-medium">✅ Completado</button>
                                <button onClick={() => handleCambiarEstadoManual('cancelado')} className="w-full py-3 px-4 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium">❌ Cancelado</button>
                            </div>
                            <div className="flex justify-end mt-6 pt-4 border-t">
                                <button onClick={() => setShowEstadoModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium">Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default ImplementacionDetalle