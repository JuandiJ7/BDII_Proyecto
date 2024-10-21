import { FastifyPluginAsync } from "fastify";
import * as temaService from "../../../services/temas.js";
import { IdTema } from "../../../types/tema.js";

const temasRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.get("/", {
    schema: {
      summary: "Obtener una tema especifica",
      description:
        "### Implementar y validar: \n " +
        " - token \n " +
        " - params \n " +
        " - response. \n - Solo admin tiene permisos.",
      tags: ["temas"],
      params: IdTema,
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const { id_tema } = request.params as IdTema;
      return temaService.findById(id_tema);
    },
  });
};

export default temasRoutes;
