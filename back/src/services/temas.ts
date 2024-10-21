import { Tema, TemaPut } from "../types/tema.js";
import { NotFoundError } from "../util/errors.js";
import db from "./db.js";

const baseQuery = `
  SELECT T.*, U.username as creador
  FROM public.temas T
  JOIN public.usuarios U ON U.id_usuario=T.id_usuario
`;

export const findAll = async () => {
  const res = await db.query(baseQuery);
  return res.rows;
};

export const findCreadasByUserId = async (id_usuario: number) => {
  const res = await db.query(
    `
    ${baseQuery}
    WHERE T.id_usuario=$1
    `,
    [id_usuario]
  );
  if (res.rowCount === 0) throw new NotFoundError(""); //FIXME: No diferencia si el usuario no existe o no tiene temas creadas.
  return res.rows;
};

export const findAsignadasByIdUsuario = async (id_usuario: number) => {
  const consulta = `
    ${baseQuery}
    JOIN public.usuario_temas UT ON UT.id_tema = T.id_tema AND UT.id_usuario = $1
    WHERE UT.id_usuario=$1
    `;

  console.log(consulta);
  const res = await db.query(consulta, [id_usuario]);

  return res.rows;
};

export const findById = async (id_tema: number): Promise<Tema> => {
  const res = await db.query(
    `
    ${baseQuery}
    WHERE id_tema=$1
    `,
    [id_tema]
  );
  if (res.rowCount === 0) throw new NotFoundError("");
  return res.rows[0];
};

export const findByIdAndCreator = async (
  id_tema: number,
  id_usuario: number
): Promise<Tema> => {
  const res = await db.query(
    `
    ${baseQuery}
    WHERE T.id_tema=$1 AND T.id_usuario = $2
    `,
    [id_tema, id_usuario]
  );
  if (res.rowCount === 0) throw new NotFoundError("");
  return res.rows[0];
};

export const deleteByIds = async (id_usuario: number, id_tema: number) => {
  const res = await db.query(
    "DELETE FROM public.temas WHERE id_usuario=$1 AND id_tema=$2",
    [id_usuario, id_tema]
  );
  if (res.rowCount === 0) throw new NotFoundError("");
};

export const unassign = async (id_usuario: number, id_tema: number) => {
  const res = await db.query(
    "DELETE FROM public.usuario_temas WHERE id_usuario=$1 AND id_tema=$2",
    [id_usuario, id_tema]
  );
  if (res.rowCount === 0) throw new NotFoundError("");
};

export const assign = async (id_usuario: number, id_tema: number) => {
  const res = await db.query(
    "INSERT INTO public.usuario_temas(id_usuario,id_tema) VALUES($1,$2)",
    [id_usuario, id_tema]
  );
  if (res.rowCount === 0) throw new NotFoundError("");
};

export const updateById = async (id_tema: number, tema: TemaPut) => {
  const res = await db.query(
    `
    UPDATE public.temas  
    SET titulo=$2, descripcion=$3 
    WHERE id_tema=$1;
    `,
    [id_tema, tema.titulo, tema.descripcion]
  );
  if (res.rowCount === 0) throw new NotFoundError("");
  return findById(id_tema);
};

export const create = async (id_usuario: number, nuevaTema: TemaPut) => {
  const res = await db.query(
    `
    INSERT INTO public.temas (titulo,descripcion,id_usuario) 
    VALUES($1, $2, $3) RETURNING *;
    `,
    [nuevaTema.titulo, nuevaTema.descripcion, id_usuario]
  );
  const tema_creada: Tema = res.rows[0];
  return findById(tema_creada.id_tema);
};
