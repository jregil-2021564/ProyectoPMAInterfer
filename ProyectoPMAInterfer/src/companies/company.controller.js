'use strict';

import { Company } from './company.model.js';
import { asyncHandler } from '../../middlewares/error-handler.js';

/**
 * POST /api/v1/companies
 * Registra una nueva empresa. No se permiten duplicados en:
 * companyName, businessName, contactEmail ni contactPhone.
 */
export const createCompany = asyncHandler(async (req, res) => {
    const {
        companyName,
        businessName,
        contactEmail,
        contactPhone,
    } = req.body;

    // Verificar duplicados con mensajes especificos por campo
    const [byName, byBusiness, byEmail, byPhone] = await Promise.all([
        Company.findOne({ companyName: { $regex: new RegExp(`^${companyName.trim()}$`, 'i') } }),
        Company.findOne({ businessName: { $regex: new RegExp(`^${businessName.trim()}$`, 'i') } }),
        Company.findOne({ contactEmail: contactEmail.toLowerCase().trim() }),
        Company.findOne({ contactPhone: contactPhone.trim() }),
    ]);

    if (byName) {
        return res.status(409).json({
            success: false,
            message: `Ya existe una empresa registrada con el nombre "${companyName}"`,
        });
    }

    if (byBusiness) {
        return res.status(409).json({
            success: false,
            message: `Ya existe una empresa registrada con la razon social "${businessName}"`,
        });
    }

    if (byEmail) {
        return res.status(409).json({
            success: false,
            message: `El email de contacto "${contactEmail}" ya esta registrado en otra empresa`,
        });
    }

    if (byPhone) {
        return res.status(409).json({
            success: false,
            message: `El telefono "${contactPhone}" ya esta registrado en otra empresa`,
        });
    }

    const company = await Company.create({
        ...req.body,
        registeredBy: req.adminId,
    });

    return res.status(201).json({
        success: true,
        message: 'Empresa registrada exitosamente',
        data: company,
    });
});

/**
 * GET /api/v1/companies
 * Lista todas las empresas con filtros, ordenamiento y paginacion.
 *
 * Query params:
 *   - category       : TECNOLOGIA | COMERCIO | ...
 *   - impactLevel    : LOCAL | REGIONAL | NATIONAL | INTERNATIONAL
 *   - minYears       : minimo de anos de trayectoria
 *   - maxYears       : maximo de anos de trayectoria
 *   - sort           : az | za | years_asc | years_desc
 *   - page           : numero de pagina (default 1)
 *   - limit          : resultados por pagina (default 10)
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

    // Filtros
    const filter = { status: true };

    if (category)    filter.category    = category;
    if (impactLevel) filter.impactLevel = impactLevel;

    if (minYears !== undefined || maxYears !== undefined) {
        filter.yearsOfExperience = {};
        if (minYears !== undefined) filter.yearsOfExperience.$gte = minYears;
        if (maxYears !== undefined) filter.yearsOfExperience.$lte = maxYears;
    }

    // Ordenamiento
    const sortMap = {
        az:         { companyName:       1 },
        za:         { companyName:      -1 },
        years_asc:  { yearsOfExperience: 1 },
        years_desc: { yearsOfExperience:-1 },
    };
    const sortQuery = sortMap[sort] || sortMap.az;

    // Paginacion
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
 * Obtiene el detalle de una empresa por su ID.
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
 * Edita los datos de una empresa.
 * Verifica duplicados en los campos unicos al actualizar.
 * No es posible eliminar empresas.
 */
export const updateCompany = asyncHandler(async (req, res) => {
    // Campos que no se pueden modificar desde el body
    const { status, registeredBy, ...updateData } = req.body;

    const company = await Company.findOne({ _id: req.params.id, status: true });

    if (!company) {
        return res.status(404).json({
            success: false,
            message: 'Empresa no encontrada',
        });
    }

    // Verificar duplicados solo si el campo viene en el body y es diferente al actual
    const checks = [];

    if (updateData.companyName && updateData.companyName.trim().toLowerCase() !== company.companyName.toLowerCase()) {
        checks.push(
            Company.findOne({
                companyName: { $regex: new RegExp(`^${updateData.companyName.trim()}$`, 'i') },
                _id: { $ne: company._id },
            }).then((found) => {
                if (found) throw { status: 409, message: `Ya existe una empresa con el nombre "${updateData.companyName}"` };
            })
        );
    }

    if (updateData.businessName && updateData.businessName.trim().toLowerCase() !== company.businessName.toLowerCase()) {
        checks.push(
            Company.findOne({
                businessName: { $regex: new RegExp(`^${updateData.businessName.trim()}$`, 'i') },
                _id: { $ne: company._id },
            }).then((found) => {
                if (found) throw { status: 409, message: `Ya existe una empresa con la razon social "${updateData.businessName}"` };
            })
        );
    }

    if (updateData.contactEmail && updateData.contactEmail.toLowerCase() !== company.contactEmail) {
        checks.push(
            Company.findOne({
                contactEmail: updateData.contactEmail.toLowerCase(),
                _id: { $ne: company._id },
            }).then((found) => {
                if (found) throw { status: 409, message: `El email "${updateData.contactEmail}" ya esta registrado en otra empresa` };
            })
        );
    }

    if (updateData.contactPhone && updateData.contactPhone !== company.contactPhone) {
        checks.push(
            Company.findOne({
                contactPhone: updateData.contactPhone,
                _id: { $ne: company._id },
            }).then((found) => {
                if (found) throw { status: 409, message: `El telefono "${updateData.contactPhone}" ya esta registrado en otra empresa` };
            })
        );
    }

    try {
        await Promise.all(checks);
    } catch (dupError) {
        return res.status(dupError.status || 409).json({
            success: false,
            message: dupError.message,
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