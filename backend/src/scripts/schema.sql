CREATE DATABASE IF NOT EXISTS appointly;
USE appointly;
-- Identity model: profesional, cliente and admin are independent accounts.
-- Each role table owns its own dni, correo and password_hash, so the same
-- human may hold one account per role with different credentials.


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


-- profesional
-- Standalone account. es_admin lets a profesional also act as admin without a
-- separate staff account (see the admin table, which is a different concept).

CREATE TABLE profesional (
    dni_profesional INT UNSIGNED PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(30),
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('M', 'F', 'X') NOT NULL,
    foto_url TEXT,
    duracion_turno_min INT UNSIGNED NOT NULL DEFAULT 30,
    es_admin BOOLEAN NOT NULL DEFAULT FALSE,
    eliminado_en TIMESTAMP NULL DEFAULT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- cliente
-- Standalone account. id_obra_social is nullable: patients without coverage.
-- numero_afiliado is VARCHAR because affiliate numbers are alphanumeric and
-- carry significant leading zeros; it is only meaningful with an obra social.

CREATE TABLE cliente (
    dni_cliente INT UNSIGNED PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(30),
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('M', 'F', 'X') NOT NULL,
    foto_url TEXT,
    id_obra_social INT UNSIGNED,
    numero_afiliado VARCHAR(30),
    eliminado_en TIMESTAMP NULL DEFAULT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_obra_social) REFERENCES obra_social(id_obra_social)
);


-- admin
-- Dedicated staff account (e.g. a receptionist) with no profesional or cliente
-- record. Not to be confused with profesional.es_admin.

CREATE TABLE admin (
    dni_admin INT UNSIGNED PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(30),
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('M', 'F', 'X') NOT NULL,
    foto_url TEXT,
    eliminado_en TIMESTAMP NULL DEFAULT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    estado ENUM('activo', 'cancelado') NOT NULL DEFAULT 'activo',
    dni_profesional INT UNSIGNED NOT NULL,
    dni_cliente INT UNSIGNED NOT NULL,
    motivo_cancelacion VARCHAR(255),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelado_en TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (dni_profesional) REFERENCES profesional(dni_profesional),
    FOREIGN KEY (dni_cliente) REFERENCES cliente(dni_cliente),
    INDEX idx_turno_profesional_fecha (dni_profesional, fecha_turno),
    INDEX idx_turno_cliente (dni_cliente)
);
