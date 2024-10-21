import { FastifyPluginAsync } from "fastify";
import * as temaService from "../../services/temas.js";
import { Tema } from "../../types/tema.js";
import { Type } from "@sinclair/typebox";

const temasRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get("/", {
    schema: {
      summary: "Listado de temas completo.",
      description:
        "### Implementar y validar: \n " +
        " - token \n " +
        " - response. \n - Solo admin puede ver todas las temas.",
      tags: ["temas"],
      response: {
        200: {
          description: "Lista de temas completo.",
          content: {
            "application/json": {
              schema: Type.Array(Tema),
            },
          },
        },
      },
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      return temaService.findAll();
    },
  });
};

export default temasRoutes;
