'use strict';

import { body, param, query } from 'express-validator';
import { IMPACT_LEVELS, COMPANY_CATEGORIES } from './company.model.js';

export const createCompanyValidators = [
    body('companyName')
        .notEmpty().withMessage('El nombre de la empresa es obligatorio.')
        .trim()
        .isLength({ max: 100 }).withMessage('El nombre no puede tener más de 100 caracteres.'),

    body('businessName')
        .notEmpty().withMessage('La razón social es obligatoria')
        .trim()
        .isLength({ max: 150 }).withMessage('La razón social no puede tener más de 150 caracteres.'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('La descripción no puede tener más de 500 caracteres.'),

    body('category')
        .notEmpty().withMessage('La categoría empresarial es obligatoria.')
        .toUpperCase()
        .isIn(COMPANY_CATEGORIES)
        .withMessage(`La categoría debe ser una de: ${COMPANY_CATEGORIES.join(', ')}`),

    body('impactLevel')
        .notEmpty().withMessage('El nivel de impacto es obligatorio.')
        .toUpperCase()
        .isIn(IMPACT_LEVELS)
        .withMessage(`El nivel de impacto debe ser uno de: ${IMPACT_LEVELS.join(', ')}`),

    body('yearsOfExperience')
        .notEmpty().withMessage('Los años de trayectoria son obligatorios.')
        .isInt({ min: 0, max: 200 })
        .withMessage('Los años de trayectoria deben ser un entero entre 0 y 200.')
        .toInt(),

    body('contactEmail')
        .notEmpty().withMessage('El email de contacto es obligatorio.')
        .isEmail().withMessage('El email de contacto no tiene un formato válido.')
        .normalizeEmail(),

    body('contactPhone')
        .notEmpty().withMessage('El teléfono de contacto es obligatorio')
        .matches(/^\d{8,15}$/).withMessage('El teléfono debe tener entre 8 y 15 dígitos'),

    body('website')
        .optional()
        .trim()
        .custom((value) => {
            if (!value) return true;
            const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
            if (!urlRegex.test(value)) throw new Error('El sitio web no tiene un formato válido');
            return true;
        }),

    body('representativeName')
        .notEmpty().withMessage('El nombre del representante es obligatorio')
        .trim()
        .isLength({ max: 100 }).withMessage('El nombre del representante no puede tener más de 100 caracteres'),

    body('representativePosition')
        .notEmpty().withMessage('El cargo del representante es obligatorio')
        .trim()
        .isLength({ max: 80 }).withMessage('El cargo no puede tener más de 80 caracteres'),
];

export const updateCompanyValidators = [
    param('id')
        .isMongoId().withMessage('El ID de la empresa no es válido'),

    body('companyName')
        .optional()
        .trim()
        .notEmpty().withMessage('El nombre no puede estar vacío')
        .isLength({ max: 100 }).withMessage('El nombre no puede tener más de 100 caracteres'),

    body('businessName')
        .optional()
        .trim()
        .notEmpty().withMessage('La razón social no puede estar vacía')
        .isLength({ max: 150 }).withMessage('La razón social no puede tener más de 150 caracteres'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('La descripción no puede tener más de 500 caracteres'),

    body('category')
        .optional()
        .toUpperCase()
        .isIn(COMPANY_CATEGORIES)
        .withMessage(`La categoría debe ser una de: ${COMPANY_CATEGORIES.join(', ')}`),

    body('impactLevel')
        .optional()
        .toUpperCase()
        .isIn(IMPACT_LEVELS)
        .withMessage(`El nivel de impacto debe ser uno de: ${IMPACT_LEVELS.join(', ')}`),

    body('yearsOfExperience')
        .optional()
        .isInt({ min: 0, max: 200 })
        .withMessage('Los años de trayectoria deben ser un entero entre 0 y 200')
        .toInt(),

    body('contactEmail')
        .optional()
        .isEmail().withMessage('El email de contacto no tiene un formato válido')
        .normalizeEmail(),

    body('contactPhone')
        .optional()
        .matches(/^\d{8,15}$/).withMessage('El teléfono debe tener entre 8 y 15 dígitos'),

    body('website')
        .optional()
        .trim()
        .custom((value) => {
            if (!value) return true;
            const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
            if (!urlRegex.test(value)) throw new Error('El sitio web no tiene un formato válido');
            return true;
        }),

    body('representativeName')
        .optional()
        .trim()
        .notEmpty().withMessage('El nombre del representante no puede estar vacío')
        .isLength({ max: 100 }).withMessage('El nombre del representante no puede tener más de 100 caracteres'),

    body('representativePosition')
        .optional()
        .trim()
        .notEmpty().withMessage('El cargo no puede estar vacío')
        .isLength({ max: 80 }).withMessage('El cargo no puede tener más de 80 caracteres'),
];

export const listCompaniesValidators = [
    query('category')
        .optional()
        .toUpperCase()
        .isIn(COMPANY_CATEGORIES)
        .withMessage(`Categoría inválida. Opciones: ${COMPANY_CATEGORIES.join(', ')}`),

    query('impactLevel')
        .optional()
        .toUpperCase()
        .isIn(IMPACT_LEVELS)
        .withMessage(`Nivel de impacto inválido. Opciones: ${IMPACT_LEVELS.join(', ')}`),

    query('minYears')
        .optional()
        .isInt({ min: 0 }).withMessage('minYears debe ser un entero >= 0')
        .toInt(),

    query('maxYears')
        .optional()
        .isInt({ min: 0 }).withMessage('maxYears debe ser un entero >= 0')
        .toInt(),

    query('sort')
        .optional()
        .isIn(['az', 'za', 'years_asc', 'years_desc'])
        .withMessage("sort debe ser 'az', 'za', 'years_asc' o 'years_desc'"),

    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('page debe ser >= 1')
        .toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100')
        .toInt(),
];

export const getCompanyByIdValidators = [
    param('id')
        .isMongoId().withMessage('El ID de la empresa no es válido'),
];
