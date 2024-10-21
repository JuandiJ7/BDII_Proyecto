import db from "./db.js";

const baseQuery = `
  WITH COMENTARIOS AS (
    SELECT C.*, U.username as creado_por
    FROM public.comentarios C
    JOIN public.usuarios U ON U.id_usuario=C.id_usuario
    WHERE C.id_tema = $1
  )
  SELECT * FROM COMENTARIOS
`;

export const findAll = async (id_tema: number) => {
  const res = await db.query(baseQuery, [id_tema]);
  return res.rows;
};
export const create = async (
  id_tema: number,
  id_usuario: number,
  descripcion: string
) => {
  const query = `
    INSERT INTO public.comentarios(id_tema,id_usuario,descripcion)
    VALUES ($1,$2,$3)
  `;
  await db.query(query, [id_tema, id_usuario, descripcion]);
  return findAll(id_tema);
};

//De acá en adelante no está probado. Cualquier duda puedes consultar.
export const modify = async (
  id_tema: number,
  id_comentario: number,
  descripcion: string
) => {
  const query = `
    UPDATE public.comentarios SET descripcion=$3
    WHERE id_tema=$1 AND id_comentario=$2
  `;
  await db.query(query, [id_tema, id_comentario, descripcion]);
  return findAll(id_tema);
};

export const erase = async (id_tema: number, id_comentario: number) => {
  const query = `
    DELETE FROM public.comentarios
    WHERE id_tema=$1 AND id_comentario=$2
  `;
  await db.query(query, [id_tema, id_comentario]);
  return findAll(id_tema);
};
