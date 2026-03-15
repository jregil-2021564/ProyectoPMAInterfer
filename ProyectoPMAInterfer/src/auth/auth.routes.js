'use strict';

import { Router } from 'express';
import { login, getProfile } from './auth.controller.js';
import { loginValidators } from './auth.validators.js';
import { handleValidationErrors } from '../../middlewares/handle-validation-errors.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { authRateLimit } from '../../middlewares/rate-limit.js';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Rate limit + validaciones + controlador
 */
router.post(
    '/login',
    authRateLimit,
    loginValidators,
    handleValidationErrors,
    login
);

/**
 * GET /api/v1/auth/profile
 * Solo admins autenticados
 */
router.get('/profile', validateJWT, getProfile);

export default router;
