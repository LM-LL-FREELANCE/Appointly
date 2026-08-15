USE appointly;

-- rol
-- IDs fijos: 1=cliente, 2=profesional, 3=admin.
-- profesional.id_rol y cliente.id_rol dependen de este orden (ver CHECK en schema.sql).

INSERT INTO rol (id_rol, nombre) VALUES
(1, 'cliente'),
(2, 'profesional'),
(3, 'admin');


-- especialidad

INSERT INTO especialidad (id_especialidad, tipo) VALUES
(1, 'Kinesiologia'),
(2, 'Psicologia'),
(3, 'Nutricion'),
(4, 'Fonoaudiologia'),
(5, 'Terapia Ocupacional');


-- obra_social

INSERT INTO obra_social (id_obra_social, nombre_obra_social) VALUES
(1, 'OSDE'),
(2, 'Swiss Medical'),
(3, 'Galeno'),
(4, 'Sancor Salud'),
(5, 'IPS Salta'),
(6, 'Medife');


-- persona
-- Aguirre aparece una sola vez: es la misma persona que despues asume
-- el rol profesional Y el rol admin (Caso 2 del DER).

INSERT INTO persona
(dni_persona, nombre, apellido, fecha_nacimiento, genero, telefono, foto_url) VALUES
-- profesionales
(27845123, 'Martin',   'Aguirre',   '1979-03-12', 'M', '11-1000-0001', NULL),
(30156789, 'Carolina', 'Vega',      '1983-08-25', 'F', '11-1000-0002', NULL),
(28934567, 'Lucia',    'Fernandez', '1981-01-30', 'F', '11-1000-0003', NULL),
(33412890, 'Federico', 'Paz',       '1988-11-07', 'M', '11-1000-0004', NULL),
(31678234, 'Valeria',  'Quiroga',   '1986-05-19', 'F', '11-1000-0005', NULL),
-- clientes
(22456789, 'Ricardo',  'Sosa',       '1971-02-14', 'M', '11-1000-0006', NULL),
(23789012, 'Graciela', 'Moreno',     '1973-06-09', 'F', '11-1000-0007', NULL),
(24123456, 'Hugo',     'Cabrera',    '1974-09-21', 'M', '11-1000-0008', NULL),
(25890123, 'Silvia',   'Rojas',      '1976-12-03', 'F', '11-1000-0009', NULL),
(26345678, 'Oscar',    'Gimenez',    '1977-04-17', 'M', '11-1000-0010', NULL),
(27012345, 'Marta',    'Luna',       '1978-08-28', 'F', '11-1000-0011', NULL),
(28567890, 'Daniel',   'Castro',     '1980-01-11', 'M', '11-1000-0012', NULL),
(29234567, 'Patricia', 'Molina',     '1981-05-23', 'F', '11-1000-0013', NULL),
(30890123, 'Sergio',   'Herrera',    '1983-10-06', 'M', '11-1000-0014', NULL),
(31456789, 'Andrea',   'Dominguez',  '1985-03-15', 'F', '11-1000-0015', NULL),
(32123450, 'Pablo',    'Rios',       '1986-07-27', 'M', '11-1000-0016', NULL),
(32789016, 'Veronica', 'Acosta',     '1987-11-08', 'F', '11-1000-0017', NULL),
(33456782, 'Gustavo',  'Flores',     '1989-02-19', 'M', '11-1000-0018', NULL),
(34123458, 'Natalia',  'Benitez',    '1990-06-30', 'F', '11-1000-0019', NULL),
(34890124, 'Diego',    'Medina',     '1991-10-12', 'M', '11-1000-0020', NULL),
(35567890, 'Florencia','Ortiz',      '1992-01-24', 'F', '11-1000-0021', NULL),
(36234566, 'Matias',   'Suarez',     '1993-05-05', 'M', '11-1000-0022', NULL),
(36901232, 'Camila',   'Torres',     '1994-09-16', 'F', '11-1000-0023', NULL),
(37568908, 'Lucas',    'Ramirez',    '1995-12-28', 'M', '11-1000-0024', NULL),
(38235674, 'Julieta',  'Pereyra',    '1997-04-09', 'F', '11-1000-0025', NULL),
(38902340, 'Nicolas',  'Gomez',      '1998-08-20', 'M', '11-1000-0026', NULL),
(39569016, 'Agustina', 'Villalba',   '1999-11-01', 'F', '11-1000-0027', NULL),
(40235682, 'Tomas',    'Arias',      '2001-03-13', 'M', '11-1000-0028', NULL),
(40902348, 'Sofia',    'Ledesma',    '2002-07-25', 'F', '11-1000-0029', NULL),
(41569014, 'Bruno',    'Navarro',    '2003-10-06', 'M', '11-1000-0030', NULL),
(42235680, 'Martina',  'Cardozo',    '2004-01-18', 'F', '11-1000-0031', NULL),
(42902346, 'Joaquin',  'Ibarra',     '2005-05-29', 'M', '11-1000-0032', NULL),
(43569012, 'Valentina','Coronel',    '1996-09-10', 'F', '11-1000-0033', NULL),
(44235678, 'Ignacio',  'Maldonado',  '1984-12-22', 'M', '11-1000-0034', NULL),
(44902344, 'Rocio',    'Figueroa',   '1982-04-03', 'F', '11-1000-0035', NULL);


-- persona_rol
-- Cada fila es una cuenta (correo + password) para una persona en un rol dado.
-- Aguirre tiene DOS cuentas: profesional (id_rol=2) y admin (id_rol=3), con
-- correos distintos, para probar el path "profesional actuando como admin".

INSERT INTO persona_rol (dni_persona, id_rol, correo, password_hash) VALUES
-- profesionales (id_rol = 2)
(27845123, 2, 'martin.aguirre@appointly.dev',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(30156789, 2, 'carolina.vega@appointly.dev',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(28934567, 2, 'lucia.fernandez@appointly.dev',  '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(33412890, 2, 'federico.paz@appointly.dev',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(31678234, 2, 'valeria.quiroga@appointly.dev',  '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
-- admin (id_rol = 3) — Aguirre, cuenta separada de la profesional
(27845123, 3, 'martin.aguirre.admin@appointly.dev', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
-- clientes (id_rol = 1)
(22456789, 1, 'ricardo.sosa@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(23789012, 1, 'graciela.moreno@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(24123456, 1, 'hugo.cabrera@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(25890123, 1, 'silvia.rojas@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(26345678, 1, 'oscar.gimenez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(27012345, 1, 'marta.luna@mail.com',        '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(28567890, 1, 'daniel.castro@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(29234567, 1, 'patricia.molina@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(30890123, 1, 'sergio.herrera@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(31456789, 1, 'andrea.dominguez@mail.com',  '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(32123450, 1, 'pablo.rios@mail.com',        '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(32789016, 1, 'veronica.acosta@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(33456782, 1, 'gustavo.flores@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(34123458, 1, 'natalia.benitez@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(34890124, 1, 'diego.medina@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(35567890, 1, 'florencia.ortiz@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(36234566, 1, 'matias.suarez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(36901232, 1, 'camila.torres@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(37568908, 1, 'lucas.ramirez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(38235674, 1, 'julieta.pereyra@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(38902340, 1, 'nicolas.gomez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(39569016, 1, 'agustina.villalba@mail.com', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(40235682, 1, 'tomas.arias@mail.com',       '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(40902348, 1, 'sofia.ledesma@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(41569014, 1, 'bruno.navarro@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(42235680, 1, 'martina.cardozo@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(42902346, 1, 'joaquin.ibarra@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(43569012, 1, 'valentina.coronel@mail.com', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(44235678, 1, 'ignacio.maldonado@mail.com', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG'),
(44902344, 1, 'rocio.figueroa@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG');


-- profesional
-- numero_matricula: matricula profesional provincial (ficticia).
-- estado_validacion: todos ya validados, son datos de prueba activos.

INSERT INTO profesional
(dni_profesional, numero_matricula, estado_validacion, duracion_turno_min) VALUES
(27845123, 'MP-10234', 'aprobado', 30),
(30156789, 'MP-10589', 'aprobado', 30),
(28934567, 'MP-20147', 'aprobado', 30),
(33412890, 'MP-30456', 'aprobado', 30),
(31678234, 'MP-40812', 'aprobado', 30);


-- profesional_especialidad

INSERT INTO profesional_especialidad (dni_profesional, id_especialidad) VALUES
(27845123, 1),
(30156789, 1),
(30156789, 5),
(28934567, 2),
(33412890, 3),
(31678234, 4);


-- obra_social_profesional

INSERT INTO obra_social_profesional (dni_profesional, id_obra_social) VALUES
(27845123, 1), (27845123, 2), (27845123, 5),
(30156789, 1), (30156789, 3), (30156789, 4),
(28934567, 2), (28934567, 5), (28934567, 6),
(33412890, 1), (33412890, 4),
(31678234, 3), (31678234, 5), (31678234, 6);


-- cliente

INSERT INTO cliente
(dni_cliente, id_obra_social, numero_afiliado) VALUES
(22456789, 1,    'OS1-22456789/00'),
(23789012, 5,    'OS5-23789012/00'),
(24123456, 2,    'OS2-24123456/00'),
(25890123, 1,    'OS1-25890123/00'),
(26345678, NULL, NULL),
(27012345, 3,    'OS3-27012345/00'),
(28567890, 4,    'OS4-28567890/00'),
(29234567, 5,    'OS5-29234567/00'),
(30890123, 1,    'OS1-30890123/00'),
(31456789, NULL, NULL),
(32123450, 2,    'OS2-32123450/00'),
(32789016, 6,    'OS6-32789016/00'),
(33456782, 5,    'OS5-33456782/00'),
(34123458, 1,    'OS1-34123458/00'),
(34890124, 3,    'OS3-34890124/00'),
(35567890, 4,    'OS4-35567890/00'),
(36234566, NULL, NULL),
(36901232, 2,    'OS2-36901232/00'),
(37568908, 5,    'OS5-37568908/00'),
(38235674, 1,    'OS1-38235674/00'),
(38902340, 6,    'OS6-38902340/00'),
(39569016, 3,    'OS3-39569016/00'),
(40235682, NULL, NULL),
(40902348, 4,    'OS4-40902348/00'),
(41569014, 5,    'OS5-41569014/00'),
(42235680, 1,    'OS1-42235680/00'),
(42902346, 2,    'OS2-42902346/00'),
(43569012, NULL, NULL),
(44235678, 6,    'OS6-44235678/00'),
(44902344, 5,    'OS5-44902344/00');


-- horario_atencion
-- dia_semana: 0=domingo ... 6=sabado

INSERT INTO horario_atencion (dni_profesional, dia_semana, hora_inicio, hora_fin) VALUES
-- Aguirre (kinesiologia): lun/mie/vie maniana, lun/mie tarde
(27845123, 1, '08:00', '13:00'),
(27845123, 3, '08:00', '13:00'),
(27845123, 5, '08:00', '13:00'),
(27845123, 1, '16:00', '20:00'),
(27845123, 3, '16:00', '20:00'),
-- Vega (kinesiologia / terapia ocupacional): mar/jue maniana, vie tarde
(30156789, 2, '09:00', '14:00'),
(30156789, 4, '09:00', '14:00'),
(30156789, 5, '14:00', '18:00'),
-- Fernandez (psicologia): lun/mar/jue jornada larga
(28934567, 1, '10:00', '18:00'),
(28934567, 2, '10:00', '18:00'),
(28934567, 4, '10:00', '18:00'),
-- Paz (nutricion): mie/vie maniana, mar tarde
(33412890, 3, '09:00', '13:00'),
(33412890, 5, '09:00', '13:00'),
(33412890, 2, '15:00', '19:00'),
-- Quiroga (fonoaudiologia): lun/jue tarde
(31678234, 1, '14:00', '19:00'),
(31678234, 4, '14:00', '19:00');


-- turno
-- Fechas: semana del 15 al 19 de junio de 2026.
-- 15=lunes, 16=martes, 17=miercoles, 18=jueves, 19=viernes.
-- Todos los turnos caen dentro del horario_atencion del profesional.

INSERT INTO turno (fecha_turno, hora_turno, estado, dni_profesional, dni_cliente, motivo_cancelacion, cancelado_en) VALUES
-- Aguirre
('2026-06-15', '08:00', 'activo',    27845123, 22456789, NULL, NULL),
('2026-06-15', '09:00', 'activo',    27845123, 25890123, NULL, NULL),
('2026-06-15', '10:00', 'cancelado', 27845123, 30890123, 'Paciente reprogramo por motivos personales', '2026-06-10 18:32:00'),
('2026-06-17', '16:00', 'activo',    27845123, 34123458, NULL, NULL),
('2026-06-17', '17:00', 'activo',    27845123, 38235674, NULL, NULL),
('2026-06-19', '09:00', 'activo',    27845123, 42235680, NULL, NULL),
-- Vega
('2026-06-16', '09:00', 'activo',    30156789, 24123456, NULL, NULL),
('2026-06-16', '10:00', 'activo',    30156789, 32123450, NULL, NULL),
('2026-06-18', '11:00', 'activo',    30156789, 36901232, NULL, NULL),
('2026-06-18', '12:00', 'cancelado', 30156789, 42902346, 'Imprevisto del profesional', '2026-06-11 09:15:00'),
('2026-06-19', '15:00', 'activo',    30156789, 26345678, NULL, NULL),
-- Fernandez
('2026-06-15', '10:00', 'activo',    28934567, 23789012, NULL, NULL),
('2026-06-15', '11:00', 'activo',    28934567, 29234567, NULL, NULL),
('2026-06-15', '12:00', 'cancelado', 28934567, 33456782, 'Cliente no pudo asistir', '2026-06-09 14:50:00'),
('2026-06-16', '14:00', 'activo',    28934567, 37568908, NULL, NULL),
('2026-06-18', '16:00', 'activo',    28934567, 41569014, NULL, NULL),
('2026-06-18', '17:00', 'activo',    28934567, 44902344, NULL, NULL),
-- Paz
('2026-06-16', '15:00', 'activo',    33412890, 28567890, NULL, NULL),
('2026-06-17', '09:00', 'activo',    33412890, 35567890, NULL, NULL),
('2026-06-17', '10:00', 'activo',    33412890, 40902348, NULL, NULL),
('2026-06-19', '11:00', 'activo',    33412890, 44235678, NULL, NULL),
-- Quiroga
('2026-06-15', '14:00', 'activo',    31678234, 31456789, NULL, NULL),
('2026-06-15', '15:00', 'activo',    31678234, 36234566, NULL, NULL),
('2026-06-18', '17:00', 'cancelado', 31678234, 40235682, 'Cliente no pudo asistir', '2026-06-11 11:05:00');


INSERT INTO turno (fecha_turno, hora_turno, estado, dni_profesional, dni_cliente, completado_en) VALUES
('2026-06-15', '11:00', 'completado', 27845123, 24123456, '2026-06-15 11:30:00'),
('2026-06-15', '13:00', 'completado', 28934567, 32123450, '2026-06-15 13:30:00'),
('2026-06-16', '11:00', 'completado', 30156789, 22456789, '2026-06-16 11:30:00'),
('2026-06-17', '11:00', 'completado', 33412890, 25890123, '2026-06-17 11:30:00');
