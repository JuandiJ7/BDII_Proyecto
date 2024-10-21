import { FastifyPluginAsync } from "fastify";

import * as temaService from "../../../../services/temas.js";
import { Tema, TemaPut } from "../../../../types/tema.js";
import { IdUsuarioType } from "../../../../types/usuario.js";
import { Type } from "@sinclair/typebox";

const temasUsuariosRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get("/", {
    schema: {
      tags: ["usuarios", "temas"],
      summary: "Temas creadas por el usuario.",
      description:
        "### Implementar y validar: \n " +
        " - token \n " +
        " - params \n " +
        " - que el usuario que ejecuta es administrador o el propio usuario buscado \n " +
        " - response. \n ",
      response: {
        200: {
          description: "Usuario encontrado. ",
          content: {
            "application/json": {
              schema: Type.Array(Tema),
            },
          },
        },
      },
    },
    onRequest: [fastify.verifyJWT, fastify.verifySelfOrAdmin],
    handler: async function (request, reply) {
      const { id_usuario } = request.params as IdUsuarioType;
      return temaService.findCreadasByUserId(id_usuario);
    },
  });

  fastify.post("/", {
    schema: {
      tags: ["usuarios", "temas"],
      summary: "Usuario crea una nueva tema.",
      description:
        "### El codigo de respuesta debe ser el adecuado \n ### El creador de la tema se toma de los params \n ### Implementar y validar: \n " +
        " - token \n " +
        " - params \n " +
        " - body \n " +
        " - que el usuario que ejecuta es el creador de la tema \n " +
        " - response. \n ",
      body: TemaPut,
      response: {
        201: {
          description: "Tema creada.",
          content: {
            "application/json": {
              schema: Tema,
            },
          },
        },
      },
    },
    onRequest: [fastify.verifyJWT, fastify.verifySelf],
    handler: async function (request, reply) {
      const nuevaTema = request.body as Tema;
      const { id_usuario } = request.params as IdUsuarioType;
      reply.code(201);
      return temaService.create(id_usuario, nuevaTema);
    },
  });
};

export default temasUsuariosRoutes;
