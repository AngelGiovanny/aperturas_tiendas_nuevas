import React, { useEffect, useState } from 'react';
import Card from '../common/Card';
import { Tienda, PuntoEmision } from '../../types';
import {
    ComputerDesktopIcon,
    PrinterIcon,
    CreditCardIcon,
    ShoppingBagIcon,
    TruckIcon,
    RectangleGroupIcon,
    DocumentTextIcon,
    WifiIcon,
    CheckCircleIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

interface ConfiguracionServiciosProps {
    tienda: Tienda;
    procesoId: string;
    estadoProceso?: string;
    onConfiguracionChange?: (configuraciones: any) => void;
    onValidarPunto?: (puntoId: string, validado: boolean, observaciones?: string) => void;
}

const ConfiguracionServicios: React.FC<ConfiguracionServiciosProps> = ({
                                                                           tienda,
                                                                           procesoId,
                                                                           estadoProceso = '',
                                                                           onConfiguracionChange,
                                                                           onValidarPunto
                                                                       }) => {
    const [estaciones, setEstaciones] = useState<PuntoEmision[]>([]);
    const [configuracionesGuardadas, setConfiguracionesGuardadas] = useState<Record<string, boolean>>({});
    const [cargando, setCargando] = useState(true);
    const [modoRevision, setModoRevision] = useState(false);

    useEffect(() => {
        console.log('🔄 ConfiguracionServicios - Tienda recibida:', tienda);
        console.log('📍 Puntos de emisión:', tienda?.puntosEmision);
        console.log('⚙️ Configuraciones:', tienda?.configuraciones);
        console.log('📊 Estado del proceso:', estadoProceso);

        if (tienda?.puntosEmision && tienda.puntosEmision.length > 0) {
            setEstaciones(tienda.puntosEmision);
            cargarConfiguracionesGuardadas();
        } else {
            console.log('⚠️ No hay puntos de emisión en esta tienda');
        }

        // Activar modo revisión si el proceso está en pendiente_aprobacion
        setModoRevision(estadoProceso === 'pendiente_aprobacion');

        setCargando(false);
    }, [tienda, estadoProceso]);

    const cargarConfiguracionesGuardadas = async () => {
        try {
            const saved = localStorage.getItem(`config_proceso_${procesoId}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('📥 Configuraciones cargadas:', parsed);
                setConfiguracionesGuardadas(parsed);
            } else {
                // Inicializar configuraciones por defecto
                const initialConfig: Record<string, boolean> = {};
                if (tienda?.puntosEmision) {
                    tienda.puntosEmision.forEach(estacion => {
                        // Servicio de Tarjetas - Solo para cajas y drive
                        if (['caja', 'drive'].includes(estacion.tipo)) {
                            initialConfig[`${estacion.tipo}_${estacion.codigo}_tarjetas`] = false;
                        }

                        // Impresión Netcore - Todas excepto kioscos y pickup
                        if (!['kiosco', 'pickup'].includes(estacion.tipo)) {
                            initialConfig[`${estacion.tipo}_${estacion.codigo}_netcore`] = false;
                        }

                        // Dragon Tail - Solo cajas si está activo en tienda
                        if (estacion.tipo === 'caja' && tienda.configuraciones?.dragonTail) {
                            initialConfig[`${estacion.tipo}_${estacion.codigo}_dragontail`] = false;
                        }

                        // Kioscos - Solo para estaciones tipo kiosco
                        if (estacion.tipo === 'kiosco' && tienda.configuraciones?.kioscos) {
                            initialConfig[`${estacion.tipo}_${estacion.codigo}_kiosco`] = false;
                        }

                        // Checkbox de validación normal
                        initialConfig[`${estacion.tipo}_${estacion.codigo}_validado`] = false;

                        // Checkbox de validación en revisión
                        initialConfig[`punto_${estacion._id}_validado`] = false;
                    });
                }
                setConfiguracionesGuardadas(initialConfig);
            }
        } catch (error) {
            console.error('Error cargando configuraciones:', error);
        }
    };

    const handleConfigChange = (key: string, checked: boolean) => {
        console.log(`🔧 Cambio en ${key}:`, checked);
        const nuevasConfig = { ...configuracionesGuardadas, [key]: checked };
        setConfiguracionesGuardadas(nuevasConfig);
        localStorage.setItem(`config_proceso_${procesoId}`, JSON.stringify(nuevasConfig));

        if (onConfiguracionChange) {
            onConfiguracionChange(nuevasConfig);
        }
    };

    const handleValidarPunto = (puntoId: string, checked: boolean) => {
        handleConfigChange(`punto_${puntoId}_validado`, checked);

        if (onValidarPunto) {
            onValidarPunto(puntoId, checked, 'Validado en revisión');
        }
    };

    const debeTenerServicioTarjetas = (estacion: PuntoEmision) => {
        return ['caja', 'drive'].includes(estacion.tipo);
    };

    const debeTenerImpresionNetcore = (estacion: PuntoEmision) => {
        return !['kiosco', 'pickup'].includes(estacion.tipo);
    };

    const debeTenerDragonTail = (estacion: PuntoEmision) => {
        return estacion.tipo === 'caja' && tienda?.configuraciones?.dragonTail === true;
    };

    const debeTenerKioscos = (estacion: PuntoEmision) => {
        return estacion.tipo === 'kiosco' && tienda?.configuraciones?.kioscos === true;
    };

    // Agrupar estaciones por tipo
    const estacionesPorTipo = estaciones.reduce((acc, estacion) => {
        if (!acc[estacion.tipo]) {
            acc[estacion.tipo] = [];
        }
        acc[estacion.tipo].push(estacion);
        return acc;
    }, {} as Record<string, PuntoEmision[]>);

    const getTituloPorTipo = (tipo: string) => {
        const titulos: Record<string, string> = {
            caja: 'Cajas Registradoras',
            drive: 'Drive-Thru',
            kiosco: 'Kioscos de Autoservicio',
            pickup: 'Pick-Up',
            domicilio: 'Domicilio / Delivery',
            tablet: 'Tablets / Comandas'
        };
        return titulos[tipo] || tipo;
    };

    const getIconoPorTipo = (tipo: string) => {
        switch(tipo) {
            case 'caja': return <ComputerDesktopIcon className="h-5 w-5" />;
            case 'drive': return <TruckIcon className="h-5 w-5" />;
            case 'kiosco': return <RectangleGroupIcon className="h-5 w-5" />;
            case 'pickup': return <ShoppingBagIcon className="h-5 w-5" />;
            case 'domicilio': return <TruckIcon className="h-5 w-5" />;
            case 'tablet': return <DocumentTextIcon className="h-5 w-5" />;
            default: return <ComputerDesktopIcon className="h-5 w-5" />;
        }
    };

    if (cargando) {
        return (
            <Card className="p-6">
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kfc-red"></div>
                </div>
            </Card>
        );
    }

    if (estaciones.length === 0) {
        return (
            <Card className="p-6">
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <ComputerDesktopIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No hay estaciones configuradas para esta tienda</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Agrega puntos de emisión en la configuración de la tienda
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <ComputerDesktopIcon className="h-5 w-5 text-kfc-red" />
                        Configuración de Estaciones y Servicios
                    </h2>
                    {modoRevision && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            <EyeIcon className="h-4 w-4" />
                            En Revisión
                        </span>
                    )}
                </div>

                {Object.entries(estacionesPorTipo).map(([tipo, estacionesList]) => (
                    <div key={tipo} className="mb-8 last:mb-0">
                        <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
                            {getIconoPorTipo(tipo)}
                            {getTituloPorTipo(tipo)}
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {estacionesList.length} {estacionesList.length === 1 ? 'estación' : 'estaciones'}
                            </span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {estacionesList.map(estacion => (
                                <div
                                    key={estacion._id}
                                    className={`border rounded-lg p-4 transition-shadow bg-white ${
                                        modoRevision
                                            ? 'border-yellow-300 ring-1 ring-yellow-200'
                                            : 'hover:shadow-md'
                                    }`}
                                >
                                    {/* Header de la estación */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="font-medium text-gray-900">{estacion.nombre}</div>
                                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                {estacion.codigo && <div>Código: {estacion.codigo}</div>}
                                                {estacion.ip && <div>IP: {estacion.ip}</div>}
                                                {estacion.tid && <div>TID: {estacion.tid}</div>}
                                                {estacion.impresora && <div>Impresora: {estacion.impresora}</div>}
                                            </div>
                                        </div>
                                        {estacion.activo ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                                                <WifiIcon className="h-3 w-3" />
                                                Activa
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                                Inactiva
                                            </span>
                                        )}
                                    </div>

                                    {/* Servicios de la estación */}
                                    <div className="border-t pt-3 mt-2">
                                        <h4 className="text-xs font-medium text-gray-500 mb-2">SERVICIOS CONFIGURADOS</h4>
                                        <div className="space-y-2">
                                            {/* Servicio de Tarjetas */}
                                            {debeTenerServicioTarjetas(estacion) && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-gray-700">
                                                        <CreditCardIcon className="h-4 w-4 text-gray-500" />
                                                        Servicio de Tarjetas
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                        configuracionesGuardadas[`${tipo}_${estacion.codigo}_tarjetas`]
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {configuracionesGuardadas[`${tipo}_${estacion.codigo}_tarjetas`]
                                                            ? 'Configurado'
                                                            : 'Pendiente'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Impresión Netcore */}
                                            {debeTenerImpresionNetcore(estacion) && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-gray-700">
                                                        <PrinterIcon className="h-4 w-4 text-gray-500" />
                                                        Impresión Netcore
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                        configuracionesGuardadas[`${tipo}_${estacion.codigo}_netcore`]
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {configuracionesGuardadas[`${tipo}_${estacion.codigo}_netcore`]
                                                            ? 'Configurado'
                                                            : 'Pendiente'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Dragon Tail */}
                                            {debeTenerDragonTail(estacion) && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-gray-700">
                                                        <RectangleGroupIcon className="h-4 w-4 text-gray-500" />
                                                        Dragon Tail
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                        configuracionesGuardadas[`${tipo}_${estacion.codigo}_dragontail`]
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {configuracionesGuardadas[`${tipo}_${estacion.codigo}_dragontail`]
                                                            ? 'Configurado'
                                                            : 'Pendiente'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Kioscos */}
                                            {debeTenerKioscos(estacion) && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-gray-700">
                                                        <RectangleGroupIcon className="h-4 w-4 text-gray-500" />
                                                        Kiosco User
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                        configuracionesGuardadas[`${tipo}_${estacion.codigo}_kiosco`]
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {configuracionesGuardadas[`${tipo}_${estacion.codigo}_kiosco`]
                                                            ? 'Configurado'
                                                            : 'Pendiente'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sección de Validación en Revisión */}
                                    {modoRevision && (
                                        <div className="border-t pt-3 mt-3 bg-yellow-50 -mx-4 px-4 pb-3 rounded-b-lg">
                                            <h4 className="text-xs font-medium text-yellow-700 mb-2 flex items-center gap-1">
                                                <EyeIcon className="h-3 w-3" />
                                                VALIDACIÓN EN REVISIÓN
                                            </h4>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={configuracionesGuardadas[`punto_${estacion._id}_validado`] || false}
                                                    onChange={(e) => handleValidarPunto(estacion._id!, e.target.checked)}
                                                    className="rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                                />
                                                <CheckCircleIcon className="h-4 w-4 text-gray-500" />
                                                Validar configuración
                                            </label>
                                        </div>
                                    )}

                                    {/* Checkbox de validación normal (solo visible fuera de revisión) */}
                                    {!modoRevision && (
                                        <div className="border-t pt-3 mt-3">
                                            <label className="flex items-center gap-2 text-sm font-medium">
                                                <input
                                                    type="checkbox"
                                                    checked={configuracionesGuardadas[`${tipo}_${estacion.codigo}_validado`] || false}
                                                    onChange={(e) => handleConfigChange(`${tipo}_${estacion.codigo}_validado`, e.target.checked)}
                                                    className="rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                                />
                                                <CheckCircleIcon className="h-4 w-4 text-gray-500" />
                                                Marcar como configurado
                                            </label>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </Card>
        </div>
    );
};

export default ConfiguracionServicios;