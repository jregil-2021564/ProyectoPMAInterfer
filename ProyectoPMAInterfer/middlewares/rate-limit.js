'use strict';

import rateLimit from 'express-rate-limit';

export const globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiadas peticiones desde esta IP. Intenta de nuevo en 15 minutos.',
    },
});

export const authRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 10 minutos.',
    },
});
