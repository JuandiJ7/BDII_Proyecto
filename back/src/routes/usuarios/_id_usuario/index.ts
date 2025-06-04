import { FastifyPluginAsync } from "fastify";

import {
  IdCiudadanoSchema,
  IdCiudadanoType,
  UsuarioSchema,
  UsuarioType,
} from "../../../types/usuario.js";
import * as usuarioService from "../../../services/usuarios.js";

const usuariosRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", {
    schema: {
      tags: ["usuarios"],
      params: IdCiudadanoSchema,
      summary: "Obtener un ciudadano por credencial",
      description:
        "## Implementar y validar\n" +
        "- token\n" +
        "- params (cc)\n" +
        "- que el usuario que ejecuta es administrador o el mismo\n" +
        "- response\n",
      response: {
        200: {
          description: "Ciudadano encontrado.",
          content: {
            "application/json": {
              schema: UsuarioSchema,
            },
          },
        },
      },
    },
    onRequest: [fastify.verifyJWT, fastify.verifySelfOrAdmin],
    handler: async function (request, reply) {
      const { cc } = request.params as IdCiudadanoType;
      return usuarioService.findByCC(cc);
    },
  });

  fastify.delete("/", {
    schema: {
      tags: ["usuarios"],
      params: IdCiudadanoSchema,
      summary: "Borrar ciudadano por credencial",
      description:
        "## Implementar y validar\n" +
        "- token\n" +
        "- que el usuario que ejecuta es admin\n" +
        "- response\n",
      response: {
        204: {
          description: "No content",
        },
      },
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      const { cc } = request.params as IdCiudadanoType;
      await usuarioService.deleteByCC(cc);
      reply.code(204).send();
    },
  });

  fastify.put("/", {
    schema: {
      tags: ["usuarios"],
      summary: "Actualizar ciudadano",
      description:
        "## Implementar y validar\n" +
        "- token\n" +
        "- body\n" +
        "- que el usuario que ejecuta es admin o el mismo ciudadano\n" +
        "- No se puede editar la contraseña\n",
      body: UsuarioSchema,
      params: IdCiudadanoSchema,
      response: {
        200: {
          description: "Ciudadano actualizado.",
          content: {
            "application/json": {
              schema: UsuarioSchema,
            },
          },
        },
      },
    },
    onRequest: [fastify.verifyJWT, fastify.verifySelfOrAdmin],
    preHandler: [fastify.verifyParamsInBody],
    handler: async function (request, reply) {
      const ciudadano = request.body as UsuarioType;
      return usuarioService.updateByCC(ciudadano);
    },
  });
};

export default usuariosRoutes;
