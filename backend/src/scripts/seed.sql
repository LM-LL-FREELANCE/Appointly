
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


-- profesional

INSERT INTO profesional
(dni_profesional, nombre, apellido, correo, password_hash, fecha_nacimiento, genero, foto_url, ubicacion) VALUES
(27845123, 'Martin',   'Aguirre',   'martin.aguirre@appointly.dev',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1979-03-12', 'M', NULL, 'Consultorio 1'),
(30156789, 'Carolina', 'Vega',      'carolina.vega@appointly.dev',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1983-08-25', 'F', NULL, 'Consultorio 2'),
(28934567, 'Lucia',    'Fernandez', 'lucia.fernandez@appointly.dev',  '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1981-01-30', 'F', NULL, 'Consultorio 3'),
(33412890, 'Federico', 'Paz',       'federico.paz@appointly.dev',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1988-11-07', 'M', NULL, 'Consultorio 2'),
(31678234, 'Valeria',  'Quiroga',   'valeria.quiroga@appointly.dev',  '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1986-05-19', 'F', NULL, 'Consultorio 1');


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
(dni_cliente, nombre, apellido, correo, password_hash, fecha_nacimiento, genero, id_obra_social) VALUES
(22456789, 'Ricardo',  'Sosa',       'ricardo.sosa@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1971-02-14', 'M', 1),
(23789012, 'Graciela', 'Moreno',     'graciela.moreno@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1973-06-09', 'F', 5),
(24123456, 'Hugo',     'Cabrera',    'hugo.cabrera@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1974-09-21', 'M', 2),
(25890123, 'Silvia',   'Rojas',      'silvia.rojas@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1976-12-03', 'F', 1),
(26345678, 'Oscar',    'Gimenez',    'oscar.gimenez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1977-04-17', 'M', NULL),
(27012345, 'Marta',    'Luna',       'marta.luna@mail.com',        '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1978-08-28', 'F', 3),
(28567890, 'Daniel',   'Castro',     'daniel.castro@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1980-01-11', 'M', 4),
(29234567, 'Patricia', 'Molina',     'patricia.molina@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1981-05-23', 'F', 5),
(30890123, 'Sergio',   'Herrera',    'sergio.herrera@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1983-10-06', 'M', 1),
(31456789, 'Andrea',   'Dominguez',  'andrea.dominguez@mail.com',  '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1985-03-15', 'F', NULL),
(32123450, 'Pablo',    'Rios',       'pablo.rios@mail.com',        '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1986-07-27', 'M', 2),
(32789016, 'Veronica', 'Acosta',     'veronica.acosta@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1987-11-08', 'F', 6),
(33456782, 'Gustavo',  'Flores',     'gustavo.flores@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1989-02-19', 'M', 5),
(34123458, 'Natalia',  'Benitez',    'natalia.benitez@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1990-06-30', 'F', 1),
(34890124, 'Diego',    'Medina',     'diego.medina@mail.com',      '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1991-10-12', 'M', 3),
(35567890, 'Florencia','Ortiz',      'florencia.ortiz@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1992-01-24', 'F', 4),
(36234566, 'Matias',   'Suarez',     'matias.suarez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1993-05-05', 'M', NULL),
(36901232, 'Camila',   'Torres',     'camila.torres@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1994-09-16', 'F', 2),
(37568908, 'Lucas',    'Ramirez',    'lucas.ramirez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1995-12-28', 'M', 5),
(38235674, 'Julieta',  'Pereyra',    'julieta.pereyra@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1997-04-09', 'F', 1),
(38902340, 'Nicolas',  'Gomez',      'nicolas.gomez@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1998-08-20', 'M', 6),
(39569016, 'Agustina', 'Villalba',   'agustina.villalba@mail.com', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1999-11-01', 'F', 3),
(40235682, 'Tomas',    'Arias',      'tomas.arias@mail.com',       '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '2001-03-13', 'M', NULL),
(40902348, 'Sofia',    'Ledesma',    'sofia.ledesma@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '2002-07-25', 'F', 4),
(41569014, 'Bruno',    'Navarro',    'bruno.navarro@mail.com',     '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '2003-10-06', 'M', 5),
(42235680, 'Martina',  'Cardozo',    'martina.cardozo@mail.com',   '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '2004-01-18', 'F', 1),
(42902346, 'Joaquin',  'Ibarra',     'joaquin.ibarra@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '2005-05-29', 'M', 2),
(43569012, 'Valentina','Coronel',    'valentina.coronel@mail.com', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1996-09-10', 'F', NULL),
(44235678, 'Ignacio',  'Maldonado',  'ignacio.maldonado@mail.com', '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1984-12-22', 'M', 6),
(44902344, 'Rocio',    'Figueroa',   'rocio.figueroa@mail.com',    '$2b$10$3aKwowEcj3qxrox5ctRVxeS3t6Wvmali84NvMekl14kOklQvSzSGG', '1982-04-03', 'F', 5);


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

INSERT INTO turno (fecha_turno, hora_turno, estado, dni_profesional, dni_cliente, cancelado_en) VALUES
-- Aguirre
('2026-06-15', '08:00', 'activo',    27845123, 22456789, NULL),
('2026-06-15', '09:00', 'activo',    27845123, 25890123, NULL),
('2026-06-15', '10:00', 'cancelado', 27845123, 30890123, '2026-06-10 18:32:00'),
('2026-06-17', '16:00', 'activo',    27845123, 34123458, NULL),
('2026-06-17', '17:00', 'activo',    27845123, 38235674, NULL),
('2026-06-19', '09:00', 'activo',    27845123, 42235680, NULL),
-- Vega
('2026-06-16', '09:00', 'activo',    30156789, 24123456, NULL),
('2026-06-16', '10:00', 'activo',    30156789, 32123450, NULL),
('2026-06-18', '11:00', 'activo',    30156789, 36901232, NULL),
('2026-06-18', '12:00', 'cancelado', 30156789, 42902346, '2026-06-11 09:15:00'),
('2026-06-19', '15:00', 'activo',    30156789, 26345678, NULL),
-- Fernandez
('2026-06-15', '10:00', 'activo',    28934567, 23789012, NULL),
('2026-06-15', '11:00', 'activo',    28934567, 29234567, NULL),
('2026-06-15', '12:00', 'cancelado', 28934567, 33456782, '2026-06-09 14:50:00'),
('2026-06-16', '14:00', 'activo',    28934567, 37568908, NULL),
('2026-06-18', '16:00', 'activo',    28934567, 41569014, NULL),
('2026-06-18', '17:00', 'activo',    28934567, 44902344, NULL),
-- Paz
('2026-06-16', '15:00', 'activo',    33412890, 28567890, NULL),
('2026-06-17', '09:00', 'activo',    33412890, 35567890, NULL),
('2026-06-17', '10:00', 'activo',    33412890, 40902348, NULL),
('2026-06-19', '11:00', 'activo',    33412890, 44235678, NULL),
-- Quiroga
('2026-06-15', '14:00', 'activo',    31678234, 31456789, NULL),
('2026-06-15', '15:00', 'activo',    31678234, 36234566, NULL),
('2026-06-18', '17:00', 'cancelado', 31678234, 40235682, '2026-06-11 11:05:00');