import { FastifyPluginAsync } from "fastify";
import {
  LoginSchema,
  LoginType,
  UsuarioSchema,
} from "../../types/usuario.js";
import db from "../../services/db.js";
import { Type } from "@sinclair/typebox";
import bcrypt from "bcrypt";

const authRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post("/", {
    schema: {
      summary: "Hacer login",
      description: "Ruta para loguearse usando username y contraseña.",
      security: [],
      tags: ["auth"],
      body: LoginSchema,
      response: {
        200: {
          description: "Datos del usuario dentro del token",
          content: {
            "application/json": {
              schema: Type.Object({
                token: Type.String(),
                usuario: UsuarioSchema,
              }),
            },
          },
        },
      },
    },
    handler: async function (request, reply) {
      const { username, contraseña } = request.body as LoginType;

      try {
        // Buscar el usuario por username
        const [rows]: [any[], any] = await db.query(
          "SELECT id_usuario, email, username, is_admin, password FROM usuarios WHERE username = ?",
          [username]
        );

        if (rows.length === 0) {
          return reply.unauthorized("El username o contraseña no es correcto.");
        }

        const usuario = rows[0];

        // Comparar contraseñas con bcrypt
        const esValida = await bcrypt.compare(contraseña, usuario.password);
        if (!esValida) {
          return reply.unauthorized("El username o contraseña no es correcto.");
        }

        // Eliminar la contraseña antes de enviar el usuario
        delete usuario.password;

        const token = fastify.jwt.sign(usuario);
        reply.send({ token, usuario });
      } catch (error) {
        console.error("Error en login:", error);
        return reply.internalServerError("Error interno al intentar loguear.");
      }
    },
  });
};

export default authRoutes;