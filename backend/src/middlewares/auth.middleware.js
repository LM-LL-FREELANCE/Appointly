// src/middlewares/auth.middleware.js

import { AppError } from "../utils/AppError.js";

/**
 * Middleware Stand-in para simular identidad mediante Headers
 */
export const identityStandIn = (req, res, next) => {
    // Leemos los headers personalizados (Express los pasa automáticamente a minúsculas)
    const dni = req.headers['x-user-dni'];
    const rol = req.headers['x-user-rol'];

    // Si no vienen en la petición, podemos asignar un valor por defecto o dejarlos como null
    req.user = {
        dni: dni ? String(dni) : null,
        rol: rol || 'guest'
    };

    // Le damos el pase al siguiente middleware o controlador
    next();
};

/**
 * Middleware opcional para proteger rutas que requieran roles específicos (ej. admin)
 */
export const grantAccess = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.rol)) {
            throw new AppError("No tenés permisos para realizar esta acción.", 403, "FORBIDDEN")
        }
        next();
    };
};