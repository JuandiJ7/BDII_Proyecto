"use strict";
import fp from "fastify-plugin";
import swagger, { SwaggerOptions } from "@fastify/swagger";
import swaggerui from "@fastify/swagger-ui";

const swaggerOpts: SwaggerOptions = {
  openapi: {
    info: {
      title: "API BDII 2025",
      summary:
        "Summary: Api creado para Obligatorio BDII 2025",
      description: "Api creado para Obligatorio BDII 2025",
      termsOfService: `http://aca.va.la.url.con.los.terminos.y.condiciones`,
      version: "1.0",
      license: {
        name: "Apache 2.0",
        url: "http://www.apache.org/licenses/LICENSE-2.0.html",
      },
    },
    servers: [
      {
        url: "http://localhost/back",
        description: "Development server",
        variables: {},
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    // consumes: ["application/json"],
    // produces: ["application/json"],
    tags: [
      {
        name: "auth",
        description: "Endpoints para autenticación.",
      },
      {
        name: "usuarios",
        description: "Endpoints para CRUD de usuarios.",
      }
    ],
  },
  hideUntagged: true,
  //   exposeRoute: true,
};

export default fp(async function (fastify, opts) {
  await fastify.register(swagger, swaggerOpts);

  await fastify.register(swaggerui, {
    routePrefix: "docs",
    uiConfig: {
      docExpansion: "none",
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });
});
