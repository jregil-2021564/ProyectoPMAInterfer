'use strict';

import mongoose from 'mongoose';

export const IMPACT_LEVELS = ['LOCAL', 'REGIONAL', 'NATIONAL', 'INTERNATIONAL'];
export const COMPANY_CATEGORIES = [
    'TECNOLOGÍA',
    'COMERCIO',
    'INDUSTRIA',
    'SERVICIOS',
    'SALUD',
    'EDUCACIÓN',
    'TURISMO',
    'AGRICULTURA',
    'CONSTRUCCIÓN',
    'FINANZAS',
    'OTRO',
];

const companySchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: [true, 'El nombre de la empresa es obligatorio'],
            trim: true,
            maxlength: [100, 'El nombre no puede tener más de 100 caracteres'],
        },
        businessName: {
            type: String,
            required: [true, 'La razón social es obligatoria'],
            trim: true,
            maxlength: [150, 'La razón social no puede tener más de 150 caracteres'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'La descripción no puede tener más de 500 caracteres'],
            default: '',
        },
        category: {
            type: String,
            required: [true, 'La categoría empresarial es obligatoria'],
            uppercase: true,
            trim: true,
            enum: {
                values: COMPANY_CATEGORIES,
                message: `La categoría debe ser una de: ${COMPANY_CATEGORIES.join(', ')}`,
            },
        },
        impactLevel: {
            type: String,
            required: [true, 'El nivel de impacto es obligatorio'],
            uppercase: true,
            trim: true,
            enum: {
                values: IMPACT_LEVELS,
                message: `El nivel de impacto debe ser uno de: ${IMPACT_LEVELS.join(', ')}`,
            },
        },
        yearsOfExperience: {
            type: Number,
            required: [true, 'Los años de trayectoria son obligatorios'],
            min: [0, 'Los años de trayectoria no pueden ser negativos'],
            max: [200, 'Los años de trayectoria no pueden superar 200'],
            validate: {
                validator: Number.isInteger,
                message: 'Los años de trayectoria deben ser un número entero',
            },
        },
        contactEmail: {
            type: String,
            required: [true, 'El email de contacto es obligatorio'],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'El email no tiene un formato válido'],
        },
        contactPhone: {
            type: String,
            required: [true, 'El teléfono de contacto es obligatorio'],
            trim: true,
            match: [/^\d{8,15}$/, 'El teléfono debe tener entre 8 y 15 dígitos'],
        },
        website: {
            type: String,
            trim: true,
            default: '',
            match: [
                /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$|^$/,
                'El sitio web no tiene un formato válido',
            ],
        },
        representativeName: {
            type: String,
            required: [true, 'El nombre del representante es obligatorio'],
            trim: true,
            maxlength: [100, 'El nombre del representante no puede tener más de 100 caracteres'],
        },
        representativePosition: {
            type: String,
            required: [true, 'El cargo del representante es obligatorio'],
            trim: true,
            maxlength: [80, 'El cargo no puede tener más de 80 caracteres'],
        },
        registeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            required: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Índices para búsquedas y ordenamiento eficiente
companySchema.index({ companyName: 1 });
companySchema.index({ category: 1 });
companySchema.index({ impactLevel: 1 });
companySchema.index({ yearsOfExperience: 1 });
companySchema.index({ status: 1 });

export const Company = mongoose.model('Company', companySchema);
