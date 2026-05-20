// frontend-web/src/components/common/ListaArchivos.tsx
import React, { useState, useRef } from 'react'
import { PaperClipIcon, DocumentIcon, PhotoIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface ArchivoAdjunto {
    id: string
    nombre: string
    url: string
    tamaño: number
    tipo: string
    fechaSubida: string
    usuario?: string
}

interface ListaArchivosProps {
    archivos: ArchivoAdjunto[]
    onAgregarArchivo?: (archivo: ArchivoAdjunto) => void
    onEliminarArchivo?: (id: string) => void
    readonly?: boolean
    titulo?: string
    mostrarSubir?: boolean
    accept?: string
}

const ListaArchivos: React.FC<ListaArchivosProps> = ({
                                                         archivos = [],
                                                         onAgregarArchivo,
                                                         onEliminarArchivo,
                                                         readonly = false,
                                                         titulo = 'Archivos adjuntos',
                                                         mostrarSubir = true,
                                                         accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
                                                     }) => {
    const [subiendo, setSubiendo] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getFileIcon = (tipo: string) => {
        if (tipo.startsWith('image/')) return <PhotoIcon className="h-5 w-5 text-blue-500" />
        if (tipo === 'application/pdf') return <DocumentIcon className="h-5 w-5 text-red-500" />
        return <PaperClipIcon className="h-5 w-5 text-gray-500" />
    }

    const handleSubirArchivo = async () => {
        const file = fileInputRef.current?.files?.[0]
        if (!file) return

        setSubiendo(true)

        // Simular subida (aquí iría la llamada al backend)
        setTimeout(() => {
            const nuevoArchivo: ArchivoAdjunto = {
                id: Date.now().toString(),
                nombre: file.name,
                url: URL.createObjectURL(file),
                tamaño: file.size,
                tipo: file.type,
                fechaSubida: new Date().toISOString(),
                usuario: 'Usuario Actual'
            }

            if (onAgregarArchivo) {
                onAgregarArchivo(nuevoArchivo)
            }

            setSubiendo(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
            toast.success('Archivo subido correctamente')
        }, 500)
    }

    const handleEliminar = (id: string) => {
        if (onEliminarArchivo) {
            onEliminarArchivo(id)
            toast.success('Archivo eliminado')
        }
    }

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <PaperClipIcon className="h-4 w-4" />
                    {titulo} ({archivos.length})
                </h4>
                {mostrarSubir && !readonly && (
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleSubirArchivo}
                            accept={accept}
                            className="hidden"
                            multiple={false}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={subiendo}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                        >
                            {subiendo ? 'Subiendo...' : '+ Adjuntar'}
                        </button>
                    </div>
                )}
            </div>

            <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                {archivos.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No hay archivos adjuntos</p>
                ) : (
                    archivos.map((archivo) => (
                        <div key={archivo.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {getFileIcon(archivo.tipo)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {archivo.nombre}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatBytes(archivo.tamaño)} • {new Date(archivo.fechaSubida).toLocaleDateString()}
                                        {archivo.usuario && ` • ${archivo.usuario}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <a
                                    href={archivo.url}
                                    download={archivo.nombre}
                                    className="p-1 text-gray-500 hover:text-kfc-red transition-colors"
                                    title="Descargar"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                </a>
                                {!readonly && onEliminarArchivo && (
                                    <button
                                        onClick={() => handleEliminar(archivo.id)}
                                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                        title="Eliminar"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default ListaArchivos