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
    estado_validacion ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
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
    estado ENUM('activo', 'cancelado', 'completado') NOT NULL DEFAULT 'activo',
    dni_profesional INT UNSIGNED NOT NULL,
    dni_cliente INT UNSIGNED NOT NULL,
    motivo_cancelacion VARCHAR(255),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelado_en TIMESTAMP NULL DEFAULT NULL,
    completado_en TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (dni_profesional) REFERENCES profesional(dni_profesional),
    FOREIGN KEY (dni_cliente) REFERENCES cliente(dni_cliente),
    INDEX idx_turno_profesional_fecha (dni_profesional, fecha_turno),
    INDEX idx_turno_cliente (dni_cliente)
);
