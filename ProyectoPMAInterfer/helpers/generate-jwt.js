'use strict';

import jwt from 'jsonwebtoken';

export const generateJWT = (uid) => {
    return new Promise((resolve, reject) => {
        const payload = { sub: uid };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION || '24h' },
            (err, token) => {
                if (err) {
                    console.error('Error generando JWT:', err);
                    reject(new Error('No se pudo generar el token'));
                } else {
                    resolve(token);
                }
            }
        );
    });
};

export const verifyJWT = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded);
        });
    });
};