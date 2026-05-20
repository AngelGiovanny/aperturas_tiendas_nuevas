import React from 'react';
import {useNavigate} from "react-router-dom";
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import Card from "../common/Card";
import Badge from "../common/Badge";
import {Tienda} from "../../types";
import {ArrowRightIcon} from "@heroicons/react/24/outline";

interface TiendasTableProps {
    tiendas: Tienda[]
    title: string
}

const TiendasTable: React.FC<TiendasTableProps> = ({ tiendas, title }) => {
    const navigate = useNavigate()

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <button
                    onClick={() => navigate('/tiendas')}
                    className="text-kfc-red hover:text-kfc-red-dark text-sm font-medium flex items-center gap-1"
                >
                    Ver todas
                    <ArrowRightIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tienda
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ciudad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha Apertura
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progreso
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {tiendas.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                No hay tiendas para mostrar
                            </td>
                        </tr>
                    ) : (
                        tiendas.map((tienda) => (
                            <tr
                                key={tienda._id}
                                onClick={() => navigate(`/tiendas/${tienda._id}`)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-kfc-red">
                                    {tienda.codigo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {tienda.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {tienda.direccion?.ciudad}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {format(new Date(tienda.fechaAperturaPlanificada), 'dd/MM/yyyy', { locale: es })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge status={tienda.estadoGeneral} size="sm" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-kfc-red h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${tienda.progreso}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-gray-700">
                        {tienda.progreso}%
                      </span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

export default TiendasTable