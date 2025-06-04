import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { Type } from "@sinclair/typebox";
import {
  NuevoUsuarioSchema,
  NuevoUsuarioType,
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
      body: NuevoUsuarioSchema,
      tags: ["usuarios"],
      summary: "Registrar ciudadano",
      description: descripcionPost,
      response: {
        201: {
          content: {
            "application/json": {
              schema: UsuarioSchema,
            },
          },
        },
      },
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      const nuevoUsuario = request.body as NuevoUsuarioType;

      if (nuevoUsuario.contraseña !== nuevoUsuario.contraseña2) {
        return reply.badRequest("Las contraseñas no coinciden.");
      }

      const creado = await usuarioService.create(nuevoUsuario);
      reply.code(201).send(creado);
    },
  });


  fastify.post('/verificar', {
    schema: {
      body: Type.Object({
        credencial: Type.String(),
        cedula: Type.String(),
      }),
      response: {
        200: Type.Object({
          nombre: Type.String(),
          apellido: Type.String(),
          departamento: Type.String(),
          circuito: Type.String(),
        }),
      },
    },
    handler: async function (
      request: FastifyRequest<{ Body: { credencial: string; cedula: string } }>,
      reply
    ) {
      const { credencial, cedula } = request.body;

      const [rows]: any[] = await db.query(
        `SELECT 
          ci.nombres AS nombre,
          CONCAT(ci.apellido1, ' ', ci.apellido2) AS apellido,
          d.nombre AS departamento,
          c.numero AS circuito
        FROM CIUDADANO ci
        JOIN PADRON p ON ci.credencial = p.credencial
        JOIN CIRCUITO c ON p.id_circuito = c.id
        JOIN DEPARTAMENTO d ON c.id_departamento = d.id
        WHERE ci.credencial = ? AND ci.cedula = ?`,
        [credencial, cedula]
      );


      if (rows.length === 0) {
        return reply.notFound('Ciudadano no encontrado');
      }

      return rows[0];
    }
  });
};

export default usuariosRoutes;