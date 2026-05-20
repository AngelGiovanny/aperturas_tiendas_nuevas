const User = require('../models/User');
const Tienda = require('../models/Tienda');
const Proceso = require('../models/Proceso');
const notificationService = require('./notificationService');

/**
 * Servicio de asignación automática de responsables
 */
class AsignacionService {

    /**
     * Asigna un responsable de CX de forma aleatoria
     */
    async asignarCXAleatorio(tiendaId) {
        try {
            const usuariosCX = await User.find({
                role: 'cx',
                activo: true,
                area: 'cx'
            });

            if (usuariosCX.length === 0) {
                console.warn('⚠️ No hay usuarios CX disponibles para asignación');
                return null;
            }

            const randomIndex = Math.floor(Math.random() * usuariosCX.length);
            const asignado = usuariosCX[randomIndex];

            const tienda = await Tienda.findByIdAndUpdate(
                tiendaId,
                {
                    'responsables.cx': asignado._id,
                    'responsableCX': asignado._id
                },
                { new: true }
            );

            if (tienda) {
                await notificationService.crearNotificacion({
                    usuario: asignado._id,
                    tipo: 'asignacion',
                    titulo: 'Asignación CX automática',
                    mensaje: `Has sido asignado como responsable CX de la tienda ${tienda.codigo}`,
                    referencia: {
                        tipo: 'tienda',
                        id: tienda._id
                    }
                });
            }

            return asignado;

        } catch (error) {
            console.error('❌ Error en asignación CX:', error);
            throw error;
        }
    }

    /**
     * Asigna responsables por área
     */
    async asignarPorArea(area) {
        try {
            const roleMap = {
                'operaciones': 'operaciones',
                'infraestructura': 'infraestructura',
                'dsi': 'dsi',
                'contabilidad': 'contabilidad',
                'cx': 'cx',
                'trade': 'trade',
                'marketing': 'marketing',
                'mesa_servicio': 'mesa_servicio'
            };

            const rol = roleMap[area];
            if (!rol) return null;

            const usuarios = await User.find({
                role: rol,
                activo: true
            }).limit(1);

            return usuarios.length > 0 ? usuarios[0] : null;

        } catch (error) {
            console.error(`❌ Error asignando área ${area}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene carga de trabajo de un usuario
     */
    async getCargaTrabajo(userId) {
        try {
            const usuario = await User.findById(userId);
            if (!usuario) throw new Error('Usuario no encontrado');

            const area = usuario.area;
            const campoResponsable = `responsables.${area}`;

            const tiendasAsignadas = await Tienda.countDocuments({
                [campoResponsable]: userId,
                estadoGeneral: { $nin: ['completado', 'cerrado', 'cancelado'] }
            });

            const procesosPendientes = await Proceso.countDocuments({
                responsable: userId,
                estado: { $nin: ['completado', 'cerrado'] }
            });

            return {
                usuario: usuario.nombre,
                area,
                tiendasAsignadas,
                procesosPendientes,
                total: tiendasAsignadas + procesosPendientes
            };

        } catch (error) {
            console.error('❌ Error obteniendo carga de trabajo:', error);
            throw error;
        }
    }
}

module.exports = new AsignacionService();