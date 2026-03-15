'use strict';

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { dbConnection } from '../configs/db.js';
import { globalRateLimit } from '../middlewares/rate-limit.js';
import { errorHandler, notFound } from '../middlewares/error-handler.js';

import authRoutes    from '../src/auth/auth.routes.js';
import companyRoutes from '../src/companies/company.routes.js';
import reportRoutes  from '../src/reports/report.routes.js';

const BASE_PATH = '/api/v1';

const applyMiddlewares = (app) => {
    app.use(express.json({ limit: '5mb' }));
    app.use(express.urlencoded({ extended: false, limit: '5mb' }));
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-token'],
    }));
    app.use(helmet());
    app.use(globalRateLimit);
    app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
};

const applyRoutes = (app) => {
    app.use(`${BASE_PATH}/auth`,      authRoutes);
    app.use(`${BASE_PATH}/companies`, companyRoutes);
    app.use(`${BASE_PATH}/reports`,   reportRoutes);

    // Health check
    app.get(`${BASE_PATH}/health`, (_req, res) => {
        res.status(200).json({
            status: 'Healthy',
            timestamp: new Date().toISOString(),
            service: 'COPEREX — Interfer API',
            version: '1.0.0',
        });
    });

    app.use(notFound);
};

export const initServer = async () => {
    const app  = express();
    const PORT = process.env.PORT || 3000;

    app.set('trust proxy', 1);

    try {
        // 1. Conectar a MongoDB
        await dbConnection();

        // 2. Sembrar administrador por defecto
       const { ensureAdminUser } = await import('../helpers/admin-seed.js');
        await ensureAdminUser();

        // 3. Middlewares y rutas
        applyMiddlewares(app);
        applyRoutes(app);

        // 4. Manejador de errores globales (siempre al final)
        app.use(errorHandler);

        app.listen(PORT, () => {
            console.log(`\n🚀 COPEREX Interfer API corriendo en el puerto ${PORT}`);
            console.log(`📋 Health: http://localhost:${PORT}${BASE_PATH}/health`);
            console.log(`🔐 Login:  POST http://localhost:${PORT}${BASE_PATH}/auth/login`);
            console.log(`🏢 Empresas: http://localhost:${PORT}${BASE_PATH}/companies`);
            console.log(`📊 Reporte:  http://localhost:${PORT}${BASE_PATH}/reports/excel\n`);
        });
    } catch (err) {
        console.error(`❌ Error iniciando servidor: ${err.message}`);
        process.exit(1);
    }
};
