import { FastifyPluginAsync } from "fastify";
import {
  LoginSchema,
  LoginType,
} from "../../types/usuario.js";
import db from "../../services/db.js";
import { Type } from "@sinclair/typebox";
import bcrypt from "bcrypt";

const authRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/", {
    schema: {
      summary: "Hacer login",
      description: "Ruta para loguearse usando credencial y contraseña.",
      security: [],
      tags: ["auth"],
      body: LoginSchema,
      response: {
        200: {
          description: "Datos del usuario dentro del token",
          content: {
            "application/json": {
              schema: Type.Object({
                token: Type.String()
              }),
            },
          },
        },
      },
    },
    handler: async function (request, reply) {
      const { credencial, contraseña } = request.body as LoginType;

      try {
        const [rows]: [any[], any] = await db.query(
          "SELECT * FROM USUARIO WHERE credencial = ?",
          [credencial]
        );

        if (rows.length === 0) {
          return reply.unauthorized("La credencial o contraseña no es correcta.");
        }

        const usuario = rows[0];

        const esValida = await bcrypt.compare(contraseña, usuario.password);

        if (!esValida) {
          return reply.unauthorized("La credencial o contraseña no es correcta.");
        }

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
