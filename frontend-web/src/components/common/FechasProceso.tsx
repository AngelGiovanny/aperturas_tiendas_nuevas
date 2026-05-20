import React from 'react';
import { Proceso, User } from '../../types';

interface FechasProcesoProps {
    proceso: Proceso;
}

const FechasProceso: React.FC<FechasProcesoProps> = ({ proceso }) => {
    const formatFecha = (fecha?: string) => {
        if (!fecha) return 'No definida';
        return new Date(fecha).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getNombreUsuario = (usuario?: User | string) => {
        if (!usuario) return 'No asignado';
        if (typeof usuario === 'string') return 'Usuario';
        return `${usuario.nombre} ${usuario.apellido || ''}`.trim();
    };

    return (
        <div className="fechas-container">
            <div className="fecha-item">
                <div className="fecha-label">Fecha de creación</div>
                <div className="fecha-valor">
                    {formatFecha(proceso.createdAt)}
                </div>
            </div>

            {proceso.fechas?.inicioReal && (
                <div className="fecha-item">
                    <div className="fecha-label">Fecha de inicio</div>
                    <div className="fecha-valor">
                        {formatFecha(proceso.fechas.inicioReal)}
                    </div>
                </div>
            )}

            {proceso.fechas?.finEstimado && (
                <div className="fecha-item">
                    <div className="fecha-label">Fecha límite</div>
                    <div className="fecha-valor">
                        {formatFecha(proceso.fechas.finEstimado)}
                        {proceso.estadoTiempo === 'atrasado' && (
                            <span className="estado-badge estado-atrasado" style={{ marginLeft: '10px' }}>
                ATRASADO
              </span>
                        )}
                    </div>
                </div>
            )}

            {proceso.equipo?.lider && (
                <div className="fecha-item">
                    <div className="fecha-label">Técnico asignado</div>
                    <div className="tecnico-asignado">
                        {getNombreUsuario(proceso.equipo.lider)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FechasProceso;