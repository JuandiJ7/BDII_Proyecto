CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    contraseña TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE temas (
    id_tema SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    titulo TEXT NOT NULL UNIQUE,    -- No pueden haber dos temas con el mismo nombre.
    descripcion TEXT NOT NULL
);

CREATE TABLE comentarios (
    id_comentario SERIAL PRIMARY KEY,
    id_tema INTEGER NOT NULL REFERENCES temas(id_tema),
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    fecha_ingresado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT NOT NULL
);

INSERT INTO public.usuarios (username,email,contraseña,is_admin) VALUES('admin', 'admin@parcial.com', crypt('@Admin1', gen_salt('bf')), true);
INSERT INTO public.usuarios (username,email,contraseña) VALUES('pepe', 'pepe@parcial.com', crypt('@Pepe1', gen_salt('bf')));
INSERT INTO public.usuarios (username,email,contraseña) VALUES('carla', 'carla@parcial.com', crypt('@Carla1', gen_salt('bf')));
INSERT INTO public.usuarios (username,email,contraseña) VALUES('flor', 'flor@parcial.com', crypt('@Flor1', gen_salt('bf')));

INSERT INTO public.temas (titulo, descripcion, id_usuario) VALUES
  ('Impacto del cambio climático en la agricultura', 'El cambio climático está causando estragos en la agricultura. Las cosechas se ven afectadas por eventos climáticos extremos y cambios en las estaciones, poniendo en riesgo la seguridad alimentaria.', 2),
  ('Avances en la inteligencia artificial', 'La inteligencia artificial ha avanzado a pasos agigantados, revolucionando industrias enteras. Sin embargo, plantea preguntas sobre la ética y el futuro del empleo humano.', 4),
  ('Historia de las civilizaciones antiguas', 'Las civilizaciones antiguas, como Egipto y Roma, han dejado un legado cultural y tecnológico que seguimos explorando hoy. Estudiarlas nos ayuda a entender nuestras raíces y evolución.', 1),
  ('Técnicas de mindfulness y meditación', 'Practicar mindfulness y meditación puede transformar tu vida, reduciendo el estrés y aumentando el bienestar general. Estas técnicas son cada vez más populares en el mundo occidental.', 3),
  ('El futuro de la energía renovable', 'Las energías renovables son clave para un futuro sostenible. Con tecnologías como la solar y eólica, podemos reducir nuestra dependencia de los combustibles fósiles y combatir el cambio climático.', 1)
;

INSERT INTO public.comentarios (id_tema, id_usuario, descripcion) VALUES
  (1, 2, 'Excelente análisis sobre la agricultura y el clima. Me gustaría saber más sobre las soluciones propuestas.'),
  (2, 2, 'Impresionante ver cómo la IA está cambiando todo. ¿Hay algún recurso adicional sobre el impacto en el empleo?'),
  (2, 3, 'Gran información sobre IA, aunque sería útil profundizar en las implicaciones éticas.'),
  (4, 4, 'Las técnicas de mindfulness realmente ayudan. ¿Tienes alguna recomendación de aplicaciones o recursos adicionales?');


INSERT INTO public.comentarios (id_tema, id_usuario, descripcion) VALUES
  (1, 3, 'El cambio climático es realmente preocupante. Las políticas deben adaptarse para proteger la agricultura.'),
  (3, 1, 'Estudiar las civilizaciones antiguas nos da perspectiva sobre nuestro propio tiempo. Fascinante.'),
  (5, 2, 'Las energías renovables son el futuro. Invertir en ellas es crucial para la sostenibilidad.'),
  (1, 4, 'Los agricultores necesitan más apoyo para adaptarse a los cambios climáticos. Es una prioridad urgente.'),
  (2, 1, 'La ética en la inteligencia artificial debe ser una prioridad. Los avances no deben ir en detrimento de los valores humanos.'),
  (3, 2, 'Siempre he encontrado fascinante cómo las antiguas civilizaciones construyeron sus imperios. Muy interesante.'),
  (4, 3, 'La meditación me ha ayudado mucho con mi ansiedad. Recomiendo a todos intentarlo al menos una vez.'),
  (5, 4, 'Me gustaría ver más políticas que apoyen la transición a energías renovables. Es fundamental para nuestro futuro.'),
  (2, 4, 'La inteligencia artificial tiene un gran potencial, pero también debemos ser cautelosos con su desarrollo.'),
  (4, 1, 'El mindfulness es una práctica transformadora. Me ha ayudado a mantenerme enfocado y calmado en momentos difíciles.');
