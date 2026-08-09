
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

-- ex-profesionales
INSERT INTO persona
(dni_persona, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero, foto_url) VALUES
(27845123, 'Martin',   'Aguirre',   'martin.aguirre@appointly.dev',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0001', '1979-03-12', 'M', NULL),
(30156789, 'Carolina', 'Vega',      'carolina.vega@appointly.dev',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0002', '1983-08-25', 'F', NULL),
(28934567, 'Lucia',    'Fernandez', 'lucia.fernandez@appointly.dev',  '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0003', '1981-01-30', 'F', NULL),
(33412890, 'Federico', 'Paz',       'federico.paz@appointly.dev',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0004', '1988-11-07', 'M', NULL),
(31678234, 'Valeria',  'Quiroga',   'valeria.quiroga@appointly.dev',  '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0005', '1986-05-19', 'F', NULL);

-- ex-clientes
INSERT INTO persona
(dni_persona, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero, foto_url) VALUES
(22456789, 'Ricardo',  'Sosa',       'ricardo.sosa@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0006', '1971-02-14', 'M', NULL),
(23789012, 'Graciela', 'Moreno',     'graciela.moreno@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0007', '1973-06-09', 'F', NULL),
(24123456, 'Hugo',     'Cabrera',    'hugo.cabrera@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0008', '1974-09-21', 'M', NULL),
(25890123, 'Silvia',   'Rojas',      'silvia.rojas@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0009', '1976-12-03', 'F', NULL),
(26345678, 'Oscar',    'Gimenez',    'oscar.gimenez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0010', '1977-04-17', 'M', NULL),
(27012345, 'Marta',    'Luna',       'marta.luna@mail.com',        '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0011', '1978-08-28', 'F', NULL),
(28567890, 'Daniel',   'Castro',     'daniel.castro@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0012', '1980-01-11', 'M', NULL),
(29234567, 'Patricia', 'Molina',     'patricia.molina@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0013', '1981-05-23', 'F', NULL),
(30890123, 'Sergio',   'Herrera',    'sergio.herrera@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0014', '1983-10-06', 'M', NULL),
(31456789, 'Andrea',   'Dominguez',  'andrea.dominguez@mail.com',  '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0015', '1985-03-15', 'F', NULL),
(32123450, 'Pablo',    'Rios',       'pablo.rios@mail.com',        '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0016', '1986-07-27', 'M', NULL),
(32789016, 'Veronica', 'Acosta',     'veronica.acosta@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0017', '1987-11-08', 'F', NULL),
(33456782, 'Gustavo',  'Flores',     'gustavo.flores@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0018', '1989-02-19', 'M', NULL),
(34123458, 'Natalia',  'Benitez',    'natalia.benitez@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0019', '1990-06-30', 'F', NULL),
(34890124, 'Diego',    'Medina',     'diego.medina@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0020', '1991-10-12', 'M', NULL),
(35567890, 'Florencia','Ortiz',      'florencia.ortiz@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0021', '1992-01-24', 'F', NULL),
(36234566, 'Matias',   'Suarez',     'matias.suarez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0022', '1993-05-05', 'M', NULL),
(36901232, 'Camila',   'Torres',     'camila.torres@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0023', '1994-09-16', 'F', NULL),
(37568908, 'Lucas',    'Ramirez',    'lucas.ramirez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0024', '1995-12-28', 'M', NULL),
(38235674, 'Julieta',  'Pereyra',    'julieta.pereyra@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0025', '1997-04-09', 'F', NULL),
(38902340, 'Nicolas',  'Gomez',      'nicolas.gomez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0026', '1998-08-20', 'M', NULL),
(39569016, 'Agustina', 'Villalba',   'agustina.villalba@mail.com', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0027', '1999-11-01', 'F', NULL),
(40235682, 'Tomas',    'Arias',      'tomas.arias@mail.com',       '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0028', '2001-03-13', 'M', NULL),
(40902348, 'Sofia',    'Ledesma',    'sofia.ledesma@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0029', '2002-07-25', 'F', NULL),
(41569014, 'Bruno',    'Navarro',    'bruno.navarro@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0030', '2003-10-06', 'M', NULL),
(42235680, 'Martina',  'Cardozo',    'martina.cardozo@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0031', '2004-01-18', 'F', NULL),
(42902346, 'Joaquin',  'Ibarra',     'joaquin.ibarra@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0032', '2005-05-29', 'M', NULL),
(43569012, 'Valentina','Coronel',    'valentina.coronel@mail.com', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0033', '1996-09-10', 'F', NULL),
(44235678, 'Ignacio',  'Maldonado',  'ignacio.maldonado@mail.com', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0034', '1984-12-22', 'M', NULL),
(44902344, 'Rocio',    'Figueroa',   'rocio.figueroa@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0035', '1982-04-03', 'F', NULL);

-- admin dedicado (sin ficha de profesional ni de cliente)
INSERT INTO persona
(dni_persona, nombre, apellido, correo, password_hash, telefono, fecha_nacimiento, genero, foto_url) VALUES
(50000000, 'Admin', 'Sistema', 'admin@appointly.dev', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '11-1000-0036', '1990-01-01', 'X', NULL);


-- profesional
-- es_admin = TRUE solo para Aguirre, para probar el path "profesional actuando como admin".

INSERT INTO profesional (dni_profesional, duracion_turno_min, es_admin) VALUES
(27845123, 30, TRUE),
(30156789, 30, FALSE),
(28934567, 30, FALSE),
(33412890, 30, FALSE),
(31678234, 30, FALSE);


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

INSERT INTO cliente (dni_cliente, id_obra_social) VALUES
(22456789, 1),
(23789012, 5),
(24123456, 2),
(25890123, 1),
(26345678, NULL),
(27012345, 3),
(28567890, 4),
(29234567, 5),
(30890123, 1),
(31456789, NULL),
(32123450, 2),
(32789016, 6),
(33456782, 5),
(34123458, 1),
(34890124, 3),
(35567890, 4),
(36234566, NULL),
(36901232, 2),
(37568908, 5),
(38235674, 1),
(38902340, 6),
(39569016, 3),
(40235682, NULL),
(40902348, 4),
(41569014, 5),
(42235680, 1),
(42902346, 2),
(43569012, NULL),
(44235678, 6),
(44902344, 5);


-- admin

INSERT INTO admin (dni_admin) VALUES (50000000);


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
