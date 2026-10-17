CREATE DATABASE IF NOT EXISTS appointly;
USE appointly;


-- rol
-- Catalogo fijo de roles. Los subtipos (profesional, cliente) referencian
-- un id_rol constante via CHECK, ver mas abajo.

CREATE TABLE rol (
    id_rol INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE
);


-- especialidad

CREATE TABLE especialidad (
    id_especialidad INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL UNIQUE
);


-- obra_social

CREATE TABLE obra_social (
    id_obra_social INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre_obra_social VARCHAR(150) NOT NULL UNIQUE
);


-- persona
-- Quien es un humano. No tiene credenciales: esas viven en persona_rol.

CREATE TABLE persona (
    dni_persona INT UNSIGNED PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('M', 'F', 'X') NOT NULL,
    telefono VARCHAR(30),
    foto_url TEXT,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- persona_rol
-- Como se autentica una persona en un rol. Una fila = una cuenta.
-- PK compuesta (dni_persona, id_rol): una sola cuenta por persona y rol.
-- UNIQUE (correo, id_rol): el mismo correo puede reusarse en otro rol.
-- No hay estado de aprobacion: cliente se registra solo, y profesional y admin
-- se crean unicamente desde una invitacion, que ya es la autorizacion.

CREATE TABLE persona_rol (
    dni_persona INT UNSIGNED NOT NULL,
    id_rol INT UNSIGNED NOT NULL,
    correo VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    eliminado_en TIMESTAMP NULL DEFAULT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (dni_persona, id_rol),
    UNIQUE KEY uq_persona_rol_correo (correo, id_rol),
    FOREIGN KEY (dni_persona) REFERENCES persona(dni_persona) ON DELETE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);


-- profesional
-- Especializa persona_rol para el rol "profesional" (id_rol = 2, fijo).
-- La FK compuesta hacia persona_rol garantiza que no exista un profesional
-- sin su cuenta/rol asignado.

CREATE TABLE profesional (
    dni_profesional INT UNSIGNED PRIMARY KEY,
    id_rol INT UNSIGNED NOT NULL DEFAULT 2,
    numero_matricula VARCHAR(30) NOT NULL UNIQUE,
    duracion_turno_min INT UNSIGNED NOT NULL DEFAULT 30,
    FOREIGN KEY (dni_profesional, id_rol) REFERENCES persona_rol(dni_persona, id_rol) ON DELETE CASCADE,
    CONSTRAINT chk_profesional_rol CHECK (id_rol = 2)
);


-- cliente
-- Especializa persona_rol para el rol "cliente" (id_rol = 1, fijo).

CREATE TABLE cliente (
    dni_cliente INT UNSIGNED PRIMARY KEY,
    id_rol INT UNSIGNED NOT NULL DEFAULT 1,
    id_obra_social INT UNSIGNED,
    numero_afiliado VARCHAR(30),
    FOREIGN KEY (dni_cliente, id_rol) REFERENCES persona_rol(dni_persona, id_rol) ON DELETE CASCADE,
    FOREIGN KEY (id_obra_social) REFERENCES obra_social(id_obra_social),
    CONSTRAINT chk_cliente_rol CHECK (id_rol = 1)
);


-- profesional_especialidad (M:N)

CREATE TABLE profesional_especialidad (
    dni_profesional INT UNSIGNED NOT NULL,
    id_especialidad INT UNSIGNED NOT NULL,
    PRIMARY KEY (dni_profesional, id_especialidad),
    FOREIGN KEY (dni_profesional) REFERENCES profesional(dni_profesional) ON DELETE CASCADE,
    FOREIGN KEY (id_especialidad) REFERENCES especialidad(id_especialidad) ON DELETE CASCADE
);


-- obra_social_profesional (M:N)

CREATE TABLE obra_social_profesional (
    dni_profesional INT UNSIGNED NOT NULL,
    id_obra_social INT UNSIGNED NOT NULL,
    PRIMARY KEY (dni_profesional, id_obra_social),
    FOREIGN KEY (dni_profesional) REFERENCES profesional(dni_profesional) ON DELETE CASCADE,
    FOREIGN KEY (id_obra_social) REFERENCES obra_social(id_obra_social) ON DELETE CASCADE
);


-- horario_atencion
-- dia_semana: 0=domingo ... 6=sabado

CREATE TABLE horario_atencion (
    id_horario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dni_profesional INT UNSIGNED NOT NULL,
    dia_semana TINYINT UNSIGNED NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    FOREIGN KEY (dni_profesional) REFERENCES profesional(dni_profesional) ON DELETE CASCADE,
    CONSTRAINT chk_dia_semana CHECK (dia_semana BETWEEN 0 AND 6),
    CONSTRAINT chk_franja CHECK (hora_inicio < hora_fin)
);


-- turno
-- Sin constraint de unicidad (profesional + fecha + hora):
-- se valida en la capa de servicios del backend.

CREATE TABLE turno (
    id_turno INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha_turno DATE NOT NULL,
    hora_turno TIME NOT NULL,
    -- Ciclo de vida: pendiente_confirmacion -> confirmado -> en_espera -> en_curso
    -- -> completado. Salidas: ausente, reprogramado (movido antes de ocurrir),
    -- cancelado. Reglas de transicion en services/turnos.service.js.
    estado ENUM('pendiente_confirmacion', 'confirmado', 'en_espera', 'en_curso',
                'completado', 'ausente', 'reprogramado', 'cancelado')
        NOT NULL DEFAULT 'confirmado',
    dni_profesional INT UNSIGNED NOT NULL,
    dni_cliente INT UNSIGNED NOT NULL,
    -- Turno del que nace este (reprogramacion, o recupero de un ausente).
    id_turno_origen INT UNSIGNED NULL,
    motivo_cancelacion VARCHAR(255),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelado_en TIMESTAMP NULL DEFAULT NULL,
    completado_en TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (dni_profesional) REFERENCES profesional(dni_profesional),
    FOREIGN KEY (dni_cliente) REFERENCES cliente(dni_cliente),
    FOREIGN KEY (id_turno_origen) REFERENCES turno(id_turno) ON DELETE SET NULL,
    INDEX idx_turno_profesional_fecha (dni_profesional, fecha_turno),
    INDEX idx_turno_cliente (dni_cliente)
);


-- turno_evento
-- Historial de cambios de estado de un turno: quien lo hizo, desde que estado,
-- hacia cual y por que. estado_anterior es NULL en el alta del turno. dni_actor
-- y rol_actor son NULL cuando no se sabe quien fue (no se inventa el dato).
-- rol_actor se guarda aparte porque una persona puede tener varios roles.

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


-- invitacion
-- Invitaciones para crear cuentas con privilegios (hoy solo admin). El token
-- NUNCA se guarda en claro: solo su sha256 (token_hash). Una invitacion es
-- valida si usada_en IS NULL, revocada_en IS NULL y expira_en > NOW().
-- Se consume con un UPDATE atomico dentro de la misma transaccion que crea la
-- cuenta. dni_persona no tiene FK: la persona puede no existir todavia.
-- creado_por es NULL para invitaciones emitidas desde consola (primer admin).

CREATE TABLE invitacion (
    id_invitacion INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    token_hash CHAR(64) NOT NULL UNIQUE,
    dni_persona INT UNSIGNED NOT NULL,
    correo VARCHAR(255) NOT NULL,
    id_rol INT UNSIGNED NOT NULL,
    creado_por INT UNSIGNED NULL,
    creada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP NOT NULL,
    usada_en TIMESTAMP NULL DEFAULT NULL,
    revocada_en TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol),
    FOREIGN KEY (creado_por) REFERENCES persona(dni_persona) ON DELETE SET NULL,
    INDEX idx_invitacion_dni_rol (dni_persona, id_rol)
);
