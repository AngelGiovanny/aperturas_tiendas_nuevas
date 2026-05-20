// frontend-web/src/types/index.ts
// ============= USUARIOS =============

export interface User {
    _id: string
    nombre: string
    apellido?: string
    email: string
    role: 'admin' | 'admin_master' | 'contabilidad' | 'operaciones' | 'it' | 'dsi' | 'cx' | 'trade' | 'marketing' | 'mesa_servicio' | 'aperturas' | 'campo' | 'tecnico' | 'instalador' | 'soporte'
    area: string
    telefono: string
    activo: boolean
    ultimoAcceso?: string
    createdAt?: string
    token?: string
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterData {
    nombre: string
    email: string
    password: string
    role: string
    area: string
    telefono: string
}

// ============= ARCHIVOS ADJUNTOS =============
export interface ArchivoAdjunto {
    id: string
    nombre: string
    url: string
    tamaño: number
    tipo: string
    fechaSubida: string
    categoria?: string
}

// ============= TIENDAS =============
export interface Direccion {
    calle: string
    ciudad: string
    provincia: string
    codigoPostal?: string
    referencia?: string
}

export interface PuntoEmision {
    _id?: string
    nombre: string
    codigo: string
    tipo: 'caja' | 'drive' | 'kiosco' | 'pickup' | 'domicilio' | 'tablet'
    impresora?: string
    ip?: string
    tid?: string
    activo: boolean
}

export interface Responsable {
    _id: string
    nombre: string
    apellido?: string
    email: string
}

export interface ConfiguracionEstaciones {
    cajas?: {
        activo: boolean
        items?: Array<{
            id: string
            nombre: string
            seleccionado: boolean
            descripcion?: string
        }>
    }
    kioscos?: {
        activo: boolean
        items?: Array<{
            id: string
            nombre: string
            seleccionado: boolean
        }>
    }
    delivery?: {
        activo: boolean
        agregadores?: boolean
        canalPropio?: boolean
    }
    pickUp?: boolean
    pickup?: boolean
    drive?: {
        activo: boolean
        items?: Array<{
            id: string
            nombre: string
            seleccionado: boolean
        }>
    }
    heladeria?: {
        activo: boolean
        items?: Array<any>
    }
    meseros?: {
        activo: boolean
        items?: Array<{
            id: string
            nombre: string
            seleccionado: boolean
        }>
    }
    impresoraLinea?: boolean
    impresoraLineaDomi?: boolean
    impresoraBar?: boolean
    impresoraCocina?: boolean
    impresoraParrilla?: boolean
    impresoraPersonalizada?: boolean
    impresoraPersonalizadaNombre?: string
    kdsItems?: {
        kds1: boolean
        kds2: boolean
        kds3: boolean
        kdsPersonalizado: boolean
        kdsPersonalizadoNombre?: string
    }
}

export interface Tienda {
    _id: string
    codigo: string
    nombre: string
    direccion: Direccion
    localidad?: string
    cadena?: string
    categoriaPrecio?: string
    tipoServicio: 'FAST FOOD' | 'FULL SERVICE' | 'PATIOS DE COMIDA' | 'IL' | 'DL' | 'MIXTO'
    ruc: string
    empresa: string
    telefono?: string
    fechaAperturaPlanificada: string
    fechaAperturaReal?: string
    estadoGeneral: 'pendiente' | 'en_proceso' | 'en_revision' | 'instalacion' | 'apertura' | 'completado' | 'en_espera_proveedor' | 'en_espera_cliente' | 'pendiente_aprobacion' | 'cerrado' | 'cancelado' | 'bloqueado'
    progreso: number
    responsables: {
        operaciones?: Responsable | string
        it?: Responsable | string
        dsi?: Responsable | string
        cx?: Responsable | string
        contabilidad?: Responsable | string
        trade?: Responsable | string
        marketing?: Responsable | string
    }
    configuraciones?: {
        kds: boolean
        delivery: boolean
        drive: boolean
        kioscos: boolean
        dragonTail: boolean
        facturacionElectronica?: boolean
        lineaDomicilio?: boolean
        horarioAtencion?: string
        impuestos?: {
            tipo: string
            porcentaje: number
            metodo: string
        }
    }
    configuracionEstaciones?: ConfiguracionEstaciones
    server?: string
    ipServidor?: string
    mid?: string
    puntosEmision?: PuntoEmision[]
    creadoPor?: string | User
    createdAt: string
    diasRestantes?: number
    atrasada?: boolean
    archivosAdjuntos?: ArchivoAdjunto[]
}

// ============= PROCESOS =============
export interface CheckItem {
    _id: string
    item: string
    descripcion?: string
    responsable?: string | User
    requiereValidacion: boolean
    validado: boolean
    fechaValidacion?: string
    validadoPor?: string | User
    adjuntos?: ArchivoAdjunto[]
    observaciones?: string
    tiempoEstimado?: number
    tiempoReal?: number
}

export interface TiempoEtapa {
    inicio?: string
    fin?: string
    duracion?: number
}

export interface Proceso {
    _id: string
    tienda: Tienda | string
    nombre: string
    descripcion?: string
    tipo?: 'apertura' | 'remodelacion' | 'mantenimiento'
    area: string
    etapa: 'planeacion' | 'pre_apertura' | 'configuracion_inicial' | 'revision' | 'instalacion' | 'pruebas_uat' | 'apertura' | 'post_apertura' | 'cierre'
    estado: 'pendiente' | 'en_proceso' | 'en_revision' | 'instalacion' | 'apertura' | 'completado' | 'en_espera_proveedor' | 'en_espera_cliente' | 'pendiente_aprobacion' | 'bloqueado' | 'cancelado'
    orden: number
    equipo?: {
        lider?: User | string
        responsables?: Array<User | string>
    }
    checklist: CheckItem[]
    fechas?: {
        inicioPlanificacion?: string
        inicioReal?: string
        finEstimado?: string
        finReal?: string
        fechaLimite?: string
    }
    tiemposEtapa?: {
        pendiente?: TiempoEtapa
        en_proceso?: TiempoEtapa
        en_revision?: TiempoEtapa
        instalacion?: TiempoEtapa
        apertura?: TiempoEtapa
        pendiente_aprobacion?: TiempoEtapa
        completado?: TiempoEtapa
        [key: string]: TiempoEtapa | undefined
    }
    tiempoEstimado?: number
    tiempoReal?: number
    estadoTiempo?: 'normal' | 'por_vencer' | 'atrasado'
    prioridad: 'baja' | 'media' | 'alta' | 'critica'
    progreso: number
    observaciones?: string
    historial?: Array<{
        fecha: string
        usuario: string | User
        accion: string
        estadoAnterior?: string
        estadoNuevo?: string
        detalles?: any
    }>
    createdAt: string
    updatedAt: string
    diasRestantes?: number
}

// ============= CADENAS =============
export interface Cadena {
    _id: string
    nombre: string
    formasPago?: Array<{
        id: string
        nombre: string
        codigo?: string
        descripcion?: string
        activo?: boolean
    }>
}

// ============= NOTIFICACIONES =============
export interface Notificacion {
    _id: string
    usuario: string | User
    tipo: 'nueva_tienda' | 'asignacion' | 'cambio_estado' | 'validacion' | 'recordatorio' | 'alerta' | 'completado' | 'sistema'
    titulo: string
    mensaje: string
    leida: boolean
    prioridad?: 'baja' | 'media' | 'alta' | 'critica'
    referencia?: {
        tipo: 'tienda' | 'proceso' | 'checklist' | 'usuario'
        id: string
    }
    metadata?: any
    enviadoPor?: string | User
    fechaExpiracion?: string
    createdAt: string
}

// ============= RESPUESTAS API =============
export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
    count?: number
    total?: number
    totalPages?: number
    currentPage?: number
}

// ============= ESTADÍSTICAS =============
export interface DashboardStats {
    totalTiendas: number
    tiendasActivas: number
    porEstado: Array<{ _id: string; count: number }>
    porArea: Array<{ area: string; total: number; completados: number; progreso: number }>
    proximasAperturas: Tienda[]
    atrasos: number
    procesosCriticos?: number
}

// ============= TIPOS ADICIONALES PARA EL FLUJO DE APERTURA =============

export interface EstacionConfig {
    id: string
    nombre: string
    seleccionado: boolean
    tipo: 'caja' | 'kiosco' | 'delivery' | 'pickup' | 'drive' | 'heladeria' | 'domi' | 'mesero'
    configuraciones?: {
        servicioTarjetas?: boolean
        impresionesNetcore?: boolean
        usuarioCreado?: boolean
        servicioImpresion?: boolean
    }
    archivos?: ArchivoAdjunto[]
}

export interface UsuarioConfig {
    id: string
    nombre: string
    tipo: 'tienda' | 'kiosco' | 'delivery' | 'pickup' | 'agregador' | 'mesero'
    usuarioAsignado?: string
    creado: boolean
    activo: boolean
    archivos?: ArchivoAdjunto[]
}

export interface ImpresoraConfig {
    id: string
    nombre: string
    seleccionado: boolean
    tipo: 'linea' | 'lineaDomi' | 'bar' | 'cocina' | 'parrilla' | 'personalizada' | 'domi' | 'kiosco' | 'drive' | 'mesero'
    nombrePersonalizado?: string
    archivos?: ArchivoAdjunto[]
}

export interface FormaPago {
    id: string
    nombre: string
    seleccionado: boolean
    codigo?: string
    descripcion?: string
}

export interface DespliegueServidorItem {
    id: string
    nombre: string
    completado: boolean
    aplica: boolean
    observaciones?: string
}

export interface DespliegueCajasItem {
    cajaId: string
    cajaNombre: string
    servicioTarjetas: boolean
    servicioImpresion: boolean
}

export interface ObservacionAnclada {
    id: string
    texto: string
    usuario: string
    fecha: string
}

export interface MKTContabilidadConfig {
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

export interface InfraestructuraConfig {
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

export interface PruebaItem {
    id: string
    nombre: string
    check: boolean
    archivos?: ArchivoAdjunto[]
    observaciones?: string
}

export interface InstalacionConfig {
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

export interface ServiciosConfig {
    dragonTail: 'aplica' | 'no_aplica' | null
    upselling: 'aplica' | 'no_aplica' | null
    kioscos: 'aplica' | 'no_aplica' | null
}

export interface PoliticasRestaurante {
    check: boolean
    archivos?: ArchivoAdjunto[]
    observaciones?: string
}

export interface MensajeApertura {
    id: string
    usuario: string
    usuarioId?: string
    fecha: string
    texto: string
    tipo: 'novedad' | 'consulta' | 'respuesta' | 'finalizacion' | 'archivo'
    archivos?: ArchivoAdjunto[]
}

// ============= PRUEBAS SERVICE TYPES =============
export interface EstacionPrueba {
    id: string
    nombre: string
    tipo: string
    completado: boolean
    observaciones?: ObservacionAnclada[]
    archivos?: ArchivoAdjunto[]
}

export interface PreAperturaEstado {
    preAperturaCompletada: boolean
    efectivoCompletado: boolean
    tarjetaCompletado: boolean
    facturaEfectivo?: {
        archivo?: ArchivoAdjunto
        observaciones?: ObservacionAnclada[]
    }
    facturaTarjeta?: {
        archivo?: ArchivoAdjunto
        observaciones?: ObservacionAnclada[]
    }
}

export interface AprobacionEstado {
    facturaDocumento?: {
        archivo?: ArchivoAdjunto
        observaciones?: ObservacionAnclada[]
    }
    revisado: boolean
}

export interface ResumenApertura {
    tiempoTotalHoras: number
    fechaFinalizacion: string
    tiempoPorEtapa: {
        configuracion: number
        pruebas: number
        instalacion: number
        apertura: number
    }
    chatResumen?: Array<{
        usuario: string
        mensaje: string
        fecha: string
    }>
}

// ============= CHECKLIST =============
export interface ChecklistTemplate {
    _id: string
    nombre: string
    descripcion?: string
    tipo: 'apertura' | 'remodelacion' | 'mantenimiento'
    items: Array<{
        item: string
        descripcion?: string
        area: string
        requiereValidacion: boolean
        tiempoEstimado?: number
        orden: number
    }>
    activo: boolean
    version: number
    createdAt: string
    updatedAt: string
}

// ============= REPORTES =============
export interface ReporteApertura {
    tienda: Tienda
    proceso: Proceso
    tiempos: {
        totalHoras: number
        configuracionHoras: number
        pruebasHoras: number
        instalacionHoras: number
        aperturaHoras: number
    }
    checklistCompletado: number
    checklistTotal: number
    usuariosCreados: number
    usuariosTotal: number
    archivosSubidos: number
}

// ============= DASHBOARD =============
export interface DashboardData {
    stats: DashboardStats
    actividadesRecientes: Array<{
        id: string
        tipo: string
        mensaje: string
        fecha: string
        usuario: string
    }>
    notificacionesNoLeidas: number
    procesosActivos: number
    alertas: Array<{
        id: string
        tipo: string
        mensaje: string
        prioridad: 'baja' | 'media' | 'alta' | 'critica'
        fecha: string
    }>
}

// ========== IMPLEMENTACIONES ==========
export interface Implementacion {
    _id: string
    codigo: string
    nombre: string
    cadena: string
    tiendaAsociada?: {
        id: string
        codigo: string
        nombre: string
    }
    direccion: Direccion
    fechaImplementacionPlanificada?: string
    fechaInicioReal?: string
    fechaFinReal?: string
    estadoGeneral: 'pendiente' | 'en_proceso' | 'en_revision' | 'instalacion' | 'apertura' | 'completado' | 'cancelado'

    configuracion: {
        cajas: {
            activo: boolean
            cantidad: number
            items?: Array<{ id: string; nombre: string; seleccionado: boolean; descripcion?: string }>
        }
        kioscos: {
            activo: boolean
            cantidad: number
            items?: Array<{ id: string; nombre: string; seleccionado: boolean }>
        }
        delivery: {
            activo: boolean
            tipo: 'propio' | 'agregadores' | 'ambos' | null
        }
        localizadores: boolean
        turnero: boolean
        kds: boolean
        heladerias: boolean
        drive: {
            activo: boolean
            items?: Array<{ id: string; nombre: string; seleccionado: boolean; descripcion?: string }>
        }
        medianet: boolean
        dragonTail: boolean
        upselling: boolean
        pickUp: boolean
        impresoras: {
            linea: boolean
            lineaDomi: boolean
            bar: boolean
            cocina: boolean
            parrilla: boolean
            personalizada: boolean
            personalizadaNombre: string
        }
    }

    tecnicoAsignado?: {
        id: string
        nombre: string
        email: string
    }

    observaciones?: string
    archivosAdjuntos?: ArchivoAdjunto[]
    createdAt: string
    updatedAt: string
}

export interface CrearImplementacionDTO {
    codigo: string
    nombre: string
    cadena: string
    tiendaAsociadaId?: string
    direccion: Direccion
    fechaImplementacionPlanificada?: string
    configuracion: {
        cajas: { activo: boolean; cantidad: number }
        kioscos: { activo: boolean; cantidad: number }
        delivery: { activo: boolean; tipo: 'propio' | 'agregadores' | 'ambos' | null }
        localizadores: boolean
        turnero: boolean
        kds: boolean
        heladerias: boolean
        drive: { activo: boolean }
        medianet: boolean
        dragonTail: boolean
        upselling: boolean
        pickUp: boolean
        impresoras: {
            linea: boolean
            lineaDomi: boolean
            bar: boolean
            cocina: boolean
            parrilla: boolean
            personalizada: boolean
            personalizadaNombre: string
        }
    }
    tecnicoAsignadoId?: string
    observaciones?: string
}