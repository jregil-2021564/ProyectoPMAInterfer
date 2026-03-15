'use strict';

import { verifyJWT } from '../helpers/generate-jwt.js';
import { Admin } from '../src/auth/admin.model.js';

/**
 * Middleware: valida el JWT desde el header Authorization (Bearer token)
 */
export const validateJWT = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization') || req.header('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No hay token en la peticion. Formato requerido: Bearer <token>',
            });
        }

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'El token esta vacio',
            });
        }

        const decoded = await verifyJWT(token);

        const admin = await Admin.findById(decoded.sub).select('-password');

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Token no valido — el usuario no existe en base de datos',
            });
        }

        if (!admin.status) {
            return res.status(423).json({
                success: false,
                message: 'Cuenta desactivada. Contacta al administrador del sistema.',
            });
        }

        req.admin  = admin;
        req.adminId = admin._id.toString();

        next();
    } catch (error) {
        console.error('Error validando JWT:', error.name, error.message);

        const messageMap = {
            TokenExpiredError: 'El token ha expirado',
            JsonWebTokenError: 'Token invalido',
            NotBeforeError:    'Token aun no activo',
        };

        return res.status(401).json({
            success: false,
            message: messageMap[error.name] || 'Error al verificar el token',
            ...(process.env.NODE_ENV === 'development' && { detalle: error.message }),
        });
    }
};