'use strict';

import { Router } from 'express';
import { generateExcelReport } from './report.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

// Requiere autenticación para generar reportes
router.use(validateJWT);

/**
 * GET /api/v1/reports/excel
 * Descarga el reporte Excel con todas las empresas registradas
 */
router.get('/excel', generateExcelReport);

export default router;
