-- 002_estados_turno
-- Intencion: ver README.md de esta carpeta.
--
-- 1. turno.estado pasa de (activo, cancelado, completado) a los ocho estados
--    del ciclo de vida. `activo` se renombra a `confirmado`.
-- 2. turno.id_turno_origen enlaza un turno con el que lo origino
--    (reprogramacion o recupero de un ausente).
-- 3. Tabla turno_evento: historial de cambios de estado con su autor.
--
-- NO es idempotente: correla UNA sola vez sobre una DB creada con el schema.sql
-- anterior. Una DB nueva ya nace con estos cambios. Hacer backup antes.
-- Los cancelados existentes no tienen evento: el autor es "desconocido".

USE appointly;

-- 1. Enum en tres pasos para no perder filas: agregar valores (conservando
-- `activo`), migrar los datos y recien entonces quitar `activo`.
ALTER TABLE turno
    MODIFY estado ENUM('activo', 'pendiente_confirmacion', 'confirmado', 'en_espera',
                       'en_curso', 'completado', 'ausente', 'reprogramado', 'cancelado')
        NOT NULL DEFAULT 'activo';

UPDATE turno SET estado = 'confirmado' WHERE estado = 'activo';

ALTER TABLE turno
    MODIFY estado ENUM('pendiente_confirmacion', 'confirmado', 'en_espera', 'en_curso',
                       'completado', 'ausente', 'reprogramado', 'cancelado')
        NOT NULL DEFAULT 'confirmado';

-- 2. Enlace con el turno de origen.
ALTER TABLE turno
    ADD COLUMN id_turno_origen INT UNSIGNED NULL AFTER dni_cliente,
    ADD CONSTRAINT fk_turno_origen
        FOREIGN KEY (id_turno_origen) REFERENCES turno(id_turno) ON DELETE SET NULL;

-- 3. Historial de estados.
CREATE TABLE turno_evento (
    id_evento INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_turno INT UNSIGNED NOT NULL,
    estado_anterior ENUM('pendiente_confirmacion', 'confirmado', 'en_espera', 'en_curso',
                         'completado', 'ausente', 'reprogramado', 'cancelado') NULL,
    estado_nuevo ENUM('pendiente_confirmacion', 'confirmado', 'en_espera', 'en_curso',
                      'completado', 'ausente', 'reprogramado', 'cancelado') NOT NULL,
    dni_actor INT UNSIGNED NULL,
    rol_actor ENUM('cliente', 'profesional', 'admin') NULL,
    motivo VARCHAR(255) NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_turno) REFERENCES turno(id_turno) ON DELETE CASCADE,
    INDEX idx_turno_evento_turno (id_turno, creado_en)
);
