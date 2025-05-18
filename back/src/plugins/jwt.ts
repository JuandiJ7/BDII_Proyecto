//Modificar o borrar este archivo resta 5 puntos.

import jwt, { FastifyJWTOptions } from "@fastify/jwt";
import { FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { FastifyReply } from "fastify/types/reply.js";
import { IdUsuarioType } from "../types/usuario.js";


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
      console.log("Verificando si es administrador.");
      const usuarioToken = request.user;
      if (!usuarioToken.is_admin)
        throw reply.unauthorized("Tienes que ser admin para hacer eso.");
    }
  );

  fastify.decorate(
    "verifySelf",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const usuarioToken = request.user;
      const id_usuario = Number((request.params as IdUsuarioType).id_usuario);
      if (usuarioToken.id_usuario !== id_usuario)
        throw reply.unauthorized(
          "No estás autorizado a modificar ese recurso que no te pertenece."
        );
    }
  );

  fastify.decorate(
    "verifySelfOrAdmin",
    async function (request: FastifyRequest, reply: FastifyReply) {
      console.log("Verificando si es administrador o self.");
      const usuarioToken = request.user;
      const id_usuario = Number((request.params as IdUsuarioType).id_usuario);
      console.log({ usuarioToken, id_usuario });
      if (!usuarioToken.is_admin && usuarioToken.id_usuario !== id_usuario)
        throw reply.unauthorized(
          "No estás autorizado a modificar ese recurso que no te pertenece si no eres admin."
        );
    }
  );

  //request.body se asigna luego de hacer la prevalidación. Antes de la prevalidacion es undefined
  fastify.decorate(
    "verifyParamsInBody",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const params: any = request.params;
      if (!params) return;
      const keys = Object.keys(params);
      if (keys.length === 0) return;
      const body: any = request.body;
      if (!body) reply.badRequest("No hay body.");
      console.log({ body });
      for (const key of keys) {
        if (!body.hasOwnProperty(key) || body[key] !== params[key]) {
          reply.badRequest(`${body[key]} !== ${params[key]}`);
        }
      }
    }
  );
});
