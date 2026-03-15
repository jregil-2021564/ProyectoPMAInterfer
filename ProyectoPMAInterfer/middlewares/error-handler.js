'use strict';

/**
 * Wrapper para funciones async — evita try/catch repetitivo
 * @param {Function} fn - Función async del controlador
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware 404 — ruta no encontrada
 */
export const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    });
};

/**
 * Middleware de errores globales
 */
export const errorHandler = (err, req, res, next) => {
    console.error('🔥 Error no controlado:', err);

    // Errores de validación de Mongoose
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: messages,
        });
    }

    // Duplicate key en MongoDB (ej. email único)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            success: false,
            message: `El valor '${err.keyValue[field]}' ya está registrado para el campo '${field}'`,
        });
    }

    // Cast error (ID de MongoDB inválido)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `ID inválido: ${err.value}`,
        });
    }

    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
