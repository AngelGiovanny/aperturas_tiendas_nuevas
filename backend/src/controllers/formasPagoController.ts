// backend/src/controllers/formasPagoController.ts
import { Request, Response } from 'express'
import { FormaPago } from '../models/FormaPago'

// Obtener formas de pago por cadena
export const getFormasPagoByCadena = async (req: Request, res: Response) => {
    try {
        const { cadenaId } = req.params

        if (!cadenaId) {
            return res.status(400).json({
                success: false,
                error: 'El ID de la cadena es requerido'
            })
        }

        const formasPago = await FormaPago.find({
            cadenaId: cadenaId,
            activo: true
        }).sort({ orden: 1 })

        return res.status(200).json({
            success: true,
            data: formasPago.map(fp => ({
                id: fp.id,
                nombre: fp.nombre
            }))
        })
    } catch (error) {
        console.error('Error obteniendo formas de pago:', error)
        return res.status(500).json({
            success: false,
            error: 'Error al obtener las formas de pago'
        })
    }
}

// Crear una nueva forma de pago (para administración)
export const crearFormaPago = async (req: Request, res: Response) => {
    try {
        const { id, nombre, cadenaId, orden } = req.body

        const nuevaFormaPago = new FormaPago({
            id,
            nombre,
            cadenaId,
            orden: orden || 0
        })

        await nuevaFormaPago.save()

        return res.status(201).json({
            success: true,
            data: nuevaFormaPago
        })
    } catch (error) {
        console.error('Error creando forma de pago:', error)
        return res.status(500).json({
            success: false,
            error: 'Error al crear la forma de pago'
        })
    }
}

// Actualizar forma de pago
export const actualizarFormaPago = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { nombre, activo, orden } = req.body

        const formaPago = await FormaPago.findOne({ id })

        if (!formaPago) {
            return res.status(404).json({
                success: false,
                error: 'Forma de pago no encontrada'
            })
        }

        if (nombre) formaPago.nombre = nombre
        if (activo !== undefined) formaPago.activo = activo
        if (orden !== undefined) formaPago.orden = orden

        await formaPago.save()

        return res.status(200).json({
            success: true,
            data: formaPago
        })
    } catch (error) {
        console.error('Error actualizando forma de pago:', error)
        return res.status(500).json({
            success: false,
            error: 'Error al actualizar la forma de pago'
        })
    }
}

// Eliminar forma de pago (soft delete)
export const eliminarFormaPago = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        const formaPago = await FormaPago.findOneAndUpdate(
            { id },
            { activo: false },
            { new: true }
        )

        if (!formaPago) {
            return res.status(404).json({
                success: false,
                error: 'Forma de pago no encontrada'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Forma de pago eliminada correctamente'
        })
    } catch (error) {
        console.error('Error eliminando forma de pago:', error)
        return res.status(500).json({
            success: false,
            error: 'Error al eliminar la forma de pago'
        })
    }
}