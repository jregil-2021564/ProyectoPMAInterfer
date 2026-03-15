'use strict';

import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es obligatorio.'],
            trim: true,
            maxlength: [50, 'El nombre no puede tener más de 50 caracteres'],
        },
        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'El email no tiene un formato válido'],
        },
        password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
            minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
            select: false, // No se devuelve en queries por defecto
        },
        role: {
            type: String,
            default: 'ADMIN_ROLE',
            enum: {
                values: ['ADMIN_ROLE'],
                message: 'Este sistema solo permite administradores',
            },
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

// Ocultar password y __v en respuestas JSON
adminSchema.methods.toJSON = function () {
    const { password, __v, ...admin } = this.toObject();
    return admin;
};

export const Admin = mongoose.model('Admin', adminSchema);
