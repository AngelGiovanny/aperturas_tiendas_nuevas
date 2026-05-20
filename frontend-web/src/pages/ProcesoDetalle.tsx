import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import FechasProceso from '../components/common/FechasProceso';
import ConfiguracionServicios from '../components/procesos/ConfiguracionServicios';
import { procesoService } from '../services/procesos';
import { Proceso, Tienda } from '../types';
import { refreshKanban } from '../hooks/useKanban'; // 👈 Importar
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    ClockIcon,
    CloudArrowUpIcon,
    PlayIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Type guard
const isTiendaObject = (tienda: string | Tienda): tienda is Tienda => {
    return typeof tienda !== 'string' && 'puntosEmision' in tienda;
};

const ProcesoDetalle: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [proceso, setProceso] = useState<Proceso | null>(null);
    const [loading, setLoading] = useState(true);
    const [checklist, setChecklist] = useState<any[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [tiempoEtapa, setTiempoEtapa] = useState<string>('0');

    useEffect(() => {
        if (id) {
            cargarProceso();
        }
    }, [id]);

    useEffect(() => {
        if (!proceso) return;

        const interval = setInterval(() => {
            if (proceso?.tiemposEtapa?.[proceso.estado as keyof typeof proceso.tiemposEtapa]?.inicio) {
                const inicio = new Date(proceso.tiemposEtapa[proceso.estado as keyof typeof proceso.tiemposEtapa]!.inicio!);
                const ahora = new Date();
                const diffMs = ahora.getTime() - inicio.getTime();
                const diffHoras = (diffMs / (1000 * 60 * 60)).toFixed(2);
                setTiempoEtapa(diffHoras);
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [proceso?.estado, proceso?.tiemposEtapa]);

    useEffect(() => {
        const guardarAntesDeSalir = (e: BeforeUnloadEvent) => {
            if (tieneCambiosSinGuardar()) {
                e.preventDefault();
                e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de salir?';
            }
        };

        window.addEventListener('beforeunload', guardarAntesDeSalir);
        return () => {
            window.removeEventListener('beforeunload', guardarAntesDeSalir);
            if (tieneCambiosSinGuardar()) {
                guardarChecklistCompleto();
            }
        };
    }, [checklist, proceso]);

    const cargarProceso = async () => {
        try {
            const response = await procesoService.getProceso(id!);
            if (response && response.data) {
                setProceso(response.data);
                setChecklist(response.data.checklist || []);

                if (response.data.tiemposEtapa?.[response.data.estado as keyof typeof response.data.tiemposEtapa]?.inicio) {
                    const inicio = new Date(response.data.tiemposEtapa[response.data.estado as keyof typeof response.data.tiemposEtapa]!.inicio!);
                    const ahora = new Date();
                    const diffMs = ahora.getTime() - inicio.getTime();
                    const diffHoras = (diffMs / (1000 * 60 * 60)).toFixed(2);
                    setTiempoEtapa(diffHoras);
                }
            }
        } catch (error) {
            console.error('Error cargando proceso:', error);
        } finally {
            setLoading(false);
        }
    };

    const tieneCambiosSinGuardar = () => {
        if (!proceso) return false;
        const originalStr = JSON.stringify(proceso.checklist);
        const actualStr = JSON.stringify(checklist);
        return originalStr !== actualStr;
    };

    const guardarChecklistCompleto = async () => {
        if (!id || !tieneCambiosSinGuardar()) return;

        setGuardando(true);
        try {
            await procesoService.actualizarChecklist(id, checklist);
            const response = await procesoService.getProceso(id);
            if (response?.data) {
                setProceso(response.data);
            }
            toast.success('Checklist guardado');
        } catch (error) {
            console.error('Error guardando checklist:', error);
            toast.error('Error al guardar');
        } finally {
            setGuardando(false);
        }
    };

    const handleChecklistChange = async (itemId: string, validado: boolean) => {
        const nuevosChecklist = checklist.map(item =>
            item._id === itemId ? { ...item, validado } : item
        );
        setChecklist(nuevosChecklist);

        setTimeout(() => {
            if (tieneCambiosSinGuardar()) {
                guardarChecklistCompleto();
            }
        }, 1000);
    };

    const handleIniciarProceso = async () => {
        try {
            await procesoService.iniciarProceso(id!);
            toast.success('Proceso iniciado');
            refreshKanban(); // 👈 Refrescar kanban
            if (proceso?.tienda && typeof proceso.tienda !== 'string') {
                navigate(`/tiendas/${proceso.tienda._id}`);
            } else {
                navigate(-1);
            }
        } catch (error) {
            console.error('Error iniciando proceso:', error);
            toast.error('Error al iniciar');
        }
    };

    const handlePasarRevision = async () => {
        const itemsRequeridos = checklist.filter((item: any) => item.requiereValidacion);
        const itemsPendientes = itemsRequeridos.filter((item: any) => !item.validado);

        if (itemsPendientes.length > 0) {
            toast.error(`Faltan ${itemsPendientes.length} items por validar`);
            return;
        }

        try {
            await procesoService.pasarARevision(id!);
            toast.success('Proceso en revisión');
            refreshKanban(); // 👈 Refrescar kanban
            if (proceso?.tienda && typeof proceso.tienda !== 'string') {
                navigate(`/tiendas/${proceso.tienda._id}`);
            } else {
                navigate(-1);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al pasar a revisión');
        }
    };

    const handleFinalizar = async () => {
        try {
            await procesoService.finalizarProceso(id!);
            toast.success('Proceso finalizado');
            refreshKanban(); // 👈 Refrescar kanban
            if (proceso?.tienda && typeof proceso.tienda !== 'string') {
                navigate(`/tiendas/${proceso.tienda._id}`);
            } else {
                navigate(-1);
            }
        } catch (error) {
            console.error('Error finalizando proceso:', error);
            toast.error('Error al finalizar');
        }
    };

    const handleValidarPunto = async (puntoId: string, validado: boolean) => {
        try {
            await fetch(`/api/procesos/${id}/validar-punto/${puntoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ validado })
            });
            await cargarProceso();
            refreshKanban(); // 👈 Refrescar kanban
        } catch (error) {
            console.error('Error validando punto:', error);
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch(estado) {
            case 'pendiente': return <ClockIcon className="h-5 w-5 text-gray-400" />;
            case 'en_proceso': return <PlayIcon className="h-5 w-5 text-blue-500" />;
            case 'pendiente_aprobacion': return <EyeIcon className="h-5 w-5 text-yellow-500" />;
            case 'completado': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            default: return <ClockIcon className="h-5 w-5 text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfc-red"></div>
                </div>
            </Layout>
        );
    }

    if (!proceso) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Proceso no encontrado</h2>
                    <Button
                        variant="primary"
                        onClick={() => navigate(-1)}
                        className="mt-4"
                        icon={<ArrowLeftIcon className="h-4 w-4" />}
                    >
                        Volver
                    </Button>
                </div>
            </Layout>
        );
    }

    const itemsRequeridos = checklist.filter((item: any) => item.requiereValidacion);
    const itemsValidados = itemsRequeridos.filter((item: any) => item.validado).length;
    const todosValidados = itemsRequeridos.length === itemsValidados;

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{proceso.nombre}</h1>
                        <p className="text-gray-600 text-sm mt-1">
                            {proceso.descripcion || 'Sin descripción'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {proceso.estado !== 'completado' && proceso.estado !== 'pendiente' && (
                            <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                <div className="text-xs text-gray-500">Tiempo en etapa</div>
                                <div className="font-mono font-bold flex items-center gap-1">
                                    {getEstadoIcon(proceso.estado)}
                                    <span>{tiempoEtapa} horas</span>
                                </div>
                            </div>
                        )}

                        {guardando && (
                            <div className="flex items-center text-sm text-gray-500">
                                <CloudArrowUpIcon className="h-4 w-4 animate-pulse mr-1" />
                                Guardando...
                            </div>
                        )}

                        <div className={`estado-badge estado-${proceso.estado}`}>
                            {proceso.estado?.replace('_', ' ') || 'Desconocido'}
                        </div>
                    </div>
                </div>

                <FechasProceso proceso={proceso} />

                <Card className="p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progreso del checklist</span>
                        <span className="text-sm text-gray-600">
                            {itemsValidados}/{itemsRequeridos} items requeridos
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-kfc-red h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${itemsRequeridos.length > 0
                                    ? (itemsValidados / itemsRequeridos.length) * 100
                                    : 0}%` }}
                        ></div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Checklist de Validación</h2>
                    <div className="space-y-3">
                        {checklist.map((item: any) => (
                            <div key={item._id} className={`checklist-item ${item.validado ? 'validado' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={item.validado}
                                    onChange={(e) => handleChecklistChange(item._id, e.target.checked)}
                                    disabled={proceso.estado !== 'en_proceso'}
                                    className="h-5 w-5 rounded border-gray-300 text-kfc-red focus:ring-kfc-red"
                                />
                                <div className="item-content">
                                    <div className="item-title">
                                        {item.item}
                                        {item.requiereValidacion && <span className="ml-2 text-xs text-red-500">*</span>}
                                    </div>
                                    {item.descripcion && <div className="item-desc">{item.descripcion}</div>}
                                    {item.observaciones && (
                                        <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                                            <span className="font-medium">Observación:</span> {item.observaciones}
                                        </div>
                                    )}
                                </div>
                                {item.tiempoEstimado && (
                                    <div className="flex items-center text-sm text-gray-500">
                                        <ClockIcon className="h-4 w-4 mr-1" />
                                        {item.tiempoEstimado}h
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {proceso.etapa === 'pre_apertura' && isTiendaObject(proceso.tienda) && (
                    <ConfiguracionServicios
                        tienda={proceso.tienda}
                        procesoId={proceso._id}
                        estadoProceso={proceso.estado}
                        onConfiguracionChange={(config) => console.log('Configuraciones:', config)}
                        onValidarPunto={handleValidarPunto}
                    />
                )}

                <div className="flex justify-end gap-4">
                    {tieneCambiosSinGuardar() && (
                        <Button
                            variant="outline"
                            onClick={guardarChecklistCompleto}
                            icon={<CloudArrowUpIcon className="h-4 w-4" />}
                            disabled={guardando}
                        >
                            {guardando ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    )}

                    {proceso.estado === 'pendiente' && (
                        <Button variant="primary" onClick={handleIniciarProceso} icon={<PlayIcon className="h-4 w-4" />}>
                            Iniciar Proceso
                        </Button>
                    )}

                    {proceso.estado === 'en_proceso' && todosValidados && (
                        <Button variant="primary" onClick={handlePasarRevision} icon={<EyeIcon className="h-4 w-4" />}>
                            Pasar a Revisión
                        </Button>
                    )}

                    {proceso.estado === 'pendiente_aprobacion' && (
                        <Button variant="primary" onClick={handleFinalizar} icon={<CheckCircleIcon className="h-4 w-4" />}>
                            Finalizar Apertura
                        </Button>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ProcesoDetalle;