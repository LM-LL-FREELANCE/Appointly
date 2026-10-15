-- 001_estado_cuenta_e_invitacion
-- Intencion: ver README.md de esta carpeta.
--
-- 1. persona_rol.estado reemplaza a profesional.estado_validacion, para que
--    el estado de aprobacion exista tambien para el rol admin (que no tiene
--    tabla propia).
-- 2. Tabla invitacion para altas de admin por token.
--
-- NO es idempotente: correla UNA sola vez sobre una DB creada con el
-- schema.sql anterior. Una DB nueva ya nace con estos cambios.

USE appointly;

-- 1. estado en persona_rol (default 'pendiente': falla cerrado).
ALTER TABLE persona_rol
    ADD COLUMN estado ENUM('pendiente', 'aprobado') NOT NULL DEFAULT 'pendiente'
    AFTER password_hash;

-- Cuentas existentes: todas estaban activas hasta ahora, salvo los
-- profesionales que no estuvieran 'aprobado' en estado_validacion.
UPDATE persona_rol SET estado = 'aprobado';

UPDATE persona_rol pr
    INNER JOIN profesional p
        ON p.dni_profesional = pr.dni_persona AND p.id_rol = pr.id_rol
    SET pr.estado = 'pendiente'
    WHERE p.estado_validacion <> 'aprobado';

ALTER TABLE profesional DROP COLUMN estado_validacion;

-- 2. invitacion
CREATE TABLE invitacion (
    id_invitacion INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    token_hash CHAR(64) NOT NULL UNIQUE,
    dni_persona INT UNSIGNED NOT NULL,
    correo VARCHAR(255) NOT NULL,
    id_rol INT UNSIGNED NOT NULL,
    creado_por INT UNSIGNED NOT NULL,
    creada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP NOT NULL,
    usada_en TIMESTAMP NULL DEFAULT NULL,
    revocada_en TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol),
    FOREIGN KEY (creado_por) REFERENCES persona(dni_persona) ON DELETE CASCADE,
    INDEX idx_invitacion_dni_rol (dni_persona, id_rol)
);
