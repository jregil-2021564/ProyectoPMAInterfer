'use strict';

import { Router } from 'express';
import {
    createCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
} from './company.controller.js';
import {
    createCompanyValidators,
    updateCompanyValidators,
    listCompaniesValidators,
    getCompanyByIdValidators,
} from './company.validators.js';
import { handleValidationErrors } from '../../middlewares/handle-validation-errors.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

// Todos los endpoints de empresas requieren autenticaciónn
router.use(validateJWT);

/**
 * POST /api/v1/companies
 * Registrar nueva empresa
 */
router.post(
    '/',
    createCompanyValidators,
    handleValidationErrors,
    createCompany
);

/**
 * GET /api/v1/companies
 * Listar empresas con filtros, ordenamiento y paginación
 */
router.get(
    '/',
    listCompaniesValidators,
    handleValidationErrors,
    getCompanies
);

/**
 * GET /api/v1/companies/:id
 * Detalle de una empresa
 */
router.get(
    '/:id',
    getCompanyByIdValidators,
    handleValidationErrors,
    getCompanyById
);

/**
 * PUT /api/v1/companies/:id
 * Editar empresa (sin eliminar)
 */
router.put(
    '/:id',
    updateCompanyValidators,
    handleValidationErrors,
    updateCompany
);

export default router;
