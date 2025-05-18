import { NuevoUsuarioType, UsuarioType } from "../types/usuario.js";
import { NotFoundError } from "../util/errors.js";
import db from "./db.js";

// GET ALL
export const findAll = async () => {
  const [rows] = await db.query("SELECT * FROM usuarios");
  return rows;
};

// GET BY ID
export const findById = async (id_usuario: number) => {
  const [rows]: any = await db.query(
    "SELECT * FROM usuarios WHERE id_usuario = ?",
    [id_usuario]
  );
  if (rows.length === 0) throw new NotFoundError("");
  return rows[0];
};

// DELETE
export const deleteById = async (id_usuario: number) => {
  const [result]: any = await db.query(
    "DELETE FROM usuarios WHERE id_usuario = ?",
    [id_usuario]
  );
  if (result.affectedRows === 0) throw new NotFoundError("");
};

// UPDATE
export const updateById = async (usuario: UsuarioType) => {
  const [result]: any = await db.query(
    `
    UPDATE usuarios
    SET email = ?, username = ?, is_admin = ?
    WHERE id_usuario = ?
  `,
    [usuario.email, usuario.username, usuario.is_admin, usuario.id_usuario]
  );
  if (result.affectedRows === 0) throw new NotFoundError("");
  return { ...usuario }; // Opcionalmente podés hacer otro SELECT si querés devolver los datos actualizados de la base
};

// CREATE
export const create = async (nuevoUsuario: NuevoUsuarioType) => {
  const [result]: any = await db.query(
    `
    INSERT INTO usuarios (username, email, contraseña)
    VALUES (?, ?, ?)
  `,
    [nuevoUsuario.username, nuevoUsuario.email, nuevoUsuario.contraseña]
  );
  const id_usuario = result.insertId;
  return { id_usuario, ...nuevoUsuario };
};
