// pages/NuevaTienda.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { tiendasService } from '../services/tiendas'
import { usuariosService } from '../services/usuariosService'
import { User } from '../types'
import {
    ArrowLeftIcon,
    BuildingStorefrontIcon,
    MapPinIcon,
    CalendarIcon,
    UserIcon,
    PhoneIcon,
    DocumentArrowUpIcon,
    XMarkIcon,
    TagIcon,
    PrinterIcon,
    ComputerDesktopIcon,
    FireIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// Definición de cadenas con los valores exactos que espera el backend
const CADENAS = [
    { id: 'KFC', nombre: 'KENTUCKY FRIED CHICKEN', letra: 'K' },
    { id: 'AMERICAN_DELI', nombre: 'AMERICAN DELI PATIOS', letra: 'A' },
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

// Base de datos de RUC y empresa por cadena
const DATOS_EMPRESA_POR_CADENA: Record<string, { ruc: string; empresa: string; tipoImpuesto: 'Incluido' | 'Diferenciado' }> = {
    'KFC': { ruc: '1791415132001', empresa: 'INT FOOD SERVICES CORP SA', tipoImpuesto: 'Incluido' },
    'AMERICAN_DELI': { ruc: '1792072018001', empresa: 'DELI INTERNACIONAL S.A.', tipoImpuesto: 'Incluido' },
    'CAJUN': { ruc: '1792049504001', empresa: 'SHEMLON SA', tipoImpuesto: 'Incluido' },
    'ESPANOL': { ruc: '1792072018001', empresa: 'DELI INTERNACIONAL S.A.', tipoImpuesto: 'Diferenciado' },
    'GUS': { ruc: '1791415132001', empresa: 'INT FOOD SERVICES CORP SA', tipoImpuesto: 'Incluido' },
    'JUANVALDEZ': { ruc: '1792141486001', empresa: 'PROMOTORA ECUATORIANA DE CAFE DE COLOMBI', tipoImpuesto: 'Incluido' },
    'MENESTRAS': { ruc: '1792049504001', empresa: 'SHEMLON SA', tipoImpuesto: 'Incluido' },
    'TROPI': { ruc: '1792072018001', empresa: 'DELI INTERNACIONAL S.A.', tipoImpuesto: 'Incluido' },
    'ILCAPPO': { ruc: '1792025435001', empresa: 'PRODUCCIONES Y EVENTOS NOVOEVENTOS S.A.', tipoImpuesto: 'Incluido' },
    'CASARES': { ruc: '1792049504001', empresa: 'SHEMLON SA', tipoImpuesto: 'Incluido' },
    'FEDERER': { ruc: '1792072018001', empresa: 'DELI INTERNACIONAL S.A.', tipoImpuesto: 'Incluido' },
    'BASKIN': { ruc: '1792072018001', empresa: 'DELI INTERNACIONAL S.A.', tipoImpuesto: 'Incluido' },
    'CINNABON': { ruc: '1792072018001', empresa: 'DELI INTERNACIONAL S.A.', tipoImpuesto: 'Incluido' },
    'DOLCE': { ruc: '1792072018001', empresa: 'DELI INTERNACIONAL S.A.', tipoImpuesto: 'Incluido' }
}

// Categorías por cadena
const CATEGORIAS_POR_CADENA: Record<string, Array<{ id: string; nombre: string; codigo: string }>> = {
    'AMERICAN_DELI': [
        { id: '35750714-127b-e811-80d7-000d3a019254', nombre: 'DELI FONTANA Y PLAZA', codigo: 'DFP' },
        { id: '36750714-127b-e811-80d7-000d3a019254', nombre: 'DELI MANTA', codigo: 'DMT' },
        { id: 'e3e1b261-e9ec-e811-80dd-000d3a019254', nombre: 'DELI FULL PILOTO', codigo: 'DFP' },
        { id: '1132d458-65bf-e911-80e4-000d3a019254', nombre: 'DELI IN LINE NORTE', codigo: 'DIL' },
        { id: '2cb79d18-240d-ec11-80f5-000d3a019254', nombre: 'DELI TERMINAL PATIO', codigo: 'DTP' },
        { id: 'b2039503-85cf-e511-80c6-000d3a3261f3', nombre: 'DELI CITY BISTRO', codigo: 'CTY' },
        { id: 'b8039503-85cf-e511-80c6-000d3a3261f3', nombre: 'GENERAL - DELI PATIOS', codigo: 'DPA' },
        { id: 'dc039503-85cf-e511-80c6-000d3a3261f3', nombre: 'DELI PATIO FULL', codigo: 'DPF' },
        { id: 'ec039503-85cf-e511-80c6-000d3a3261f3', nombre: 'D ARRECIFE UIO', codigo: 'DAF' },
        { id: '03049503-85cf-e511-80c6-000d3a3261f3', nombre: 'DELI ARRECIFE', codigo: 'ARF' }
    ],
    'CAJUN': [
        { id: 'df039503-85cf-e511-80c6-000d3a3261f3', nombre: 'CAJUN AEROPUERTO', codigo: 'AER' },
        { id: 'e5039503-85cf-e511-80c6-000d3a3261f3', nombre: 'CAJUN TERMINAL', codigo: 'TER' },
        { id: 'ea039503-85cf-e511-80c6-000d3a3261f3', nombre: 'CAJUN AERO QUITO', codigo: 'CAQ' },
        { id: '1742e5fd-1687-e611-80c5-000d3a330947', nombre: 'GENERAL - CAJUN', codigo: 'CAJ' },
        { id: 'e738553d-4b3f-ed11-a27c-c896655094a7', nombre: 'CAJUN PASEO SAN FRANCISCO', codigo: 'CAJ' },
        { id: 'e838553d-4b3f-ed11-a27c-c896655094a7', nombre: 'CONVENIOS', codigo: 'CON' }
    ],
    'ESPANOL': [
        { id: '42ba60ad-8c54-e811-80d3-000d3a019254', nombre: 'KFC COSTA NORTE', codigo: 'ESM' },
        { id: '5ab9814f-d15e-e811-80d7-000d3a019254', nombre: 'PROVINCIAS', codigo: 'EPR' },
        { id: 'ba039503-85cf-e511-80c6-000d3a3261f3', nombre: 'ESPAÑOL PREEMBARQUE GYE', codigo: 'EPN' },
        { id: 'bb039503-85cf-e511-80c6-000d3a3261f3', nombre: 'ESPAÑOL AEROPUERTO', codigo: 'ESA' },
        { id: 'e0039503-85cf-e511-80c6-000d3a3261f3', nombre: 'ESPANOL PUNTILLA', codigo: 'EPT' },
        { id: 'e7039503-85cf-e511-80c6-000d3a3261f3', nombre: 'ESPANOL AEROPUERTO UIO', codigo: 'EAQ' },
        { id: 'f4039503-85cf-e511-80c6-000d3a3261f3', nombre: 'GENERAL - ESPANOL SERVICIO A LA MESA', codigo: 'ESE' },
        { id: '51d39409-13f9-ee11-8076-c89665503cdf', nombre: 'GENERAL PROMOCIONAL', codigo: 'CGP' },
        { id: '52d39409-13f9-ee11-8076-c89665503cdf', nombre: 'GENERAL ALTA', codigo: 'CGA' },
        { id: '53d39409-13f9-ee11-8076-c89665503cdf', nombre: 'PROVINCIAS ALTA', codigo: 'CPA' }
    ],
    'GUS': [
        { id: 'be039503-85cf-e511-80c6-000d3a3261f3', nombre: 'GENERAL - GUS', codigo: 'GUS' },
        { id: 'd8039503-85cf-e511-80c6-000d3a3261f3', nombre: 'GUS GUAYAQUIL', codigo: 'GYE' },
        { id: '834ed29d-76cc-e611-80c6-000d3a330947', nombre: 'GUS QUEVEDO', codigo: 'GQV' },
        { id: '854ed29d-76cc-e611-80c6-000d3a330947', nombre: 'GUS DIFERENCIADOS', codigo: 'GDF' },
        { id: '584fdbeb-3abb-e711-80ce-000d3a330947', nombre: 'GUS PILOTOS', codigo: 'GP' }
    ],
    'KFC': [
        { id: '787a99c5-ccce-e711-80d0-000d3a019254', nombre: 'KFC SIERRA CENTRO', codigo: 'SIE' },
        { id: '5ceec32e-411b-e811-80d1-000d3a019254', nombre: 'KFC COSTA NORTE', codigo: 'NOR' },
        { id: '3a4a6c42-1d4f-e811-80d3-000d3a019254', nombre: 'KFC COSTA NORTE', codigo: 'NOR' },
        { id: '8e98e0e8-57dc-e811-80dc-000d3a019254', nombre: 'KFC COSTA NORTE', codigo: 'NOR' },
        { id: '824d7564-b6f8-e811-80dd-000d3a019254', nombre: 'KFC PICHINCHA', codigo: 'PIC' },
        { id: 'e3035c1a-1e2e-e911-80df-000d3a019254', nombre: 'KFC COSTA NORTE', codigo: 'NOR' },
        { id: '776d617d-050d-ec11-80f5-000d3a019254', nombre: 'KFC COSTA NORTE', codigo: 'NOR' },
        { id: '70faf37c-5c9e-ec11-80fc-000d3a019254', nombre: 'KFC COSTA NORTE', codigo: 'NOR' },
        { id: 'ac039503-85cf-e511-80c6-000d3a3261f3', nombre: 'KFC - AEROPUERTO', codigo: 'AER' },
        { id: 'bd039503-85cf-e511-80c6-000d3a3261f3', nombre: 'KFC - HIBRIDO', codigo: 'HIB' },
        { id: 'c6039503-85cf-e511-80c6-000d3a3261f3', nombre: 'KFC - CUENCA', codigo: 'QNK' },
        { id: 'ed039503-85cf-e511-80c6-000d3a3261f3', nombre: 'KFC - MOVIL', codigo: 'MOV' },
        { id: 'f1039503-85cf-e511-80c6-000d3a3261f3', nombre: 'GENERAL - 2014', codigo: 'G14' },
        { id: 'fd039503-85cf-e511-80c6-000d3a3261f3', nombre: 'AEROPUERTO GYE', codigo: 'AEG' },
        { id: '0c049503-85cf-e511-80c6-000d3a3261f3', nombre: 'KFC-GYE', codigo: 'GYE' },
        { id: '9c11f3eb-a9c0-e611-80c6-000d3a330947', nombre: 'KFC COSTA NORTE', codigo: 'NOR' },
        { id: '9d11f3eb-a9c0-e611-80c6-000d3a330947', nombre: 'KFC COSTA NORTE', codigo: 'NOR' },
        { id: '0905f1c3-8e0a-e711-80c6-000d3a330947', nombre: 'KFC COSTA NORTE', codigo: 'NOR' },
        { id: 'f61d7308-c81e-e711-80c6-000d3a330947', nombre: 'KFC UIO', codigo: 'UIO' },
        { id: '94193cc6-233b-e711-80c7-000d3a330947', nombre: 'KFC COSTA NORTE', codigo: 'NOR' },
        { id: 'dc41143f-c570-e711-80c9-000d3a330947', nombre: 'KFC COSTA NORTE', codigo: 'NOR' }
    ],
    'JUANVALDEZ': [
        { id: 'c2039503-85cf-e511-80c6-000d3a3261f3', nombre: 'JUAN VALDEZ', codigo: 'J' },
        { id: 'c3039503-85cf-e511-80c6-000d3a3261f3', nombre: 'JUAN VALDEZ AEROPUERTO', codigo: 'JVA' },
        { id: 'c4039503-85cf-e511-80c6-000d3a3261f3', nombre: 'GENERAL - JUAN VALDEZ', codigo: 'JVQ' },
        { id: 'e9039503-85cf-e511-80c6-000d3a3261f3', nombre: 'JUAN VALDEZ AEROPUERTO UIO', codigo: 'VAQ' },
        { id: '43443dc5-97c7-e611-80c6-000d3a330947', nombre: 'JUAN VALDEZ CEIBOS', codigo: 'JCB' },
        { id: '09b705d2-2be2-e511-80c5-0050568602d0', nombre: 'JUAN VALDEZ PREEMBARQUE', codigo: 'VPA' },
        { id: '0ab705d2-2be2-e511-80c5-0050568602d0', nombre: 'JUAN VALDEZ-BEL', codigo: 'JVB' },
        { id: 'e85b2f9c-78fa-ee11-8076-c89665503cdf', nombre: 'TERPEL', codigo: 'TER' },
        { id: 'e95b2f9c-78fa-ee11-8076-c89665503cdf', nombre: 'POR COMPETECIA STARB', codigo: 'PCS' }
    ],
    'MENESTRAS': [
        { id: '48cea64c-2839-e811-80d1-000d3a019254', nombre: 'CUENCA', codigo: 'MQK' },
        { id: '5131c330-a88a-e811-80d7-000d3a019254', nombre: 'AEROPUERTO GYE', codigo: 'MAG' },
        { id: 'c5039503-85cf-e511-80c6-000d3a3261f3', nombre: 'GENERAL - MENESTRAS', codigo: 'MEN' },
        { id: '0a05f1c3-8e0a-e711-80c6-000d3a330947', nombre: 'MENESTRAS GYE PILOTO', codigo: 'MPI' },
        { id: '0b05f1c3-8e0a-e711-80c6-000d3a330947', nombre: 'MENESTRAS MANABI', codigo: 'MEM' },
        { id: 'ca22e6df-5116-e711-80c6-000d3a330947', nombre: 'PILOTOS PROV', codigo: 'MNB' }
    ],
    'TROPI': [
        { id: 'c7039503-85cf-e511-80c6-000d3a3261f3', nombre: 'TROPI CANCHAS', codigo: 'NOR' },
        { id: 'c8039503-85cf-e511-80c6-000d3a3261f3', nombre: 'TROPI GUAYAQUIL', codigo: 'TGY' },
        { id: 'ca039503-85cf-e511-80c6-000d3a3261f3', nombre: 'GENERAL - TROPI', codigo: 'TRO' },
        { id: 'cd039503-85cf-e511-80c6-000d3a3261f3', nombre: 'TROPI LOCALES SUR', codigo: 'TSU' },
        { id: 'd7039503-85cf-e511-80c6-000d3a3261f3', nombre: 'TROPI CUENCA', codigo: 'TQK' },
        { id: '16f6be33-55d7-e611-80c6-000d3a330947', nombre: 'TROPI-PILOTO', codigo: 'TRO' },
        { id: 'ffe09506-483f-ed11-a27c-c896655094a7', nombre: 'DOMICILIO UBER', codigo: 'UBE' }
    ],
    'ILCAPPO': [
        { id: 'd9039503-85cf-e511-80c6-000d3a3261f3', nombre: 'GENERAL - IL CAPPO', codigo: 'ILC' },
        { id: 'e4039503-85cf-e511-80c6-000d3a3261f3', nombre: 'IL CAPPO VALOR', codigo: 'ILV' },
        { id: 'eb039503-85cf-e511-80c6-000d3a3261f3', nombre: 'IL CAPPO AEROPUERTO', codigo: 'AER' },
        { id: 'e1fcedba-fe9c-ed11-bf7a-c896655094a7', nombre: 'IL CAPPO JARDIN', codigo: 'ILC' }
    ],
    'CASARES': [
        { id: 'ccb4eb3e-54df-e711-80d0-000d3a019254', nombre: '9 DE OCTUBRE', codigo: 'CR' },
        { id: 'e6039503-85cf-e511-80c6-000d3a3261f3', nombre: 'AEROPUERTO', codigo: 'AER' },
        { id: '02049503-85cf-e511-80c6-000d3a3261f3', nombre: 'GENERAL', codigo: 'GEN' },
        { id: '1e238489-ea5c-e711-80c8-000d3a330947', nombre: 'CASA RES SAN MARINO', codigo: 'GYE' },
        { id: '1f238489-ea5c-e711-80c8-000d3a330947', nombre: 'CASA RES GYE', codigo: 'GY1' },
        { id: '20238489-ea5c-e711-80c8-000d3a330947', nombre: 'MANABI', codigo: 'MAN' }
    ],
    'DOLCE': [
        { id: 'fc039503-85cf-e511-80c6-000d3a3261f3', nombre: 'GENERAL - DOLCE INCONTRO', codigo: 'GRL' },
        { id: '0e8382ad-77cc-e611-80c6-000d3a330947', nombre: 'GASOLINERA', codigo: 'DGA' },
        { id: 'c6622793-a1f3-ee11-8076-c89665503cdf', nombre: 'DOLCE PILOTO', codigo: 'DPI' }
    ],
    'FEDERER': [
        { id: 'b52ff31c-9029-e911-80df-000d3a019254', nombre: 'GENERAL FEDERER', codigo: 'FED' },
        { id: 'd8148074-493f-ed11-a27c-c896655094a7', nombre: 'APP MERCADITO', codigo: 'FED' }
    ],
    'BASKIN': [
        { id: 'e0183eae-6181-e911-80e0-000d3a019254', nombre: 'GENERAL - BASKIN ROBBINS', codigo: 'BAP' },
        { id: 'e1183eae-6181-e911-80e0-000d3a019254', nombre: 'AEREOPUERTO GYE-BASKIN ROBBINS', codigo: 'BAG' },
        { id: 'e2183eae-6181-e911-80e0-000d3a019254', nombre: 'BASKIN AEREOPUERTO QUITO', codigo: 'BAQ' },
        { id: 'e3183eae-6181-e911-80e0-000d3a019254', nombre: 'BASKIN VALOR', codigo: 'BRV' },
        { id: 'e4183eae-6181-e911-80e0-000d3a019254', nombre: 'PREMIUM-BASKIN ROBBINS NIVEL 2', codigo: 'BPN' },
        { id: '84c60bba-483f-ed11-a27c-c896655094a7', nombre: 'BASKIN VALOR NIVEL 2', codigo: 'BSV' }
    ],
    'CINNABON': [
        { id: '72ed43a7-6181-e911-80e0-000d3a019254', nombre: 'GENERAL - CINNABON', codigo: 'CAP' },
        { id: '73ed43a7-6181-e911-80e0-000d3a019254', nombre: 'AEREOPUERTO GYE-BASKIN ROBBINS', codigo: 'BAG' },
        { id: '74ed43a7-6181-e911-80e0-000d3a019254', nombre: 'BASKIN AEREOPUERTO QUITO', codigo: 'BAQ' },
        { id: '75ed43a7-6181-e911-80e0-000d3a019254', nombre: 'BASKIN VALOR', codigo: 'BRV' },
        { id: '76ed43a7-6181-e911-80e0-000d3a019254', nombre: 'PREMIUM-BASKIN ROBBINS NIVEL 2', codigo: 'BPN' },
        { id: 'ea1474a9-ba56-ec11-80f8-000d3a019254', nombre: 'ARRIBO INTERNACIONAL GYE', codigo: 'AIG' }
    ]
}

// Tipos de servicio
const TIPOS_SERVICIO = [
    "FAST FOOD",
    "FULL SERVICE",
    "PATIOS DE COMIDA"
] as const

type TipoServicio = typeof TIPOS_SERVICIO[number]

// Interfaz para archivos adjuntos
interface ArchivoAdjunto {
    id: string
    nombre: string
    tamaño: number
    tipo: string
    archivo: File
}

// Interfaz para items de estaciones
interface EstacionItem {
    id: string
    nombre: string
    seleccionado: boolean
    descripcion?: string
}

// Interfaz para configuración de estaciones
export interface ConfiguracionEstaciones {
    cajas: {
        activo: boolean
        items: EstacionItem[]
    }
    drive: {
        activo: boolean
        items: EstacionItem[]
    }
    heladeria: {
        activo: boolean
        items: EstacionItem[]
    }
    pickUp: boolean
    delivery: {
        activo: boolean
        agregadores: boolean
        canalPropio: boolean
    }
    kioscos: {
        activo: boolean
        items: EstacionItem[]
    }
    kds: boolean
    kdsItems: {
        kds1: boolean
        kds2: boolean
        kds3: boolean
        kdsPersonalizado: boolean
        kdsPersonalizadoNombre: string
    }
    impresoraLinea: boolean
    impresoraLineaDomi: boolean
    impresoraBar: boolean
    impresoraCocina: boolean
    impresoraParrilla: boolean
    impresoraPersonalizada: boolean
    impresoraPersonalizadaNombre: string
}

const NuevaTienda: React.FC = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [adjuntos, setAdjuntos] = useState<ArchivoAdjunto[]>([])
    const [categoriasDisponibles, setCategoriasDisponibles] = useState<Array<{ id: string; nombre: string; codigo: string }>>([])
    const [tecnicos, setTecnicos] = useState<User[]>([])

    const [configEstaciones, setConfigEstaciones] = useState<ConfiguracionEstaciones>({
        cajas: {
            activo: false,
            items: [
                { id: 'caja1', nombre: 'Caja 1', seleccionado: false },
                { id: 'caja2', nombre: 'Caja 2', seleccionado: false },
                { id: 'caja3', nombre: 'Caja 3', seleccionado: false, descripcion: '' },
                { id: 'caja4', nombre: 'Caja 4', seleccionado: false, descripcion: '' },
                { id: 'caja5', nombre: 'Caja 5', seleccionado: false, descripcion: '' }
            ]
        },
        drive: {
            activo: false,
            items: [
                { id: 'drive1', nombre: 'Drive 1', seleccionado: false },
                { id: 'drive2', nombre: 'Drive 2', seleccionado: false },
                { id: 'drive3', nombre: 'Drive 3', seleccionado: false, descripcion: '' },
                { id: 'drive4', nombre: 'Drive 4', seleccionado: false, descripcion: '' }
            ]
        },
        heladeria: {
            activo: false,
            items: [
                { id: 'hela1', nombre: 'Heladería 1', seleccionado: false },
                { id: 'hela2', nombre: 'Heladería 2', seleccionado: false, descripcion: '' },
                { id: 'hela3', nombre: 'Heladería 3', seleccionado: false, descripcion: '' },
                { id: 'hela4', nombre: 'Heladería 4', seleccionado: false, descripcion: '' }
            ]
        },
        pickUp: false,
        delivery: {
            activo: false,
            agregadores: false,
            canalPropio: false
        },
        kioscos: {
            activo: false,
            items: [
                { id: 'kiosco1', nombre: 'Kiosco 1', seleccionado: false },
                { id: 'kiosco2', nombre: 'Kiosco 2', seleccionado: false },
                { id: 'kiosco3', nombre: 'Kiosco 3', seleccionado: false },
                { id: 'kiosco4', nombre: 'Kiosco 4', seleccionado: false },
                { id: 'kiosco5', nombre: 'Kiosco 5', seleccionado: false },
                { id: 'kiosco6', nombre: 'Kiosco 6', seleccionado: false },
                { id: 'kiosco7', nombre: 'Kiosco 7', seleccionado: false },
                { id: 'kiosco8', nombre: 'Kiosco 8', seleccionado: false },
                { id: 'kiosco9', nombre: 'Kiosco 9', seleccionado: false },
                { id: 'kiosco10', nombre: 'Kiosco 10', seleccionado: false }
            ]
        },
        kds: false,
        kdsItems: {
            kds1: false,
            kds2: false,
            kds3: false,
            kdsPersonalizado: false,
            kdsPersonalizadoNombre: ''
        },
        impresoraLinea: false,
        impresoraLineaDomi: false,
        impresoraBar: false,
        impresoraCocina: false,
        impresoraParrilla: false,
        impresoraPersonalizada: false,
        impresoraPersonalizadaNombre: ''
    })

    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        cadena: '',
        ruc: '',
        empresa: '',
        tipoImpuesto: 'Incluido' as 'Incluido' | 'Diferenciado',
        direccion: {
            calle: '',
            ciudad: '',
            provincia: ''
        },
        telefono: '',
        categoriaPrecioId: '',
        categoriaPrecioNombre: '',
        tipoServicio: 'FAST FOOD' as TipoServicio,
        fechaAperturaPlanificada: '',
        responsableId: ''
    })

    // Cargar técnicos (usuarios con rol CX)
    useEffect(() => {
        const cargarTecnicos = async () => {
            try {
                console.log('🔄 Cargando técnicos CX y Administradores para Nueva Tienda...')
                const usuariosRes = await usuariosService.getAll()
                console.log('📋 Usuarios recibidos:', usuariosRes?.length || 0)

                if (usuariosRes && usuariosRes.length > 0) {
                    const rolesDisponibles = [...new Set(usuariosRes.map((u: User) => u.role))]
                    console.log('📝 Roles disponibles:', rolesDisponibles)

                    // ✅ FILTRO: Incluye CX y ADMIN_MASTER
                    const tecnicosList = usuariosRes.filter((u: User) => {
                        const role = u.role?.toLowerCase()
                        return (role === 'cx' || role === 'admin_master') && u.activo === true
                    })

                    console.log('🔧 Técnicos/Admin encontrados:', tecnicosList.length)
                    setTecnicos(tecnicosList)

                    if (tecnicosList.length === 0) {
                        toast.warning('No hay técnicos CX o administradores disponibles')
                    }
                } else {
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

    // Efecto para cargar datos de la empresa cuando se selecciona una cadena
    useEffect(() => {
        if (formData.cadena && DATOS_EMPRESA_POR_CADENA[formData.cadena]) {
            const datos = DATOS_EMPRESA_POR_CADENA[formData.cadena]
            setFormData(prev => ({
                ...prev,
                ruc: datos.ruc,
                empresa: datos.empresa,
                tipoImpuesto: datos.tipoImpuesto
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                ruc: '',
                empresa: '',
                tipoImpuesto: 'Incluido'
            }))
        }
    }, [formData.cadena])

    const handleCadenaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cadenaId = e.target.value
        setFormData({
            ...formData,
            cadena: cadenaId,
            categoriaPrecioId: '',
            categoriaPrecioNombre: ''
        })

        if (cadenaId && CATEGORIAS_POR_CADENA[cadenaId]) {
            const categoriasUnicas = CATEGORIAS_POR_CADENA[cadenaId].filter((categoria, index, self) =>
                index === self.findIndex(c => c.nombre === categoria.nombre)
            )
            setCategoriasDisponibles(categoriasUnicas)
        } else {
            setCategoriasDisponibles([])
        }
    }

    const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const categoriaId = e.target.value
        const categoria = categoriasDisponibles.find(c => c.id === categoriaId)
        setFormData({
            ...formData,
            categoriaPrecioId: categoriaId,
            categoriaPrecioNombre: categoria?.nombre || ''
        })
    }

    const generarCodigoSugerido = () => {
        if (!formData.cadena) return ''
        const cadena = CADENAS.find(c => c.id === formData.cadena)
        if (!cadena) return ''
        const letra = cadena.letra
        const numero = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `${letra}${numero}`
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const nuevosAdjuntos: ArchivoAdjunto[] = []
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

    const getTecnicoNombre = () => {
        if (!formData.responsableId) return ''
        const tecnico = tecnicos.find(t => t._id === formData.responsableId)
        if (!tecnico) return ''
        return `${tecnico.nombre} ${tecnico.apellido || ''}`.trim()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!formData.codigo || !formData.nombre || !formData.cadena) {
            setError('Por favor completa los campos obligatorios')
            setLoading(false)
            return
        }

        try {
            console.log('📝 Datos del formulario:', formData)
            console.log('🔧 Configuración de estaciones:', configEstaciones)

            const configuracionesCompletas = {
                kds: configEstaciones.kds || configEstaciones.kdsItems.kds1 || configEstaciones.kdsItems.kds2 || configEstaciones.kdsItems.kds3 || configEstaciones.kdsItems.kdsPersonalizado,
                delivery: configEstaciones.delivery.activo,
                drive: configEstaciones.drive.activo,
                kioscos: configEstaciones.kioscos.activo,
                dragonTail: false,
                facturacionElectronica: false,
                lineaDomicilio: configEstaciones.impresoraLineaDomi,
                horarioAtencion: undefined
            }

            // ✅ IMPORTANTE: El campo responsableCX se envía correctamente
            const nuevaTienda = {
                codigo: formData.codigo,
                nombre: formData.nombre,
                cadena: formData.cadena,
                ruc: formData.ruc,
                empresa: formData.empresa,
                tipoImpuesto: formData.tipoImpuesto,
                direccion: formData.direccion.calle ? {
                    calle: formData.direccion.calle,
                    ciudad: formData.direccion.ciudad,
                    provincia: formData.direccion.provincia
                } : undefined,
                telefono: formData.telefono || undefined,
                categoriaPrecio: formData.categoriaPrecioNombre || undefined,
                tipoServicio: formData.tipoServicio,
                fechaAperturaPlanificada: formData.fechaAperturaPlanificada,
                responsableCX: formData.responsableId || undefined,  // ✅ Correcto
                estadoGeneral: 'pendiente' as const,
                progreso: 0,
                configuraciones: configuracionesCompletas,
                configuracionEstaciones: configEstaciones,  // ✅ Incluye pickUp y delivery.canalPropio
                responsables: {}
            }

            console.log('📤 Objeto a enviar:', JSON.stringify(nuevaTienda, null, 2))

            await tiendasService.create(nuevaTienda)

            toast.success('✅ Tienda creada exitosamente')
            navigate('/tiendas')

        } catch (error: any) {
            console.error('❌ Error creating tienda:', error)
            setError(error?.response?.data?.error || error?.message || 'Error al crear la tienda')
            toast.error(error?.response?.data?.error || 'Error al crear la tienda')
        } finally {
            setLoading(false)
        }
    }

    const codigoSugerido = generarCodigoSugerido()

    const actualizarItem = (
        categoria: 'cajas' | 'drive' | 'heladeria' | 'kioscos',
        itemId: string,
        cambios: Partial<EstacionItem>
    ) => {
        setConfigEstaciones(prev => ({
            ...prev,
            [categoria]: {
                ...prev[categoria],
                items: prev[categoria].items.map(item =>
                    item.id === itemId ? { ...item, ...cambios } : item
                )
            }
        }))
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        type="button"
                        onClick={() => navigate('/tiendas')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Nueva Tienda</h1>
                        <p className="text-gray-600 text-sm mt-1">Complete la información para crear una nueva tienda</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información Básica */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cadena <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.cadena}
                                    onChange={handleCadenaChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none"
                                    required
                                >
                                    <option value="">Seleccionar cadena</option>
                                    {CADENAS.map(cadena => (
                                        <option key={cadena.id} value={cadena.id}>
                                            {cadena.nombre} ({cadena.letra})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Código de tienda <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.codigo}
                                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                        placeholder={codigoSugerido || "Ej: K125"}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none"
                                        required
                                    />
                                </div>
                                {codigoSugerido && !formData.codigo && (
                                    <p className="text-xs text-gray-500 mt-1">Sugerencia: {codigoSugerido}</p>
                                )}
                            </div>

                            <Input
                                label="Nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej: Quitumbe"
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    RUC <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.ruc}
                                    readOnly
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Empresa <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.empresa}
                                    readOnly
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Impuesto
                                </label>
                                <input
                                    type="text"
                                    value={formData.tipoImpuesto}
                                    readOnly
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                            </div>

                            <Input
                                label="Teléfono"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                placeholder="023456789"
                                icon={<PhoneIcon className="h-5 w-5" />}
                            />
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dirección</h3>
                        <div className="space-y-4">
                            <Input
                                label="Calle principal"
                                value={formData.direccion.calle}
                                onChange={(e) => setFormData({ ...formData, direccion: { ...formData.direccion, calle: e.target.value } })}
                                placeholder="Av. Principal y calle secundaria"
                                icon={<MapPinIcon className="h-5 w-5" />}
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

                    {/* Configuración de Estaciones */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Estaciones</h3>

                        {/* Cajas */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    checked={configEstaciones.cajas.activo}
                                    onChange={(e) => setConfigEstaciones({
                                        ...configEstaciones,
                                        cajas: { ...configEstaciones.cajas, activo: e.target.checked }
                                    })}
                                    className="w-5 h-5 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <label className="font-medium text-gray-700">Cajas</label>
                            </div>
                            {configEstaciones.cajas.activo && (
                                <div className="ml-8 space-y-3">
                                    {configEstaciones.cajas.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={item.seleccionado}
                                                onChange={(e) => actualizarItem('cajas', item.id, { seleccionado: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                            />
                                            <span className="text-sm text-gray-700 min-w-[60px]">{item.nombre}</span>
                                            {item.descripcion !== undefined && item.seleccionado && (
                                                <input
                                                    type="text"
                                                    value={item.descripcion}
                                                    onChange={(e) => actualizarItem('cajas', item.id, { descripcion: e.target.value })}
                                                    placeholder="Descripción"
                                                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-1 focus:ring-kfc-red/20 outline-none"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Drive */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    checked={configEstaciones.drive.activo}
                                    onChange={(e) => setConfigEstaciones({
                                        ...configEstaciones,
                                        drive: { ...configEstaciones.drive, activo: e.target.checked }
                                    })}
                                    className="w-5 h-5 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <label className="font-medium text-gray-700">Drive</label>
                            </div>
                            {configEstaciones.drive.activo && (
                                <div className="ml-8 space-y-3">
                                    {configEstaciones.drive.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={item.seleccionado}
                                                onChange={(e) => actualizarItem('drive', item.id, { seleccionado: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                            />
                                            <span className="text-sm text-gray-700 min-w-[60px]">{item.nombre}</span>
                                            {item.descripcion !== undefined && item.seleccionado && (
                                                <input
                                                    type="text"
                                                    value={item.descripcion}
                                                    onChange={(e) => actualizarItem('drive', item.id, { descripcion: e.target.value })}
                                                    placeholder="Descripción"
                                                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-1 focus:ring-kfc-red/20 outline-none"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Heladería */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    checked={configEstaciones.heladeria.activo}
                                    onChange={(e) => setConfigEstaciones({
                                        ...configEstaciones,
                                        heladeria: { ...configEstaciones.heladeria, activo: e.target.checked }
                                    })}
                                    className="w-5 h-5 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <label className="font-medium text-gray-700">Heladería</label>
                            </div>
                            {configEstaciones.heladeria.activo && (
                                <div className="ml-8 space-y-3">
                                    {configEstaciones.heladeria.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={item.seleccionado}
                                                onChange={(e) => actualizarItem('heladeria', item.id, { seleccionado: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                            />
                                            <span className="text-sm text-gray-700 min-w-[80px]">{item.nombre}</span>
                                            {item.descripcion !== undefined && item.seleccionado && (
                                                <input
                                                    type="text"
                                                    value={item.descripcion}
                                                    onChange={(e) => actualizarItem('heladeria', item.id, { descripcion: e.target.value })}
                                                    placeholder="Descripción"
                                                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-1 focus:ring-kfc-red/20 outline-none"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pick Up */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={configEstaciones.pickUp}
                                    onChange={(e) => setConfigEstaciones({ ...configEstaciones, pickUp: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <label className="font-medium text-gray-700">Pick Up</label>
                            </div>
                        </div>

                        {/* Delivery */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    checked={configEstaciones.delivery.activo}
                                    onChange={(e) => setConfigEstaciones({
                                        ...configEstaciones,
                                        delivery: { ...configEstaciones.delivery, activo: e.target.checked }
                                    })}
                                    className="w-5 h-5 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <label className="font-medium text-gray-700">Delivery</label>
                            </div>
                            {configEstaciones.delivery.activo && (
                                <div className="ml-8 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={configEstaciones.delivery.agregadores}
                                            onChange={(e) => setConfigEstaciones({
                                                ...configEstaciones,
                                                delivery: { ...configEstaciones.delivery, agregadores: e.target.checked }
                                            })}
                                            className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                        />
                                        <span className="text-sm text-gray-700">Agregadores</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={configEstaciones.delivery.canalPropio}
                                            onChange={(e) => setConfigEstaciones({
                                                ...configEstaciones,
                                                delivery: { ...configEstaciones.delivery, canalPropio: e.target.checked }
                                            })}
                                            className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                        />
                                        <span className="text-sm text-gray-700">Canal Propio</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Kioscos */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    checked={configEstaciones.kioscos.activo}
                                    onChange={(e) => setConfigEstaciones({
                                        ...configEstaciones,
                                        kioscos: { ...configEstaciones.kioscos, activo: e.target.checked }
                                    })}
                                    className="w-5 h-5 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <label className="font-medium text-gray-700">Kioscos</label>
                            </div>
                            {configEstaciones.kioscos.activo && (
                                <div className="ml-8 grid grid-cols-2 gap-2">
                                    {configEstaciones.kioscos.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={item.seleccionado}
                                                onChange={(e) => actualizarItem('kioscos', item.id, { seleccionado: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                            />
                                            <span className="text-sm text-gray-700">{item.nombre}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* KDS Múltiples */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <ComputerDesktopIcon className="h-5 w-5 text-gray-600" />
                                KDS (Kitchen Display System)
                            </h4>
                            <div className="ml-8 space-y-3">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={configEstaciones.kdsItems.kds1}
                                        onChange={(e) => setConfigEstaciones({
                                            ...configEstaciones,
                                            kdsItems: { ...configEstaciones.kdsItems, kds1: e.target.checked }
                                        })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <span className="text-sm text-gray-700">KDS 1</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={configEstaciones.kdsItems.kds2}
                                        onChange={(e) => setConfigEstaciones({
                                            ...configEstaciones,
                                            kdsItems: { ...configEstaciones.kdsItems, kds2: e.target.checked }
                                        })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <span className="text-sm text-gray-700">KDS 2</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={configEstaciones.kdsItems.kds3}
                                        onChange={(e) => setConfigEstaciones({
                                            ...configEstaciones,
                                            kdsItems: { ...configEstaciones.kdsItems, kds3: e.target.checked }
                                        })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <span className="text-sm text-gray-700">KDS 3</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={configEstaciones.kdsItems.kdsPersonalizado}
                                        onChange={(e) => setConfigEstaciones({
                                            ...configEstaciones,
                                            kdsItems: { ...configEstaciones.kdsItems, kdsPersonalizado: e.target.checked }
                                        })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <span className="text-sm text-gray-700">KDS Personalizado:</span>
                                    {configEstaciones.kdsItems.kdsPersonalizado && (
                                        <input
                                            type="text"
                                            value={configEstaciones.kdsItems.kdsPersonalizadoNombre}
                                            onChange={(e) => setConfigEstaciones({
                                                ...configEstaciones,
                                                kdsItems: { ...configEstaciones.kdsItems, kdsPersonalizadoNombre: e.target.value }
                                            })}
                                            placeholder="Nombre del KDS"
                                            className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-1 focus:ring-kfc-red/20 outline-none"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Impresoras */}
                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-medium text-gray-900 mb-3">Impresoras</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={configEstaciones.impresoraLinea}
                                        onChange={(e) => setConfigEstaciones({ ...configEstaciones, impresoraLinea: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <PrinterIcon className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Línea</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={configEstaciones.impresoraLineaDomi}
                                        onChange={(e) => setConfigEstaciones({ ...configEstaciones, impresoraLineaDomi: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <PrinterIcon className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Línea Domi</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={configEstaciones.impresoraBar}
                                        onChange={(e) => setConfigEstaciones({ ...configEstaciones, impresoraBar: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <PrinterIcon className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Bar</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={configEstaciones.impresoraCocina}
                                        onChange={(e) => setConfigEstaciones({ ...configEstaciones, impresoraCocina: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <FireIcon className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Cocina</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={configEstaciones.impresoraParrilla}
                                        onChange={(e) => setConfigEstaciones({ ...configEstaciones, impresoraParrilla: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <FireIcon className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Parrilla</span>
                                </label>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <input
                                        type="checkbox"
                                        checked={configEstaciones.impresoraPersonalizada}
                                        onChange={(e) => setConfigEstaciones({ ...configEstaciones, impresoraPersonalizada: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                    />
                                    <PrinterIcon className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Personalizada:</span>
                                    {configEstaciones.impresoraPersonalizada && (
                                        <input
                                            type="text"
                                            value={configEstaciones.impresoraPersonalizadaNombre}
                                            onChange={(e) => setConfigEstaciones({ ...configEstaciones, impresoraPersonalizadaNombre: e.target.value })}
                                            placeholder="Nombre de la impresora"
                                            className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-1 focus:ring-kfc-red/20 outline-none"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configuración General */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración General</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Categoría de Precio <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <select
                                        value={formData.categoriaPrecioId}
                                        onChange={handleCategoriaChange}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none"
                                        required
                                        disabled={!formData.cadena || categoriasDisponibles.length === 0}
                                    >
                                        <option value="">Seleccionar categoría</option>
                                        {categoriasDisponibles.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.nombre} ({cat.codigo})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {!formData.cadena && (
                                    <p className="text-xs text-gray-500 mt-1">Primero selecciona una cadena</p>
                                )}
                                {formData.cadena && categoriasDisponibles.length === 0 && (
                                    <p className="text-xs text-yellow-600 mt-1">No hay categorías disponibles para esta cadena</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Servicio <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.tipoServicio}
                                    onChange={(e) => setFormData({ ...formData, tipoServicio: e.target.value as TipoServicio })}
                                    className="w-full px-3 py-2 border rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none"
                                    required
                                >
                                    {TIPOS_SERVICIO.map(tipo => (
                                        <option key={tipo} value={tipo}>{tipo}</option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label="Fecha de apertura"
                                type="date"
                                value={formData.fechaAperturaPlanificada}
                                onChange={(e) => setFormData({ ...formData, fechaAperturaPlanificada: e.target.value })}
                                icon={<CalendarIcon className="h-5 w-5" />}
                                required
                            />

                            {/* Responsable (Técnico CX) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Responsable (Técnico CX)
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <select
                                        value={formData.responsableId}
                                        onChange={(e) => setFormData({ ...formData, responsableId: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-kfc-red focus:ring-2 focus:ring-kfc-red/20 outline-none bg-white text-gray-900"
                                    >
                                        <option value="" className="text-gray-900">-- Seleccionar técnico CX --</option>
                                        {tecnicos.length === 0 ? (
                                            <option value="" disabled className="text-gray-400">⚠️ No hay técnicos CX disponibles</option>
                                        ) : (
                                            tecnicos.map((tecnico) => (
                                                <option key={tecnico._id} value={tecnico._id} className="text-gray-900">
                                                    👤 {tecnico.nombre} {tecnico.apellido || ''} - {tecnico.email}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                {tecnicos.length === 0 && (
                                    <p className="text-xs text-yellow-600 mt-1">
                                        ⚠️ No hay técnicos CX. Crea usuarios con rol "cx" en Admin → Usuarios
                                    </p>
                                )}
                                {formData.responsableId && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✅ Responsable: {getTecnicoNombre()}
                                    </p>
                                )}
                            </div>
                        </div>
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
                            onClick={() => navigate('/tiendas')}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                        >
                            Crear Tienda
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}

export default NuevaTienda