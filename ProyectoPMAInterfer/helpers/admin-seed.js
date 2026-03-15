'use strict';

import { Admin } from '../src/auth/admin.model.js';
import { hashPassword } from '../utils/password-utils.js';

export const ensureAdminUser = async () => {
    try {
        const adminEmail    = process.env.ADMIN_EMAIL    || 'jregil0re@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';

        let admin = await Admin.findOne({ email: adminEmail.toLowerCase() });

        if (!admin) {
            console.log('⚙️  Creando administrador por defecto...');

            const hashedPassword = await hashPassword(adminPassword);

            admin = await Admin.create({
                name:     'Administrador COPEREX',
                email:    adminEmail.toLowerCase(),
                password: hashedPassword,
                role:     'ADMIN_ROLE',
                status:   true,
            });

            console.log(`✅ Administrador creado: ${adminEmail}`);
        } else {
            console.log(`✅ Administrador ya existe: ${adminEmail}`);
        }
    } catch (error) {
        console.error('❌ Error en admin-seed:', error.message);
        throw error;
    }
};