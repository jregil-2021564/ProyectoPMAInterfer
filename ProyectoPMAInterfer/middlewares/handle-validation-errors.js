'use strict';

import { validationResult } from 'express-validator';

/**
 * Middleware: recoge los errores de express-validator y responde 400 si hay alguno
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Error de validación en los datos enviados',
            errors: errors.array().map((e) => ({
                field: e.path,
                message: e.msg,
                value: e.value,
            })),
        });
    }

    next();
};
