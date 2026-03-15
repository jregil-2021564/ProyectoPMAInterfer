'use strict';

import { Admin } from './admin.model.js';
import { verifyPassword } from '../../utils/password-utils.js';
import { generateJWT } from '../../helpers/generate-jwt.js';
import { asyncHandler } from '../../middlewares/error-handler.js';

/**
 * POST /api/v1/auth/login
 * Inicio de sesión exclusivo para administradores
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Buscar admin — incluir password explícitamente (select: false en schema)
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin) {
        return res.status(401).json({
            success: false,
            message: 'Credenciales incorrectas',
        });
    }

    if (!admin.status) {
        return res.status(423).json({
            success: false,
            message: 'Cuenta desactivada. Contacta al administrador del sistema.',
        });
    }

    const isPasswordValid = await verifyPassword(admin.password, password);

    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Credenciales incorrectas',
        });
    }

    const token = await generateJWT(admin._id.toString());

    return res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
            token,
            admin: admin.toJSON(),
        },
    });
});

/**
 * GET /api/v1/auth/profile
 * Obtiene el perfil del admin autenticado
 */
export const getProfile = asyncHandler(async (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: req.admin,
    });
});