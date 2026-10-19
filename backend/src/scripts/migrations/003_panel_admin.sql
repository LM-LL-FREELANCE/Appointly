-- 003_panel_admin
-- Intencion: base de datos del panel de administracion (PLAN_ADMIN.md §6):
-- configuracion del centro, avisos, bloqueos de agenda, historial de
-- comunicaciones, MFA para admins, auditoria de reasignaciones y estado de
-- cuenta (suspension reversible).
--
-- Corre DESPUES de 002_estados_turno (numeracion correlativa): asume
-- turno.estado con los ocho estados y no lo modifica.
--
-- NO es idempotente: correla UNA sola vez sobre una DB existente. Una DB
-- nueva ya nace con estos cambios (schema.sql) y NO debe correr esta migracion.
--
-- Funciona sobre los DOS linajes de persona_rol (con o sin la columna
-- `estado` que agrego la 001): solo agrega `suspendido_en` y no toca `estado`.

USE appointly;

-- 1. persona_rol: suspension reversible (la baja sigue siendo eliminado_en).
--    activa = eliminado_en IS NULL AND suspendido_en IS NULL.

ALTER TABLE persona_rol
    ADD COLUMN suspendido_en TIMESTAMP NULL DEFAULT NULL AFTER eliminado_en;


-- 2. configuracion (singleton: una sola fila, id = 1).
--    El model devuelve defaults seguros si la fila no existe.

CREATE TABLE configuracion (
    id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
    nombre_centro VARCHAR(150) NOT NULL DEFAULT '',
    telefono VARCHAR(30) NULL,
    email_institucional VARCHAR(255) NULL,
    direccion VARCHAR(255) NULL,
    anticipacion_reserva_min INT UNSIGNED NOT NULL DEFAULT 0,
    limite_cancelacion_horas INT UNSIGNED NOT NULL DEFAULT 0,
    dias_habiles JSON NULL,
    hora_apertura TIME NULL,
    hora_cierre TIME NULL,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    actualizado_por INT UNSIGNED NULL,
    CONSTRAINT chk_config_singleton CHECK (id = 1),
    FOREIGN KEY (actualizado_por) REFERENCES persona(dni_persona) ON DELETE SET NULL
);


-- 3. aviso: banners globales para todos los usuarios logueados.

CREATE TABLE aviso (
    id_aviso INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('info','advertencia','critico') NOT NULL DEFAULT 'info',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    vigente_desde DATE NULL,
    vigente_hasta DATE NULL,
    creado_por INT UNSIGNED NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creado_por) REFERENCES persona(dni_persona) ON DELETE SET NULL
);


-- 4. bloqueo_agenda: bloqueos de disponibilidad futura (centro o profesional).
--    dni_profesional NULL = bloqueo a nivel centro (afecta a todos).
--    hora_inicio/hora_fin NULL+NULL = dia completo.
--    Los turnos ya tomados dentro del bloqueo NO se cancelan solos.

CREATE TABLE bloqueo_agenda (
    id_bloqueo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dni_profesional INT UNSIGNED NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NULL,
    hora_fin TIME NULL,
    motivo VARCHAR(255) NULL,
    creado_por INT UNSIGNED NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dni_profesional) REFERENCES profesional(dni_profesional) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES persona(dni_persona) ON DELETE SET NULL,
    CONSTRAINT chk_bloqueo_horas CHECK (
        (hora_inicio IS NULL AND hora_fin IS NULL) OR
        (hora_inicio IS NOT NULL AND hora_fin IS NOT NULL AND hora_inicio < hora_fin)
    ),
    INDEX idx_bloqueo_fecha (fecha),
    INDEX idx_bloqueo_prof (dni_profesional, fecha)
);


-- 5. email_enviado: historial del centro de comunicaciones.

CREATE TABLE email_enviado (
    id_envio INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dni_admin INT UNSIGNED NULL,
    tipo ENUM('individual','masivo') NOT NULL,
    segmento VARCHAR(50) NULL,
    segmento_params JSON NULL,
    destinatarios JSON NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    exitos INT UNSIGNED NOT NULL DEFAULT 0,
    fallos INT UNSIGNED NOT NULL DEFAULT 0,
    asunto VARCHAR(255) NOT NULL,
    cuerpo TEXT NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dni_admin) REFERENCES persona(dni_persona) ON DELETE SET NULL,
    INDEX idx_envio_fecha (creado_en)
);


-- 6. mfa_codigo: codigos de 6 digitos para el segundo factor del admin.
--    Solo se guarda el sha256; el codigo viaja unicamente por email.

CREATE TABLE mfa_codigo (
    id_codigo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dni_persona INT UNSIGNED NOT NULL,
    codigo_hash CHAR(64) NOT NULL,
    expira_en TIMESTAMP NOT NULL,
    intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
    consumido_en TIMESTAMP NULL DEFAULT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dni_persona) REFERENCES persona(dni_persona) ON DELETE CASCADE,
    INDEX idx_mfa_vigente (dni_persona, consumido_en)
);


-- 7. turno_reasignacion: auditoria de cambios de profesional (admin).

CREATE TABLE turno_reasignacion (
    id_reasignacion INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_turno INT UNSIGNED NOT NULL,
    dni_prof_anterior INT UNSIGNED NOT NULL,
    dni_prof_nuevo INT UNSIGNED NOT NULL,
    motivo VARCHAR(255) NULL,
    creado_por INT UNSIGNED NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_turno) REFERENCES turno(id_turno) ON DELETE CASCADE,
    FOREIGN KEY (dni_prof_anterior) REFERENCES profesional(dni_profesional),
    FOREIGN KEY (dni_prof_nuevo) REFERENCES profesional(dni_profesional),
    FOREIGN KEY (creado_por) REFERENCES persona(dni_persona) ON DELETE SET NULL
);


-- 8. Catalogos maestros: habilitar/deshabilitar sin romper relaciones.

ALTER TABLE especialidad ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE obra_social ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;


-- 9. turno: indices de lectura para el monitor y las metricas. No toca
--    estado (eso lo hizo la 002_estados_turno) ni agrega columnas de estado:
--    el ausente se trackea por turno_evento.

ALTER TABLE turno
    ADD INDEX idx_turno_fecha (fecha_turno),
    ADD INDEX idx_turno_estado_fecha (estado, fecha_turno);
