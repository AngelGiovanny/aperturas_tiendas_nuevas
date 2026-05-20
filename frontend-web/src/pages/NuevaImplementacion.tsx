// pages/NuevaImplementacion.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { implementacionesService } from '../services/implementacionesService'
import { tiendasService } from '../services/tiendas'
import { usuariosService } from '../services/usuariosService'
import { Tienda, User } from '@/types'
import {
    ArrowLeftIcon,
    BuildingStorefrontIcon,
    CalendarIcon,
    DocumentArrowUpIcon,
    XMarkIcon,
    PrinterIcon,
    ComputerDesktopIcon,
    TruckIcon,
    WifiIcon,
    ShoppingCartIcon,
    WalletIcon,
    ChatBubbleLeftIcon,
    QueueListIcon,
    CakeIcon,
    UserIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// Definición de cadenas
const CADENAS = [
    { id: 'KFC', nombre: 'KENTUCKY FRIED CHICKEN', letra: 'K' },
    { id: 'DELI', nombre: 'AMERICAN DELI PATIOS', letra: 'A' },
    { id: 'CAJUN', nombre: 'CAJUN', letra: 'J' },
    { id: 'ESPANOL', nombre: 'EL ESPAÑOL', letra: 'E' },
    { id: 'GUS', nombre: 'GUS', letra: 'G' },
    { id: 'JUANVALDEZ', nombre: 'JUAN VALDEZ CAFÉ', letra: 'V' },
    { id: 'MENESTRAS', nombre: 'MENESTRAS DEL NEGRO', letra: 'M' },
    { id: 'TROPI', nombre: 'TROPIBURGER', letra: 'T' },
    { id: 'ILCAPPO', nombre: 'ILCAPPO', letra: 'I' },
    { id: 'CASARES', nombre: 'CASA RES', letra: 'R' },
    { id: 'FEDERER', nombre: 'FEDERER', letra: 'FD' },
    { id: 'BASKIN', nombre: 'BASKIN ROBBINS', letra: 'BS' },
    { id: 'CINNABON', nombre: 'CINNABON', letra: 'CN' },
    { id: 'DOLCE', nombre: 'DOLCE INCONTRO', letra: 'D' }
]

interface ArchivoAdjuntoLocal {
    id: string
    nombre: string
    tamaño: number
    tipo: string
    archivo: File
}

interface ObservacionLocal {
    id: string
    texto: string
    fecha: string
}

const NuevaImplementacion: React.FC = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tecnicos, setTecnicos] = useState<User[]>([])
    const [adjuntos, setAdjuntos] = useState<ArchivoAdjuntoLocal[]>([])
    const [observaciones, setObservaciones] = useState<ObservacionLocal[]>([])
    const [nuevaObservacion, setNuevaObservacion] = useState('')

    const [formData, setFormData] = useState({
        codigo: '',
        cadena: '',
        fechaImplementacionPlanificada: '',
        tecnicoAsignadoId: '',
        direccion: {
            calle: '',
            ciudad: '',
            provincia: ''
        },
        configuracion: {
            cajas: { activo: false, cantidad: 1 },
            kioscos: { activo: false, cantidad: 0 },
            delivery: { activo: false, tipo: 'propio' as 'propio' | 'agregadores' | 'ambos' }, // ✅ CAMBIADO: null → 'propio'
            localizadores: false,
            turnero: false,
            kds: false,
            heladerias: false,
            drive: { activo: false },
            medianet: false,
            dragonTail: false,
            pickUp: false,
            impresoras: {
                linea: false,
                lineaDomi: false,
                bar: false,
                cocina: false,
                parrilla: false,
                personalizada: false,
                personalizadaNombre: ''
            }
        }
    })

    // Cargar técnicos (usuarios con rol CX)
    useEffect(() => {
        const cargarTecnicos = async () => {
            try {
                console.log('🔄 Cargando técnicos CX y Administradores...')

                // Cargar usuarios
                const usuariosRes = await usuariosService.getAll()
                console.log('📋 Usuarios recibidos:', usuariosRes?.length || 0)

                if (usuariosRes && usuariosRes.length > 0) {
                    // Mostrar roles disponibles para depuración
                    const rolesDisponibles = [...new Set(usuariosRes.map((u: User) => u.role))]
                    console.log('📝 Roles disponibles en BD:', rolesDisponibles)

                    // ✅ FILTRO MODIFICADO: Incluye CX y ADMIN_MASTER
                    const tecnicosList = usuariosRes.filter((u: User) => {
                        const role = u.role?.toLowerCase()
                        // Ahora incluye 'cx' y 'admin_master'
                        return (role === 'cx' || role === 'admin_master') && u.activo === true
                    })

                    console.log('🔧 Técnicos/Admin encontrados:', tecnicosList.length)
                    console.log('👥 Lista:', tecnicosList.map(t => ({
                        nombre: t.nombre,
                        apellido: t.apellido,
                        email: t.email,
                        role: t.role
                    })))

                    setTecnicos(tecnicosList)

                    if (tecnicosList.length === 0) {
                        console.warn('⚠️ No se encontraron usuarios activos con rol CX o ADMIN_MASTER')
                        toast.warning('No hay técnicos CX o administradores disponibles')
                    } else {
                        toast.success(`${tecnicosList.length} técnico(s)/admin(s) disponible(s)`)
                    }
                } else {
                    console.warn('⚠️ No se recibieron usuarios del backend')
                    setTecnicos([])
                }
            } catch (error) {
                console.error('❌ Error cargando técnicos:', error)
                toast.error('Error al cargar la lista de técnicos')
                setTecnicos([])
            }
        }
        cargarTecnicos()
    }, [])

    const generarCodigoSugerido = () => {
        if (!formData.cadena) return ''
        const cadena = CADENAS.find(c => c.id === formData.cadena)
        if (!cadena) return ''
        const letra = cadena.letra
        const numero = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `IMP-${letra}${numero}`
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const nuevosAdjuntos: ArchivoAdjuntoLocal[] = []
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            nuevosAdjuntos.push({
                id: `${Date.now()}-${i}`,
                nombre: file.name,
                tamaño: file.size,
                tipo: file.type,
                archivo: file
            })
        }
        setAdjuntos([...adjuntos, ...nuevosAdjuntos])
        e.target.value = ''
    }

    const eliminarAdjunto = (id: string) => {
        setAdjuntos(adjuntos.filter(a => a.id !== id))
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const agregarObservacion = () => {
        if (!nuevaObservacion.trim()) {
            toast.error('Escribe una observación antes de agregar')
            return
        }
        const nuevaObs: ObservacionLocal = {
            id: Date.now().toString(),
            texto: nuevaObservacion.trim(),
            fecha: new Date().toISOString()
        }
        setObservaciones([...observaciones, nuevaObs])
        setNuevaObservacion('')
        toast.success('Observación agregada')
    }

    const eliminarObservacion = (id: string) => {
        setObservaciones(observaciones.filter(obs => obs.id !== id))
    }

    // ✅ FUNCIÓN HANDLESUBMIT CORREGIDA
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!formData.codigo || !formData.cadena) {
            setError('Por favor completa los campos obligatorios')
            setLoading(false)
            return
        }

        try {
            // ✅ Limpiar datos inválidos antes de enviar
            const configuracionLimpia = {
                ...formData.configuracion,
                delivery: {
                    activo: formData.configuracion.delivery.activo,
                    tipo: formData.configuracion.delivery.tipo || 'propio' // ✅ Si es null/undefined, usar 'propio'
                }
            }

            const nuevaImplementacion = {
                codigo: formData.codigo,
                nombre: `Implementación ${formData.codigo}`,
                cadena: formData.cadena,
                direccion: formData.direccion,
                fechaImplementacionPlanificada: formData.fechaImplementacionPlanificada,
                configuracion: configuracionLimpia, // ✅ Usar configuración limpia
                tecnicoAsignadoId: formData.tecnicoAsignadoId || undefined,
                observaciones: observaciones.map(obs => obs.texto).join('\n')
            }

            console.log('📤 Enviando implementación:', nuevaImplementacion)
            await implementacionesService.create(nuevaImplementacion)
            toast.success('✅ Implementación creada exitosamente')
            navigate('/implementaciones')
        } catch (error: any) {
            console.error('❌ Error:', error)
            setError(error?.response?.data?.error || 'Error al crear la implementación')
            toast.error(error?.response?.data?.error || 'Error al crear la implementación')
        } finally {
            setLoading(false)
        }
    }

    const codigoSugerido = generarCodigoSugerido()

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        type="button"
                        onClick={() => navigate('/implementaciones')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Nueva Implementación</h1>
                        <p className="text-gray-600 text-sm mt-1">Complete la información para crear una nueva implementación</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información General */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cadena <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.cadena}
                                    onChange={(e) => setFormData({ ...formData, cadena: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white text-gray-900"
                                    required
                                >
                                    <option value="" className="text-gray-900">Seleccionar cadena</option>
                                    {CADENAS.map(cadena => (
                                        <option key={cadena.id} value={cadena.id} className="text-gray-900">
                                            {cadena.nombre} ({cadena.letra})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Código <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.codigo}
                                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                        placeholder={codigoSugerido || "Ej: IMP-K001"}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white text-gray-900 placeholder-gray-400"
                                        required
                                    />
                                </div>
                                {codigoSugerido && !formData.codigo && (
                                    <p className="text-xs text-gray-500 mt-1">Sugerencia: {codigoSugerido}</p>
                                )}
                            </div>

                            <Input
                                label="Fecha Planificada"
                                type="date"
                                value={formData.fechaImplementacionPlanificada}
                                onChange={(e) => setFormData({ ...formData, fechaImplementacionPlanificada: e.target.value })}
                                icon={<CalendarIcon className="h-5 w-5" />}
                            />
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubicación</h3>
                        <div className="space-y-4">
                            <Input
                                label="Calle principal"
                                value={formData.direccion.calle}
                                onChange={(e) => setFormData({ ...formData, direccion: { ...formData.direccion, calle: e.target.value } })}
                                placeholder="Av. Principal y calle secundaria"
                                icon={<BuildingStorefrontIcon className="h-5 w-5" />}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Ciudad"
                                    value={formData.direccion.ciudad}
                                    onChange={(e) => setFormData({ ...formData, direccion: { ...formData.direccion, ciudad: e.target.value } })}
                                    placeholder="Quito"
                                />
                                <Input
                                    label="Provincia"
                                    value={formData.direccion.provincia}
                                    onChange={(e) => setFormData({ ...formData, direccion: { ...formData.direccion, provincia: e.target.value } })}
                                    placeholder="Pichincha"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Configuración de Implementación */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Implementación</h3>

                        {/* Cajas */}
                        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    checked={formData.configuracion.cajas.activo}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuracion: {
                                            ...formData.configuracion,
                                            cajas: { ...formData.configuracion.cajas, activo: e.target.checked }
                                        }
                                    })}
                                    className="w-5 h-5 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <label className="font-medium text-gray-700">Cajas</label>
                            </div>
                            {formData.configuracion.cajas.activo && (
                                <div className="ml-8">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cantidad de cajas
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={formData.configuracion.cajas.cantidad}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            configuracion: {
                                                ...formData.configuracion,
                                                cajas: { ...formData.configuracion.cajas, cantidad: parseInt(e.target.value) || 1 }
                                            }
                                        })}
                                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white text-gray-900"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Kioscos */}
                        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    checked={formData.configuracion.kioscos.activo}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuracion: {
                                            ...formData.configuracion,
                                            kioscos: { ...formData.configuracion.kioscos, activo: e.target.checked }
                                        }
                                    })}
                                    className="w-5 h-5 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <label className="font-medium text-gray-700">Kioscos</label>
                            </div>
                            {formData.configuracion.kioscos.activo && (
                                <div className="ml-8">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cantidad de kioscos
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.configuracion.kioscos.cantidad}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            configuracion: {
                                                ...formData.configuracion,
                                                kioscos: { ...formData.configuracion.kioscos, cantidad: parseInt(e.target.value) || 0 }
                                            }
                                        })}
                                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white text-gray-900"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Delivery */}
                        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    checked={formData.configuracion.delivery.activo}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuracion: {
                                            ...formData.configuracion,
                                            delivery: { ...formData.configuracion.delivery, activo: e.target.checked, tipo: e.target.checked ? formData.configuracion.delivery.tipo : 'propio' }
                                        }
                                    })}
                                    className="w-5 h-5 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <ShoppingCartIcon className="h-5 w-5 text-gray-500" />
                                <label className="font-medium text-gray-700">Delivery</label>
                            </div>
                            {formData.configuracion.delivery.activo && (
                                <div className="ml-8 flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            checked={formData.configuracion.delivery.tipo === 'propio'}
                                            onChange={() => setFormData({
                                                ...formData,
                                                configuracion: {
                                                    ...formData.configuracion,
                                                    delivery: { ...formData.configuracion.delivery, tipo: 'propio' }
                                                }
                                            })}
                                            className="w-4 h-4 text-kfc-red"
                                        />
                                        <span className="text-sm text-gray-700">Canal Propio</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            checked={formData.configuracion.delivery.tipo === 'agregadores'}
                                            onChange={() => setFormData({
                                                ...formData,
                                                configuracion: {
                                                    ...formData.configuracion,
                                                    delivery: { ...formData.configuracion.delivery, tipo: 'agregadores' }
                                                }
                                            })}
                                            className="w-4 h-4 text-kfc-red"
                                        />
                                        <span className="text-sm text-gray-700">Agregadores</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            checked={formData.configuracion.delivery.tipo === 'ambos'}
                                            onChange={() => setFormData({
                                                ...formData,
                                                configuracion: {
                                                    ...formData.configuracion,
                                                    delivery: { ...formData.configuracion.delivery, tipo: 'ambos' }
                                                }
                                            })}
                                            className="w-4 h-4 text-kfc-red"
                                        />
                                        <span className="text-sm text-gray-700">Ambos</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Grid de opciones adicionales */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.configuracion.localizadores}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuracion: { ...formData.configuracion, localizadores: e.target.checked }
                                    })}
                                    className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <QueueListIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-700">Localizadores</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.configuracion.turnero}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuracion: { ...formData.configuracion, turnero: e.target.checked }
                                    })}
                                    className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <ChatBubbleLeftIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-700">Turnero</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.configuracion.kds}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuracion: { ...formData.configuracion, kds: e.target.checked }
                                    })}
                                    className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <ComputerDesktopIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-700">KDS</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.configuracion.heladerias}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuracion: { ...formData.configuracion, heladerias: e.target.checked }
                                    })}
                                    className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <CakeIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-700">Heladerías</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.configuracion.drive.activo}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuracion: {
                                            ...formData.configuracion,
                                            drive: { activo: e.target.checked }
                                        }
                                    })}
                                    className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <TruckIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-700">Drive</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.configuracion.medianet}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuracion: { ...formData.configuracion, medianet: e.target.checked }
                                    })}
                                    className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <WifiIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-700">Medianet</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.configuracion.dragonTail}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuracion: { ...formData.configuracion, dragonTail: e.target.checked }
                                    })}
                                    className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <WalletIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-700">Dragon Tail</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.configuracion.pickUp}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        configuracion: { ...formData.configuracion, pickUp: e.target.checked }
                                    })}
                                    className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-700">Pick Up</span>
                            </label>
                        </div>

                        {/* Impresoras */}
                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-medium text-gray-900 mb-3">Impresoras</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.configuracion.impresoras.linea}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            configuracion: {
                                                ...formData.configuracion,
                                                impresoras: { ...formData.configuracion.impresoras, linea: e.target.checked }
                                            }
                                        })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <PrinterIcon className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm text-gray-700">Línea</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.configuracion.impresoras.lineaDomi}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            configuracion: {
                                                ...formData.configuracion,
                                                impresoras: { ...formData.configuracion.impresoras, lineaDomi: e.target.checked }
                                            }
                                        })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <PrinterIcon className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm text-gray-700">Línea Domi</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.configuracion.impresoras.bar}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            configuracion: {
                                                ...formData.configuracion,
                                                impresoras: { ...formData.configuracion.impresoras, bar: e.target.checked }
                                            }
                                        })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <PrinterIcon className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm text-gray-700">Bar</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.configuracion.impresoras.cocina}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            configuracion: {
                                                ...formData.configuracion,
                                                impresoras: { ...formData.configuracion.impresoras, cocina: e.target.checked }
                                            }
                                        })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <PrinterIcon className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm text-gray-700">Cocina</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.configuracion.impresoras.parrilla}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            configuracion: {
                                                ...formData.configuracion,
                                                impresoras: { ...formData.configuracion.impresoras, parrilla: e.target.checked }
                                            }
                                        })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <PrinterIcon className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm text-gray-700">Parrilla</span>
                                </label>

                                <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                                    <input
                                        type="checkbox"
                                        checked={formData.configuracion.impresoras.personalizada}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            configuracion: {
                                                ...formData.configuracion,
                                                impresoras: {
                                                    ...formData.configuracion.impresoras,
                                                    personalizada: e.target.checked
                                                }
                                            }
                                        })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <PrinterIcon className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm text-gray-700">Personalizada:</span>
                                    {formData.configuracion.impresoras.personalizada && (
                                        <input
                                            type="text"
                                            value={formData.configuracion.impresoras.personalizadaNombre}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                configuracion: {
                                                    ...formData.configuracion,
                                                    impresoras: {
                                                        ...formData.configuracion.impresoras,
                                                        personalizadaNombre: e.target.value
                                                    }
                                                }
                                            })}
                                            placeholder="Nombre de la impresora"
                                            className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-1 focus:ring-kfc-red/20 outline-none bg-white text-gray-900"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Técnico Asignado */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-kfc-red" />
                            Técnico Asignado (CX)
                        </h3>
                        <select
                            value={formData.tecnicoAsignadoId}
                            onChange={(e) => setFormData({ ...formData, tecnicoAsignadoId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white text-gray-900"
                        >
                            <option value="" className="text-gray-900">-- Seleccionar técnico CX --</option>
                            {tecnicos.length === 0 ? (
                                <option value="" disabled className="text-gray-400">⚠️ No hay técnicos CX disponibles</option>
                            ) : (
                                tecnicos.map((tecnico) => (
                                    <option key={tecnico._id} value={tecnico._id} className="text-gray-900">
                                        👤 {tecnico.nombre} - {tecnico.email}
                                    </option>
                                ))
                            )}
                        </select>
                        {tecnicos.length === 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-xs text-yellow-700">
                                    ⚠️ No hay usuarios con rol CX disponibles en la base de datos.
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">
                                    💡 Para agregar técnicos CX, ve a Admin → Usuarios y crea usuarios con rol "cx".
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Observaciones con botón Agregar */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Observaciones</h3>
                        <div className="mb-4">
                            <div className="flex gap-2">
                                <textarea
                                    value={nuevaObservacion}
                                    onChange={(e) => setNuevaObservacion(e.target.value)}
                                    rows={3}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white text-gray-900 placeholder-gray-400"
                                    placeholder="Escribe una observación..."
                                />
                                <button
                                    type="button"
                                    onClick={agregarObservacion}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 self-start"
                                >
                                    <PlusCircleIcon className="h-5 w-5" />
                                    Agregar
                                </button>
                            </div>
                        </div>

                        {observaciones.length > 0 && (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {observaciones.map((obs) => (
                                    <div key={obs.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-700">{obs.texto}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(obs.fecha).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => eliminarObservacion(obs.id)}
                                            className="p-1 hover:bg-gray-200 rounded ml-2"
                                        >
                                            <XMarkIcon className="h-4 w-4 text-gray-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Adjuntar Archivos */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos Adjuntos</h3>
                        <div className="mb-4">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                <DocumentArrowUpIcon className="h-5 w-5 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">Seleccionar archivos</span>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                />
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                                Formatos permitidos: PDF, JPG, PNG, DOC, XLS (máx 10MB por archivo)
                            </p>
                        </div>

                        {adjuntos.length > 0 && (
                            <div className="space-y-2">
                                {adjuntos.map((adjunto) => (
                                    <div key={adjunto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <DocumentArrowUpIcon className="h-5 w-5 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">{adjunto.nombre}</p>
                                                <p className="text-xs text-gray-500">{formatFileSize(adjunto.tamaño)}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => eliminarAdjunto(adjunto.id)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                        >
                                            <XMarkIcon className="h-4 w-4 text-gray-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/implementaciones')}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                        >
                            Crear Implementación
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}

export default NuevaImplementacion