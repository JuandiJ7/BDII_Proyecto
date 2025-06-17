import { FastifyPluginAsync } from "fastify";
import db from "../../services/db.js";
import { UsuarioLoginType } from "../../types/usuarioLogin.js";

const eleccionesRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Obtener todos los partidos con presidente y vicepresidente
  fastify.get("/partidos", {
    schema: {
      tags: ["elecciones"],
      summary: "Obtener todos los partidos con presidente y vicepresidente",
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "integer" },
              nombre: { type: "string" },
              direccion: { type: "string" },
              presidente: {
                type: "object",
                properties: {
                  credencial: { type: "string" },
                  nombres: { type: "string" },
                  apellidos: { type: "string" }
                },
                nullable: true
              },
              vicepresidente: {
                type: "object",
                properties: {
                  credencial: { type: "string" },
                  nombres: { type: "string" },
                  apellidos: { type: "string" }
                },
                nullable: true
              }
            }
          }
        }
      }
    },
    handler: async function (request, reply) {
      const [rows]: any[] = await db.query(
        `SELECT 
            p.id, 
            p.nombre, 
            p.direccion,
            pres.credencial AS presidente_credencial,
            pres_ci.nombres AS presidente_nombres,
            CONCAT(pres_ci.apellido1, ' ', COALESCE(pres_ci.apellido2, '')) AS presidente_apellidos,
            vice.credencial AS vicepresidente_credencial,
            vice_ci.nombres AS vicepresidente_nombres,
            CONCAT(vice_ci.apellido1, ' ', COALESCE(vice_ci.apellido2, '')) AS vicepresidente_apellidos
        FROM PARTIDO p
        LEFT JOIN INTEGRANTES pres ON pres.id_partido = p.id AND pres.rol = 'PRESIDENTE'
        LEFT JOIN CIUDADANO pres_ci ON pres.credencial = pres_ci.credencial
        LEFT JOIN INTEGRANTES vice ON vice.id_partido = p.id AND vice.rol = 'VICEPRESIDENTE'
        LEFT JOIN CIUDADANO vice_ci ON vice.credencial = vice_ci.credencial`
      );

      const partidos = rows.map((row: any) => ({
        id: row.id,
        nombre: row.nombre,
        direccion: row.direccion,
        presidente: row.presidente_credencial ? {
          credencial: row.presidente_credencial,
          nombres: row.presidente_nombres,
          apellidos: row.presidente_apellidos
        } : null,
        vicepresidente: row.vicepresidente_credencial ? {
          credencial: row.vicepresidente_credencial,
          nombres: row.vicepresidente_nombres,
          apellidos: row.vicepresidente_apellidos
        } : null
      }));

      return partidos;
    }
  });

  // Obtener listas de un partido específico filtradas por departamento del ciudadano
  fastify.get("/partidos/:idPartido/listas", {
    schema: {
      tags: ["elecciones"],
      summary: "Obtener listas de un partido específico filtradas por departamento del ciudadano",
      params: {
        type: "object",
        properties: {
          idPartido: { type: "integer" }
        },
        required: ["idPartido"]
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "integer" },
              numero: { type: "integer" },
              id_departamento: { type: "integer" },
              nombre_departamento: { type: "string" },
              nombre_partido: { type: "string" }
            }
          }
        }
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const { idPartido } = request.params as { idPartido: number };
      const usuario = request.user as unknown as UsuarioLoginType;
      const credencial = usuario.credencial;

      // Obtener el departamento del ciudadano
      const [departamentoRows]: any[] = await db.query(
        `SELECT d.id, d.nombre
         FROM CIUDADANO c
         JOIN PADRON p ON c.credencial = p.credencial
         JOIN CIRCUITO ci ON p.id_circuito = ci.id
         JOIN ESTABLECIMIENTO e ON ci.id_establecimiento = e.id
         JOIN LOCALIDAD l ON e.id_localidad = l.id
         JOIN DEPARTAMENTO d ON l.id_departamento = d.id
         WHERE c.credencial = ?`,
        [credencial]
      );

      if (!departamentoRows.length) {
        return reply.code(404).send({ error: 'No se encontró el departamento del ciudadano' });
      }

      const idDepartamento = departamentoRows[0].id;

      // Obtener las listas del partido para ese departamento
      const [rows]: any[] = await db.query(
        `SELECT l.id, l.numero, l.id_departamento, d.nombre as nombre_departamento, p.nombre as nombre_partido
         FROM LISTA l
         JOIN DEPARTAMENTO d ON l.id_departamento = d.id
         JOIN PARTIDO p ON l.id_partido = p.id
         WHERE l.id_partido = ? AND l.id_departamento = ?`,
        [idPartido, idDepartamento]
      );
      return rows;
    }
  });

  // Obtener detalles completos de una lista
  fastify.get("/listas/:idLista/detalles", {
    schema: {
      tags: ["elecciones"],
      summary: "Obtener detalles completos de una lista",
      params: {
        type: "object",
        properties: {
          idLista: { type: "integer" }
        },
        required: ["idLista"]
      },
      response: {
        200: {
          type: "object",
          properties: {
            id: { type: "integer" },
            numero: { type: "integer" },
            departamento: {
              type: "object",
              properties: {
                id: { type: "integer" },
                nombre: { type: "string" }
              }
            },
            partido: {
              type: "object",
              properties: {
                id: { type: "integer" },
                nombre: { type: "string" }
              }
            },
            integrantes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  credencial: { type: "string" },
                  nombres: { type: "string" },
                  apellidos: { type: "string" },
                  orden: { type: "integer" },
                  candidato: { type: "string" }
                }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const { idLista } = request.params as { idLista: number };

      // Obtener información básica de la lista
      const [listaRows]: any[] = await db.query(
        `SELECT l.id, l.numero, 
                d.id as departamento_id, d.nombre as departamento_nombre,
                p.id as partido_id, p.nombre as partido_nombre
         FROM LISTA l
         JOIN DEPARTAMENTO d ON l.id_departamento = d.id
         JOIN PARTIDO p ON l.id_partido = p.id
         WHERE l.id = ?`,
        [idLista]
      );

      if (!listaRows.length) {
        return reply.code(404).send({ error: 'Lista no encontrada' });
      }

      // Obtener integrantes de la lista
      const [integrantesRows]: any[] = await db.query(
        `SELECT li.credencial, li.orden, li.candidato,
                c.nombres, CONCAT(c.apellido1, ' ', COALESCE(c.apellido2, '')) as apellidos
         FROM LISTAINTEGRANTES li
         JOIN CIUDADANO c ON li.credencial = c.credencial
         WHERE li.id_lista = ?
         ORDER BY li.orden`,
        [idLista]
      );

      return {
        id: listaRows[0].id,
        numero: listaRows[0].numero,
        departamento: {
          id: listaRows[0].departamento_id,
          nombre: listaRows[0].departamento_nombre
        },
        partido: {
          id: listaRows[0].partido_id,
          nombre: listaRows[0].partido_nombre
        },
        integrantes: integrantesRows.map((row: any) => ({
          credencial: row.credencial,
          nombres: row.nombres,
          apellidos: row.apellidos,
          orden: row.orden,
          candidato: row.candidato
        }))
      };
    }
  });

  // Obtener todas las papeletas
  fastify.get("/papeletas", {
    schema: {
      tags: ["elecciones"],
      summary: "Obtener todas las papeletas",
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "integer" },
              nombre: { type: "string" },
              color: { type: "string" }
            }
          }
        }
      }
    },
    handler: async function (request, reply) {
      try {
        const [rows]: any[] = await db.query(
          `SELECT id, nombre, color FROM PAPELETA`
        );
        return rows;
      } catch (error) {
        console.error('Error al obtener papeletas:', error);
        return reply.code(500).send({ error: 'Error al obtener papeletas' });
      }
    }
  });

  // Obtener integrantes de una lista específica
  fastify.get("/listas/:idLista/integrantes", {
    schema: {
      tags: ["elecciones"],
      summary: "Obtener integrantes de una lista específica",
      params: {
        type: "object",
        properties: {
          idLista: { type: "integer" }
        },
        required: ["idLista"]
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              credencial: { type: "string" },
              orden: { type: "integer" },
              candidato: { type: "string" }
            }
          }
        }
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const { idLista } = request.params as { idLista: number };
      const [rows]: any[] = await db.query(
        `SELECT credencial, orden, candidato FROM LISTAINTEGRANTES WHERE id_lista = ?`,
        [idLista]
      );
      return rows;
    }
  });

  // Aquí se agregarán los otros endpoints: listas, integrantes, papeletas
};

export default eleccionesRoutes; 