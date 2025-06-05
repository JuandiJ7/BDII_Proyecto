import { UsuarioType } from "../types/usuario.js";
import { NotFoundError } from "../util/errors.js";
import db from "./db.js";
import bcrypt from "bcrypt";

// GET ALL ciudadanos
export const findAll = async (): Promise<UsuarioType[]> => {
  const [rows] = await db.query("SELECT * FROM CIUDADANO");
  return rows as UsuarioType[];
};

// GET BY CC
export const findByCC = async (cc: string): Promise<UsuarioType> => {
  const [rows]: any = await db.query("SELECT * FROM CIUDADANO WHERE cc = ?", [cc]);
  if (rows.length === 0) throw new NotFoundError("Ciudadano no encontrado");
  return rows[0];
};

// DELETE
export const deleteByCC = async (cc: string) => {
  const [result]: any = await db.query("DELETE FROM CIUDADANO WHERE cc = ?", [cc]);
  if (result.affectedRows === 0) throw new NotFoundError("Ciudadano no encontrado");
};

// UPDATE (actualiza datos básicos)
export const updateByCC = async (usuario: UsuarioType) => {
  const [result]: any = await db.query(
    `
    UPDATE CIUDADANO
    SET nombre = ?, apellido = ?, ci = ?, fecha_nac = ?, direccion = ?, rol = ?, id_departamento = ?
    WHERE cc = ?
  `,
    [
      usuario.nombre,
      usuario.apellido,
      usuario.ci,
      usuario.fecha_nac,
      usuario.direccion,
      usuario.cc,
    ]
  );
  if (result.affectedRows === 0) throw new NotFoundError("Ciudadano no encontrado");
  return { ...usuario };
};

// CREATE nuevo USUARIO
export const create = async (credencial: string, password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const []: any = await db.query(
    `
    INSERT IGNORE INTO USUARIO (credencial, password, rol) VALUES
    (?, ?, 'votante')
  `,
    [
      credencial,
      hashedPassword,
    ]
  );

  return {
    credencial: credencial,
    rol: "votante",
  };
};
