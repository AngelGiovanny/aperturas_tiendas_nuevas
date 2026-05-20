/**
 * Utilidades generales para el backend
 */

// Formatear fecha
const formatDate = (date, format = 'DD/MM/YYYY') => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return format
        .replace('DD', day)
        .replace('MM', month)
        .replace('YYYY', year);
};

// Días entre fechas
const daysBetween = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Generar código único
const generateCode = (prefix, length = 4) => {
    const random = Math.floor(Math.random() * Math.pow(10, length))
        .toString()
        .padStart(length, '0');
    return `${prefix}${random}`;
};

// Validar email
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Validar teléfono ecuatoriano
const isValidPhone = (phone) => {
    const re = /^(\+593|0)[0-9]{9}$/;
    return re.test(phone);
};

// Paginar resultados
const paginate = (page = 1, limit = 10) => {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    return { skip, limit: limitNum, page: pageNum };
};

// Sanitizar objeto (quitar undefined/null)
const sanitizeObject = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null && value !== '') {
            result[key] = value;
        }
    }
    return result;
};

module.exports = {
    formatDate,
    daysBetween,
    generateCode,
    isValidEmail,
    isValidPhone,
    paginate,
    sanitizeObject
};