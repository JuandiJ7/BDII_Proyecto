//Modificar o borrar este archivo resta 5 puntos.

import jwt, { FastifyJWTOptions } from "@fastify/jwt";
import { FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { FastifyReply } from "fastify/types/reply.js";
import { IdCiudadanoType } from "../types/usuario.js"; // Usamos CC en lugar de ID

const jwtOptions: FastifyJWTOptions = {
  secret: process.env.JWT_SECRET || "holaprofe",
};

export default fp<FastifyJWTOptions>(async (fastify) => {
  fastify.register(jwt, jwtOptions);

  // Verifica que el JWT sea válido
  fastify.decorate(
    "verifyJWT",
    async function (request: FastifyRequest, reply: FastifyReply) {
      await request.jwtVerify();
    }
  );

  // Requiere que el usuario tenga rol admin
  fastify.decorate(
    "verifyAdmin",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const usuarioToken = request.user;
      if (usuarioToken.rol !== "admin") {
        throw reply.unauthorized("Tienes que ser admin para hacer eso.");
      }
    }
  );

  // Solo el mismo ciudadano puede acceder a sus datos
  fastify.decorate(
    "verifySelf",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const usuarioToken = request.user;
      const { cc } = request.params as IdCiudadanoType;

      if (usuarioToken.cc !== cc) {
        throw reply.unauthorized(
          "No estás autorizado a modificar un recurso que no te pertenece."
        );
      }
    }
  );

  // El mismo ciudadano o un admin pueden acceder
  fastify.decorate(
    "verifySelfOrAdmin",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const usuarioToken = request.user;
      const { cc } = request.params as IdCiudadanoType;

      if (usuarioToken.rol !== "admin" && usuarioToken.cc !== cc) {
        throw reply.unauthorized(
          "No estás autorizado a modificar ese recurso que no te pertenece si no eres admin."
        );
      }
    }
  );

  // Verifica que los valores en params coincidan con los del body
  fastify.decorate(
    "verifyParamsInBody",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const params: any = request.params;
      if (!params) return;

      const keys = Object.keys(params);
      if (keys.length === 0) return;

      const body: any = request.body;
      if (!body) reply.badRequest("No hay body.");

      for (const key of keys) {
        if (!body.hasOwnProperty(key) || body[key] !== params[key]) {
          reply.badRequest(`El valor de "${key}" no coincide entre body y params.`);
        }
      }
    }
  );
});
