'use strict';

import { Company } from './company.model.js';
import { asyncHandler } from '../../middlewares/error-handler.js';

/**
 * POST /api/v1/companies
 * Registra una nueva empresa en el sistema
 */
export const createCompany = asyncHandler(async (req, res) => {
    const companyData = {
        ...req.body,
        registeredBy: req.adminId,
    };

    const company = await Company.create(companyData);

    return res.status(201).json({
        success: true,
        message: 'Empresa registrada exitosamente',
        data: company,
    });
});

/**
 * GET /api/v1/companies
 * Lista todas las empresas con filtros, ordenamiento y paginación
 *
 * Query params:
 *   - category       : TECNOLOGÍA | COMERCIO | ...
 *   - impactLevel    : LOCAL | REGIONAL | NATIONAL | INTERNATIONAL
 *   - minYears       : número mínimo de años de trayectoria
 *   - maxYears       : número máximo de años de trayectoria
 *   - sort           : az | za | years_asc | years_desc
 *   - page           : número de página (default 1)
 *   - limit          : resultados por página (default 10)
 */
export const getCompanies = asyncHandler(async (req, res) => {
    const {
        category,
        impactLevel,
        minYears,
        maxYears,
        sort = 'az',
        page = 1,
        limit = 10,
    } = req.query;

    // ── Filtros ────────────────────────────────────────────────────────────────
    const filter = { status: true };

    if (category)     filter.category     = category;
    if (impactLevel)  filter.impactLevel  = impactLevel;

    if (minYears !== undefined || maxYears !== undefined) {
        filter.yearsOfExperience = {};
        if (minYears !== undefined) filter.yearsOfExperience.$gte = minYears;
        if (maxYears !== undefined) filter.yearsOfExperience.$lte = maxYears;
    }

    // ── Ordenamiento ───────────────────────────────────────────────────────────
    const sortMap = {
        az:         { companyName:        1 },
        za:         { companyName:       -1 },
        years_asc:  { yearsOfExperience:  1 },
        years_desc: { yearsOfExperience: -1 },
    };
    const sortQuery = sortMap[sort] || sortMap.az;

    // ── Paginación ─────────────────────────────────────────────────────────────
    const pageNum  = parseInt(page,  10);
    const limitNum = parseInt(limit, 10);
    const skip     = (pageNum - 1) * limitNum;

    const [companies, total] = await Promise.all([
        Company.find(filter)
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNum)
            .populate('registeredBy', 'name email'),
        Company.countDocuments(filter),
    ]);

    return res.status(200).json({
        success: true,
        message: 'Empresas obtenidas exitosamente',
        data: {
            companies,
            pagination: {
                total,
                page:       pageNum,
                limit:      limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNext:    pageNum < Math.ceil(total / limitNum),
                hasPrev:    pageNum > 1,
            },
        },
    });
});

/**
 * GET /api/v1/companies/:id
 * Obtiene el detalle de una empresa por su ID
 */
export const getCompanyById = asyncHandler(async (req, res) => {
    const company = await Company.findOne({ _id: req.params.id, status: true })
        .populate('registeredBy', 'name email');

    if (!company) {
        return res.status(404).json({
            success: false,
            message: 'Empresa no encontrada',
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Empresa obtenida exitosamente',
        data: company,
    });
});

/**
 * PUT /api/v1/companies/:id
 * Edita los datos de una empresa (sin poder eliminarla)
 */
export const updateCompany = asyncHandler(async (req, res) => {
    // Evitar que se modifiquen campos sensibles desde el body
    const { status, registeredBy, ...updateData } = req.body;

    const company = await Company.findOne({ _id: req.params.id, status: true });

    if (!company) {
        return res.status(404).json({
            success: false,
            message: 'Empresa no encontrada',
        });
    }

    const updated = await Company.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).populate('registeredBy', 'name email');

    return res.status(200).json({
        success: true,
        message: 'Empresa actualizada exitosamente',
        data: updated,
    });
});
