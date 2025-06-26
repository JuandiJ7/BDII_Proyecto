import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { Type } from "@sinclair/typebox";
import {
  UsuarioSchema,
} from "../../types/usuario.js";
import { UsuarioLoginType } from "../../types/usuarioLogin.js";
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

  fastify.post("/validar-votante", {
    schema: {
      body: Type.Object({
        credencialVotante: Type.String(),
      }),
      tags: ["usuarios"],
      summary: "Validar votante por funcionario",
      description: "Permite a un funcionario validar un votante para su circuito",
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      const { credencialVotante } = request.body as { credencialVotante: string };

      // Verificar que el usuario sea funcionario
      if (usuario.rol !== 'FUNCIONARIO') {
        return reply.forbidden('Solo los funcionarios pueden validar votantes');
      }

      try {
        // Obtener datos del funcionario (circuito)
        const [funcionarioRows]: any[] = await db.query(
          `SELECT 
            c.id AS id_circuito,
            c.numero AS circuito
          FROM CIUDADANO ci
          JOIN PADRON p ON ci.credencial = p.credencial
          JOIN CIRCUITO c ON p.id_circuito = c.id
          WHERE ci.credencial = ?`,
          [usuario.credencial]
        );

        if (funcionarioRows.length === 0) {
          return reply.notFound('Funcionario no encontrado en el padrón');
        }

        const funcionario = funcionarioRows[0];

        // Obtener datos del votante y su estado en PADRON
        const [votanteRows]: any[] = await db.query(
          `SELECT 
            ci.nombres AS nombre,
            CONCAT(ci.apellido1, ' ', ci.apellido2) AS apellido,
            ci.cedula AS cedula,
            ci.credencial,
            c.id AS id_circuito_original,
            c.numero AS circuito,
            p.habilitado,
            p.circuito_final,
            p.voto
          FROM CIUDADANO ci
          JOIN PADRON p ON ci.credencial = p.credencial
          JOIN CIRCUITO c ON p.id_circuito = c.id
          WHERE ci.credencial = ?`,
          [credencialVotante]
        );

        if (votanteRows.length === 0) {
          return reply.notFound('Votante no encontrado');
        }

        const votante = votanteRows[0];

        // Verificar si el votante ya votó
        if (votante.voto) {
          return reply.badRequest('El votante ya ha emitido su voto y no puede ser habilitado nuevamente');
        }

        // Determinar si es observado (circuito diferente al del funcionario)
        const esObservado = votante.id_circuito_original !== funcionario.id_circuito;
        
        // Si es observado, establecer circuito_final al circuito del funcionario
        // Si no es observado, mantener circuito_final como NULL (usa el original)
        const circuitoFinal = esObservado ? funcionario.id_circuito : null;

        // Actualizar el padrón
        await db.query(
          `UPDATE PADRON SET habilitado = true, circuito_final = ? WHERE credencial = ?`,
          [circuitoFinal, credencialVotante]
        );

        return {
          success: true,
          votante: {
            nombre: votante.nombre,
            apellido: votante.apellido,
            cedula: votante.cedula,
            credencial: votante.credencial,
            circuito: votante.circuito
          },
          esObservado: esObservado,
          mensaje: esObservado 
            ? 'Votante habilitado como observado (circuito diferente)'
            : 'Votante habilitado correctamente'
        };

      } catch (error) {
        console.error('Error al validar votante:', error);
        return reply.internalServerError('Error interno al validar votante');
      }
    },
  });
};

export default usuariosRoutes;