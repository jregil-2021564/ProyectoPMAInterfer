'use strict';

import { body } from 'express-validator';

export const loginValidators = [
    body('email')
        .notEmpty().withMessage('El email ess obligatorio')
        .isEmail().withMessage('El email no tiene un formato válido')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
];
