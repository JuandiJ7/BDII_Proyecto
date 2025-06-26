import jwt, { FastifyJWTOptions } from "@fastify/jwt";
import { FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { FastifyReply } from "fastify/types/reply.js";
import { IdCiudadanoType } from "../types/usuario.js";
import { UsuarioLoginType } from "../types/usuarioLogin.js";

const jwtOptions: FastifyJWTOptions = {
  secret: process.env.JWT_SECRET || "holaprofe",
};

export default fp<FastifyJWTOptions>(async (fastify) => {
  fastify.register(jwt, jwtOptions);

  fastify.decorate(
    "verifyJWT",
    async function (request: FastifyRequest, reply: FastifyReply) {
      await request.jwtVerify();
    }
  );

  fastify.decorate(
    "verifyAdmin",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const usuarioToken = request.user as unknown as UsuarioLoginType;
      if (usuarioToken.rol !== "ADMIN") {
        throw reply.unauthorized("Tienes que ser admin para hacer eso.");
      }
    }
  );

  fastify.decorate(
    "verifySelf",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const usuarioToken = request.user as unknown as UsuarioLoginType;
      const { cc } = request.params as IdCiudadanoType;

      if (usuarioToken.credencial !== cc) {
        throw reply.unauthorized("No estás autorizado a modificar este recurso.");
      }
    }
  );

  fastify.decorate(
    "verifySelfOrAdmin",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const usuarioToken = request.user as unknown as UsuarioLoginType;
      const { cc } = request.params as IdCiudadanoType;

      if (usuarioToken.rol !== "ADMIN" && usuarioToken.credencial !== cc) {
        throw reply.unauthorized("Solo podés acceder a tu propio recurso o ser admin.");
      }
    }
  );

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
