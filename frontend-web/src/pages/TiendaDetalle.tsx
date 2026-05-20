// pages/TiendaDetalle.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Button from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'
import { tiendasService } from '../services/tiendas'
import { procesoService } from '../services/procesos'
import { pruebasService, EstacionPrueba } from '../services/pruebasService'
import { usuariosService } from '../services/usuariosService'
import { Tienda, Proceso, ArchivoAdjunto, User } from '@/types'
import {
    CheckCircleIcon,
    ChatBubbleLeftIcon,
    ArrowRightIcon,
    TrashIcon,
    PaperClipIcon,
    UserCircleIcon,
    CogIcon,
    DocumentCheckIcon,
    XCircleIcon,
    PencilIcon,
    ArrowUturnLeftIcon,
    ServerIcon,
    CreditCardIcon,
    CubeIcon,
    DocumentTextIcon,
    BuildingStorefrontIcon,
    PrinterIcon,
    CpuChipIcon,
    WalletIcon,
    ShoppingCartIcon,
    WrenchIcon,
    PhotoIcon,
    BoltIcon,
    SignalIcon,
    BuildingOfficeIcon,
    ClipboardDocumentListIcon,
    ChartBarIcon,
    EyeIcon,
    CalendarIcon,
    ArrowDownTrayIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    UserIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

// =============================================
// NUEVAS INTERFACES PARA PRUEBAS DETALLADAS POR ESTACIÓN
// =============================================

interface PruebaEstacionItem {
    id: string
    nombre: string
    check: boolean
    observacion?: string
}

interface PruebaEstacion {
    id: string
    nombre: string
    tipo: 'caja' | 'drive' | 'pickup' | 'delivery' | 'kiosco' | 'kds'
    items: PruebaEstacionItem[]
    completado: boolean
    activo: boolean
}

// Tipos para el flujo
type EstadoTienda = 'pendiente' | 'en_proceso' | 'en_revision' | 'instalacion' | 'apertura' | 'completado' | 'en_espera_proveedor' | 'en_espera_cliente' | 'pendiente_aprobacion' | 'cancelado' | 'bloqueado'

interface MensajeApertura {
    id: string
    usuario: string
    usuarioId?: string
    fecha: string
    texto: string
    tipo: 'novedad' | 'consulta' | 'respuesta' | 'finalizacion' | 'archivo'
    archivos?: ArchivoAdjunto[]
}

interface ServiciosConfig {
    dragonTail: 'aplica' | 'no_aplica' | null
    upselling: 'aplica' | 'no_aplica' | null
    kioscos: 'aplica' | 'no_aplica' | null
}

interface PoliticasRestaurante {
    check: boolean
    archivos?: ArchivoAdjunto[]
    observaciones?: string
}

interface EstacionConfig {
    id: string
    nombre: string
    seleccionado: boolean
    tipo: 'caja' | 'kiosco' | 'delivery' | 'pickup' | 'drive' | 'heladeria' | 'domi' | 'mesero'
    completado: boolean
    archivos?: ArchivoAdjunto[]
}

interface UsuarioConfig {
    id: string
    nombre: string
    tipo: 'tienda' | 'kiosco' | 'delivery' | 'pickup' | 'agregador' | 'mesero'
    usuarioAsignado?: string
    creado: boolean
    activo: boolean
    archivos?: ArchivoAdjunto[]
}

interface ImpresoraConfig {
    id: string
    nombre: string
    seleccionado: boolean
    completado: boolean
    tipo: 'linea' | 'lineaDomi' | 'bar' | 'cocina' | 'parrilla' | 'personalizada' | 'domi' | 'kiosco' | 'drive' | 'mesero' | 'caja'
    nombrePersonalizado?: string
    archivos?: ArchivoAdjunto[]
}

interface FormaPago {
    id: string
    nombre: string
    seleccionado: boolean
    codigo?: string
    descripcion?: string
}

interface DespliegueServidorItem {
    id: string
    nombre: string
    completado: boolean
    aplica: boolean
    observaciones?: string
}

interface DespliegueCajasItem {
    cajaId: string
    cajaNombre: string
    servicioTarjetas: boolean
    servicioImpresion: boolean
}

interface ObservacionAnclada {
    id: string
    texto: string
    usuario: string
    fecha: string
}

interface MKTContabilidadConfig {
    deUna: {
        check: boolean
        archivos?: ArchivoAdjunto[]
        observaciones?: ObservacionAnclada[]
    }
    puntosEmisionCodigos: {
        check: boolean
        archivos?: ArchivoAdjunto[]
        observaciones?: ObservacionAnclada[]
    }
}

interface InfraestructuraConfig {
    servidor: {
        check: boolean
        archivos?: ArchivoAdjunto[]
        observaciones?: ObservacionAnclada[]
        replicaInicial: boolean
        observacionesReplica?: ObservacionAnclada[]
    }
    cajas: {
        check: boolean
        archivos?: ArchivoAdjunto[]
        observaciones?: ObservacionAnclada[]
    }
    enlacePrincipal: {
        check: boolean
        archivos?: ArchivoAdjunto[]
        observaciones?: ObservacionAnclada[]
    }
    energiaElectrica: {
        check: boolean
        archivos?: ArchivoAdjunto[]
        observaciones?: ObservacionAnclada[]
    }
}

interface PruebaItem {
    id: string
    nombre: string
    check: boolean
    archivos?: ArchivoAdjunto[]
    observaciones?: string
}

interface InstalacionConfig {
    instalacionEquipos: {
        check: boolean
        archivos?: ArchivoAdjunto[]
        observaciones?: string
    }
    pruebasLocal: {
        check: boolean
        archivos?: ArchivoAdjunto[]
        observaciones?: string
    }
}

// CHECKLIST COMPLETO para el resumen
const CHECKLIST_COMPLETO = [
    'Configuración Dragon Tail', 'Configuración Upselling', 'Configuración Kioscos',
    'Políticas Restaurante', 'Estaciones configuradas', 'Usuarios creados',
    'Impresoras configuradas', 'Formas de pago', 'Despliegue Servidor',
    'Despliegue Cajas', 'MKT-Contabilidad DE-UNA', 'MKT-Contabilidad Puntos Emisión',
    'Infraestructura Servidor', 'Infraestructura Cajas', 'Infraestructura Enlace Principal',
    'Infraestructura Energía Eléctrica', 'Réplica Inicial', 'Pruebas Conexión',
    'Pruebas Pagos', 'Pruebas Facturación', 'Pruebas Impresión',
    'Instalación Equipos', 'Pruebas Local', 'Imagen Apertura'
]

const StatusBadge: React.FC<{ status: EstadoTienda }> = ({ status }) => {
    const colors = {
        pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        en_proceso: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        en_revision: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        instalacion: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
        apertura: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        completado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        en_espera_proveedor: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        en_espera_cliente: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        pendiente_aprobacion: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        bloqueado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }

    const labels = {
        pendiente: 'PENDIENTE',
        en_proceso: 'EN PROCESO',
        en_revision: 'EN REVISIÓN',
        instalacion: 'INSTALACIÓN',
        apertura: 'APERTURA',
        completado: 'COMPLETADO',
        en_espera_proveedor: 'ESPERA PROVEEDOR',
        en_espera_cliente: 'ESPERA CLIENTE',
        pendiente_aprobacion: 'PENDIENTE APROBACIÓN',
        cancelado: 'CANCELADO',
        bloqueado: 'BLOQUEADO'
    }

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
            {labels[status] || status}
        </span>
    )
}

// ===== MAPEO DE CADENA TEXTO A ID NUMÉRICO =====
const mapeoCadenaANumero: { [key: string]: string } = {
    'KFC': '10', 'KENTUCKY FRIED CHICKEN': '10',
    'AMERICAN DELI PATIOS': '2', 'AMERICAN DELI': '2',
    'CAJUN': '5',
    'EL ESPAÑOL': '8', 'ESPANOL': '8', 'EL ESPANOL': '8',
    'GUS': '9',
    'JUAN VALDEZ CAFÉ': '12', 'JUAN VALDEZ CAFE': '12',
    'DOLCE INCONTRO': '14',
    'TROPIBURGER': '16',
    'ILCAPPO': '22',
    'CASA RES': '25',
    'MENESTRAS DEL NEGRO': '28',
    'FEDERER': '35',
    'BASKIN ROBBINS': '36',
    'CINNABON': '37'
}

const obtenerCadenaIdNumerico = (cadena: string | number | undefined): string | null => {
    if (!cadena) return null;
    if (typeof cadena === 'number') return cadena.toString();
    if (typeof cadena === 'string' && /^\d+$/.test(cadena)) return cadena;
    const cadenaStr = cadena.toString().toUpperCase().trim();
    if (mapeoCadenaANumero[cadenaStr]) return mapeoCadenaANumero[cadenaStr];
    for (const [key, value] of Object.entries(mapeoCadenaANumero)) {
        if (cadenaStr.includes(key) || key.includes(cadenaStr)) return value;
    }
    console.warn(`⚠️ [Mapeo] No se encontró mapeo para: "${cadena}"`);
    return null;
}

const buildApiUrl = (apiUrl: string, path: string): string => {
    let baseUrl = apiUrl.replace(/\/api$/, '');
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    let apiPath = path;
    if (!apiPath.startsWith('/api')) apiPath = `/api${apiPath}`;
    return `${baseUrl}${apiPath}`;
};

const TiendaDetalle: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, isAdmin } = useAuth()
    const isMaster = user?.email === 'angel.gualotuna@kfc.com.ec' || isAdmin

    // Estados principales
    const [tienda, setTienda] = useState<Tienda | null>(null)
    const [procesoActivo, setProcesoActivo] = useState<Proceso | null>(null)
    const [loading, setLoading] = useState(true)
    const [estadoActual, setEstadoActual] = useState<EstadoTienda>('pendiente')
    const [aprobando, setAprobando] = useState(false)

    // Control para evitar múltiples llamadas
    const [cargandoProceso, setCargandoProceso] = useState(false)
    const procesoCargadoRef = useRef(false)
    const [cargandoFormasPago, setCargandoFormasPago] = useState(false)

    const formasPagoCargadasRef = useRef<{ [key: string]: boolean }>({})

    // Estados para pruebas funcionales
    const [estacionesPrueba, setEstacionesPrueba] = useState<EstacionPrueba[]>([])
    const [cargandoEstaciones, setCargandoEstaciones] = useState(false)
    const [observacionEstacion, setObservacionEstacion] = useState<{ [key: string]: string }>({})

    // ===== NUEVOS ESTADOS PARA PRUEBAS FUNCIONALES DETALLADAS =====
    const [pruebasEstaciones, setPruebasEstaciones] = useState<PruebaEstacion[]>([])
    const [pruebasEstacionesGuardadas, setPruebasEstacionesGuardadas] = useState(false)

    // Estados para pre-apertura
    const [facturaEfectivoArchivo, setFacturaEfectivoArchivo] = useState<File | null>(null)
    const [facturaTarjetaArchivo, setFacturaTarjetaArchivo] = useState<File | null>(null)
    const [facturaEfectivoUrl, setFacturaEfectivoUrl] = useState<string | null>(null)
    const [facturaTarjetaUrl, setFacturaTarjetaUrl] = useState<string | null>(null)
    const [observacionEfectivo, setObservacionEfectivo] = useState('')
    const [observacionTarjeta, setObservacionTarjeta] = useState('')
    const [observacionesEfectivoLista, setObservacionesEfectivoLista] = useState<ObservacionAnclada[]>([])
    const [observacionesTarjetaLista, setObservacionesTarjetaLista] = useState<ObservacionAnclada[]>([])
    const [preAperturaCompletada, setPreAperturaCompletada] = useState(false)
    const [preAperturaEfectivoCompletado, setPreAperturaEfectivoCompletado] = useState(false)
    const [preAperturaTarjetaCompletado, setPreAperturaTarjetaCompletado] = useState(false)

    // Estados para aprobación contabilidad
    const [documentoFacturacionArchivo, setDocumentoFacturacionArchivo] = useState<File | null>(null)
    const [documentoFacturacionUrl, setDocumentoFacturacionUrl] = useState<string | null>(null)
    const [observacionAprobacion, setObservacionAprobacion] = useState('')
    const [observacionesAprobacionLista, setObservacionesAprobacionLista] = useState<ObservacionAnclada[]>([])
    const [aprobacionRevisado, setAprobacionRevisado] = useState(false)

    // Estados para resumen final
    const [showResumenModal, setShowResumenModal] = useState(false)
    const [resumenData, setResumenData] = useState<any>(null)

    // SERVICIOS
    const [servicios, setServicios] = useState<ServiciosConfig>(() => {
        const saved = localStorage.getItem(`servicios_tienda_${id}`)
        return saved ? JSON.parse(saved) : { dragonTail: null, upselling: null, kioscos: null }
    })

    const [politicasRestaurante, setPoliticasRestaurante] = useState<PoliticasRestaurante>({ check: false, archivos: [], observaciones: '' })
    const [estaciones, setEstaciones] = useState<EstacionConfig[]>([])
    const [usuarios, setUsuarios] = useState<UsuarioConfig[]>([])
    const [impresoras, setImpresoras] = useState<ImpresoraConfig[]>([])
    const [formasPago, setFormasPago] = useState<FormaPago[]>([])

    const [despliegueServidor, setDespliegueServidor] = useState<DespliegueServidorItem[]>([
        { id: 'usuarios', nombre: 'Usuario Nuevos SA', completado: false, aplica: true },
        { id: 'kds', nombre: 'KDS', completado: false, aplica: true },
        { id: 'mxpSocket', nombre: 'MXP-Socket Despacho', completado: false, aplica: true },
        { id: 'mxpCredenciales', nombre: 'MXP-Credenciales', completado: false, aplica: true },
        { id: 'mxpReportes', nombre: 'MXP-Reportes', completado: false, aplica: true },
        { id: 'mxpFacturacion', nombre: 'MXP-Facturación Electrónica', completado: false, aplica: true },
        { id: 'reduccionLogs', nombre: 'Reducción de Logs', completado: false, aplica: true },
        { id: 'pasoVersionPOS', nombre: 'Paso de Versión POS', completado: false, aplica: true },
        { id: 'dragonTail', nombre: 'Dragon Tail', completado: false, aplica: false },
        { id: 'upselling', nombre: 'Upselling', completado: false, aplica: false },
        { id: 'kioscos', nombre: 'Kioscos', completado: false, aplica: false }
    ])

    const [despliegueCajas, setDespliegueCajas] = useState<DespliegueCajasItem[]>([])
    const [mktContabilidad, setMktContabilidad] = useState<MKTContabilidadConfig>(() => {
        const saved = localStorage.getItem(`mktContabilidad_${id}`)
        if (saved) {
            const parsed = JSON.parse(saved)
            return {
                deUna: { check: parsed.deUna?.check || false, archivos: parsed.deUna?.archivos || [], observaciones: parsed.deUna?.observaciones || [] },
                puntosEmisionCodigos: { check: parsed.puntosEmisionCodigos?.check || false, archivos: parsed.puntosEmisionCodigos?.archivos || [], observaciones: parsed.puntosEmisionCodigos?.observaciones || [] }
            }
        }
        return { deUna: { check: false, archivos: [], observaciones: [] }, puntosEmisionCodigos: { check: false, archivos: [], observaciones: [] } }
    })

    const [infraestructura, setInfraestructura] = useState<InfraestructuraConfig>(() => {
        const saved = localStorage.getItem(`infraestructura_${id}`)
        if (saved) {
            const parsed = JSON.parse(saved)
            return {
                servidor: { check: parsed.servidor?.check || false, archivos: parsed.servidor?.archivos || [], observaciones: parsed.servidor?.observaciones || [], replicaInicial: parsed.servidor?.replicaInicial || false, observacionesReplica: parsed.servidor?.observacionesReplica || [] },
                cajas: { check: parsed.cajas?.check || false, archivos: parsed.cajas?.archivos || [], observaciones: parsed.cajas?.observaciones || [] },
                enlacePrincipal: { check: parsed.enlacePrincipal?.check || false, archivos: parsed.enlacePrincipal?.archivos || [], observaciones: parsed.enlacePrincipal?.observaciones || [] },
                energiaElectrica: { check: parsed.energiaElectrica?.check || false, archivos: parsed.energiaElectrica?.archivos || [], observaciones: parsed.energiaElectrica?.observaciones || [] }
            }
        }
        return {
            servidor: { check: false, archivos: [], observaciones: [], replicaInicial: false, observacionesReplica: [] },
            cajas: { check: false, archivos: [], observaciones: [] },
            enlacePrincipal: { check: false, archivos: [], observaciones: [] },
            energiaElectrica: { check: false, archivos: [], observaciones: [] }
        }
    })

    const [pruebas, setPruebas] = useState<PruebaItem[]>([
        { id: 'conexion', nombre: 'Prueba de Conexión', check: false, archivos: [], observaciones: '' },
        { id: 'pagos', nombre: 'Prueba de Pagos', check: false, archivos: [], observaciones: '' },
        { id: 'facturacion', nombre: 'Prueba de Facturación', check: false, archivos: [], observaciones: '' },
        { id: 'impresion', nombre: 'Prueba de Impresión', check: false, archivos: [], observaciones: '' }
    ])
    const [instalacion, setInstalacion] = useState<InstalacionConfig>({ instalacionEquipos: { check: false, archivos: [], observaciones: '' }, pruebasLocal: { check: false, archivos: [], observaciones: '' } })

    // Estados para inputs de observaciones
    const [observacionDeUna, setObservacionDeUna] = useState('')
    const [observacionPuntosEmision, setObservacionPuntosEmision] = useState('')
    const [observacionEnlacePrincipal, setObservacionEnlacePrincipal] = useState('')
    const [observacionEnergiaElectrica, setObservacionEnergiaElectrica] = useState('')
    const [observacionServidor, setObservacionServidor] = useState('')
    const [observacionCajas, setObservacionCajas] = useState('')
    const [observacionReplicaInicial, setObservacionReplicaInicial] = useState('')

    // CHAT DE APERTURA
    const [mensajesApertura, setMensajesApertura] = useState<MensajeApertura[]>(() => {
        const saved = localStorage.getItem(`chat_apertura_${id}`)
        return saved ? JSON.parse(saved) : [{ id: '1', usuario: 'Sistema', usuarioId: 'system', fecha: new Date().toISOString(), texto: 'Inicio del proceso de apertura de local', tipo: 'finalizacion' }]
    })
    const [nuevoMensaje, setNuevoMensaje] = useState('')
    const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
    const [aperturaFinalizada, setAperturaFinalizada] = useState(false)
    const [imagenApertura, setImagenApertura] = useState<ArchivoAdjunto | null>(null)

    // NUEVO: Estado para el modal del chat
    const [showChatModal, setShowChatModal] = useState(false)

    // Estados de UI para modales
    const [showServiciosModal, setShowServiciosModal] = useState(false)
    const [showConfiguracionTiendaModal, setShowConfiguracionTiendaModal] = useState(false)
    const [showFormasPagoModal, setShowFormasPagoModal] = useState(false)
    const [showDespliegueServidorModal, setShowDespliegueServidorModal] = useState(false)
    const [showDespliegueCajasModal, setShowDespliegueCajasModal] = useState(false)
    const [showMKTContabilidadModal, setShowMKTContabilidadModal] = useState(false)
    const [showInfraestructuraModal, setShowInfraestructuraModal] = useState(false)
    const [showPruebasModal, setShowPruebasModal] = useState(false)
    const [showInstalacionModal, setShowInstalacionModal] = useState(false)
    const [showEstadoModal, setShowEstadoModal] = useState(false)
    const [showPruebasPreAperturaModal, setShowPruebasPreAperturaModal] = useState(false)
    const [showAprobacionContabilidadModal, setShowAprobacionContabilidadModal] = useState(false)
    const [showPruebasFuncionalesModal, setShowPruebasFuncionalesModal] = useState(false)

    // NUEVOS ESTADOS PARA REASIGNACIÓN DE TÉCNICO CX
    const [tecnicosDisponibles, setTecnicosDisponibles] = useState<User[]>([])
    const [showReasignarTecnicoModal, setShowReasignarTecnicoModal] = useState(false)
    const [reasignandoTecnico, setReasignandoTecnico] = useState(false)

    // ===== FUNCIÓN PARA CARGAR TÉCNICOS CX DISPONIBLES =====
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

    // ===== FUNCIÓN PARA OBTENER NOMBRE DEL TÉCNICO CX ACTUAL =====
    const getNombreTecnicoActual = (): string => {
        if (!tienda) return 'No asignado'

        const tecnicoId = tienda.responsables?.cx || tienda.responsableCX
        if (!tecnicoId) return 'No asignado'

        const tecnico = tecnicosDisponibles.find(t => t._id === tecnicoId)
        if (tecnico) return `${tecnico.nombre} ${tecnico.apellido || ''}`.trim()

        return 'Técnico asignado'
    }

    // ===== FUNCIÓN PARA REASIGNAR TÉCNICO CX =====
    const handleReasignarTecnico = async (nuevoTecnicoId: string) => {
        if (!tienda) return
        setReasignandoTecnico(true)
        try {
            const nuevoTecnico = tecnicosDisponibles.find(t => t._id === nuevoTecnicoId)
            if (!nuevoTecnico) throw new Error('Técnico no encontrado')

            const updateData = {
                responsableCX: nuevoTecnicoId,
                responsables: {
                    ...tienda.responsables,
                    cx: nuevoTecnicoId
                }
            }

            await tiendasService.update(tienda._id, updateData)

            setTienda(prev => prev ? {
                ...prev,
                responsableCX: nuevoTecnicoId,
                responsables: {
                    ...prev.responsables,
                    cx: nuevoTecnicoId
                }
            } : null)

            agregarMensajeApertura(`Técnico CX reasignado de ${getNombreTecnicoActual()} a ${nuevoTecnico.nombre} ${nuevoTecnico.apellido || ''}`, 'novedad')

            toast.success(`Técnico CX reasignado a ${nuevoTecnico.nombre} ${nuevoTecnico.apellido || ''}`)
            setShowReasignarTecnicoModal(false)
        } catch (error) {
            console.error('Error reasignando técnico:', error)
            toast.error('Error al reasignar el técnico')
        } finally {
            setReasignandoTecnico(false)
        }
    }

    // ===== FUNCIÓN PARA CARGAR ARCHIVOS DE LA TIENDA =====
    const cargarArchivosTienda = useCallback(async () => {
        if (!id) return;

        const savedArchivos = localStorage.getItem(`tienda_archivos_${id}`);
        if (savedArchivos) {
            const archivos = JSON.parse(savedArchivos);
            setTienda(prev => prev ? { ...prev, archivosAdjuntos: archivos } : prev);
        }
    }, [id]);

    // ===== FUNCIÓN PARA CARGAR FORMAS DE PAGO DESDE BACKEND =====
    const cargarFormasPagoDesdeBackend = useCallback(async (cadenaId: string, forceReload: boolean = false) => {
        if (cargandoFormasPago) return;
        if (!forceReload && formasPagoCargadasRef.current[cadenaId]) return;
        if (!forceReload) {
            const savedFormas = localStorage.getItem(`formasPago_${id}_${cadenaId}`);
            if (savedFormas) {
                try {
                    const parsed = JSON.parse(savedFormas);
                    if (parsed && parsed.length > 0) {
                        setFormasPago(parsed);
                        formasPagoCargadasRef.current[cadenaId] = true;
                        return parsed;
                    }
                } catch (e) { console.error(e); }
            }
        }
        setCargandoFormasPago(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const url = buildApiUrl(apiUrl, `/cadenas/${cadenaId}/formas-pago`);
            const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            let formasData = [];
            if (result.success && result.data && Array.isArray(result.data)) formasData = result.data;
            else if (Array.isArray(result)) formasData = result;
            else {
                const fallback = [{ id: 'efectivo', nombre: 'EFECTIVO', seleccionado: false, codigo: '001' }, { id: 'tarjeta', nombre: 'TARJETA', seleccionado: false, codigo: '002' }, { id: 'transferencia', nombre: 'TRANSFERENCIA', seleccionado: false, codigo: '003' }];
                setFormasPago(fallback);
                formasPagoCargadasRef.current[cadenaId] = true;
                return fallback;
            }
            if (formasData && formasData.length > 0) {
                const formasIniciales = formasData.map((fp: any, index: number) => ({ id: fp.id || fp._id || `fp_${index}`, nombre: fp.nombre || fp.name || 'Forma de pago', seleccionado: false, codigo: fp.codigo || '', descripcion: fp.descripcion || '' }));
                setFormasPago(formasIniciales);
                localStorage.setItem(`formasPago_${id}_${cadenaId}`, JSON.stringify(formasIniciales));
                formasPagoCargadasRef.current[cadenaId] = true;
                toast.success(`${formasIniciales.length} formas de pago cargadas`);
                return formasIniciales;
            }
            const fallback = [{ id: 'efectivo', nombre: 'EFECTIVO', seleccionado: false, codigo: '001' }, { id: 'tarjeta', nombre: 'TARJETA', seleccionado: false, codigo: '002' }, { id: 'transferencia', nombre: 'TRANSFERENCIA', seleccionado: false, codigo: '003' }];
            setFormasPago(fallback);
            return fallback;
        } catch (error) {
            console.error(error);
            const fallback = [{ id: 'efectivo', nombre: 'EFECTIVO', seleccionado: false, codigo: '001' }, { id: 'tarjeta', nombre: 'TARJETA', seleccionado: false, codigo: '002' }, { id: 'transferencia', nombre: 'TRANSFERENCIA', seleccionado: false, codigo: '003' }];
            setFormasPago(fallback);
            toast.error('Error al cargar formas de pago');
            return fallback;
        } finally { setCargandoFormasPago(false); }
    }, [id]);

    // ===== FUNCIÓN PARA CARGAR CONFIGURACIÓN COMPLETA =====
    const cargarConfiguracionDesdeTienda = useCallback(async (tiendaData: any) => {
        let config = tiendaData.configuracionEstaciones || tiendaData.configuraciones || {}
        if (Object.keys(config).length === 0) {
            config = {
                cajas: tiendaData.cajas || { activo: false, items: [] }, drive: tiendaData.drive || { activo: false, items: [] },
                kioscos: tiendaData.kioscos || { activo: false, items: [] }, delivery: tiendaData.delivery || false,
                pickUp: tiendaData.pickUp || false, heladeria: tiendaData.heladeria || false,
                impresoraLinea: tiendaData.impresoraLinea || false, impresoraBar: tiendaData.impresoraBar || false,
                impresoraCocina: tiendaData.impresoraCocina || false, impresoraParrilla: tiendaData.impresoraParrilla || false,
                impresoraLineaDomi: tiendaData.impresoraLineaDomi || false,
                impresoraPersonalizada: tiendaData.impresoraPersonalizada || false,
                impresoraPersonalizadaNombre: tiendaData.impresoraPersonalizadaNombre
            }
        }
        const nuevasEstaciones: EstacionConfig[] = []
        const nuevasImpresoras: ImpresoraConfig[] = []
        const nuevosUsuarios: UsuarioConfig[] = []
        let contadorKiosco = 1

        // Procesar CAJAS
        const cajas = config.cajas || {}
        if (cajas.activo && cajas.items && Array.isArray(cajas.items)) {
            cajas.items.forEach((item: any) => {
                if (item.seleccionado) {
                    const cajaId = item.id || `caja_${Date.now()}_${Math.random()}`
                    const cajaNombre = item.nombre || `Caja ${nuevasEstaciones.filter(e => e.tipo === 'caja').length + 1}`
                    nuevasEstaciones.push({ id: cajaId, nombre: cajaNombre, seleccionado: true, tipo: 'caja', completado: false })
                    setDespliegueCajas(prev => { const exists = prev.some(c => c.cajaId === cajaId); if (!exists) return [...prev, { cajaId, cajaNombre, servicioTarjetas: false, servicioImpresion: false }]; return prev })
                    nuevasImpresoras.push({ id: `impresora_caja_${cajaId}`, nombre: `Impresora Caja ${cajaNombre}`, seleccionado: true, completado: false, tipo: 'caja' })
                }
            })
        }

        // Procesar DRIVE
        const drive = config.drive || {}
        if (drive.activo && drive.items && Array.isArray(drive.items)) {
            drive.items.forEach((item: any) => { if (item.seleccionado) nuevasEstaciones.push({ id: item.id || `drive_${Date.now()}_${Math.random()}`, nombre: `Drive ${item.nombre || ''}`, seleccionado: true, tipo: 'drive', completado: false }) })
        }

        // Procesar KIOSCOS
        const kioscos = config.kioscos || {}
        if (kioscos.activo && kioscos.items && Array.isArray(kioscos.items)) {
            kioscos.items.forEach((item: any) => {
                if (item.seleccionado) {
                    nuevasEstaciones.push({ id: item.id || `kiosco_${Date.now()}_${Math.random()}`, nombre: item.nombre || `Kiosco ${contadorKiosco}`, seleccionado: true, tipo: 'kiosco', completado: false })
                    nuevosUsuarios.push({ id: `kiosco_${item.id || contadorKiosco}`, nombre: `KIOSCO${contadorKiosco}`, tipo: 'kiosco', usuarioAsignado: `kiosco${contadorKiosco}`, creado: false, activo: true, archivos: [] })
                    contadorKiosco++
                }
            })
        }

        // Procesar DELIVERY
        const delivery = config.delivery
        if (delivery === true || (delivery && delivery.activo === true)) {
            nuevasEstaciones.push({ id: 'delivery', nombre: 'Delivery', seleccionado: true, tipo: 'delivery', completado: false })
            nuevosUsuarios.push({ id: 'delivery_mxp', nombre: 'DELIVERYMXP', tipo: 'delivery', usuarioAsignado: 'delivery_mxp', creado: false, activo: true, archivos: [] })
            nuevosUsuarios.push({ id: 'delivery_agregadores', nombre: 'DELIVERYMXP1', tipo: 'agregador', usuarioAsignado: 'delivery_mxp1', creado: false, activo: true, archivos: [] })
            nuevasImpresoras.push({ id: 'impresora_domi', nombre: 'DOMI', seleccionado: true, completado: false, tipo: 'domi' })
        }

        // Procesar PICKUP
        const pickup = config.pickUp || config.pickup
        if (pickup === true || (pickup && pickup.activo === true)) {
            nuevasEstaciones.push({ id: 'pickup', nombre: 'Pick Up', seleccionado: true, tipo: 'pickup', completado: false })
            nuevosUsuarios.push({ id: 'pickup', nombre: 'PICKUP1', tipo: 'pickup', usuarioAsignado: 'pickup1', creado: false, activo: true, archivos: [] })
        }

        // Procesar HELADERÍA
        const heladeria = config.heladeria
        if (heladeria === true || (heladeria && heladeria.activo === true)) nuevasEstaciones.push({ id: 'heladeria', nombre: 'Heladería', seleccionado: true, tipo: 'heladeria', completado: false })

        // IMPRESORAS ADICIONALES
        if (config.impresoraLinea === true) nuevasImpresoras.push({ id: 'linea', nombre: 'Impresora de Línea', seleccionado: true, completado: false, tipo: 'linea' })
        if (config.impresoraLineaDomi === true) nuevasImpresoras.push({ id: 'lineaDomi', nombre: 'Impresora de Línea Domi', seleccionado: true, completado: false, tipo: 'lineaDomi' })
        if (config.impresoraBar === true) nuevasImpresoras.push({ id: 'bar', nombre: 'Impresora de Bar', seleccionado: true, completado: false, tipo: 'bar' })
        if (config.impresoraCocina === true) nuevasImpresoras.push({ id: 'cocina', nombre: 'Impresora de Cocina', seleccionado: true, completado: false, tipo: 'cocina' })
        if (config.impresoraParrilla === true) nuevasImpresoras.push({ id: 'parrilla', nombre: 'Impresora de Parrilla', seleccionado: true, completado: false, tipo: 'parrilla' })
        if (config.impresoraPersonalizada === true && config.impresoraPersonalizadaNombre) nuevasImpresoras.push({ id: 'personalizada', nombre: config.impresoraPersonalizadaNombre, seleccionado: true, completado: false, tipo: 'personalizada', nombrePersonalizado: config.impresoraPersonalizadaNombre })

        setEstaciones(nuevasEstaciones)
        setImpresoras(nuevasImpresoras)
        nuevosUsuarios.unshift({ id: 'tienda', nombre: 'Usuario Local', tipo: 'tienda', usuarioAsignado: 'local', creado: false, activo: true, archivos: [] })
        setUsuarios(nuevosUsuarios)

        // CARGAR FORMAS DE PAGO
        let cadenaIdNumerico = null;
        if (tiendaData.cadena) {
            cadenaIdNumerico = obtenerCadenaIdNumerico(tiendaData.cadena);
            if (!cadenaIdNumerico && tiendaData.cadena.toString().toUpperCase().includes('ESPANOL')) {
                cadenaIdNumerico = '8';
            }
        }

        if (cadenaIdNumerico) {
            const savedFormas = localStorage.getItem(`formasPago_${id}_${cadenaIdNumerico}`);
            if (savedFormas) {
                try {
                    const parsed = JSON.parse(savedFormas);
                    if (parsed && parsed.length > 0) {
                        setFormasPago(parsed);
                        formasPagoCargadasRef.current[cadenaIdNumerico] = true;
                    }
                } catch (e) { console.error(e); }
            }
            if (!formasPagoCargadasRef.current[cadenaIdNumerico] || formasPago.length === 0) {
                await cargarFormasPagoDesdeBackend(cadenaIdNumerico, true);
            }
        }

        setDespliegueServidor(prev => prev.map(item => {
            if (item.id === 'dragonTail') return { ...item, aplica: servicios.dragonTail === 'aplica' }
            if (item.id === 'upselling') return { ...item, aplica: servicios.upselling === 'aplica' }
            if (item.id === 'kioscos') return { ...item, aplica: servicios.kioscos === 'aplica' }
            return item
        }))
    }, [id, servicios, cargarFormasPagoDesdeBackend])

    // ===== FUNCIÓN PARA INICIALIZAR PRUEBAS POR ESTACIÓN =====
    const inicializarPruebasEstaciones = useCallback(() => {
        if (!tienda) return

        const nuevasPruebas: PruebaEstacion[] = []

        // Items comunes para Cajas y Kioscos
        const itemsComunes = [
            { id: 'impresion_factura', nombre: 'Impresión de Factura', check: false },
            { id: 'impresion_comanda', nombre: 'Impresión de Comanda', check: false },
            { id: 'cobro_efectivo', nombre: 'Cobro en Efectivo', check: false },
            { id: 'cobro_tarjeta', nombre: 'Cobro con Tarjeta', check: false },
            { id: 'cobro_deuna', nombre: 'Cobro con De-Una', check: false },
            { id: 'anulacion_orden_efectivo', nombre: 'Anulación de Orden en Efectivo', check: false },
            { id: 'anulacion_orden_tarjeta', nombre: 'Anulación de Orden con Tarjeta', check: false }
        ]

        // Items para KDS
        const itemsKDS = [
            { id: 'visualizacion_ordenes', nombre: 'Visualización de Órdenes', check: false },
            { id: 'tiempos_preparacion', nombre: 'Tiempos de Preparación', check: false },
            { id: 'cancelacion_orden', nombre: 'Cancelación de Orden', check: false }
        ]

        // Items para Delivery
        const itemsDelivery = [
            { id: 'integracion_ordenes', nombre: 'Integración de Órdenes', check: false },
            { id: 'impresion_comanda', nombre: 'Impresión de Comanda', check: false },
            { id: 'impresion_factura', nombre: 'Impresión de Factura', check: false },
            { id: 'sonido_notificacion', nombre: 'Sonido de Notificación', check: false },
            { id: 'dragon_tail', nombre: 'Dragon Tail', check: false }
        ]

        // Items para PickUp
        const itemsPickUp = [
            { id: 'integracion_ordenes', nombre: 'Integración de Órdenes', check: false },
            { id: 'impresion_orden', nombre: 'Impresión de Órdenes', check: false },
            { id: 'impresion_factura', nombre: 'Impresión de Factura', check: false },
            { id: 'retomar_orden_efectivo', nombre: 'Retomar Orden en Efectivo', check: false }
        ]

        // Items para Drive
        const itemsDrive = [
            { id: 'toma_orden', nombre: 'Toma de Orden', check: false },
            { id: 'cobro_efectivo', nombre: 'Cobro en Efectivo', check: false },
            { id: 'cobro_tarjeta', nombre: 'Cobro con Tarjeta', check: false },
            { id: 'impresion_factura', nombre: 'Impresión de Factura', check: false },
            { id: 'impresion_comanda', nombre: 'Impresión de Comanda', check: false }
        ]

        // Items para Kioscos (adicionales)
        const itemsKiosco = [
            ...itemsComunes,
            { id: 'recuperacion_orden', nombre: 'Recuperación de Orden', check: false },
            { id: 'instalacion_sotide', nombre: 'Instalación de Sotide', check: false }
        ]

        // Crear pruebas por cada caja activa
        if (tienda.configuracionEstaciones?.cajas?.activo && tienda.configuracionEstaciones.cajas.items) {
            tienda.configuracionEstaciones.cajas.items.forEach((caja: any) => {
                if (caja.seleccionado) {
                    nuevasPruebas.push({
                        id: `caja_${caja.id}`,
                        nombre: `Caja: ${caja.nombre}`,
                        tipo: 'caja',
                        items: itemsComunes.map(item => ({ ...item, check: false })),
                        completado: false,
                        activo: true
                    })
                }
            })
        }

        // Drive
        if (tienda.configuracionEstaciones?.drive?.activo && tienda.configuracionEstaciones.drive.items) {
            tienda.configuracionEstaciones.drive.items.forEach((drive: any) => {
                if (drive.seleccionado) {
                    nuevasPruebas.push({
                        id: `drive_${drive.id}`,
                        nombre: `Drive: ${drive.nombre}`,
                        tipo: 'drive',
                        items: itemsDrive.map(item => ({ ...item, check: false })),
                        completado: false,
                        activo: true
                    })
                }
            })
        }

        // PickUp
        if (tienda.configuracionEstaciones?.pickUp === true) {
            nuevasPruebas.push({
                id: 'pickup',
                nombre: 'Pick Up',
                tipo: 'pickup',
                items: itemsPickUp.map(item => ({ ...item, check: false })),
                completado: false,
                activo: true
            })
        }

        // Delivery
        const tieneDragonTail = tienda.configuracionEstaciones?.delivery?.canalPropio === true
        if (tienda.configuracionEstaciones?.delivery?.activo === true) {
            nuevasPruebas.push({
                id: 'delivery',
                nombre: 'Delivery',
                tipo: 'delivery',
                items: itemsDelivery.map(item => ({
                    ...item,
                    check: false,
                    ...(item.id === 'dragon_tail' && { activo: tieneDragonTail })
                })),
                completado: false,
                activo: true
            })
        }

        // Kioscos
        if (tienda.configuracionEstaciones?.kioscos?.activo && tienda.configuracionEstaciones.kioscos.items) {
            tienda.configuracionEstaciones.kioscos.items.forEach((kiosco: any) => {
                if (kiosco.seleccionado) {
                    nuevasPruebas.push({
                        id: `kiosco_${kiosco.id}`,
                        nombre: `Kiosco: ${kiosco.nombre}`,
                        tipo: 'kiosco',
                        items: itemsKiosco.map(item => ({ ...item, check: false })),
                        completado: false,
                        activo: true
                    })
                }
            })
        }

        // KDS
        const tieneKDS = tienda.configuracionEstaciones?.kdsItems?.kds1 ||
            tienda.configuracionEstaciones?.kdsItems?.kds2 ||
            tienda.configuracionEstaciones?.kdsItems?.kds3 ||
            tienda.configuracionEstaciones?.kdsItems?.kdsPersonalizado
        if (tieneKDS) {
            nuevasPruebas.push({
                id: 'kds',
                nombre: 'KDS (Kitchen Display System)',
                tipo: 'kds',
                items: itemsKDS.map(item => ({ ...item, check: false })),
                completado: false,
                activo: true
            })
        }

        // Cargar datos guardados
        const saved = localStorage.getItem(`pruebas_estaciones_${id}`)
        if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed && parsed.length > 0) {
                setPruebasEstaciones(parsed)
                const todasCompletadas = parsed.every((est: PruebaEstacion) =>
                    est.items.every((item: PruebaEstacionItem) => item.check)
                )
                setPruebasEstacionesGuardadas(todasCompletadas)
                return
            }
        }

        setPruebasEstaciones(nuevasPruebas)
    }, [id, tienda])

    // ===== FUNCIÓN PARA ACTUALIZAR ITEM DE PRUEBA =====
    const actualizarItemPrueba = (estacionId: string, itemId: string, check: boolean) => {
        const nuevasPruebas = pruebasEstaciones.map(estacion => {
            if (estacion.id === estacionId) {
                const nuevosItems = estacion.items.map(item =>
                    item.id === itemId ? { ...item, check } : item
                )
                const estacionCompletada = nuevosItems.every(item => item.check)
                return { ...estacion, items: nuevosItems, completado: estacionCompletada }
            }
            return estacion
        })

        setPruebasEstaciones(nuevasPruebas)
        localStorage.setItem(`pruebas_estaciones_${id}`, JSON.stringify(nuevasPruebas))

        const todasCompletadas = nuevasPruebas.every(estacion =>
            estacion.items.every(item => item.check)
        )
        setPruebasEstacionesGuardadas(todasCompletadas)
    }

    // ===== FUNCIÓN PARA VERIFICAR SI PRUEBAS FUNCIONALES ESTÁN COMPLETAS =====
    const verificarPruebasFuncionalesCompletas = (): boolean => {
        if (pruebasEstaciones.length === 0) return true
        return pruebasEstaciones.every(estacion =>
            estacion.items.every(item => item.check === true)
        )
    }

    // ===== FUNCIÓN PARA GUARDAR PRUEBAS FUNCIONALES DETALLADAS =====
    const guardarPruebasFuncionales = () => {
        localStorage.setItem(`pruebas_estaciones_${id}`, JSON.stringify(pruebasEstaciones))
        const todasCompletadas = pruebasEstaciones.every(estacion =>
            estacion.items.every(item => item.check === true)
        )
        setPruebasEstacionesGuardadas(todasCompletadas)
        toast.success('Pruebas funcionales guardadas correctamente')
        setShowPruebasFuncionalesModal(false)
    }

    // ===== FUNCIONES PARA PRUEBAS FUNCIONALES (EXISTENTES) =====
    const cargarEstacionesPrueba = async () => {
        if (!id) return;
        setCargandoEstaciones(true);
        try {
            const response = await pruebasService.getEstaciones(id);
            if (response.success) {
                setEstacionesPrueba(response.data);
            }
        } catch (error) {
            console.error('Error cargando estaciones:', error);
            toast.error('Error al cargar las estaciones');
        } finally {
            setCargandoEstaciones(false);
        }
    };

    const handleEnviarObservacionEstacion = async (estacionId: string) => {
        const texto = observacionEstacion[estacionId];
        if (!texto || !texto.trim()) {
            toast.error('Escribe una observación antes de enviar');
            return;
        }
        try {
            const response = await pruebasService.addObservacionEstacion(id!, estacionId, texto);
            if (response.success) {
                setObservacionEstacion(prev => ({ ...prev, [estacionId]: '' }));
                await cargarEstacionesPrueba();
                toast.success('Observación agregada');
            }
        } catch (error) {
            console.error('Error enviando observación:', error);
            toast.error('Error al enviar la observación');
        }
    };

    const handleCompletarEstacion = async (estacionId: string) => {
        try {
            const response = await pruebasService.completarEstacion(id!, estacionId);
            if (response.success) {
                await cargarEstacionesPrueba();
                toast.success(response.message || 'Estación completada');
            }
        } catch (error) {
            console.error('Error completando estación:', error);
            toast.error('Error al completar la estación');
        }
    };

    // ===== FUNCIONES PARA PRE-APERTURA =====
    const cargarPreAperturaEstado = async () => {
        if (!id) return;
        try {
            const response = await pruebasService.getPreAperturaEstado(id);
            if (response.success) {
                setPreAperturaCompletada(response.data.preAperturaCompletada);
                setPreAperturaEfectivoCompletado(response.data.efectivoCompletado);
                setPreAperturaTarjetaCompletado(response.data.tarjetaCompletado);

                if (response.data.facturaEfectivo?.archivo?.url) {
                    setFacturaEfectivoUrl(response.data.facturaEfectivo.archivo.url);
                }
                if (response.data.facturaTarjeta?.archivo?.url) {
                    setFacturaTarjetaUrl(response.data.facturaTarjeta.archivo.url);
                }
                setObservacionesEfectivoLista(response.data.facturaEfectivo?.observaciones || []);
                setObservacionesTarjetaLista(response.data.facturaTarjeta?.observaciones || []);
            }
        } catch (error) {
            console.error('Error cargando pre-apertura:', error);
        }
    };

    const handleUploadFacturaEfectivo = async () => {
        if (!facturaEfectivoArchivo) {
            toast.error('Selecciona un archivo primero');
            return;
        }
        try {
            const response = await pruebasService.uploadFacturaEfectivo(id!, facturaEfectivoArchivo);
            if (response.success) {
                setFacturaEfectivoArchivo(null);
                setFacturaEfectivoUrl(response.data.archivo.url);
                setPreAperturaEfectivoCompletado(true);

                if (response.preAperturaCompletada) {
                    setPreAperturaCompletada(true);
                    toast.success('✅ Ambas facturas subidas. Pre-apertura completada!');
                } else {
                    toast.success('Factura efectivo subida correctamente');
                }
                await cargarPreAperturaEstado();
            }
        } catch (error) {
            console.error('Error subiendo factura:', error);
            toast.error('Error al subir la factura');
        }
    };

    const handleUploadFacturaTarjeta = async () => {
        if (!facturaTarjetaArchivo) {
            toast.error('Selecciona un archivo primero');
            return;
        }
        try {
            const response = await pruebasService.uploadFacturaTarjeta(id!, facturaTarjetaArchivo);
            if (response.success) {
                setFacturaTarjetaArchivo(null);
                setFacturaTarjetaUrl(response.data.archivo.url);
                setPreAperturaTarjetaCompletado(true);

                if (response.preAperturaCompletada) {
                    setPreAperturaCompletada(true);
                    toast.success('✅ Ambas facturas subidas. Pre-apertura completada!');
                } else {
                    toast.success('Factura tarjeta subida correctamente');
                }
                await cargarPreAperturaEstado();
            }
        } catch (error) {
            console.error('Error subiendo factura:', error);
            toast.error('Error al subir la factura');
        }
    };

    const handleEnviarObservacionPreApertura = async (tipo: 'efectivo' | 'tarjeta') => {
        const texto = tipo === 'efectivo' ? observacionEfectivo : observacionTarjeta;
        if (!texto || !texto.trim()) {
            toast.error('Escribe una observación antes de enviar');
            return;
        }
        try {
            const response = await pruebasService.addObservacionPreApertura(id!, tipo, texto);
            if (response.success) {
                if (tipo === 'efectivo') {
                    setObservacionEfectivo('');
                    setObservacionesEfectivoLista(response.data);
                } else {
                    setObservacionTarjeta('');
                    setObservacionesTarjetaLista(response.data);
                }
                toast.success('Observación agregada');
            }
        } catch (error) {
            console.error('Error enviando observación:', error);
            toast.error('Error al enviar la observación');
        }
    };

    // ===== FUNCIONES PARA APROBACIÓN CONTABILIDAD =====
    const cargarAprobacion = async () => {
        if (!id) return;
        try {
            const response = await pruebasService.getAprobacion(id);
            if (response.success && response.data) {
                if (response.data.facturaDocumento?.archivo?.url) {
                    setDocumentoFacturacionUrl(response.data.facturaDocumento.archivo.url);
                }
                setObservacionesAprobacionLista(response.data.facturaDocumento?.observaciones || []);
                setAprobacionRevisado(response.data.revisado || false);
            }

            const preAperturaResponse = await pruebasService.getPreAperturaEstado(id);
            if (preAperturaResponse.success) {
                if (preAperturaResponse.data.facturaEfectivo?.archivo?.url) {
                    setFacturaEfectivoUrl(preAperturaResponse.data.facturaEfectivo.archivo.url);
                }
                if (preAperturaResponse.data.facturaTarjeta?.archivo?.url) {
                    setFacturaTarjetaUrl(preAperturaResponse.data.facturaTarjeta.archivo.url);
                }
                setPreAperturaCompletada(preAperturaResponse.data.preAperturaCompletada);
                setPreAperturaEfectivoCompletado(preAperturaResponse.data.efectivoCompletado);
                setPreAperturaTarjetaCompletado(preAperturaResponse.data.tarjetaCompletado);
                setObservacionesEfectivoLista(preAperturaResponse.data.facturaEfectivo?.observaciones || []);
                setObservacionesTarjetaLista(preAperturaResponse.data.facturaTarjeta?.observaciones || []);
            }
        } catch (error) {
            console.error('Error cargando aprobación:', error);
        }
    };

    const handleUploadDocumentoFacturacion = async () => {
        if (!documentoFacturacionArchivo) {
            toast.error('Selecciona un archivo primero');
            return;
        }
        try {
            const response = await pruebasService.uploadDocumentoFacturacion(id!, documentoFacturacionArchivo);
            if (response.success) {
                setDocumentoFacturacionArchivo(null);
                setDocumentoFacturacionUrl(response.data.archivo.url);
                toast.success('Documento subido correctamente');
                await cargarAprobacion();
            }
        } catch (error) {
            console.error('Error subiendo documento:', error);
            toast.error('Error al subir el documento');
        }
    };

    const handleSetRevisado = async (revisado: boolean) => {
        console.log('🔄 handleSetRevisado llamado con:', revisado);
        try {
            const response = await pruebasService.setRevisado(id!, revisado);
            console.log('📥 Respuesta setRevisado:', response);
            if (response.success) {
                setAprobacionRevisado(revisado);
                toast.success(revisado ? '✅ Marcado como revisado' : 'Revisión desmarcada');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Error actualizando revisado:', error);
            toast.error('Error al actualizar');
        }
    };

    const handleEnviarObservacionAprobacion = async () => {
        if (!observacionAprobacion || !observacionAprobacion.trim()) {
            toast.error('Escribe una observación antes de enviar');
            return;
        }
        try {
            const response = await pruebasService.addObservacionAprobacion(id!, observacionAprobacion);
            if (response.success) {
                setObservacionAprobacion('');
                setObservacionesAprobacionLista(response.data);
                toast.success('Observación agregada');
            }
        } catch (error) {
            console.error('Error enviando observación:', error);
            toast.error('Error al enviar la observación');
        }
    };

    // ===== FUNCIÓN PARA APROBAR FACTURACIÓN - CORREGIDA (PASA A APERTURA) =====
    const handleAprobarFacturacion = async () => {
        console.log('🔍 ===== INICIO handleAprobarFacturacion =====');
        console.log('📌 preAperturaCompletada:', preAperturaCompletada);
        console.log('📌 aprobacionRevisado (local):', aprobacionRevisado);
        console.log('📌 ID Tienda:', id);
        console.log('📌 procesoActivo ID:', procesoActivo?._id);
        console.log('📌 aprobando:', aprobando);

        if (!preAperturaCompletada) {
            toast.error('❌ Debes completar las pruebas de pre-apertura primero');
            return;
        }

        if (aprobando) {
            console.log('⚠️ Ya hay una aprobación en proceso');
            return;
        }

        setAprobando(true);

        try {
            toast.loading('📤 Procesando aprobación...', { id: 'aprobarToast' });

            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            // PASO 1: Forzar marcado como revisado
            console.log('🔄 PASO 1: Forzando marcado como revisado...');
            const setRevisadoUrl = buildApiUrl(apiUrl, `/pruebas/tienda/${id}/aprobacion/revisado`);
            await fetch(setRevisadoUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ revisado: true })
            });

            await new Promise(resolve => setTimeout(resolve, 500));

            // PASO 2: Enviar aprobación
            console.log('🔄 PASO 2: Enviando aprobación...');
            const url = buildApiUrl(apiUrl, `/tiendas/${id}/aprobar-facturacion`);
            console.log('📤 URL de la petición:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📥 Status code:', response.status);

            const data = await response.json();
            console.log('📥 Respuesta completa:', JSON.stringify(data, null, 2));

            toast.dismiss('aprobarToast');

            if (data.success) {
                console.log('✅ Aprobación exitosa!');
                toast.success('✅ Facturación aprobada!');

                setShowAprobacionContabilidadModal(false);
                setEstadoActual('apertura');
                if (procesoActivo) {
                    setProcesoActivo({
                        ...procesoActivo,
                        estado: 'apertura' as any
                    });
                }
                if (tienda) {
                    setTienda({
                        ...tienda,
                        estadoGeneral: 'apertura' as any
                    });
                }
                await loadTiendaData();
                await cargarProcesoActivo();
                agregarMensajeApertura('✅ Facturación aprobada. Pasando a etapa de APERTURA');
                window.dispatchEvent(new CustomEvent('kanban-refresh'));
                toast.success('🎉 Tienda movida a APERTURA exitosamente!');
            } else {
                console.error('❌ Error:', data.error);
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (error: any) {
            console.error('❌ Error capturado:', error);
            toast.dismiss('aprobarToast');
            toast.error(error?.message || 'Error al aprobar la facturación');
        } finally {
            setAprobando(false);
            console.log('🏁 ===== FIN handleAprobarFacturacion =====');
        }
    };

    // ===== FUNCIÓN PARA GENERAR INFORME WORD =====
    const generarInformeWord = (resumenData: any, _tiendaData: Tienda | null)=> {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Informe Técnico de Apertura - ${resumenData.tienda?.codigo}</title>
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
                    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
                    .image-container { text-align: center; margin: 20px 0; }
                    .image-container img { max-width: 100%; max-height: 300px; border: 1px solid #ddd; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">KFC Aperturas</div>
                    <div class="title">Informe Técnico de Apertura de Local</div>
                </div>
                
                <h2>1. Información General</h2>
                <div class="info-grid">
                    <div class="info-item"><span class="info-label">Código:</span> ${resumenData.tienda?.codigo || 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Nombre:</span> ${resumenData.tienda?.nombre || 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Cadena:</span> ${resumenData.tienda?.cadena || 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Dirección:</span> ${resumenData.tienda?.direccion?.callePrincipal || 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Ciudad:</span> ${resumenData.tienda?.direccion?.ciudad || 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Fecha Planificada:</span> ${resumenData.tienda?.fechaAperturaPlanificada ? new Date(resumenData.tienda.fechaAperturaPlanificada).toLocaleDateString('es-EC') : 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Fecha Inicio:</span> ${resumenData.fechas?.inicio ? new Date(resumenData.fechas.inicio).toLocaleString('es-EC') : 'N/A'}</div>
                    <div class="info-item"><span class="info-label">Fecha Finalización:</span> ${resumenData.fechas?.fin ? new Date(resumenData.fechas.fin).toLocaleString('es-EC') : 'N/A'}</div>
                </div>
                
                <h2>2. Tiempos del Proceso</h2>
                <div class="tiempos">
                    <div class="tiempo-card"><div class="tiempo-valor">${resumenData.tiempos?.totalHoras || 0}h</div><div>Tiempo Total</div><small>(${resumenData.tiempos?.totalDias || 0} días)</small></div>
                    <div class="tiempo-card"><div class="tiempo-valor">${resumenData.tiempos?.horasConfiguracion || 0}h</div><div>Configuración</div></div>
                    <div class="tiempo-card"><div class="tiempo-valor">${resumenData.tiempos?.horasPruebas || 0}h</div><div>Pruebas</div></div>
                    <div class="tiempo-card"><div class="tiempo-valor">${resumenData.tiempos?.horasInstalacion || 0}h</div><div>Instalación</div></div>
                    <div class="tiempo-card"><div class="tiempo-valor">${resumenData.tiempos?.horasApertura || 0}h</div><div>Apertura</div></div>
                </div>
                
                <h2>3. Contratiempos y Novedades</h2>
                ${resumenData.contratiempos && resumenData.contratiempos.length > 0 ?
            resumenData.contratiempos.map((obs: any) => `
                        <div class="contratiempo">
                            <strong>${obs.etapa}</strong><br>
                            ${obs.observacion}<br>
                            <small>Registrado: ${obs.usuario ? `Por: ${obs.usuario} - ` : ''}${obs.fecha ? new Date(obs.fecha).toLocaleString('es-EC') : ''}</small>
                        </div>
                    `).join('') :
            '<p>No se registraron contratiempos durante el proceso.</p>'
        }
                
                <h2>4. Observaciones del Proceso</h2>
                ${resumenData.observaciones && resumenData.observaciones.length > 0 ?
            resumenData.observaciones.map((obs: any) => `
                        <div class="observacion">
                            <strong>${obs.etapa}</strong><br>
                            ${obs.observacion}<br>
                            <small>Registrado: ${obs.usuario ? `Por: ${obs.usuario} - ` : ''}${obs.fecha ? new Date(obs.fecha).toLocaleString('es-EC') : ''}</small>
                        </div>
                    `).join('') :
            '<p>No se registraron observaciones durante el proceso.</p>'
        }
                
                <h2>5. Evidencia Fotográfica</h2>
                ${resumenData.imagenApertura ? `
                    <div class="image-container">
                        <img src="${resumenData.imagenApertura}" alt="Evidencia de Apertura">
                        <p><em>Evidencia de apertura del local</em></p>
                    </div>
                ` : '<p>No se adjuntó evidencia fotográfica.</p>'}
                
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
            `<tr>
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
                    <p>Documento generado automáticamente por el Sistema de Aperturas KFC</p>
                    <p>Fecha de generación: ${new Date().toLocaleString('es-EC')}</p>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Informe_Apertura_${resumenData.tienda?.codigo}_${new Date().toISOString().split('T')[0]}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ===== FUNCIONES PARA RESUMEN FINAL - VERSIÓN MEJORADA =====
    const cargarResumenFinal = async () => {
        try {
            console.log('📊 Cargando resumen final para tienda:', id);

            const tiendaActual = tienda || await tiendasService.getById(id!) as any;
            const tiendaData = tiendaActual.tienda || tiendaActual;

            let procesoData = procesoActivo;
            if (!procesoData) {
                const response = await procesoService.getProcesosByTienda(id!);
                if (response.success && response.data) {
                    procesoData = response.data.find((p: Proceso) =>
                        p.tipo === 'apertura' || p.nombre?.toLowerCase().includes('apertura')
                    );
                }
            }

            const fechaInicio = procesoData?.fechas?.inicioReal ? new Date(procesoData.fechas.inicioReal) : null;
            const fechaFin = procesoData?.fechas?.finReal ? new Date(procesoData.fechas.finReal) : new Date();

            let horasConfiguracion = 0;
            let horasPruebas = 0;
            let horasInstalacion = 0;
            let horasApertura = 0;
            let totalHoras = 0;

            if (procesoData?.historial && procesoData.historial.length > 0) {
                let lastDate: Date | null = null;
                let currentStage = '';

                procesoData.historial.forEach((entry: any) => {
                    const entryDate = new Date(entry.fecha);

                    if (lastDate && currentStage) {
                        const diffHoras = (entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

                        switch (currentStage) {
                            case 'en_proceso':
                            case 'configuracion':
                                horasConfiguracion += diffHoras;
                                break;
                            case 'pendiente_aprobacion':
                            case 'pruebas':
                                horasPruebas += diffHoras;
                                break;
                            case 'instalacion':
                                horasInstalacion += diffHoras;
                                break;
                            case 'apertura':
                                horasApertura += diffHoras;
                                break;
                        }
                    }

                    lastDate = entryDate;
                    currentStage = entry.estadoNuevo || entry.estado || '';
                });

                if (fechaFin && lastDate && procesoData?.estado === 'completado') {
                    const diffFinal = (fechaFin.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
                    if (currentStage === 'apertura') horasApertura += diffFinal;
                    else if (currentStage === 'instalacion') horasInstalacion += diffFinal;
                }
            }

            totalHoras = horasConfiguracion + horasPruebas + horasInstalacion + horasApertura;

            if (totalHoras === 0 && fechaInicio && fechaFin) {
                totalHoras = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);
                horasConfiguracion = totalHoras * 0.3;
                horasPruebas = totalHoras * 0.2;
                horasInstalacion = totalHoras * 0.25;
                horasApertura = totalHoras * 0.25;
            }

            const observaciones: any[] = [];

            if (instalacion?.instalacionEquipos?.observaciones) {
                observaciones.push({
                    etapa: 'Instalación de Equipos',
                    observacion: instalacion.instalacionEquipos.observaciones,
                    fecha: new Date().toISOString()
                });
            }
            if (instalacion?.pruebasLocal?.observaciones) {
                observaciones.push({
                    etapa: 'Pruebas en Local',
                    observacion: instalacion.pruebasLocal.observaciones,
                    fecha: new Date().toISOString()
                });
            }

            if (mktContabilidad?.deUna?.observaciones?.length) {
                mktContabilidad.deUna.observaciones.forEach((obs: any) => {
                    observaciones.push({
                        etapa: 'MKT-Contabilidad DE-UNA',
                        observacion: obs.texto,
                        usuario: obs.usuario,
                        fecha: obs.fecha
                    });
                });
            }
            if (mktContabilidad?.puntosEmisionCodigos?.observaciones?.length) {
                mktContabilidad.puntosEmisionCodigos.observaciones.forEach((obs: any) => {
                    observaciones.push({
                        etapa: 'MKT-Contabilidad Puntos de Emisión',
                        observacion: obs.texto,
                        usuario: obs.usuario,
                        fecha: obs.fecha
                    });
                });
            }

            if (infraestructura?.servidor?.observaciones?.length) {
                infraestructura.servidor.observaciones.forEach((obs: any) => {
                    observaciones.push({
                        etapa: 'Infraestructura Servidor',
                        observacion: obs.texto,
                        usuario: obs.usuario,
                        fecha: obs.fecha
                    });
                });
            }
            if (infraestructura?.cajas?.observaciones?.length) {
                infraestructura.cajas.observaciones.forEach((obs: any) => {
                    observaciones.push({
                        etapa: 'Infraestructura Cajas',
                        observacion: obs.texto,
                        usuario: obs.usuario,
                        fecha: obs.fecha
                    });
                });
            }
            if (infraestructura?.enlacePrincipal?.observaciones?.length) {
                infraestructura.enlacePrincipal.observaciones.forEach((obs: any) => {
                    observaciones.push({
                        etapa: 'Infraestructura Enlace Principal',
                        observacion: obs.texto,
                        usuario: obs.usuario,
                        fecha: obs.fecha
                    });
                });
            }
            if (infraestructura?.energiaElectrica?.observaciones?.length) {
                infraestructura.energiaElectrica.observaciones.forEach((obs: any) => {
                    observaciones.push({
                        etapa: 'Infraestructura Energía Eléctrica',
                        observacion: obs.texto,
                        usuario: obs.usuario,
                        fecha: obs.fecha
                    });
                });
            }

            if (estacionesPrueba?.length) {
                estacionesPrueba.forEach((estacion: any) => {
                    if (estacion.observaciones?.length) {
                        estacion.observaciones.forEach((obs: any) => {
                            observaciones.push({
                                etapa: `Prueba Funcional - ${estacion.nombre}`,
                                observacion: obs.texto,
                                usuario: obs.usuario,
                                fecha: obs.fecha
                            });
                        });
                    }
                });
            }

            const contratiempos = observaciones.filter(obs =>
                obs.observacion?.toLowerCase().includes('problema') ||
                obs.observacion?.toLowerCase().includes('error') ||
                obs.observacion?.toLowerCase().includes('demora') ||
                obs.observacion?.toLowerCase().includes('retraso') ||
                obs.observacion?.toLowerCase().includes('pendiente')
            );

            const archivosAdjuntos = tiendaData?.archivosAdjuntos || [];
            const imagenAperturaUrl = imagenApertura?.url || null;
            const chatResumen = mensajesApertura.filter(m => m.usuario !== 'Sistema').slice(-30);

            setResumenData({
                tienda: {
                    id: tiendaData._id,
                    codigo: tiendaData.codigo,
                    nombre: tiendaData.nombre,
                    cadena: tiendaData.cadena,
                    direccion: tiendaData.direccion,
                    fechaAperturaPlanificada: tiendaData.fechaAperturaPlanificada
                },
                fechas: {
                    inicio: fechaInicio?.toISOString(),
                    fin: fechaFin?.toISOString(),
                    fechaFinalizacion: fechaFin?.toISOString()
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
                imagenApertura: imagenAperturaUrl,
                chatResumen: chatResumen.map(m => ({
                    usuario: m.usuario,
                    mensaje: m.texto,
                    fecha: m.fecha,
                    archivos: m.archivos
                })),
                checklist: {
                    total: CHECKLIST_COMPLETO.length,
                    completados: instalacion?.instalacionEquipos?.check && instalacion?.pruebasLocal?.check ?
                        CHECKLIST_COMPLETO.filter((_, i) => i < 24).length : 0,
                    items: CHECKLIST_COMPLETO
                },
                instalacionCompletada: verificarInstalacionCompleta()
            });

            setShowResumenModal(true);

        } catch (error) {
            console.error('Error cargando resumen:', error);
            toast.error('Error al cargar el resumen');
        }
    };

    // ===== FUNCIONES PARA MANEJO DE ARCHIVOS =====
    const handleSubirArchivoMKT = (tipo: 'deUna' | 'puntosEmision', file: File) => {
        const nuevoArchivo: ArchivoAdjunto = {
            id: Date.now().toString(),
            nombre: file.name,
            url: URL.createObjectURL(file),
            tamaño: file.size,
            tipo: file.type,
            fechaSubida: new Date().toISOString(),
            categoria: tipo === 'deUna' ? 'DE-UNA' : 'Puntos Emisión'
        };

        if (tipo === 'deUna') {
            const nuevosArchivos = [...(mktContabilidad.deUna.archivos || []), nuevoArchivo];
            setMktContabilidad(prev => ({
                ...prev,
                deUna: {
                    ...prev.deUna,
                    archivos: nuevosArchivos
                }
            }));

            if (tienda) {
                const tiendaArchivos = tienda.archivosAdjuntos || [];
                const nuevosTiendaArchivos = [...tiendaArchivos, nuevoArchivo];
                setTienda(prev => prev ? { ...prev, archivosAdjuntos: nuevosTiendaArchivos } : prev);
                localStorage.setItem(`tienda_archivos_${tienda._id}`, JSON.stringify(nuevosTiendaArchivos));
            }
        } else {
            const nuevosArchivos = [...(mktContabilidad.puntosEmisionCodigos.archivos || []), nuevoArchivo];
            setMktContabilidad(prev => ({
                ...prev,
                puntosEmisionCodigos: {
                    ...prev.puntosEmisionCodigos,
                    archivos: nuevosArchivos
                }
            }));

            if (tienda) {
                const tiendaArchivos = tienda.archivosAdjuntos || [];
                const nuevosTiendaArchivos = [...tiendaArchivos, nuevoArchivo];
                setTienda(prev => prev ? { ...prev, archivosAdjuntos: nuevosTiendaArchivos } : prev);
                localStorage.setItem(`tienda_archivos_${tienda._id}`, JSON.stringify(nuevosTiendaArchivos));
            }
        }

        localStorage.setItem(`mktContabilidad_${id}`, JSON.stringify({
            ...mktContabilidad,
            [tipo === 'deUna' ? 'deUna' : 'puntosEmisionCodigos']: {
                ...(tipo === 'deUna' ? mktContabilidad.deUna : mktContabilidad.puntosEmisionCodigos),
                archivos: tipo === 'deUna'
                    ? [...(mktContabilidad.deUna.archivos || []), nuevoArchivo]
                    : [...(mktContabilidad.puntosEmisionCodigos.archivos || []), nuevoArchivo]
            }
        }));

        toast.success('Documento subido correctamente');
    };

    const handleSubirArchivoInfraestructura = (seccion: 'enlacePrincipal' | 'energiaElectrica' | 'servidor' | 'cajas', file: File) => {
        const nuevoArchivo: ArchivoAdjunto = {
            id: Date.now().toString(),
            nombre: file.name,
            url: URL.createObjectURL(file),
            tamaño: file.size,
            tipo: file.type,
            fechaSubida: new Date().toISOString(),
            categoria: 'Infraestructura'
        };

        setInfraestructura(prev => ({
            ...prev,
            [seccion]: {
                ...prev[seccion],
                archivos: [...(prev[seccion].archivos || []), nuevoArchivo]
            }
        }));

        if (tienda) {
            const tiendaArchivos = tienda.archivosAdjuntos || [];
            const nuevosTiendaArchivos = [...tiendaArchivos, nuevoArchivo];
            setTienda(prev => prev ? { ...prev, archivosAdjuntos: nuevosTiendaArchivos } : prev);
            localStorage.setItem(`tienda_archivos_${tienda._id}`, JSON.stringify(nuevosTiendaArchivos));
        }

        toast.success('Archivo adjuntado correctamente');
    };

    // ===== FUNCIÓN PARA handleSubirArchivo =====
    const handleSubirArchivo = (tipo: string, _seccion: string, itemId: string | null, file: File) => {
        let nuevoArchivo: ArchivoAdjunto = {
            id: Date.now().toString(),
            nombre: file.name,
            url: URL.createObjectURL(file),
            tamaño: file.size,
            tipo: file.type,
            fechaSubida: new Date().toISOString()
        };

        switch (tipo) {
            case 'politicas':
                nuevoArchivo.categoria = 'Políticas Restaurante';
                setPoliticasRestaurante(prev => ({
                    ...prev,
                    archivos: [...(prev.archivos || []), nuevoArchivo]
                }));
                if (tienda) {
                    const tiendaArchivos = tienda.archivosAdjuntos || [];
                    const nuevosTiendaArchivos = [...tiendaArchivos, nuevoArchivo];
                    setTienda(prev => prev ? { ...prev, archivosAdjuntos: nuevosTiendaArchivos } : prev);
                    localStorage.setItem(`tienda_archivos_${tienda._id}`, JSON.stringify(nuevosTiendaArchivos));
                }
                localStorage.setItem(`politicasRestaurante_${id}`, JSON.stringify({
                    ...politicasRestaurante,
                    archivos: [...(politicasRestaurante.archivos || []), nuevoArchivo]
                }));
                break;
            case 'usuario':
                setUsuarios(prev => prev.map(u => u.id === itemId ? { ...u, archivos: [...(u.archivos || []), nuevoArchivo] } : u));
                break;
            case 'impresora':
                setImpresoras(prev => prev.map(i => i.id === itemId ? { ...i, archivos: [...(i.archivos || []), nuevoArchivo] } : i));
                break;
            case 'estacion':
                setEstaciones(prev => prev.map(e => e.id === itemId ? { ...e, archivos: [...(e.archivos || []), nuevoArchivo] } : e));
                break;
            case 'prueba':
                setPruebas(prev => prev.map(p => p.id === itemId ? { ...p, archivos: [...(p.archivos || []), nuevoArchivo] } : p));
                break;
            case 'instalacion_equipos':
                setInstalacion(prev => ({ ...prev, instalacionEquipos: { ...prev.instalacionEquipos, archivos: [...(prev.instalacionEquipos.archivos || []), nuevoArchivo] } }));
                break;
            case 'instalacion_pruebas':
                setInstalacion(prev => ({ ...prev, pruebasLocal: { ...prev.pruebasLocal, archivos: [...(prev.pruebasLocal.archivos || []), nuevoArchivo] } }));
                break;
            case 'chat':
                const nuevoMensajeChat: MensajeApertura = {
                    id: Date.now().toString(),
                    usuario: user?.nombre || 'Usuario',
                    usuarioId: user?._id,
                    fecha: new Date().toISOString(),
                    texto: `Archivo adjunto: ${file.name}`,
                    tipo: 'archivo',
                    archivos: [nuevoArchivo]
                };
                setMensajesApertura(prev => [...prev, nuevoMensajeChat]);
                localStorage.setItem(`chat_apertura_${id}`, JSON.stringify([...mensajesApertura, nuevoMensajeChat]));
                break;
            case 'apertura_imagen':
                nuevoArchivo.categoria = 'Imagen Apertura';
                setImagenApertura(nuevoArchivo);
                if (tienda) {
                    const tiendaArchivos = tienda.archivosAdjuntos || [];
                    const nuevosTiendaArchivos = [...tiendaArchivos, nuevoArchivo];
                    setTienda(prev => prev ? { ...prev, archivosAdjuntos: nuevosTiendaArchivos } : prev);
                    localStorage.setItem(`tienda_archivos_${tienda._id}`, JSON.stringify(nuevosTiendaArchivos));
                }
                break;
        }
        toast.success('Archivo subido');
    };

    // ===== FUNCIONES PARA OBSERVACIONES =====
    const handleAgregarObservacionMKT = (tipo: 'deUna' | 'puntosEmision') => {
        const texto = tipo === 'deUna' ? observacionDeUna : observacionPuntosEmision;
        if (!texto || !texto.trim()) {
            toast.error('Escribe una observación antes de enviar');
            return;
        }

        const nuevaObs: ObservacionAnclada = {
            id: Date.now().toString(),
            texto: texto.trim(),
            usuario: user?.nombre || 'Usuario',
            fecha: new Date().toISOString()
        };

        if (tipo === 'deUna') {
            setMktContabilidad(prev => ({
                ...prev,
                deUna: {
                    ...prev.deUna,
                    observaciones: [...(prev.deUna.observaciones || []), nuevaObs]
                }
            }));
            setObservacionDeUna('');
        } else {
            setMktContabilidad(prev => ({
                ...prev,
                puntosEmisionCodigos: {
                    ...prev.puntosEmisionCodigos,
                    observaciones: [...(prev.puntosEmisionCodigos.observaciones || []), nuevaObs]
                }
            }));
            setObservacionPuntosEmision('');
        }
        toast.success('Observación agregada');
    };

    const handleAgregarObservacionInfraestructura = (seccion: 'enlacePrincipal' | 'energiaElectrica' | 'servidor' | 'cajas') => {
        let texto = '';
        if (seccion === 'enlacePrincipal') texto = observacionEnlacePrincipal;
        else if (seccion === 'energiaElectrica') texto = observacionEnergiaElectrica;
        else if (seccion === 'servidor') texto = observacionServidor;
        else texto = observacionCajas;

        if (!texto || !texto.trim()) {
            toast.error('Escribe una observación antes de enviar');
            return;
        }

        const nuevaObs: ObservacionAnclada = {
            id: Date.now().toString(),
            texto: texto.trim(),
            usuario: user?.nombre || 'Usuario',
            fecha: new Date().toISOString()
        };

        setInfraestructura(prev => ({
            ...prev,
            [seccion]: {
                ...prev[seccion],
                observaciones: [...(prev[seccion].observaciones || []), nuevaObs]
            }
        }));

        if (seccion === 'enlacePrincipal') setObservacionEnlacePrincipal('');
        else if (seccion === 'energiaElectrica') setObservacionEnergiaElectrica('');
        else if (seccion === 'servidor') setObservacionServidor('');
        else setObservacionCajas('');

        toast.success('Observación agregada');
    };

    const handleAgregarObservacionReplicaInicial = () => {
        if (!observacionReplicaInicial || !observacionReplicaInicial.trim()) {
            toast.error('Escribe una observación antes de enviar');
            return;
        }

        const nuevaObs: ObservacionAnclada = {
            id: Date.now().toString(),
            texto: observacionReplicaInicial.trim(),
            usuario: user?.nombre || 'Usuario',
            fecha: new Date().toISOString()
        };

        setInfraestructura(prev => ({
            ...prev,
            servidor: {
                ...prev.servidor,
                observacionesReplica: [...(prev.servidor.observacionesReplica || []), nuevaObs]
            }
        }));
        setObservacionReplicaInicial('');
        toast.success('Observación agregada');
    };

    // ===== FUNCIONES EXISTENTES =====
    const getFaltantesMessage = (): string => {
        const faltantes: string[] = []
        if (!politicasRestaurante?.check) faltantes.push('✓ Políticas del restaurante')
        const estacionesNoCompletadas = estaciones?.filter(e => !e.completado) ?? []
        if (estacionesNoCompletadas.length > 0) faltantes.push(`✓ Configuración de estaciones (${estacionesNoCompletadas.map(e => e.nombre).join(', ')})`)
        const usuariosNoCreados = usuarios?.filter(u => u.activo && !u.creado) ?? []
        if (usuariosNoCreados.length > 0) faltantes.push(`✓ Usuarios por crear (${usuariosNoCreados.map(u => u.nombre).join(', ')})`)
        const servidorNoCompletado = despliegueServidor?.filter(item => item.aplica && !item.completado) ?? []
        if (servidorNoCompletado.length > 0) faltantes.push(`✓ Despliegue servidor (${servidorNoCompletado.map(i => i.nombre).join(', ')})`)
        const cajasNoCompletadasDespliegue = despliegueCajas?.filter(c => !(c.servicioTarjetas && c.servicioImpresion)) ?? []
        if (cajasNoCompletadasDespliegue.length > 0) faltantes.push(`✓ Despliegue cajas (${cajasNoCompletadasDespliegue.map(c => c.cajaNombre).join(', ')})`)
        if (!mktContabilidad?.deUna?.check) faltantes.push('✓ MKT-Contabilidad DE-UNA')
        if (!mktContabilidad?.puntosEmisionCodigos?.check) faltantes.push('✓ MKT-Contabilidad Puntos de Emisión')
        if (!infraestructura?.servidor?.check) faltantes.push('✓ Infraestructura Servidor')
        if (!infraestructura?.servidor?.replicaInicial) faltantes.push('✓ Infraestructura Réplica Inicial')
        if (!infraestructura?.cajas?.check) faltantes.push('✓ Infraestructura Cajas')
        if (!infraestructura?.enlacePrincipal?.check) faltantes.push('✓ Infraestructura Enlace Principal')
        if (!infraestructura?.energiaElectrica?.check) faltantes.push('✓ Infraestructura Energía Eléctrica')
        const impresorasNoCompletadas = impresoras?.filter(i => i.seleccionado && !i.completado) ?? []
        if (impresorasNoCompletadas.length > 0) faltantes.push(`✓ Impresoras (${impresorasNoCompletadas.map(i => i.nombre).join(', ')})`)
        if (!formasPago?.some(fp => fp.seleccionado)) faltantes.push('✓ Formas de pago')
        return faltantes.length > 0 ? `Faltan los siguientes items:\n${faltantes.join('\n')}` : ''
    }

    const handleGuardarConfiguracionCompleta = () => {
        localStorage.setItem(`politicasRestaurante_${id}`, JSON.stringify(politicasRestaurante))
        localStorage.setItem(`estaciones_${id}`, JSON.stringify(estaciones))
        localStorage.setItem(`impresoras_${id}`, JSON.stringify(impresoras))
        localStorage.setItem(`usuarios_${id}`, JSON.stringify(usuarios))
        setShowConfiguracionTiendaModal(false)
        toast.success('Configuración de tienda guardada correctamente')
    }

    const handleSeleccionarTodasEstaciones = () => {
        const nuevasEstaciones = estaciones.map(estacion => ({ ...estacion, completado: true }))
        setEstaciones(nuevasEstaciones)
        localStorage.setItem(`estaciones_${id}`, JSON.stringify(nuevasEstaciones))
        toast.success('Todas las estaciones marcadas como completadas')
    }

    const handleSeleccionarTodosUsuarios = () => {
        const nuevosUsuarios = usuarios.map(usuario => ({ ...usuario, creado: true }))
        setUsuarios(nuevosUsuarios)
        localStorage.setItem(`usuarios_${id}`, JSON.stringify(nuevosUsuarios))
        toast.success('Todos los usuarios marcados como creados')
    }

    const handleSeleccionarTodasImpresoras = () => {
        const nuevasImpresoras = impresoras.map(imp => ({ ...imp, completado: true }))
        setImpresoras(nuevasImpresoras)
        localStorage.setItem(`impresoras_${id}`, JSON.stringify(nuevasImpresoras))
        toast.success('Todas las impresoras marcadas como completadas')
    }

    const handleSeleccionarTodasPruebas = () => {
        const nuevasPruebas = pruebas.map(prueba => ({ ...prueba, check: true }))
        setPruebas(nuevasPruebas)
        localStorage.setItem(`pruebas_${id}`, JSON.stringify(nuevasPruebas))
        toast.success('Todas las pruebas marcadas como completadas')
    }

    const handleSeleccionarTodasFormasPago = () => {
        const nuevasFormasPago = formasPago.map(fp => ({ ...fp, seleccionado: true }))
        setFormasPago(nuevasFormasPago)
        let cadenaId = tienda?.cadena;
        if (cadenaId) {
            const cadenaIdNumerico = obtenerCadenaIdNumerico(cadenaId);
            if (cadenaIdNumerico) localStorage.setItem(`formasPago_${id}_${cadenaIdNumerico}`, JSON.stringify(nuevasFormasPago))
        }
        toast.success('Todas las formas de pago seleccionadas')
    }

    const handleGuardarServicios = () => {
        setShowServiciosModal(false)
        localStorage.setItem(`servicios_tienda_${id}`, JSON.stringify(servicios))
        setDespliegueServidor(prev => prev.map(item => {
            if (item.id === 'dragonTail') return { ...item, aplica: servicios.dragonTail === 'aplica' }
            if (item.id === 'upselling') return { ...item, aplica: servicios.upselling === 'aplica' }
            if (item.id === 'kioscos') return { ...item, aplica: servicios.kioscos === 'aplica' }
            return item
        }))
        toast.success('Servicios configurados')
    }

    const handleGuardarFormasPago = () => {
        let cadenaIdNumerico = null;
        if (tienda?.cadena) {
            cadenaIdNumerico = obtenerCadenaIdNumerico(tienda.cadena);
            if (!cadenaIdNumerico && tienda.cadena.toString().toUpperCase().includes('ESPANOL')) {
                cadenaIdNumerico = '8';
            }
        }
        if (cadenaIdNumerico) localStorage.setItem(`formasPago_${id}_${cadenaIdNumerico}`, JSON.stringify(formasPago))
        setShowFormasPagoModal(false)
        toast.success('Formas de pago guardadas')
    }

    const handleGuardarDespliegueServidor = () => {
        localStorage.setItem(`despliegueServidor_${id}`, JSON.stringify(despliegueServidor))
        setShowDespliegueServidorModal(false)
        toast.success('Despliegue servidor guardado')
    }

    const handleGuardarDespliegueCajas = () => {
        localStorage.setItem(`despliegueCajas_${id}`, JSON.stringify(despliegueCajas))
        setShowDespliegueCajasModal(false)
        toast.success('Despliegue cajas guardado')
    }

    const handleGuardarMKTContabilidad = () => {
        localStorage.setItem(`mktContabilidad_${id}`, JSON.stringify(mktContabilidad))
        setShowMKTContabilidadModal(false)
        toast.success('MKT-Contabilidad guardado')
    }

    const handleGuardarInfraestructura = () => {
        localStorage.setItem(`infraestructura_${id}`, JSON.stringify(infraestructura))
        setShowInfraestructuraModal(false)
        toast.success('Infraestructura guardada')
    }

    const handleGuardarPruebas = () => {
        localStorage.setItem(`pruebas_${id}`, JSON.stringify(pruebas))
        setShowPruebasModal(false)
        toast.success('Pruebas guardadas')
    }

    const handleGuardarInstalacion = () => {
        localStorage.setItem(`instalacion_${id}`, JSON.stringify(instalacion))
        setShowInstalacionModal(false)
        toast.success('Instalación guardada')

        if (estadoActual === 'apertura') {
            setEstadoActual(prev => prev);
        }
    }

    const handleAceptarTienda = async () => {
        try {
            if (!tienda) return
            setLoading(true)
            const nuevoProceso = {
                tienda: tienda._id,
                nombre: `Apertura de ${tienda.nombre}`,
                tipo: 'apertura',
                area: 'aperturas',
                etapa: 'pre_apertura',
                estado: 'en_proceso',
                orden: 1,
                fechas: {
                    inicioReal: new Date().toISOString(),
                    finEstimado: tienda.fechaAperturaPlanificada || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                },
                prioridad: 'alta'
            }
            const response = await procesoService.crearProceso(nuevoProceso)
            if (response.success) {
                toast.success('Proceso iniciado correctamente')
                setEstadoActual('en_proceso')
                await cargarProcesoActivo()
                window.dispatchEvent(new CustomEvent('kanban-refresh'))
            } else throw new Error(response.error || 'Error al crear el proceso')
        } catch (error: any) {
            console.error(error)
            toast.error(error?.response?.data?.error || error?.message || 'Error al iniciar el proceso')
        } finally { setLoading(false) }
    }

    useEffect(() => {
        if (id && !procesoCargadoRef.current) {
            procesoCargadoRef.current = true
            loadTiendaData()
            cargarDatosGuardados()
            cargarArchivosTienda()
            cargarTecnicosDisponibles()
        }
    }, [id])

    useEffect(() => {
        let isMounted = true
        const handleKanbanUpdate = () => {
            if (isMounted && !cargandoProceso) cargarProcesoActivo()
        }
        window.addEventListener('kanban-refresh', handleKanbanUpdate)
        return () => {
            isMounted = false
            window.removeEventListener('kanban-refresh', handleKanbanUpdate)
        }
    }, [cargandoProceso])

    useEffect(() => {
        if (showPruebasFuncionalesModal) {
            cargarEstacionesPrueba();
            inicializarPruebasEstaciones(); // ✅ AGREGADO
        }
    }, [showPruebasFuncionalesModal])

    useEffect(() => {
        if (showPruebasPreAperturaModal) {
            cargarPreAperturaEstado();
        }
    }, [showPruebasPreAperturaModal])

    useEffect(() => {
        if (showAprobacionContabilidadModal) {
            cargarAprobacion();
        }
    }, [showAprobacionContabilidadModal])

    useEffect(() => {
        console.log('🔄 Estado actual cambiado a:', estadoActual);
    }, [estadoActual]);

    useEffect(() => {
        console.log('🔄 procesoActivo cambiado:', procesoActivo?._id, 'Estado:', procesoActivo?.estado);
    }, [procesoActivo]);

    const cargarDatosGuardados = () => {
        try {
            const savedServicios = localStorage.getItem(`servicios_tienda_${id}`); if (savedServicios) setServicios(JSON.parse(savedServicios))
            const savedPoliticas = localStorage.getItem(`politicasRestaurante_${id}`); if (savedPoliticas) setPoliticasRestaurante(JSON.parse(savedPoliticas))
            const savedEstaciones = localStorage.getItem(`estaciones_${id}`); if (savedEstaciones) setEstaciones(JSON.parse(savedEstaciones))
            const savedUsuarios = localStorage.getItem(`usuarios_${id}`); if (savedUsuarios) setUsuarios(JSON.parse(savedUsuarios))
            const savedImpresoras = localStorage.getItem(`impresoras_${id}`); if (savedImpresoras) setImpresoras(JSON.parse(savedImpresoras))
            const savedDespliegueServidor = localStorage.getItem(`despliegueServidor_${id}`); if (savedDespliegueServidor) setDespliegueServidor(JSON.parse(savedDespliegueServidor))
            const savedDespliegueCajas = localStorage.getItem(`despliegueCajas_${id}`); if (savedDespliegueCajas) setDespliegueCajas(JSON.parse(savedDespliegueCajas))
            const savedMKT = localStorage.getItem(`mktContabilidad_${id}`); if (savedMKT) setMktContabilidad(JSON.parse(savedMKT))
            const savedInfra = localStorage.getItem(`infraestructura_${id}`); if (savedInfra) { const parsed = JSON.parse(savedInfra); setInfraestructura(parsed) }
            const savedPruebas = localStorage.getItem(`pruebas_${id}`); if (savedPruebas) setPruebas(JSON.parse(savedPruebas))
            const savedInstalacion = localStorage.getItem(`instalacion_${id}`); if (savedInstalacion) setInstalacion(JSON.parse(savedInstalacion))
            const savedChat = localStorage.getItem(`chat_apertura_${id}`); if (savedChat) setMensajesApertura(JSON.parse(savedChat))
        } catch (error) { console.error(error) }
    }

    const loadTiendaData = async () => {
        try {
            setLoading(true)
            const response = await tiendasService.getById(id!) as any
            const tiendaData = response.tienda || response

            console.log('📥 loadTiendaData - Tienda:', tiendaData._id, 'Estado:', tiendaData.estadoGeneral);

            const savedArchivos = localStorage.getItem(`tienda_archivos_${id}`);
            if (savedArchivos) {
                tiendaData.archivosAdjuntos = JSON.parse(savedArchivos);
            } else if (!tiendaData.archivosAdjuntos) {
                tiendaData.archivosAdjuntos = [];
            }

            setTienda(tiendaData)
            setEstadoActual(tiendaData.estadoGeneral as EstadoTienda || 'pendiente')
            await cargarConfiguracionDesdeTienda(tiendaData)
            await cargarProcesoActivo()
            inicializarPruebasEstaciones() // ✅ AGREGADO
        } catch (error) {
            console.error(error)
            toast.error('Error al cargar los datos de la tienda')
        } finally {
            setLoading(false)
        }
    }

    const cargarProcesoActivo = useCallback(async () => {
        if (!id || cargandoProceso) return
        setCargandoProceso(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            const response = await procesoService.getProcesosByTienda(id)
            console.log('📥 cargarProcesoActivo - Respuesta:', response);

            if (response.success && response.data) {
                const proceso = response.data.find((p: Proceso) =>
                    p.tipo === 'apertura' ||
                    p.nombre?.toLowerCase().includes('apertura') ||
                    p.etapa === 'pre_apertura'
                )
                if (proceso) {
                    console.log('✅ Proceso encontrado:', proceso._id, 'Estado:', proceso.estado);
                    setProcesoActivo(proceso)
                    setEstadoActual(proceso.estado as EstadoTienda)
                } else {
                    console.warn('⚠️ No se encontró proceso activo');
                }
            }
        } catch (error) {
            console.error('❌ Error cargando proceso activo:', error)
        } finally {
            setCargandoProceso(false)
        }
    }, [id, cargandoProceso])

    const verificarConfiguracionCompleta = (): boolean => {
        const politicasOk = politicasRestaurante?.check ?? false
        const estacionesOk = estaciones?.every(est => est.completado === true) ?? false
        const usuariosOk = usuarios?.filter(u => u.activo).every(u => u.creado) ?? false
        const despliegueServidorOk = despliegueServidor?.filter(item => item.aplica).every(item => item.completado) ?? false
        const despliegueCajasOk = despliegueCajas?.every(c => c.servicioTarjetas && c.servicioImpresion) ?? false
        const mktOk = (mktContabilidad?.deUna?.check && mktContabilidad?.puntosEmisionCodigos?.check) ?? false
        const infraOk = (infraestructura?.servidor?.check && infraestructura?.servidor?.replicaInicial && infraestructura?.cajas?.check && infraestructura?.enlacePrincipal?.check && infraestructura?.energiaElectrica?.check) ?? false
        const impresorasOk = impresoras?.filter(i => i.seleccionado).every(i => i.completado) ?? false
        const formasPagoOk = formasPago?.some(fp => fp.seleccionado) ?? false
        return politicasOk && estacionesOk && usuariosOk && despliegueServidorOk && despliegueCajasOk && mktOk && infraOk && impresorasOk && formasPagoOk
    }

    const verificarRevisionCompleta = (): boolean => {
        const pruebasBasicasCompletas = pruebas?.every(p => p.check) ?? false
        const pruebasFuncionalesDetalladasCompletas = verificarPruebasFuncionalesCompletas()
        return pruebasBasicasCompletas && pruebasFuncionalesDetalladasCompletas
    }

    const verificarInstalacionCompleta = (): boolean => (instalacion?.instalacionEquipos?.check && instalacion?.pruebasLocal?.check) ?? false

    const handleSiguienteEstado = async () => {
        try {
            if (!procesoActivo) return

            if (estadoActual === 'en_proceso' && verificarConfiguracionCompleta()) {
                if (window.confirm('¿Estás seguro de que todos los items han sido completados correctamente? Esta acción moverá la tienda a la etapa de REVISIÓN.')) {
                    await procesoService.pasarARevision(procesoActivo._id)
                    setEstadoActual('pendiente_aprobacion')
                    toast.success('✅ Todo configurado correctamente. Proceso enviado a revisión')
                }
            } else if (estadoActual === 'en_proceso' && !verificarConfiguracionCompleta()) {
                const faltantes = getFaltantesMessage()
                toast.error(`❌ No se puede pasar a revisión. ${faltantes}`)
            } else if (estadoActual === 'pendiente_aprobacion' && verificarRevisionCompleta()) {
                if (window.confirm('¿Estás seguro de que todas las pruebas han sido completadas? Esta acción moverá la tienda a la etapa de APERTURA.')) {
                    await procesoService.updateProceso(procesoActivo._id, { estado: 'apertura' })
                    setEstadoActual('apertura')
                    agregarMensajeApertura('✅ Pruebas completadas. Pasando a APERTURA')
                    toast.success('✅ Pruebas completadas. Pasando a APERTURA')
                }
            } else if (estadoActual === 'pendiente_aprobacion' && !verificarRevisionCompleta()) {
                const pruebasFaltantes = pruebas.filter(p => !p.check).map(p => p.nombre)
                toast.error(`❌ No se puede pasar a apertura. Faltan las siguientes pruebas: ${pruebasFaltantes.join(', ')}`)
            }
            await cargarProcesoActivo()
            window.dispatchEvent(new CustomEvent('kanban-refresh'))
        } catch (error) {
            console.error(error)
            toast.error('Error al cambiar el estado')
        }
    }

    const handleCambiarEstadoManual = async (nuevoEstado: EstadoTienda) => {
        if (!procesoActivo || !isMaster) return

        try {
            if (procesoActivo.estado === 'pendiente_aprobacion' && nuevoEstado === 'en_revision') {
                const response = await procesoService.continuarRevision(procesoActivo._id)
                if (response.success) {
                    toast.success('✅ Estado cambiado de PENDIENTE APROBACIÓN a EN REVISIÓN')
                    setEstadoActual('en_revision')
                    await cargarProcesoActivo()
                    window.dispatchEvent(new CustomEvent('kanban-refresh'))
                    setShowEstadoModal(false)
                    return
                } else {
                    throw new Error(response.error)
                }
            }

            if (nuevoEstado === 'en_proceso') {
                await procesoService.iniciarProceso(procesoActivo._id)
            } else if (nuevoEstado === 'en_revision') {
                await procesoService.pasarARevision(procesoActivo._id)
            } else if (nuevoEstado === 'instalacion') {
                await procesoService.updateProceso(procesoActivo._id, { estado: 'instalacion' })
            } else if (nuevoEstado === 'apertura') {
                await procesoService.updateProceso(procesoActivo._id, { estado: 'apertura' })
            } else if (nuevoEstado === 'completado') {
                await procesoService.finalizarProceso(procesoActivo._id)
            } else if (nuevoEstado === 'pendiente') {
                await procesoService.updateProceso(procesoActivo._id, { estado: 'pendiente' })
            } else if (nuevoEstado === 'cancelado') {
                await procesoService.updateProceso(procesoActivo._id, { estado: 'cancelado' })
            }

            setShowEstadoModal(false)
            toast.success(`Estado cambiado a ${nuevoEstado.replace('_', ' ')}`)
            await cargarProcesoActivo()
            window.dispatchEvent(new CustomEvent('kanban-refresh'))
        } catch (error) {
            console.error('Error cambiando estado:', error)
            toast.error('Error al cambiar el estado')
        }
    }

    const handleFinalizarApertura = async () => {
        if (!imagenApertura) {
            toast.error('Debes adjuntar la imagen de apertura antes de finalizar')
            return
        }
        if (!verificarInstalacionCompleta()) {
            toast.error('❌ Debes completar la instalación de equipos y pruebas en local antes de finalizar la apertura')
            return
        }
        if (window.confirm('¿Estás seguro de que deseas finalizar el proceso de apertura?')) {
            try {
                if (!procesoActivo) return
                await procesoService.finalizarProceso(procesoActivo._id)
                agregarMensajeApertura('✅ Proceso de apertura finalizado exitosamente.', 'finalizacion')
                setAperturaFinalizada(true)
                setEstadoActual('completado')
                toast.success('🎉 Apertura finalizada exitosamente!')
                await cargarProcesoActivo()
                window.dispatchEvent(new CustomEvent('kanban-refresh'))
                await cargarResumenFinal()
                setShowChatModal(false)
            } catch (error) {
                console.error(error)
                toast.error('Error al finalizar la apertura')
            }
        }
    }

    const handleEliminarTienda = async () => {
        if (!isMaster) {
            toast.error('Solo el usuario master puede eliminar tiendas')
            return
        }
        if (!tienda) return
        if (window.confirm(`¿Estás seguro de que deseas eliminar ${tienda.codigo} - ${tienda.nombre}?`)) {
            try {
                setLoading(true)
                await tiendasService.delete(tienda._id)
                const keysToRemove = []
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key && key.includes(tienda._id)) keysToRemove.push(key)
                }
                keysToRemove.forEach(key => localStorage.removeItem(key))
                toast.success('Tienda eliminada exitosamente')
                navigate('/tiendas')
                setTimeout(() => window.location.reload(), 100)
            } catch (error) {
                console.error(error)
                toast.error('Error al eliminar la tienda')
            } finally {
                setLoading(false)
            }
        }
    }

    const handleEditarTienda = () => {
        if (!tienda) return
        navigate(`/tiendas/editar/${tienda._id}`)
    }

    const agregarMensajeApertura = (texto: string, tipo: 'novedad' | 'consulta' | 'respuesta' | 'finalizacion' | 'archivo' = 'novedad') => {
        if (!texto.trim() && tipo !== 'archivo') return
        const nuevo: MensajeApertura = {
            id: Date.now().toString(),
            usuario: user?.nombre || 'Usuario',
            usuarioId: user?._id,
            fecha: new Date().toISOString(),
            texto,
            tipo
        }
        const nuevosMensajes = [...mensajesApertura, nuevo]
        setMensajesApertura(nuevosMensajes)
        localStorage.setItem(`chat_apertura_${id}`, JSON.stringify(nuevosMensajes))
    }

    const handleEnviarMensajeApertura = () => {
        if (!nuevoMensaje.trim() && !archivoSeleccionado) return
        if (archivoSeleccionado) {
            handleSubirArchivo('chat', '', null, archivoSeleccionado)
            setArchivoSeleccionado(null)
        }
        if (nuevoMensaje.trim()) {
            agregarMensajeApertura(nuevoMensaje)
            setNuevoMensaje('')
        }
    }

    const handleRegresar = () => navigate('/tiendas')

    const estadoMostrar = procesoActivo?.estado as EstadoTienda || estadoActual

    if (loading) return (
        <Layout>
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfc-red"></div>
            </div>
        </Layout>
    )

    if (!tienda) return (
        <Layout>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Tienda no encontrada</h2>
                <Button variant="primary" onClick={() => navigate('/tiendas')}>Volver a Tiendas</Button>
            </div>
        </Layout>
    )

    return (
        <Layout>
            <div className="space-y-6">
                {/* HEADER CON TÉCNICO CX Y BOTÓN DE CAMBIAR */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={handleRegresar} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <ArrowUturnLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                        {tienda.codigo} - {tienda.nombre}
                                    </h1>
                                    <StatusBadge status={estadoMostrar} />
                                </div>
                                <div className="mt-2">
                                    <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg font-semibold flex items-center gap-2">
                                        <CalendarIcon className="h-5 w-5 text-kfc-red" />
                                        <span>Apertura:</span>
                                        <span className="text-kfc-red font-bold text-lg md:text-xl">
                                            {tienda.fechaAperturaPlanificada ? format(new Date(tienda.fechaAperturaPlanificada), 'dd/MM/yyyy', { locale: es }) : 'No definida'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                <UserCircleIcon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    CX: {getNombreTecnicoActual()}
                                </span>
                                {(estadoMostrar === 'pendiente' || estadoMostrar === 'en_proceso') && (
                                    <button
                                        onClick={() => setShowReasignarTecnicoModal(true)}
                                        className="text-kfc-red hover:text-red-700 text-xs flex items-center gap-1 ml-1"
                                        title="Reasignar técnico CX"
                                    >
                                        <ArrowPathIcon className="h-3 w-3" /> Cambiar
                                    </button>
                                )}
                            </div>
                            <button onClick={handleEditarTienda} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 transition-colors" title="Editar tienda">
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            {procesoActivo && (
                                <button onClick={() => setShowEstadoModal(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 transition-colors" title="Cambiar estado manualmente">
                                    <CogIcon className="h-5 w-5" />
                                </button>
                            )}
                            {estadoMostrar === 'completado' && (
                                <button onClick={cargarResumenFinal} className="p-2 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 transition-colors" title="Ver resumen">
                                    <ChartBarIcon className="h-5 w-5" />
                                </button>
                            )}
                            {isMaster && (
                                <button onClick={handleEliminarTienda} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 transition-colors" title="Eliminar tienda">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Debug */}
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm">
                        <span className="font-semibold">Estado actual:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                            estadoMostrar === 'en_revision' ? 'bg-purple-100 text-purple-800' :
                                estadoMostrar === 'pendiente_aprobacion' ? 'bg-orange-100 text-orange-800' :
                                    estadoMostrar === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                                        estadoMostrar === 'instalacion' ? 'bg-indigo-100 text-indigo-800' :
                                            estadoMostrar === 'apertura' ? 'bg-orange-100 text-orange-800' :
                                                estadoMostrar === 'completado' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-200 text-gray-800'
                        }`}>
                            {estadoMostrar?.toUpperCase() || 'DESCONOCIDO'}
                        </span>
                    </p>
                </div>

                {/* Botón aceptar tienda */}
                {estadoMostrar === 'pendiente' && (
                    <div className="flex justify-center">
                        <button onClick={handleAceptarTienda} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-3">
                            <CheckCircleIcon className="h-6 w-6" /> ACEPTAR TIENDA - INICIAR PROCESO
                        </button>
                    </div>
                )}

                {/* EN PROCESO - Mostrar archivos adjuntos de la tienda */}
                {estadoMostrar === 'en_proceso' && (
                    <>
                        {tienda.archivosAdjuntos && tienda.archivosAdjuntos.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <PaperClipIcon className="h-5 w-5 text-gray-500" />
                                    Documentos Adjuntos de la Tienda
                                </h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {tienda.archivosAdjuntos.map((archivo: ArchivoAdjunto, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {archivo.tipo?.startsWith('image/') ?
                                                    <PhotoIcon className="h-4 w-4 text-blue-500 flex-shrink-0" /> :
                                                    <PaperClipIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                }
                                                <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{archivo.nombre}</span>
                                                {archivo.categoria && (
                                                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0">
                                                        {archivo.categoria}
                                                    </span>
                                                )}
                                            </div>
                                            <a href={archivo.url} download className="text-kfc-red hover:underline text-sm flex items-center gap-1 flex-shrink-0 ml-2">
                                                <ArrowDownTrayIcon className="h-4 w-4" /> Descargar
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <button onClick={() => setShowServiciosModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"><CogIcon className="h-6 w-6" /> SERVICIOS</button>
                            <button onClick={() => setShowConfiguracionTiendaModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"><BuildingStorefrontIcon className="h-6 w-6" /> CONFIGURACIÓN TIENDA</button>
                            <button onClick={() => setShowFormasPagoModal(true)} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"><CreditCardIcon className="h-6 w-6" /> FORMAS DE PAGO</button>
                            <button onClick={() => setShowDespliegueServidorModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"><ServerIcon className="h-6 w-6" /> DESPLIEGUE SERVIDOR</button>
                            <button onClick={() => setShowDespliegueCajasModal(true)} className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"><CubeIcon className="h-6 w-6" /> DESPLIEGUE CAJAS</button>
                            <button onClick={() => setShowMKTContabilidadModal(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"><DocumentTextIcon className="h-6 w-6" /> MKT-CONTABILIDAD</button>
                            <button onClick={() => setShowInfraestructuraModal(true)} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"><BoltIcon className="h-6 w-6" /> INFRAESTRUCTURA</button>
                        </div>
                        {verificarConfiguracionCompleta() ?
                            <div className="flex justify-center mt-4"><button onClick={handleSiguienteEstado} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"><ArrowRightIcon className="h-5 w-5" /> PASAR A REVISIÓN</button></div> :
                            <div className="flex justify-center mt-4"><button onClick={() => { const faltantes = getFaltantesMessage(); toast.error(`❌ No se puede pasar a revisión.\n${faltantes}`) }} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2 cursor-not-allowed"><ArrowRightIcon className="h-5 w-5" /> PASAR A REVISIÓN (Completa los items faltantes)</button></div>
                        }
                    </>
                )}

                {/* PENDIENTE APROBACIÓN - Botones de pruebas */}
                {estadoMostrar === 'pendiente_aprobacion' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <button onClick={() => setShowPruebasFuncionalesModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"><ClipboardDocumentListIcon className="h-6 w-6" /> PRUEBAS FUNCIONALES</button>
                            <button onClick={() => setShowPruebasPreAperturaModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"><DocumentCheckIcon className="h-6 w-6" /> PRUEBAS PRE-APERTURA</button>
                            <button onClick={() => setShowAprobacionContabilidadModal(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"><DocumentTextIcon className="h-6 w-6" /> APROBACIÓN CONTABILIDAD</button>
                        </div>
                        {verificarRevisionCompleta() ?
                            <div className="flex justify-center mt-4"><button onClick={handleSiguienteEstado} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"><ArrowRightIcon className="h-5 w-5" /> PASAR A APERTURA</button></div> :
                            <div className="flex justify-center mt-4"><button onClick={() => { const pruebasFaltantes = pruebas.filter(p => !p.check).map(p => p.nombre); toast.error(`❌ No se puede pasar a apertura. Faltan las siguientes pruebas: ${pruebasFaltantes.join(', ')}`) }} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2 cursor-not-allowed"><ArrowRightIcon className="h-5 w-5" /> PASAR A APERTURA (Completa las pruebas)</button></div>
                        }
                    </>
                )}

                {/* INSTALACIÓN */}
                {estadoMostrar === 'instalacion' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <button onClick={() => setShowInstalacionModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg">
                                <WrenchIcon className="h-6 w-6" /> INSTALACIÓN
                            </button>
                        </div>
                        {verificarInstalacionCompleta() ? (
                            <div className="flex justify-center mt-4">
                                <button onClick={handleSiguienteEstado} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                                    <ArrowRightIcon className="h-5 w-5" /> INICIAR APERTURA
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-center mt-4">
                                <button className="bg-gray-400 cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2">
                                    <ArrowRightIcon className="h-5 w-5" /> INICIAR APERTURA (Completa instalación)
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* APERTURA - Botones de Instalación y Seguimiento */}
                {estadoMostrar === 'apertura' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowInstalacionModal(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"
                            >
                                <WrenchIcon className="h-6 w-6" /> INSTALACIÓN
                            </button>
                            <button
                                onClick={() => setShowChatModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transform hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"
                            >
                                <ChatBubbleLeftIcon className="h-6 w-6" /> SEGUIMIENTO APERTURA
                            </button>
                        </div>

                        {verificarInstalacionCompleta() ? (
                            <div className="flex justify-center mt-4">
                                <button onClick={handleFinalizarApertura} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                                    <CheckCircleIcon className="h-5 w-5" /> FINALIZAR APERTURA
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-center mt-4">
                                <button className="bg-gray-400 cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2">
                                    <CheckCircleIcon className="h-5 w-5" /> FINALIZAR APERTURA (Completa instalación)
                                </button>
                            </div>
                        )}

                        {/* Subir imagen de apertura */}
                        {!imagenApertura && (
                            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">Adjunta la imagen de la apertura antes de finalizar</p>
                                <input type="file" id="imagen-apertura" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleSubirArchivo('apertura_imagen', '', null, e.target.files[0]) }} />
                                <label htmlFor="imagen-apertura" className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg cursor-pointer hover:bg-yellow-700">
                                    <PhotoIcon className="h-5 w-5" /> Subir Imagen de Apertura
                                </label>
                            </div>
                        )}
                        {imagenApertura && (
                            <div className="mt-4 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2">
                                <PhotoIcon className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-green-700 dark:text-green-300">Imagen de apertura: {imagenApertura.nombre}</span>
                                <a href={imagenApertura.url} download className="text-kfc-red hover:underline ml-auto text-sm">Descargar</a>
                            </div>
                        )}
                    </>
                )}

                {/* COMPLETADO */}
                {estadoMostrar === 'completado' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                Proceso Completado
                                <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">Finalizado</span>
                            </h3>
                            <button onClick={cargarResumenFinal} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                                <ChartBarIcon className="h-4 w-4" /> VER RESUMEN
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== MODAL CHAT DE SEGUIMIENTO DE APERTURA ===== */}
                {showChatModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <ChatBubbleLeftIcon className="h-6 w-6 text-kfc-red" />
                                        Seguimiento de Apertura - {tienda.nombre}
                                        {aperturaFinalizada && <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">Finalizado</span>}
                                    </h3>
                                    <button onClick={() => setShowChatModal(false)} className="text-gray-500 hover:text-gray-700">
                                        <XCircleIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3 mb-4">
                                    {mensajesApertura.map((mensaje) => (
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

                                {!aperturaFinalizada && (
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
                                                onKeyPress={(e) => e.key === 'Enter' && handleEnviarMensajeApertura()}
                                            />
                                            <button onClick={handleEnviarMensajeApertura} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700">
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
                                {!aperturaFinalizada && estadoMostrar === 'apertura' && (
                                    <button
                                        onClick={handleFinalizarApertura}
                                        disabled={!verificarInstalacionCompleta() || !imagenApertura}
                                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                                            verificarInstalacionCompleta() && imagenApertura
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-gray-400 text-white cursor-not-allowed'
                                        }`}
                                    >
                                        <CheckCircleIcon className="h-4 w-4" /> FINALIZAR APERTURA
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== MODAL PRUEBAS FUNCIONALES - VERSIÓN MEJORADA CON CHECKLIST DETALLADO ===== */}
                {showPruebasFuncionalesModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <ClipboardDocumentListIcon className="h-6 w-6 text-kfc-red" />
                                        Pruebas Funcionales - {tienda?.nombre}
                                    </h3>
                                    <button onClick={() => setShowPruebasFuncionalesModal(false)} className="text-gray-500 hover:text-gray-700">
                                        <XCircleIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 max-h-[70vh] overflow-y-auto">
                                {cargandoEstaciones ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kfc-red mx-auto mb-2"></div>
                                        <p>Cargando estaciones...</p>
                                    </div>
                                ) : pruebasEstaciones.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No hay estaciones configuradas para esta tienda</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Barra de progreso general */}
                                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium">Progreso General</span>
                                                <span className="text-sm font-bold text-kfc-red">
                                                    {pruebasEstaciones.filter(e => e.completado).length}/{pruebasEstaciones.length} estaciones
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-300 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${(pruebasEstaciones.filter(e => e.completado).length / pruebasEstaciones.length) * 100}%` }}
                                                />
                                            </div>
                                            {pruebasEstacionesGuardadas && (
                                                <div className="mt-3 text-center text-green-600 text-sm flex items-center justify-center gap-2">
                                                    <CheckCircleIcon className="h-5 w-5" />
                                                    Todas las pruebas completadas exitosamente
                                                </div>
                                            )}
                                        </div>

                                        {/* Lista de estaciones con sus checklists */}
                                        {pruebasEstaciones.map((estacion) => (
                                            <div key={estacion.id} className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 ${estacion.completado ? 'border-green-500' : 'border-gray-300'}`}>
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                                        {estacion.nombre}
                                                        <span className="ml-2 text-xs text-gray-500">({estacion.tipo})</span>
                                                    </h4>
                                                    {estacion.completado && (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs flex items-center gap-1">
                                                            <CheckCircleIcon className="h-3 w-3" /> Completado
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {estacion.items.map((item) => (
                                                        <label key={item.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.check}
                                                                onChange={(e) => actualizarItemPrueba(estacion.id, item.id, e.target.checked)}
                                                                className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                                            />
                                                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.nombre}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 p-4 pt-0 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                                <button onClick={() => setShowPruebasFuncionalesModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 font-medium">
                                    Cancelar
                                </button>
                                <button onClick={guardarPruebasFuncionales} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-medium">
                                    Guardar Pruebas
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== MODALES EXISTENTES (CONTINUACIÓN) ===== */}
                {/* MODAL PRUEBAS PRE-APERTURA */}
                {showPruebasPreAperturaModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <DocumentCheckIcon className="h-6 w-6 text-kfc-red" />
                                        Pruebas Pre-Apertura - {tienda.nombre}
                                    </h3>
                                    <button onClick={() => setShowPruebasPreAperturaModal(false)} className="text-gray-500 hover:text-gray-700"><XCircleIcon className="h-6 w-6" /></button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className={`rounded-lg p-3 ${preAperturaCompletada ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Progreso Pre-Apertura:</span>
                                        <span className={`text-sm font-bold ${preAperturaCompletada ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {preAperturaCompletada ? '✅ COMPLETADO' : '⏳ PENDIENTE'}
                                        </span>
                                    </div>
                                    <div className="mt-2 h-2 bg-gray-300 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${preAperturaCompletada ? 'bg-green-500' : 'bg-yellow-500'}`}
                                            style={{ width: `${((preAperturaEfectivoCompletado ? 1 : 0) + (preAperturaTarjetaCompletado ? 1 : 0)) * 50}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                                        <span className={preAperturaEfectivoCompletado ? 'text-green-600' : ''}>
                                            {preAperturaEfectivoCompletado ? '✓' : '○'} Factura Efectivo
                                        </span>
                                        <span className={preAperturaTarjetaCompletado ? 'text-green-600' : ''}>
                                            {preAperturaTarjetaCompletado ? '✓' : '○'} Factura Tarjeta
                                        </span>
                                    </div>
                                </div>

                                <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 ${preAperturaEfectivoCompletado ? 'border-l-4 border-green-500' : ''}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Facturación Efectivo</h4>
                                        {preAperturaEfectivoCompletado && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs flex items-center gap-1"><CheckCircleIcon className="h-3 w-3" /> Completado</span>}
                                    </div>
                                    {facturaEfectivoUrl && (
                                        <div className="mb-3 p-2 bg-green-50 rounded-lg">
                                            <a href={facturaEfectivoUrl} download className="text-kfc-red hover:underline flex items-center gap-1">
                                                <PaperClipIcon className="h-4 w-4" /> Ver factura subida
                                            </a>
                                        </div>
                                    )}
                                    {observacionesEfectivoLista.length > 0 && (
                                        <div className="mb-3 space-y-2">
                                            <p className="text-sm font-medium">Observaciones:</p>
                                            {observacionesEfectivoLista.map((obs, idx) => (
                                                <div key={idx} className="bg-white dark:bg-gray-600 rounded-lg p-2 text-sm">
                                                    <p>{obs.texto}</p>
                                                    <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {!preAperturaEfectivoCompletado && (
                                        <>
                                            <div className="flex gap-3 mb-3">
                                                <input type="file" id="factura-efectivo" className="hidden" accept="image/*,.pdf" onChange={(e) => setFacturaEfectivoArchivo(e.target.files?.[0] || null)} />
                                                <button onClick={() => document.getElementById('factura-efectivo')?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                                    <PaperClipIcon className="h-5 w-5" /> Subir factura
                                                </button>
                                                {facturaEfectivoArchivo && <button onClick={handleUploadFacturaEfectivo} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Subir archivo</button>}
                                            </div>
                                            {facturaEfectivoArchivo && <p className="text-sm text-gray-500 mb-3">Archivo seleccionado: {facturaEfectivoArchivo.name}</p>}
                                            <textarea
                                                value={observacionEfectivo}
                                                onChange={(e) => setObservacionEfectivo(e.target.value)}
                                                placeholder="Escribe una observación (opcional)..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-1 focus:ring-kfc-red outline-none"
                                                rows={2}
                                            />
                                            <button onClick={() => handleEnviarObservacionPreApertura('efectivo')} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enviar Observación</button>
                                        </>
                                    )}
                                </div>

                                <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 ${preAperturaTarjetaCompletado ? 'border-l-4 border-green-500' : ''}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Facturación Tarjeta</h4>
                                        {preAperturaTarjetaCompletado && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs flex items-center gap-1"><CheckCircleIcon className="h-3 w-3" /> Completado</span>}
                                    </div>
                                    {facturaTarjetaUrl && (
                                        <div className="mb-3 p-2 bg-green-50 rounded-lg">
                                            <a href={facturaTarjetaUrl} download className="text-kfc-red hover:underline flex items-center gap-1">
                                                <PaperClipIcon className="h-4 w-4" /> Ver factura subida
                                            </a>
                                        </div>
                                    )}
                                    {observacionesTarjetaLista.length > 0 && (
                                        <div className="mb-3 space-y-2">
                                            <p className="text-sm font-medium">Observaciones:</p>
                                            {observacionesTarjetaLista.map((obs, idx) => (
                                                <div key={idx} className="bg-white dark:bg-gray-600 rounded-lg p-2 text-sm">
                                                    <p>{obs.texto}</p>
                                                    <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {!preAperturaTarjetaCompletado && (
                                        <>
                                            <div className="flex gap-3 mb-3">
                                                <input type="file" id="factura-tarjeta" className="hidden" accept="image/*,.pdf" onChange={(e) => setFacturaTarjetaArchivo(e.target.files?.[0] || null)} />
                                                <button onClick={() => document.getElementById('factura-tarjeta')?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                                    <PaperClipIcon className="h-5 w-5" /> Subir factura
                                                </button>
                                                {facturaTarjetaArchivo && <button onClick={handleUploadFacturaTarjeta} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Subir archivo</button>}
                                            </div>
                                            {facturaTarjetaArchivo && <p className="text-sm text-gray-500 mb-3">Archivo seleccionado: {facturaTarjetaArchivo.name}</p>}
                                            <textarea
                                                value={observacionTarjeta}
                                                onChange={(e) => setObservacionTarjeta(e.target.value)}
                                                placeholder="Escribe una observación (opcional)..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-1 focus:ring-kfc-red outline-none"
                                                rows={2}
                                            />
                                            <button onClick={() => handleEnviarObservacionPreApertura('tarjeta')} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enviar Observación</button>
                                        </>
                                    )}
                                </div>

                                {preAperturaCompletada && (
                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                                        <CheckCircleIcon className="h-5 w-5 text-green-600 inline mr-2" />
                                        <span className="text-green-700 dark:text-green-300">Pre-apertura completada exitosamente</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL APROBACIÓN CONTABILIDAD */}
                {showAprobacionContabilidadModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <DocumentTextIcon className="h-6 w-6 text-kfc-red" />
                                        Aprobación Contabilidad - {tienda.nombre}
                                    </h3>
                                    <button onClick={() => setShowAprobacionContabilidadModal(false)} className="text-gray-500 hover:text-gray-700"><XCircleIcon className="h-6 w-6" /></button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className={`rounded-lg p-3 ${preAperturaCompletada ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200'}`}>
                                    <div className="flex items-center gap-2">
                                        {preAperturaCompletada ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <XCircleIcon className="h-5 w-5 text-red-600" />}
                                        <span className={`text-sm font-medium ${preAperturaCompletada ? 'text-green-700' : 'text-red-700'}`}>
                                            {preAperturaCompletada ? 'Pre-apertura completada' : 'Pre-apertura pendiente - Debes subir ambas facturas primero'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <DocumentCheckIcon className="h-5 w-5 text-blue-500" />
                                        Documentos de Pre-Apertura
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                                            <div className="flex items-center gap-2"><CreditCardIcon className="h-4 w-4 text-green-600" /><span className="text-sm font-medium">Factura Efectivo:</span></div>
                                            {facturaEfectivoUrl ? <a href={facturaEfectivoUrl} download className="text-kfc-red hover:underline text-sm flex items-center gap-1"><EyeIcon className="h-4 w-4" /> Ver Documento</a> : <span className="text-gray-400 text-sm">No subido</span>}
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                                            <div className="flex items-center gap-2"><CreditCardIcon className="h-4 w-4 text-green-600" /><span className="text-sm font-medium">Factura Tarjeta:</span></div>
                                            {facturaTarjetaUrl ? <a href={facturaTarjetaUrl} download className="text-kfc-red hover:underline text-sm flex items-center gap-1"><EyeIcon className="h-4 w-4" /> Ver Documento</a> : <span className="text-gray-400 text-sm">No subido</span>}
                                        </div>
                                    </div>
                                    {(observacionesEfectivoLista.length > 0 || observacionesTarjetaLista.length > 0) && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones de Pre-Apertura:</p>
                                            {observacionesEfectivoLista.map((obs, idx) => (
                                                <div key={`efectivo-${idx}`} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-sm mb-2">
                                                    <p className="text-gray-600 dark:text-gray-300"><span className="font-medium">Efectivo:</span> {obs.texto}</p>
                                                    <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                </div>
                                            ))}
                                            {observacionesTarjetaLista.map((obs, idx) => (
                                                <div key={`tarjeta-${idx}`} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-sm mb-2">
                                                    <p className="text-gray-600 dark:text-gray-300"><span className="font-medium">Tarjeta:</span> {obs.texto}</p>
                                                    <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-yellow-500">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <DocumentTextIcon className="h-5 w-5 text-yellow-500" />
                                        Documento de Facturación (Contabilidad)
                                    </h4>
                                    {documentoFacturacionUrl && (
                                        <div className="mb-3 p-2 bg-green-50 rounded-lg">
                                            <a href={documentoFacturacionUrl} download className="text-kfc-red hover:underline flex items-center gap-1">
                                                <PaperClipIcon className="h-4 w-4" /> Ver documento subido
                                            </a>
                                        </div>
                                    )}
                                    {observacionesAprobacionLista.length > 0 && (
                                        <div className="mb-3 space-y-2">
                                            <p className="text-sm font-medium">Observaciones de Contabilidad:</p>
                                            {observacionesAprobacionLista.map((obs, idx) => (
                                                <div key={idx} className="bg-white dark:bg-gray-600 rounded-lg p-2 text-sm">
                                                    <p>{obs.texto}</p>
                                                    <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-3 mb-3">
                                        <input type="file" id="documento-facturacion" className="hidden" accept="image/*,.pdf" onChange={(e) => setDocumentoFacturacionArchivo(e.target.files?.[0] || null)} />
                                        <button onClick={() => document.getElementById('documento-facturacion')?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                            <PaperClipIcon className="h-5 w-5" /> Adjuntar documento
                                        </button>
                                        {documentoFacturacionArchivo && <button onClick={handleUploadDocumentoFacturacion} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Subir archivo</button>}
                                    </div>
                                    {documentoFacturacionArchivo && <p className="text-sm text-gray-500 mb-3">Archivo seleccionado: {documentoFacturacionArchivo.name}</p>}
                                    <textarea
                                        value={observacionAprobacion}
                                        onChange={(e) => setObservacionAprobacion(e.target.value)}
                                        placeholder="Escribe una observación (opcional)..."
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-1 focus:ring-kfc-red outline-none"
                                        rows={2}
                                    />
                                    <button onClick={handleEnviarObservacionAprobacion} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enviar Observación</button>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="revisado"
                                        checked={aprobacionRevisado}
                                        onChange={(e) => handleSetRevisado(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <label htmlFor="revisado" className="text-sm font-medium text-gray-700 dark:text-gray-300">He revisado todos los documentos y están correctos</label>
                                </div>

                                <button
                                    onClick={handleAprobarFacturacion}
                                    disabled={!preAperturaCompletada || !aprobacionRevisado || aprobando}
                                    className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold ${
                                        preAperturaCompletada && aprobacionRevisado && !aprobando
                                            ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                                            : 'bg-gray-400 cursor-not-allowed text-white'
                                    }`}
                                >
                                    {aprobando ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="h-5 w-5" />
                                            Aprobar Facturación
                                        </>
                                    )}
                                </button>
                                {!preAperturaCompletada && <p className="text-xs text-red-500 text-center">⚠️ Debes completar las pruebas de pre-apertura primero</p>}
                                {preAperturaCompletada && !aprobacionRevisado && <p className="text-xs text-yellow-500 text-center">⚠️ Debes marcar como revisado para aprobar</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL RESUMEN FINAL */}
                {showResumenModal && resumenData && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <ChartBarIcon className="h-6 w-6 text-kfc-red" />
                                        Informe Final de Apertura - {resumenData.tienda?.codigo} {resumenData.tienda?.nombre}
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => generarInformeWord(resumenData, tienda)}
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
                                        <div><span className="font-medium">Tienda:</span> {resumenData.tienda?.codigo} - {resumenData.tienda?.nombre}</div>
                                        <div><span className="font-medium">Cadena:</span> {resumenData.tienda?.cadena}</div>
                                        <div><span className="font-medium">Dirección:</span> {resumenData.tienda?.direccion?.callePrincipal || 'No registrada'}</div>
                                        <div><span className="font-medium">Ciudad:</span> {resumenData.tienda?.direccion?.ciudad || 'No registrada'}</div>
                                        <div><span className="font-medium">Fecha Planificada:</span> {resumenData.tienda?.fechaAperturaPlanificada ? format(new Date(resumenData.tienda.fechaAperturaPlanificada), 'dd/MM/yyyy') : 'No definida'}</div>
                                        <div><span className="font-medium">Fecha Real Apertura:</span> {resumenData.fechas?.fin ? format(new Date(resumenData.fechas.fin), 'dd/MM/yyyy HH:mm') : 'No registrada'}</div>
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
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Fecha Finalización</p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {resumenData.fechas?.fin ? format(new Date(resumenData.fechas.fin), 'dd/MM/yyyy HH:mm') : '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Tiempo por Etapa */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Tiempo por Etapa</h4>
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
                                                    <p className="text-gray-700 dark:text-gray-300">{obs.observacion}</p>
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
                                                    <p className="text-gray-700 dark:text-gray-300">{obs.observacion}</p>
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

                                {/* Imagen de Apertura */}
                                {resumenData.imagenApertura && (
                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <PhotoIcon className="h-5 w-5 text-green-600" />
                                            Evidencia Fotográfica - Apertura
                                        </h4>
                                        <div className="flex justify-center">
                                            <img
                                                src={resumenData.imagenApertura}
                                                alt="Evidencia de apertura"
                                                className="max-w-full max-h-64 rounded-lg shadow-md cursor-pointer"
                                                onClick={() => window.open(resumenData.imagenApertura, '_blank')}
                                            />
                                        </div>
                                        <div className="flex justify-center mt-2">
                                            <a href={resumenData.imagenApertura} download className="text-kfc-red hover:underline text-sm">Descargar imagen</a>
                                        </div>
                                    </div>
                                )}

                                {/* Resumen del Chat */}
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
                                    onClick={() => generarInformeWord(resumenData, tienda)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <DocumentTextIcon className="h-5 w-5" />
                                    Descargar Informe Técnico
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL MKT-Contabilidad */}
                {showMKTContabilidadModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <DocumentTextIcon className="h-6 w-6 text-kfc-red" />
                                        MKT-Contabilidad - {tienda.codigo}
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
                                                    const nuevo = { ...mktContabilidad, deUna: { ...mktContabilidad.deUna, check: e.target.checked } };
                                                    setMktContabilidad(nuevo);
                                                    localStorage.setItem(`mktContabilidad_${id}`, JSON.stringify(nuevo));
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                            />
                                            <span className="text-sm">Configuración DE-UNA completada</span>
                                        </label>

                                        {mktContabilidad.deUna.observaciones && mktContabilidad.deUna.observaciones.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones:</p>
                                                {mktContabilidad.deUna.observaciones.map((obs, idx) => (
                                                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-sm">
                                                        <p className="text-gray-600 dark:text-gray-300">{obs.texto}</p>
                                                        <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {obs.fecha ? format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm') : new Date().toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {mktContabilidad.deUna.archivos && mktContabilidad.deUna.archivos.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Archivos adjuntos:</p>
                                                {mktContabilidad.deUna.archivos.map((arch, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-lg">
                                                        <span className="text-sm">{arch.nombre}</span>
                                                        <a href={arch.url} download className="text-kfc-red hover:underline text-sm flex items-center gap-1">
                                                            <PaperClipIcon className="h-4 w-4" /> Descargar
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <input type="file" id="deuna-file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    handleSubirArchivoMKT('deUna', e.target.files[0]);
                                                }
                                            }} />
                                            <button onClick={() => document.getElementById('deuna-file')?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                                                <PaperClipIcon className="h-4 w-4" /> Adjuntar documento
                                            </button>
                                        </div>

                                        <div>
                                            <textarea
                                                value={observacionDeUna}
                                                onChange={(e) => setObservacionDeUna(e.target.value)}
                                                placeholder="Escribe una observación..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                                rows={2}
                                            />
                                            <button
                                                onClick={() => handleAgregarObservacionMKT('deUna')}
                                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                Enviar Observación
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
                                                    const nuevo = { ...mktContabilidad, puntosEmisionCodigos: { ...mktContabilidad.puntosEmisionCodigos, check: e.target.checked } };
                                                    setMktContabilidad(nuevo);
                                                    localStorage.setItem(`mktContabilidad_${id}`, JSON.stringify(nuevo));
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                            />
                                            <span className="text-sm">Configuración completada</span>
                                        </label>

                                        {mktContabilidad.puntosEmisionCodigos.observaciones && mktContabilidad.puntosEmisionCodigos.observaciones.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones:</p>
                                                {mktContabilidad.puntosEmisionCodigos.observaciones.map((obs, idx) => (
                                                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-sm">
                                                        <p className="text-gray-600 dark:text-gray-300">{obs.texto}</p>
                                                        <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {obs.fecha ? format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm') : new Date().toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {mktContabilidad.puntosEmisionCodigos.archivos && mktContabilidad.puntosEmisionCodigos.archivos.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Archivos adjuntos:</p>
                                                {mktContabilidad.puntosEmisionCodigos.archivos.map((arch, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-lg">
                                                        <span className="text-sm">{arch.nombre}</span>
                                                        <a href={arch.url} download className="text-kfc-red hover:underline text-sm flex items-center gap-1">
                                                            <PaperClipIcon className="h-4 w-4" /> Descargar
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <input type="file" id="puntos-file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    handleSubirArchivoMKT('puntosEmision', e.target.files[0]);
                                                }
                                            }} />
                                            <button onClick={() => document.getElementById('puntos-file')?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                                                <PaperClipIcon className="h-4 w-4" /> Adjuntar documento
                                            </button>
                                        </div>

                                        <div>
                                            <textarea
                                                value={observacionPuntosEmision}
                                                onChange={(e) => setObservacionPuntosEmision(e.target.value)}
                                                placeholder="Escribe una observación..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                                rows={2}
                                            />
                                            <button
                                                onClick={() => handleAgregarObservacionMKT('puntosEmision')}
                                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                Enviar Observación
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                                <button onClick={() => setShowMKTContabilidadModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancelar</button>
                                <button onClick={handleGuardarMKTContabilidad} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-medium">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL Infraestructura */}
                {showInfraestructuraModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full my-8 mx-4 shadow-xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BoltIcon className="h-6 w-6 text-kfc-red" />
                                        Infraestructura - {tienda.codigo}
                                    </h3>
                                    <button onClick={() => setShowInfraestructuraModal(false)} className="text-gray-500 hover:text-gray-700"><XCircleIcon className="h-6 w-6" /></button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                {/* Enlace Principal */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <SignalIcon className="h-5 w-5 text-blue-500" />
                                        Enlace Principal
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                                            <input type="checkbox" checked={infraestructura.enlacePrincipal.check} onChange={(e) => {
                                                const nuevo = { ...infraestructura, enlacePrincipal: { ...infraestructura.enlacePrincipal, check: e.target.checked } };
                                                setInfraestructura(nuevo);
                                                localStorage.setItem(`infraestructura_${id}`, JSON.stringify(nuevo));
                                            }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" />
                                            <span className="text-sm">Enlace principal configurado</span>
                                        </label>

                                        {infraestructura.enlacePrincipal.observaciones && infraestructura.enlacePrincipal.observaciones.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones:</p>
                                                {infraestructura.enlacePrincipal.observaciones.map((obs, idx) => (
                                                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-sm">
                                                        <p className="text-gray-600 dark:text-gray-300">{obs.texto}</p>
                                                        <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {infraestructura.enlacePrincipal.archivos && infraestructura.enlacePrincipal.archivos.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Archivos adjuntos:</p>
                                                {infraestructura.enlacePrincipal.archivos.map((arch, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-lg">
                                                        <span className="text-sm">{arch.nombre}</span>
                                                        <a href={arch.url} download className="text-kfc-red hover:underline text-sm flex items-center gap-1">
                                                            <PaperClipIcon className="h-4 w-4" /> Descargar
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <input type="file" id="enlace-file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    handleSubirArchivoInfraestructura('enlacePrincipal', e.target.files[0]);
                                                }
                                            }} />
                                            <button onClick={() => document.getElementById('enlace-file')?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                                                <PaperClipIcon className="h-4 w-4" /> Adjuntar documento
                                            </button>
                                        </div>

                                        <div>
                                            <textarea
                                                value={observacionEnlacePrincipal}
                                                onChange={(e) => setObservacionEnlacePrincipal(e.target.value)}
                                                placeholder="Escribe una observación..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                                rows={2}
                                            />
                                            <button
                                                onClick={() => handleAgregarObservacionInfraestructura('enlacePrincipal')}
                                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                Enviar Observación
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Energía Eléctrica */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-yellow-500">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <BoltIcon className="h-5 w-5 text-yellow-500" />
                                        Energía Eléctrica
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                                            <input type="checkbox" checked={infraestructura.energiaElectrica.check} onChange={(e) => {
                                                const nuevo = { ...infraestructura, energiaElectrica: { ...infraestructura.energiaElectrica, check: e.target.checked } };
                                                setInfraestructura(nuevo);
                                                localStorage.setItem(`infraestructura_${id}`, JSON.stringify(nuevo));
                                            }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" />
                                            <span className="text-sm">Energía eléctrica verificada</span>
                                        </label>

                                        {infraestructura.energiaElectrica.observaciones && infraestructura.energiaElectrica.observaciones.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones:</p>
                                                {infraestructura.energiaElectrica.observaciones.map((obs, idx) => (
                                                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-sm">
                                                        <p className="text-gray-600 dark:text-gray-300">{obs.texto}</p>
                                                        <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {infraestructura.energiaElectrica.archivos && infraestructura.energiaElectrica.archivos.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Archivos adjuntos:</p>
                                                {infraestructura.energiaElectrica.archivos.map((arch, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-lg">
                                                        <span className="text-sm">{arch.nombre}</span>
                                                        <a href={arch.url} download className="text-kfc-red hover:underline text-sm flex items-center gap-1">
                                                            <PaperClipIcon className="h-4 w-4" /> Descargar
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <input type="file" id="energia-file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    handleSubirArchivoInfraestructura('energiaElectrica', e.target.files[0]);
                                                }
                                            }} />
                                            <button onClick={() => document.getElementById('energia-file')?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                                                <PaperClipIcon className="h-4 w-4" /> Adjuntar documento
                                            </button>
                                        </div>

                                        <div>
                                            <textarea
                                                value={observacionEnergiaElectrica}
                                                onChange={(e) => setObservacionEnergiaElectrica(e.target.value)}
                                                placeholder="Escribe una observación..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                                rows={2}
                                            />
                                            <button
                                                onClick={() => handleAgregarObservacionInfraestructura('energiaElectrica')}
                                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                Enviar Observación
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Servidor */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-purple-500">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <ServerIcon className="h-5 w-5 text-purple-500" />
                                        Servidor - Formateo y Carga de SO
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                                            <input type="checkbox" checked={infraestructura.servidor.check} onChange={(e) => {
                                                const nuevo = { ...infraestructura, servidor: { ...infraestructura.servidor, check: e.target.checked } };
                                                setInfraestructura(nuevo);
                                                localStorage.setItem(`infraestructura_${id}`, JSON.stringify(nuevo));
                                            }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" />
                                            <span className="text-sm font-medium">Formateo y carga de SO en Servidor</span>
                                        </label>

                                        {infraestructura.servidor.observaciones && infraestructura.servidor.observaciones.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones:</p>
                                                {infraestructura.servidor.observaciones.map((obs, idx) => (
                                                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-sm">
                                                        <p className="text-gray-600 dark:text-gray-300">{obs.texto}</p>
                                                        <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {infraestructura.servidor.archivos && infraestructura.servidor.archivos.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Archivos adjuntos:</p>
                                                {infraestructura.servidor.archivos.map((arch, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-lg">
                                                        <span className="text-sm">{arch.nombre}</span>
                                                        <a href={arch.url} download className="text-kfc-red hover:underline text-sm flex items-center gap-1">
                                                            <PaperClipIcon className="h-4 w-4" /> Descargar
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <input type="file" id="servidor-file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    handleSubirArchivoInfraestructura('servidor', e.target.files[0]);
                                                }
                                            }} />
                                            <button onClick={() => document.getElementById('servidor-file')?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                                                <PaperClipIcon className="h-4 w-4" /> Adjuntar documento
                                            </button>
                                        </div>

                                        <div>
                                            <textarea
                                                value={observacionServidor}
                                                onChange={(e) => setObservacionServidor(e.target.value)}
                                                placeholder="Escribe una observación..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                                rows={2}
                                            />
                                            <button
                                                onClick={() => handleAgregarObservacionInfraestructura('servidor')}
                                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                Enviar Observación
                                            </button>
                                        </div>

                                        {infraestructura.servidor.check && (
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                    <label className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={infraestructura.servidor.replicaInicial}
                                                            onChange={(e) => {
                                                                const nuevo = { ...infraestructura, servidor: { ...infraestructura.servidor, replicaInicial: e.target.checked } };
                                                                setInfraestructura(nuevo);
                                                                localStorage.setItem(`infraestructura_${id}`, JSON.stringify(nuevo));
                                                            }}
                                                            className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                                        />
                                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">✅ RÉPLICA INICIAL completada</span>
                                                    </label>
                                                </div>

                                                {infraestructura.servidor.observacionesReplica && infraestructura.servidor.observacionesReplica.length > 0 && (
                                                    <div className="mt-3 space-y-2">
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones de Réplica Inicial:</p>
                                                        {infraestructura.servidor.observacionesReplica.map((obs, idx) => (
                                                            <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-sm">
                                                                <p className="text-gray-600 dark:text-gray-300">{obs.texto}</p>
                                                                <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="mt-3">
                                                    <textarea
                                                        value={observacionReplicaInicial}
                                                        onChange={(e) => setObservacionReplicaInicial(e.target.value)}
                                                        placeholder="Observaciones sobre la Réplica Inicial..."
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                                        rows={2}
                                                    />
                                                    <button
                                                        onClick={handleAgregarObservacionReplicaInicial}
                                                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                                    >
                                                        Enviar Observación Réplica Inicial
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cajas */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-green-500">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <CubeIcon className="h-5 w-5 text-green-500" />
                                        Cajas - Formateo y Carga de SO
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                                            <input type="checkbox" checked={infraestructura.cajas.check} onChange={(e) => {
                                                const nuevo = { ...infraestructura, cajas: { ...infraestructura.cajas, check: e.target.checked } };
                                                setInfraestructura(nuevo);
                                                localStorage.setItem(`infraestructura_${id}`, JSON.stringify(nuevo));
                                            }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" />
                                            <span className="text-sm font-medium">Formateo y carga de SO en Cajas</span>
                                        </label>

                                        {infraestructura.cajas.observaciones && infraestructura.cajas.observaciones.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones:</p>
                                                {infraestructura.cajas.observaciones.map((obs, idx) => (
                                                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-sm">
                                                        <p className="text-gray-600 dark:text-gray-300">{obs.texto}</p>
                                                        <p className="text-xs text-gray-400 mt-1">- {obs.usuario}, {format(new Date(obs.fecha), 'dd/MM/yyyy HH:mm')}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {infraestructura.cajas.archivos && infraestructura.cajas.archivos.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Archivos adjuntos:</p>
                                                {infraestructura.cajas.archivos.map((arch, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-lg">
                                                        <span className="text-sm">{arch.nombre}</span>
                                                        <a href={arch.url} download className="text-kfc-red hover:underline text-sm flex items-center gap-1">
                                                            <PaperClipIcon className="h-4 w-4" /> Descargar
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <input type="file" id="cajas-file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    handleSubirArchivoInfraestructura('cajas', e.target.files[0]);
                                                }
                                            }} />
                                            <button onClick={() => document.getElementById('cajas-file')?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                                                <PaperClipIcon className="h-4 w-4" /> Adjuntar documento
                                            </button>
                                        </div>

                                        <div>
                                            <textarea
                                                value={observacionCajas}
                                                onChange={(e) => setObservacionCajas(e.target.value)}
                                                placeholder="Escribe una observación..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700"
                                                rows={2}
                                            />
                                            <button
                                                onClick={() => handleAgregarObservacionInfraestructura('cajas')}
                                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                Enviar Observación
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                                <button onClick={() => setShowInfraestructuraModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancelar</button>
                                <button onClick={handleGuardarInfraestructura} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-medium">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL Servicios */}
                {showServiciosModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl"><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Configurar Servicios - {tienda.codigo}</h3><div className="space-y-6"><div><label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Dragon Tail</label><div className="flex gap-3"><button onClick={() => setServicios({ ...servicios, dragonTail: 'aplica' })} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${servicios.dragonTail === 'aplica' ? 'bg-kfc-red text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Aplica</button><button onClick={() => setServicios({ ...servicios, dragonTail: 'no_aplica' })} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${servicios.dragonTail === 'no_aplica' ? 'bg-gray-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'}`}>No Aplica</button></div></div><div><label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Upselling</label><div className="flex gap-3"><button onClick={() => setServicios({ ...servicios, upselling: 'aplica' })} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${servicios.upselling === 'aplica' ? 'bg-kfc-red text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Aplica</button><button onClick={() => setServicios({ ...servicios, upselling: 'no_aplica' })} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${servicios.upselling === 'no_aplica' ? 'bg-gray-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'}`}>No Aplica</button></div></div><div><label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Kioscos</label><div className="flex gap-3"><button onClick={() => setServicios({ ...servicios, kioscos: 'aplica' })} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${servicios.kioscos === 'aplica' ? 'bg-kfc-red text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Aplica</button><button onClick={() => setServicios({ ...servicios, kioscos: 'no_aplica' })} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${servicios.kioscos === 'no_aplica' ? 'bg-gray-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'}`}>No Aplica</button></div></div></div><div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"><button onClick={() => setShowServiciosModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancelar</button><button onClick={handleGuardarServicios} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-medium">Guardar</button></div></div>
                    </div>
                )}

                {/* MODAL Configuración Tienda */}
                {showConfiguracionTiendaModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" style={{ alignItems: 'flex-start' }}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full my-8 mx-4 shadow-xl"><div className="sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10"><h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><BuildingStorefrontIcon className="h-6 w-6 text-kfc-red" /> Configuración Tienda - {tienda.codigo}</h3></div><div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(100vh - 180px)' }}><div className="space-y-8"><div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"><h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><DocumentTextIcon className="h-5 w-5 text-gray-500" /> Políticas Restaurante</h4><div className="space-y-3"><label className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg"><input type="checkbox" checked={politicasRestaurante.check} onChange={(e) => { setPoliticasRestaurante(prev => ({ ...prev, check: e.target.checked })); localStorage.setItem(`politicasRestaurante_${id}`, JSON.stringify({ ...politicasRestaurante, check: e.target.checked })) }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" /><span className="text-sm">Confirmar políticas del restaurante</span></label><textarea placeholder="Observaciones" value={politicasRestaurante.observaciones} onChange={(e) => { setPoliticasRestaurante(prev => ({ ...prev, observaciones: e.target.value })); localStorage.setItem(`politicasRestaurante_${id}`, JSON.stringify({ ...politicasRestaurante, observaciones: e.target.value })) }} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700" rows={2} /></div></div>{estaciones.length > 0 && (<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"><div className="flex justify-between items-center mb-4"><h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><BuildingOfficeIcon className="h-5 w-5 text-gray-500" /> Configuración Estaciones</h4><button onClick={handleSeleccionarTodasEstaciones} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1"><CheckCircleIcon className="h-4 w-4" /> Seleccionar Todas</button></div><div className="space-y-4 max-h-96 overflow-y-auto pr-2">{estaciones.map((estacion) => (<div key={estacion.id} className="bg-white dark:bg-gray-600 rounded-lg p-3"><div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">{estacion.nombre}</span><span className="text-xs text-gray-500">{estacion.tipo}</span></div><div className="space-y-2"><label className="flex items-center gap-2"><input type="checkbox" checked={estacion.completado || false} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const nuevasEstaciones = estaciones.map(est => est.id === estacion.id ? { ...est, completado: e.target.checked } : est); setEstaciones(nuevasEstaciones); localStorage.setItem(`estaciones_${id}`, JSON.stringify(nuevasEstaciones)) }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" /><span className="text-sm">Configuración completada</span></label></div></div>))}</div></div>)}{impresoras.length > 0 && (<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"><div className="flex justify-between items-center mb-4"><h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><PrinterIcon className="h-5 w-5 text-gray-500" /> Configuración Impresiones</h4><button onClick={handleSeleccionarTodasImpresoras} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1"><CheckCircleIcon className="h-4 w-4" /> Seleccionar Todas</button></div><div className="space-y-3">{impresoras.map((impresora) => (<div key={impresora.id} className="bg-white dark:bg-gray-600 rounded-lg p-3"><div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">{impresora.nombre}</span><span className="text-xs text-gray-500">{impresora.tipo}</span></div><div className="flex items-center gap-3"><label className="flex items-center gap-2"><input type="checkbox" checked={impresora.completado} onChange={(e) => { const nuevasImpresoras = impresoras.map(imp => imp.id === impresora.id ? { ...imp, completado: e.target.checked } : imp); setImpresoras(nuevasImpresoras); localStorage.setItem(`impresoras_${id}`, JSON.stringify(nuevasImpresoras)) }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" /><span className="text-sm">Configuración completada</span></label></div></div>))}</div></div>)}{usuarios.filter(u => u.activo).length > 0 && (<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"><div className="flex justify-between items-center mb-4"><h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><UserCircleIcon className="h-5 w-5 text-gray-500" /> Usuarios</h4><button onClick={handleSeleccionarTodosUsuarios} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1"><CheckCircleIcon className="h-4 w-4" /> Seleccionar Todos</button></div><div className="space-y-3">{usuarios.filter(u => u.activo).map((usuario) => (<div key={usuario.id} className="bg-white dark:bg-gray-600 rounded-lg p-3"><div className="flex items-center justify-between mb-2"><div><span className="font-medium text-sm">{usuario.nombre}</span>{usuario.usuarioAsignado && <span className="text-xs text-gray-500 ml-2">({usuario.usuarioAsignado})</span>}</div><label className="flex items-center gap-2"><input type="checkbox" checked={usuario.creado} onChange={(e) => { const nuevosUsuarios = usuarios.map(u => u.id === usuario.id ? { ...u, creado: e.target.checked } : u); setUsuarios(nuevosUsuarios); localStorage.setItem(`usuarios_${id}`, JSON.stringify(nuevosUsuarios)) }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" /><span className="text-xs">Creado</span></label></div></div>))}</div></div>)}</div></div><div className="sticky bottom-0 bg-white dark:bg-gray-800 rounded-b-2xl border-t border-gray-200 dark:border-gray-700 px-6 py-4"><div className="flex justify-end gap-3"><button onClick={() => setShowConfiguracionTiendaModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancelar</button><button onClick={handleGuardarConfiguracionCompleta} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-medium">Guardar Configuración</button></div></div></div>
                    </div>
                )}

                {/* MODAL Formas de Pago */}
                {showFormasPagoModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full p-6 my-8 shadow-xl"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><CreditCardIcon className="h-6 w-6 text-kfc-red" /> Formas de Pago - {tienda.codigo}</h3>{formasPago.length > 0 && <button onClick={handleSeleccionarTodasFormasPago} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1"><CheckCircleIcon className="h-4 w-4" /> Seleccionar Todas</button>}</div><p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{cargandoFormasPago ? "Cargando formas de pago..." : formasPago.length === 0 ? "No hay formas de pago disponibles para esta cadena" : `Selecciona las formas de pago habilitadas para esta tienda (${formasPago.length} disponibles)`}</p><div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">{cargandoFormasPago ? <div className="col-span-3 text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kfc-red mx-auto mb-2"></div><p className="text-gray-500">Cargando formas de pago...</p></div> : formasPago.length === 0 ? <div className="col-span-3 text-center py-8"><p className="text-gray-500">No hay formas de pago disponibles</p><p className="text-xs text-gray-400 mt-2">Verifica que la cadena tenga formas de pago configuradas</p></div> : formasPago.map((fp, index) => (<label key={fp.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"><input type="checkbox" checked={fp.seleccionado} onChange={() => { const nuevas = [...formasPago]; nuevas[index].seleccionado = !nuevas[index].seleccionado; setFormasPago(nuevas); let cadenaIdNumerico = tienda?.cadena ? obtenerCadenaIdNumerico(tienda.cadena) : null; if (!cadenaIdNumerico && tienda?.cadena?.toString().toUpperCase().includes('ESPANOL')) cadenaIdNumerico = '8'; if (cadenaIdNumerico) localStorage.setItem(`formasPago_${id}_${cadenaIdNumerico}`, JSON.stringify(nuevas)) }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" /><span className="text-sm font-medium">{fp.nombre}</span>{fp.codigo && <span className="text-xs text-gray-400 ml-auto">({fp.codigo})</span>}</label>))}</div><div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"><button onClick={() => setShowFormasPagoModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancelar</button><button onClick={handleGuardarFormasPago} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-medium" disabled={cargandoFormasPago}>Guardar</button></div></div>
                    </div>
                )}

                {/* MODAL Despliegue Servidor */}
                {showDespliegueServidorModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full p-6 my-8"><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><ServerIcon className="h-6 w-6 text-kfc-red" /> Despliegue Servidor - {tienda.codigo}</h3><p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Marca los items que han sido completados</p><div className="space-y-3">{despliegueServidor.map((item, index) => (<div key={item.id} className={`flex items-center justify-between p-4 rounded-lg ${!item.aplica ? 'bg-gray-100 dark:bg-gray-600 opacity-50' : 'bg-gray-50 dark:bg-gray-700'}`}><div className="flex items-center gap-3">{item.id === 'usuarios' && <UserCircleIcon className="h-5 w-5 text-gray-500" />}{item.id === 'kds' && <CpuChipIcon className="h-5 w-5 text-gray-500" />}{item.id.includes('mxp') && <ServerIcon className="h-5 w-5 text-gray-500" />}{item.id === 'dragonTail' && <WalletIcon className="h-5 w-5 text-gray-500" />}{item.id === 'upselling' && <ShoppingCartIcon className="h-5 w-5 text-gray-500" />}{item.id === 'kioscos' && <ShoppingCartIcon className="h-5 w-5 text-gray-500" />}<div><span className="font-medium text-gray-900 dark:text-white">{item.nombre}</span>{!item.aplica && <p className="text-xs text-gray-500">No aplica para esta tienda</p>}</div></div>{item.aplica && <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={item.completado} onChange={() => { const nuevos = [...despliegueServidor]; nuevos[index].completado = !nuevos[index].completado; setDespliegueServidor(nuevos); localStorage.setItem(`despliegueServidor_${id}`, JSON.stringify(nuevos)) }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" /><span className="text-sm">Completado</span></label>}</div>))}</div><div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"><button onClick={() => setShowDespliegueServidorModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancelar</button><button onClick={handleGuardarDespliegueServidor} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-medium">Guardar</button></div></div>
                    </div>
                )}

                {/* MODAL Despliegue Cajas */}
                {showDespliegueCajasModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full p-6 my-8"><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CubeIcon className="h-6 w-6 text-kfc-red" /> Despliegue Cajas - {tienda.codigo}</h3><p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Configura los servicios por cada caja</p>{despliegueCajas.length === 0 ? <div className="text-center py-8 text-gray-500">No hay cajas configuradas para esta tienda.</div> : <div className="space-y-6"><div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"><h4 className="font-semibold text-gray-900 dark:text-white mb-4">Servicio Tarjetas</h4><div className="space-y-3">{despliegueCajas.map((caja) => (<label key={caja.cajaId} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg cursor-pointer"><input type="checkbox" checked={caja.servicioTarjetas} onChange={(e) => { const nuevas = despliegueCajas.map(c => c.cajaId === caja.cajaId ? { ...c, servicioTarjetas: e.target.checked } : c); setDespliegueCajas(nuevas); localStorage.setItem(`despliegueCajas_${id}`, JSON.stringify(nuevas)) }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" /><CreditCardIcon className="h-4 w-4 text-gray-500" /><span className="text-sm">{caja.cajaNombre}</span></label>))}</div></div><div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"><h4 className="font-semibold text-gray-900 dark:text-white mb-4">Servicio Impresión</h4><div className="space-y-3">{despliegueCajas.map((caja) => (<label key={caja.cajaId} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg cursor-pointer"><input type="checkbox" checked={caja.servicioImpresion} onChange={(e) => { const nuevas = despliegueCajas.map(c => c.cajaId === caja.cajaId ? { ...c, servicioImpresion: e.target.checked } : c); setDespliegueCajas(nuevas); localStorage.setItem(`despliegueCajas_${id}`, JSON.stringify(nuevas)) }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" /><PrinterIcon className="h-4 w-4 text-gray-500" /><span className="text-sm">{caja.cajaNombre}</span></label>))}</div></div></div>}<div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"><button onClick={() => setShowDespliegueCajasModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancelar</button><button onClick={handleGuardarDespliegueCajas} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-medium">Guardar</button></div></div>
                    </div>
                )}

                {/* MODAL Pruebas */}
                {showPruebasModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full p-6 my-8"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><DocumentCheckIcon className="h-6 w-6 text-kfc-red" /> Pruebas Funcionales - {tienda.codigo}</h3><button onClick={handleSeleccionarTodasPruebas} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1"><CheckCircleIcon className="h-4 w-4" /> Seleccionar Todas</button></div><div className="space-y-6">{pruebas.map((prueba) => (<div key={prueba.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"><h4 className="font-semibold text-gray-900 dark:text-white mb-4">{prueba.nombre}</h4><div className="space-y-3"><label className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg"><input type="checkbox" checked={prueba.check} onChange={(e) => { const nuevas = pruebas.map(p => p.id === prueba.id ? { ...p, check: e.target.checked } : p); setPruebas(nuevas); localStorage.setItem(`pruebas_${id}`, JSON.stringify(nuevas)) }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" /><span className="text-sm">Prueba completada</span></label><textarea placeholder="Novedades presentadas" value={prueba.observaciones} onChange={(e) => { const nuevas = pruebas.map(p => p.id === prueba.id ? { ...p, observaciones: e.target.value } : p); setPruebas(nuevas); localStorage.setItem(`pruebas_${id}`, JSON.stringify(nuevas)) }} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700" rows={2} /></div></div>))}</div><div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"><button onClick={() => setShowPruebasModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancelar</button><button onClick={handleGuardarPruebas} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-medium">Guardar</button></div></div>
                    </div>
                )}

                {/* MODAL Instalación */}
                {showInstalacionModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full p-6 my-8"><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><WrenchIcon className="h-6 w-6 text-kfc-red" /> Instalación - {tienda.codigo}</h3><div className="space-y-6"><div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"><h4 className="font-semibold text-gray-900 dark:text-white mb-4">Instalación de Equipos</h4><div className="space-y-3"><label className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg"><input type="checkbox" checked={instalacion.instalacionEquipos.check} onChange={(e) => { const nuevo = { ...instalacion, instalacionEquipos: { ...instalacion.instalacionEquipos, check: e.target.checked } }; setInstalacion(nuevo); localStorage.setItem(`instalacion_${id}`, JSON.stringify(nuevo)) }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" /><span className="text-sm">Instalación de equipos completada</span></label><textarea placeholder="Observaciones" value={instalacion.instalacionEquipos.observaciones} onChange={(e) => { const nuevo = { ...instalacion, instalacionEquipos: { ...instalacion.instalacionEquipos, observaciones: e.target.value } }; setInstalacion(nuevo); localStorage.setItem(`instalacion_${id}`, JSON.stringify(nuevo)) }} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700" rows={2} /></div></div><div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"><h4 className="font-semibold text-gray-900 dark:text-white mb-4">Pruebas en Local</h4><div className="space-y-3"><label className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg"><input type="checkbox" checked={instalacion.pruebasLocal.check} onChange={(e) => { const nuevo = { ...instalacion, pruebasLocal: { ...instalacion.pruebasLocal, check: e.target.checked } }; setInstalacion(nuevo); localStorage.setItem(`instalacion_${id}`, JSON.stringify(nuevo)) }} className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red" /><span className="text-sm">Pruebas en local completadas</span></label><textarea placeholder="Observaciones" value={instalacion.pruebasLocal.observaciones} onChange={(e) => { const nuevo = { ...instalacion, pruebasLocal: { ...instalacion.pruebasLocal, observaciones: e.target.value } }; setInstalacion(nuevo); localStorage.setItem(`instalacion_${id}`, JSON.stringify(nuevo)) }} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white dark:bg-gray-700" rows={2} /></div></div></div><div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"><button onClick={() => setShowInstalacionModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancelar</button><button onClick={handleGuardarInstalacion} className="px-4 py-2 bg-kfc-red text-white rounded-lg hover:bg-red-700 font-medium">Guardar</button></div></div>
                    </div>
                )}

                {/* MODAL Cambiar Estado */}
                {showEstadoModal && isMaster && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl"><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cambiar Estado Manualmente</h3><p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Estado actual: <span className="font-bold text-kfc-red">{estadoMostrar?.toUpperCase()}</span></p><div className="space-y-3 max-h-96 overflow-y-auto"><button onClick={() => handleCambiarEstadoManual('pendiente')} className="w-full py-3 px-4 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg font-medium transition-colors">📋 Pendiente</button><button onClick={() => handleCambiarEstadoManual('en_proceso')} className="w-full py-3 px-4 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-medium transition-colors">🔄 En Proceso</button><button onClick={() => handleCambiarEstadoManual('en_revision')} className="w-full py-3 px-4 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg font-medium transition-colors">👁️ En Revisión</button><button onClick={() => handleCambiarEstadoManual('pendiente_aprobacion')} className="w-full py-3 px-4 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg font-medium transition-colors">⏳ Pendiente Aprobación</button><button onClick={() => handleCambiarEstadoManual('instalacion')} className="w-full py-3 px-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg font-medium transition-colors">🔧 Instalación</button><button onClick={() => handleCambiarEstadoManual('apertura')} className="w-full py-3 px-4 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg font-medium transition-colors">🚀 Apertura</button><button onClick={() => handleCambiarEstadoManual('completado')} className="w-full py-3 px-4 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-medium transition-colors">✅ Completado</button><button onClick={() => handleCambiarEstadoManual('cancelado')} className="w-full py-3 px-4 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors">❌ Cancelado</button></div><div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"><button onClick={() => setShowEstadoModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">Cancelar</button></div></div>
                    </div>
                )}

                {/* MODAL REASIGNAR TÉCNICO CX */}
                {showReasignarTecnicoModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <UserIcon className="h-6 w-6 text-kfc-red" />
                                    Reasignar Técnico CX
                                </h3>
                                <button onClick={() => setShowReasignarTecnicoModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <XCircleIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Técnico actual: <span className="font-semibold">{getNombreTecnicoActual()}</span>
                            </p>
                            <div className="space-y-3">
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none"
                                    defaultValue=""
                                    onChange={(e) => e.target.value && handleReasignarTecnico(e.target.value)}
                                    disabled={reasignandoTecnico}
                                >
                                    <option value="">Seleccionar nuevo técnico CX</option>
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
            </div>
        </Layout>
    )
}

export default TiendaDetalle