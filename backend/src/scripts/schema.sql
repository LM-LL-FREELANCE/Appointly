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
    tipo VARCHAR(100) NOT NULL UNIQUE,
    activo TINYINT(1) NOT NULL DEFAULT 1
);


-- obra_social

CREATE TABLE obra_social (
    id_obra_social INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre_obra_social VARCHAR(150) NOT NULL UNIQUE,
    activo TINYINT(1) NOT NULL DEFAULT 1
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
    suspendido_en TIMESTAMP NULL DEFAULT NULL,
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
    estado ENUM('activo', 'cancelado', 'completado', 'ausente') NOT NULL DEFAULT 'activo',
    dni_profesional INT UNSIGNED NOT NULL,
    dni_cliente INT UNSIGNED NOT NULL,
    motivo_cancelacion VARCHAR(255),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelado_en TIMESTAMP NULL DEFAULT NULL,
    completado_en TIMESTAMP NULL DEFAULT NULL,
    ausente_en TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (dni_profesional) REFERENCES profesional(dni_profesional),
    FOREIGN KEY (dni_cliente) REFERENCES cliente(dni_cliente),
    INDEX idx_turno_profesional_fecha (dni_profesional, fecha_turno),
    INDEX idx_turno_cliente (dni_cliente),
    INDEX idx_turno_fecha (fecha_turno),
    INDEX idx_turno_estado_fecha (estado, fecha_turno)
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


-- configuracion
-- Singleton (fila unica, id = 1): datos del centro y politicas globales de
-- turnos. Si la fila no existe, el model devuelve defaults seguros.

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


-- aviso
-- Banners globales (publico: /api/avisos/activos). Un aviso es visible si
-- activo = 1 y CURDATE() cae dentro de [vigente_desde, vigente_hasta]
-- (NULL en un extremo = sin limite de ese lado).

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


-- bloqueo_agenda
-- Bloqueos de disponibilidad futura. dni_profesional NULL = centro (todos
-- los profesionales). hora_inicio/hora_fin NULL+NULL = dia completo.
-- Los turnos ya tomados dentro del bloqueo NO se cancelan solos: el admin
-- los ve en el monitor y los cancela o reasigna a mano.

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


-- email_enviado
-- Historial del centro de comunicaciones: quién envió, a quién y con qué
-- resultado (exitos/fallos del lote).

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


-- mfa_codigo
-- Segundo factor del admin: codigo de 6 digitos, TTL 10 min, maximo de
-- intentos. Solo se guarda el sha256; el codigo plano viaja por email.

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


-- turno_reasignacion
-- Auditoria de cambios de profesional hechos por un admin.

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
