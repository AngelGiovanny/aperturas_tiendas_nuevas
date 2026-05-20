import { useState, useEffect } from 'react';
import {
    Search,
    Database,
    Server,
    MapPin,
    Tag,
    MoreVertical,
    Filter,
    Eye,
    Edit,
    Download,
    CheckCircle,
    Code,
    Wifi,
    HardDrive,
    AlertCircle
} from 'lucide-react';

// 👇 SI TIENES LOGO, descomenta esto y pon la ruta correcta
// import logoKfc from '../assets/images/logo-kfc.png';

// --- TIPOS (interfaz de datos) ---
interface ConexionBDD {
    rstid: string;
    titulo: string;
    ubicacion: string;
    servidor: string;
    puerto: number;
    nombre_bdd: string;
}

// --- COMPONENTE PRINCIPAL ---
const ConexionesBDD = () => {
    // --- ESTADO LOCAL (datos) ---
    const [conexiones, setConexiones] = useState<ConexionBDD[]>([]);
    const [busqueda, setBusqueda] = useState('k125');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    // --- SIMULACIÓN: AQUÍ CONECTARÁS CON TU API REAL ---
    useEffect(() => {
        // ESTO ES SOLO UN EJEMPLO. REEMPLAZA con tu llamada real a axios/fetch
        const cargarDatos = async () => {
            try {
                setCargando(true);

                // 🔥🔥🔥 AQUÍ VA TU LLAMADA REAL AL BACKEND 🔥🔥🔥
                // const respuesta = await axios.get('http://localhost:5000/api/conexiones');
                // setConexiones(respuesta.data);

                // --- DATOS DE EJEMPLO (BORRAR cuando conectes con tu API) ---
                setTimeout(() => {
                    setConexiones([
                        {
                            rstid: 'K125',
                            titulo: 'QUITUMBE SANTA MARIA',
                            ubicacion: '10.101.125.20',
                            servidor: 'MAXPOINT',
                            puerto: 1433,
                            nombre_bdd: 'MAXPOINT_K125'
                        },
                        {
                            rstid: 'CK06',
                            titulo: 'QUITUMBE SANTA MARIA',
                            ubicacion: '10.101.125.20',
                            servidor: 'MAXPOINT',
                            puerto: 1433,
                            nombre_bdd: 'MAXPOINT_K125'
                        }
                    ]);
                    setCargando(false);
                }, 500);
                // --- FIN DATOS DE EJEMPLO ---

            } catch (err) {
                setError('Error al cargar las conexiones');
                setCargando(false);
            }
        };

        cargarDatos();
    }, []); // Array vacío = se ejecuta 1 vez al montar el componente

    // --- FILTRO LOCAL (opcional, tu backend ya filtra por "k125") ---
    const conexionesFiltradas = busqueda
        ? conexiones.filter(conn =>
            conn.rstid.toLowerCase().includes(busqueda.toLowerCase()) ||
            conn.ubicacion.includes(busqueda) ||
            conn.nombre_bdd.toLowerCase().includes(busqueda.toLowerCase())
        )
        : conexiones;

    // --- SI ESTÁ CARGANDO ---
    if (cargando) {
        return (
            <div className="min-h-screen bg-kfc-white-off flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-kfc-red mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando conexiones...</p>
                </div>
            </div>
        );
    }

    // --- SI HAY ERROR ---
    if (error) {
        return (
            <div className="min-h-screen bg-kfc-white-off flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
                    <AlertCircle className="h-16 w-16 text-kfc-red mx-auto" />
                    <p className="mt-4 text-gray-800 font-semibold">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-kfc-red text-white px-6 py-2 rounded-full hover:bg-kfc-red-600 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    // --- VISTA PRINCIPAL (DASHBOARD) ---
    return (
        <div className="min-h-screen bg-kfc-white-off p-4 md:p-8">
            {/* Tarjeta principal */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-3xl shadow-kfc border border-kfc-red-100 overflow-hidden">

                    {/* 🟥 HEADER KFC */}
                    <div className="bg-gradient-to-r from-white to-kfc-red-50 p-6 border-b border-kfc-red-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                {/* Logo KFC */}
                                <div className="bg-kfc-red rounded-xl p-3 shadow-md">
                                    {/* 👇 SI YA GUARDASTE EL LOGO, usa este: */}
                                    {/* <img src={logoKfc} alt="KFC" className="h-10 w-auto" /> */}

                                    {/* 👇 MIENTRAS TANTO, usamos este icono */}
                                    <Database className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                        Conexiones <span className="text-kfc-red bg-kfc-red-50 px-3 py-1 rounded-full text-xl ml-2">BDD Locales</span>
                                    </h1>
                                    <p className="text-gray-600 mt-1 flex items-center gap-2">
                                        <HardDrive className="h-4 w-4 text-kfc-red" />
                                        Gestión de bases de datos - Grupo KFC
                                    </p>
                                </div>
                            </div>

                            {/* Badge versión */}
                            <div className="bg-gray-900 text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md">
                                <Code className="h-4 w-4" />
                                <span className="font-semibold text-sm">v2.0.5.3</span>
                                <span className="bg-kfc-red w-2 h-2 rounded-full ml-1 animate-pulse"></span>
                            </div>
                        </div>
                    </div>

                    {/* 🔍 BARRA DE BÚSQUEDA Y FILTROS */}
                    <div className="p-6 bg-white border-b border-gray-100">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="relative w-full sm:w-auto flex-1 max-w-lg">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-kfc-red" />
                                </div>
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Buscar por RSTID, ubicación, servidor..."
                                    className="w-full pl-12 pr-4 py-3 border-2 border-kfc-red-100 rounded-2xl focus:border-kfc-red focus:ring-2 focus:ring-kfc-red-200 transition-all outline-none bg-kfc-red-50/30"
                                />
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <button className="bg-kfc-red hover:bg-kfc-red-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold transition-all shadow-md hover:shadow-lg">
                                    <Filter className="h-5 w-5" />
                                    Filtrar
                                </button>

                                <div className="bg-kfc-red-50 px-5 py-3 rounded-2xl flex items-center gap-3 text-sm font-medium">
                  <span className="flex items-center gap-1">
                    <Database className="h-4 w-4 text-kfc-red" />
                      {conexionesFiltradas.length} registros
                  </span>
                                    <span className="text-gray-400">|</span>
                                    <span className="flex items-center gap-1">
                    <Filter className="h-4 w-4 text-kfc-red" />
                    Filtrado de {conexiones.length}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 📊 TABLA PRINCIPAL */}
                    {conexionesFiltradas.length === 0 ? (
                        <div className="text-center py-16">
                            <Database className="h-16 w-16 text-gray-300 mx-auto" />
                            <p className="mt-4 text-gray-500 text-lg">No se encontraron conexiones</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                {/* Cabeceras */}
                                <thead className="bg-kfc-red">
                                <tr>
                                    {['RSTID', 'Título', 'Ubicación', 'Servidor', 'Puerto', 'Base de Datos', 'Acciones'].map((header) => (
                                        <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                {header === 'RSTID' && <Tag className="h-4 w-4" />}
                                                {header === 'Ubicación' && <MapPin className="h-4 w-4" />}
                                                {header === 'Servidor' && <Server className="h-4 w-4" />}
                                                {header === 'Base de Datos' && <Database className="h-4 w-4" />}
                                                {header}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                                </thead>

                                {/* Cuerpo */}
                                <tbody className="divide-y divide-kfc-red-100">
                                {conexionesFiltradas.map((conexion, idx) => (
                                    <tr key={idx} className="hover:bg-kfc-red-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-kfc-red-50 border border-kfc-red-200 text-kfc-red-700 font-bold px-4 py-2 rounded-full text-sm">
                          {conexion.rstid}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {conexion.titulo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Wifi className="h-4 w-4 text-gray-500" />
                                                <span className="font-mono bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                            {conexion.ubicacion}
                          </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                            {conexion.servidor}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-gray-100 px-4 py-1.5 rounded-full text-sm font-mono">
                          {conexion.puerto}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="bg-kfc-red-50 px-4 py-1.5 rounded-full inline-block">
                                                <code className="text-kfc-red-700 font-bold text-sm">
                                                    {conexion.nombre_bdd}
                                                </code>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 hover:bg-kfc-red-100 rounded-lg transition-colors text-gray-600 hover:text-kfc-red">
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                                <button className="p-2 hover:bg-kfc-red-100 rounded-lg transition-colors text-gray-600 hover:text-kfc-red">
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                <button className="p-2 hover:bg-kfc-red-100 rounded-lg transition-colors text-gray-600 hover:text-kfc-red">
                                                    <Download className="h-5 w-5" />
                                                </button>
                                                <button className="p-2 hover:bg-kfc-red-100 rounded-lg transition-colors text-gray-600 hover:text-kfc-red">
                                                    <MoreVertical className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 📌 FOOTER CORPORATIVO */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-kfc-red" />
                            <span>© 2026 International Food Services - Grupo KFC</span>
                        </div>
                        <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Database className="h-3 w-3" />
                Todos los derechos reservados
              </span>
                            <span className="bg-kfc-red text-white px-4 py-1.5 rounded-full text-xs font-bold">
                Enterprise 2.0
              </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConexionesBDD;