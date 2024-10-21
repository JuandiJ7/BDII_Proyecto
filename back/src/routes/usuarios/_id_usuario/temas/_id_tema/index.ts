import { FastifyPluginAsync } from "fastify";

import * as temaService from "../../../../../services/temas.js";
import { IdTema, Tema, TemaPut } from "../../../../../types/tema.js";
import { Type } from "@sinclair/typebox";
import { IdUsuarioSchema } from "../../../../../types/usuario.js";

const temaUsuarioRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get("/", {
    schema: {
      summary: "Obtener tema de usuario",
      description:
        "### Implementar y validar: \n " +
        " - token \n " +
        " - params \n " +
        " - que el usuario que ejecuta es el creador de la tema o admin \n " +
        " - response. \n ",
      tags: ["usuarios", "temas"],
      params: Type.Intersect([IdUsuarioSchema, IdTema]),
      response: {
        200: {
          description: "Listado de temas del usuario dado.",
          content: {
            "application/json": {
              schema: Tema,
            },
          },
        },
      },
    },
    onRequest: [fastify.verifyJWT, fastify.verifyTemaCreator],
    handler: async function (request, reply) {
      const { id_tema, id_usuario } = request.params as {
        id_tema: number;
        id_usuario: number;
      };
      return temaService.findByIdAndCreator(id_tema, id_usuario);
    },
  });

  fastify.put("/", {
    schema: {
      summary: "Modificar la tema del usuario",
      description:
        "### Implementar y validar: \n " +
        " - token \n " +
        " - params \n " +
        " - body \n " +
        " - que el usuario que ejecuta es el creador de la tema o admin \n " +
        " - response. \n ",
      tags: ["usuarios", "temas"],
      params: Type.Intersect([IdUsuarioSchema, IdTema]),
      body: TemaPut,
      response: {
        200: {
          description: "Tema modificada.",
          content: {
            "application/json": {
              schema: Tema,
            },
          },
        },
      },
    },
    onRequest: [fastify.verifyJWT, fastify.verifyTemaCreator],
    handler: async function (request, reply) {
      const nuevaTema = request.body as Tema;
      const { id_tema } = request.params as IdTema;
      reply.code(201);
      return temaService.updateById(id_tema, nuevaTema);
    },
  });

  fastify.delete("/", {
    schema: {
      tags: ["usuarios", "temas"],
      params: Type.Intersect([IdUsuarioSchema, IdTema]),
      summary: "Borrar una tema",
      description:
        "### Implementar y validar: \n " +
        " - token \n " +
        " - params \n " +
        " - que el usuario que ejecuta es administrador o el creador \n " +
        " - response. \n ",
      response: {
        204: {
          description: "No content",
        },
      },
    },
    onRequest: [fastify.verifyJWT, fastify.verifyTemaCreator],
    handler: async function (request, reply) {
      const { id_usuario, id_tema } = request.params as {
        id_usuario: number;
        id_tema: number;
      };
      reply.code(204);
      return temaService.deleteByIds(id_usuario, id_tema);
    },
  });
};

export default temaUsuarioRoutes;
