import { format, formatDistance } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDate = (date: string | Date, pattern = 'dd/MM/yyyy') => {
    return format(new Date(date), pattern, { locale: es })
}

export const formatDateTime = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
}

export const formatRelativeTime = (date: string | Date) => {
    return formatDistance(new Date(date), new Date(), {
        addSuffix: true,
        locale: es
    })
}

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(value)
}

export const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})$/)
    if (match) {
        return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`
    }
    return phone
}

export const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const capitalizeWords = (str: string) => {
    return str.split(' ').map(capitalize).join(' ')
}

export const truncate = (str: string, length: number) => {
    if (str.length <= length) return str
    return str.substring(0, length) + '...'
}