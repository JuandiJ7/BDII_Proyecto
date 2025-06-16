import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { Type } from "@sinclair/typebox";
import {
  UsuarioSchema,
} from "../../types/usuario.js";
import * as usuarioService from "../../services/usuarios.js";
import db from "./../../services/db.js";


const descripcionPost =
  "## Crear un ciudadano\n" +
  "- Valida que ambas contraseñas coincidan\n" +
  "- Solo accesible por administradores\n";

const usuariosRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", {
    schema: {
      tags: ["usuarios"],
      summary: "Obtener todos los ciudadanos",
      description: "Devuelve el listado completo de ciudadanos. Solo admin.",
      response: {
        200: {
          content: {
            "application/json": {
              schema: Type.Array(UsuarioSchema),
            },
          },
        },
      },
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function () {
      return usuarioService.findAll();
    },
  });

  fastify.post("/", {
    schema: {
      body: Type.Object({
        credencial: Type.String(),
        password: Type.String(),
      }),
      tags: ["usuarios"],
      summary: "Registrar ciudadano",
      description: descripcionPost,
    },
    handler: async function (request, reply) {
      const nuevoUsuario = request.body as {credencial: string, password: string};

      await usuarioService.create(nuevoUsuario.credencial, nuevoUsuario.password);
      reply.code(201).send();
    },
  });


  fastify.get('/verificar', {
    schema: {
      querystring: Type.Object({
        credencial: Type.String(),
      }),
      response: {
        200: Type.Object({
          nombre: Type.String(),
          apellido: Type.String(),
          cedula: Type.String(),
          circuito: Type.String(),
          departamento: Type.String(),
          direccion_establecimiento: Type.String(),
        }),
      }
    },
    handler: async function (
      request: FastifyRequest<{ Querystring: { credencial: string } }>,
      reply
    ) {
      const { credencial } = request.query;

      const [rows]: any[] = await db.query(
        `SELECT 
          ci.nombres AS nombre,
          CONCAT(ci.apellido1, ' ', ci.apellido2) AS apellido,
          ci.cedula AS cedula,
          c.numero AS circuito,
          d.nombre AS departamento,
          e.direccion AS direccion_establecimiento
        FROM CIUDADANO ci
        JOIN PADRON p ON ci.credencial = p.credencial
        JOIN CIRCUITO c ON p.id_circuito = c.id
        JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
        JOIN LOCALIDAD l ON e.id_localidad = l.id
        JOIN DEPARTAMENTO d ON l.id_departamento = d.id
        WHERE ci.credencial = ?`,
        [credencial]
      );

      if (rows.length === 0) {
        return reply.notFound('Ciudadano no encontrado');
      }

      return rows[0];
    }
  });

  fastify.get("/verificar/:credencial",
    {
      schema: {
        params: Type.Object({
          credencial: Type.String(),
        }),
        response: {
          200: Type.Object({
            credencial: Type.String(),
            rol: Type.String(),
          }),
          404: Type.Object({
            message: Type.String(),
          }),
        },
      },
    },
    async function (request, reply) {
      const { credencial } = request.params as { credencial: string };

      const [rows]: any[] = await db.query(
        `SELECT credencial, rol FROM USUARIO WHERE credencial = ?`,
        [credencial]
      );

      if (rows.length === 0) {
        return reply.status(204).send({ message: "No registrado" });
      }

      return rows[0];
    }
  );

  fastify.get("/:credencial", {
    schema: {
      params: Type.Object({
        credencial: Type.String(),
      }),
      response: {
        200: Type.Object({
          nombre: Type.String(),
          apellido: Type.String(),
          cedula: Type.String(),
          circuito: Type.String(),
          departamento: Type.String(),
          direccion_establecimiento: Type.String(),
        }),
        404: Type.Object({
          message: Type.String(),
        }),
      },
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const { credencial } = request.params as { credencial: string };

      const [rows]: any[] = await db.query(
        `SELECT 
          ci.nombres AS nombre,
          CONCAT(ci.apellido1, ' ', ci.apellido2) AS apellido,
          ci.cedula AS cedula,
          c.numero AS circuito,
          d.nombre AS departamento,
          e.direccion AS direccion_establecimiento
        FROM CIUDADANO ci
        JOIN PADRON p ON ci.credencial = p.credencial
        JOIN CIRCUITO c ON p.id_circuito = c.id
        JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
        JOIN LOCALIDAD l ON e.id_localidad = l.id
        JOIN DEPARTAMENTO d ON l.id_departamento = d.id
        WHERE ci.credencial = ?`,
        [credencial]
      );

      if (rows.length === 0) {
        return reply.status(404).send({ message: "Ciudadano no encontrado" });
      }

      return rows[0];
    }
  });
};

export default usuariosRoutes;