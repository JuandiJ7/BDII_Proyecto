import { FastifyPluginAsync } from "fastify";
import db from "../../services/db.js";
import { UsuarioLoginType } from "../../types/usuarioLogin.js";
import { Type } from "@sinclair/typebox";

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
        LEFT JOIN CIUDADANO vice_ci ON vice.credencial = vice_ci.credencial
        WHERE p.id != 12`
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

  // Endpoint de prueba para verificar datos del usuario
  fastify.get("/votante/debug", {
    schema: {
      tags: ["elecciones"],
      summary: "Debug: Verificar datos del votante autenticado",
      response: {
        200: Type.Object({
          usuario: Type.Object({
            credencial: Type.String(),
            rol: Type.String()
          }),
          padron: Type.Any(),
          ciudadano: Type.Any()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      const credencial = usuario.credencial;

      try {
        // Verificar datos del usuario autenticado
        console.log('Usuario autenticado:', usuario);

        // Verificar si existe en PADRON
        const [padronRows]: any[] = await db.query(
          `SELECT * FROM PADRON WHERE credencial = ?`,
          [credencial]
        );

        // Verificar si existe en CIUDADANO
        const [ciudadanoRows]: any[] = await db.query(
          `SELECT * FROM CIUDADANO WHERE credencial = ?`,
          [credencial]
        );

        return {
          usuario: {
            credencial: usuario.credencial,
            rol: usuario.rol
          },
          padron: padronRows.length > 0 ? padronRows[0] : null,
          ciudadano: ciudadanoRows.length > 0 ? ciudadanoRows[0] : null
        };
      } catch (error) {
        console.error('Error en debug:', error);
        return reply.internalServerError('Error interno en debug');
      }
    }
  });

  // Verificar si un votante está habilitado
  fastify.get("/votante/habilitado", {
    schema: {
      tags: ["elecciones"],
      summary: "Verificar si un votante está habilitado para votar",
      response: {
        200: Type.Object({
          habilitado: Type.Boolean(),
          yaVoto: Type.Boolean(),
          mensaje: Type.String()
        }),
        404: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      const credencial = usuario.credencial;

      try {
        console.log('Verificando habilitación para credencial:', credencial);

        // Verificar datos del padrón
        const [padronRows]: any[] = await db.query(
          `SELECT habilitado, voto FROM PADRON WHERE credencial = ?`,
          [credencial]
        );

        if (padronRows.length === 0) {
          console.log('Votante no encontrado en el padrón');
          return reply.code(404).send({ error: 'Votante no encontrado en el padrón' });
        }

        const padron = padronRows[0];
        console.log('Datos del padrón:', padron);

        // Para campos booleanos: 0 = false, 1 = true
        const estaHabilitado = padron.habilitado === 1 || padron.habilitado === true;
        const yaVoto = padron.voto === 1 || padron.voto === true;

        console.log('estaHabilitado:', estaHabilitado, 'yaVoto:', yaVoto);

        let mensaje = '';
        if (!estaHabilitado) {
          mensaje = 'No estás habilitado para votar. Debe ser validado por un funcionario primero.';
        } else if (yaVoto) {
          mensaje = 'Ya has emitido tu voto.';
        } else {
          mensaje = 'Estás habilitado para votar.';
        }

        return {
          habilitado: estaHabilitado && !yaVoto,
          yaVoto: yaVoto,
          mensaje: mensaje
        };

      } catch (error) {
        console.error('Error al verificar habilitación:', error);
        return reply.internalServerError('Error interno al verificar habilitación');
      }
    }
  });

  // Obtener circuito del votante autenticado
  fastify.get("/votante/circuito", {
    schema: {
      tags: ["elecciones"],
      summary: "Obtener circuito del votante autenticado",
      response: {
        200: Type.Object({
          id_circuito: Type.Number(),
          nombre_circuito: Type.String()
        }),
        404: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      const credencial = usuario.credencial;

      try {
        console.log('Buscando circuito para credencial:', credencial);

        // Primero verificar si existe en PADRON
        const [padronRows]: any[] = await db.query(
          `SELECT id_circuito FROM PADRON WHERE credencial = ?`,
          [credencial]
        );

        if (padronRows.length === 0) {
          console.log('No se encontró en PADRON');
          return reply.code(404).send({ error: 'Votante no encontrado en el padrón' });
        }

        const idCircuito = padronRows[0].id_circuito;
        console.log('ID Circuito encontrado:', idCircuito);

        if (!idCircuito) {
          console.log('No tiene circuito asignado');
          return reply.code(404).send({ error: 'Votante no tiene circuito asignado' });
        }

        // Obtener información del circuito
        const [circuitoRows]: any[] = await db.query(
          `SELECT id, numero FROM CIRCUITO WHERE id = ?`,
          [idCircuito]
        );

        if (circuitoRows.length === 0) {
          console.log('Circuito no encontrado');
          return reply.code(404).send({ error: 'Circuito no encontrado' });
        }

        const circuito = circuitoRows[0];
        console.log('Circuito encontrado:', circuito);

        return {
          id_circuito: circuito.id,
          nombre_circuito: circuito.numero
        };

      } catch (error) {
        console.error('Error al obtener circuito del votante:', error);
        return reply.internalServerError('Error interno al obtener el circuito');
      }
    }
  });

  // Registrar un voto
  fastify.post("/voto", {
    schema: {
      tags: ["elecciones"],
      summary: "Registrar un voto",
      description: "Registra el voto de un ciudadano habilitado",
      body: Type.Object({
        id_lista: Type.Union([Type.Number(), Type.Null()]),
        papeletas: Type.Array(Type.Number()),
        credencial_votante: Type.String()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        }),
        400: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      const { id_lista, papeletas, credencial_votante } = request.body as {
        id_lista: number | null;
        papeletas: number[];
        credencial_votante: string;
      };

      // Verificar que el usuario que vota sea el mismo que está autenticado
      if (usuario.credencial !== credencial_votante) {
        return reply.forbidden('Solo puedes registrar tu propio voto');
      }

      try {
        console.log('=== INICIO VALIDACIÓN VOTO ===');
        console.log('Credencial del votante:', credencial_votante);
        console.log('Usuario autenticado:', usuario.credencial);
        
        // Verificar que el votante esté habilitado y no haya votado
        const [padronRows]: any[] = await db.query(
          `SELECT habilitado, voto FROM PADRON WHERE credencial = ?`,
          [credencial_votante]
        );

        console.log('Resultado consulta PADRON:', padronRows);

        if (padronRows.length === 0) {
          console.log('ERROR: Votante no encontrado en el padrón');
          return reply.badRequest('Votante no encontrado en el padrón');
        }

        const padron = padronRows[0];
        console.log('Datos del padrón:', padron);
        console.log('habilitado:', padron.habilitado, 'tipo:', typeof padron.habilitado);
        console.log('voto:', padron.voto, 'tipo:', typeof padron.voto);

        // Para campos booleanos: 0 = false, 1 = true
        const estaHabilitado = padron.habilitado === 1 || padron.habilitado === true;
        const yaVoto = padron.voto === 1 || padron.voto === true;
        
        console.log('estaHabilitado (convertido):', estaHabilitado);
        console.log('yaVoto (convertido):', yaVoto);

        if (!estaHabilitado) {
          console.log('ERROR: Votante no está habilitado');
          return reply.badRequest('No estás habilitado para votar');
        }

        if (yaVoto) {
          console.log('ERROR: Votante ya emitió su voto');
          return reply.badRequest('Ya has emitido tu voto');
        }

        console.log('=== VALIDACIONES PASADAS - CONTINUANDO ===');

        // Obtener información del circuito donde debe votar desde PADRON
        const [padronVotoRows]: any[] = await db.query(
          `SELECT 
            id_circuito,
            COALESCE(circuito_final, id_circuito) as circuito_voto,
            CASE WHEN circuito_final IS NOT NULL THEN 1 ELSE 0 END as es_observado
           FROM PADRON WHERE credencial = ?`,
          [credencial_votante]
        );

        if (padronVotoRows.length === 0) {
          return reply.badRequest('Error al obtener información del circuito de voto');
        }

        const circuitoVoto = padronVotoRows[0].circuito_voto;
        const esObservado = padronVotoRows[0].es_observado === 1;

        console.log('Circuito de voto:', circuitoVoto);
        console.log('Es observado:', esObservado);

        // Verificar que la lista existe (excepto para voto en blanco)
        if (id_lista !== null) {
          const [listaRows]: any[] = await db.query(
            `SELECT id FROM LISTA WHERE id = ?`,
            [id_lista]
          );

          if (listaRows.length === 0) {
            return reply.badRequest('Lista no encontrada');
          }
        }

        // Verificar que el circuito de voto existe
        const [circuitoRows]: any[] = await db.query(
          `SELECT id FROM CIRCUITO WHERE id = ?`,
          [circuitoVoto]
        );

        if (circuitoRows.length === 0) {
          return reply.badRequest('Circuito de voto no encontrado');
        }

        // Verificar que las papeletas existen
        if (papeletas.length > 0) {
          const papeletasPlaceholders = papeletas.map(() => '?').join(',');
          const [papeletasRows]: any[] = await db.query(
            `SELECT id FROM PAPELETA WHERE id IN (${papeletasPlaceholders})`,
            papeletas
          );

          if (papeletasRows.length !== papeletas.length) {
            return reply.badRequest('Una o más papeletas no encontradas');
          }
        }

        // Registrar el voto con el circuito correcto y si es observado
        const [votoResult]: any[] = await db.query(
          `INSERT INTO VOTO (id_lista, fecha_hora, es_observado, id_circuito) VALUES (?, NOW(), ?, ?)`,
          [id_lista, esObservado, circuitoVoto]
        );

        const idVoto = votoResult.insertId;

        // Registrar las papeletas seleccionadas
        if (papeletas.length > 0) {
          const papeletasValues = papeletas.map(idPapeleta => [idVoto, idPapeleta]);
          await db.query(
            `INSERT INTO PAPELETASVOTO (id_voto, id_papeleta) VALUES ?`,
            [papeletasValues]
          );
        }

        // Marcar en el padrón que ya votó
        await db.query(
          `UPDATE PADRON SET voto = true, habilitado = false WHERE credencial = ?`,
          [credencial_votante]
        );

        return {
          success: true,
          mensaje: 'Voto registrado correctamente'
        };

      } catch (error) {
        console.error('Error al registrar voto:', error);
        return reply.internalServerError('Error interno al registrar el voto');
      }
    }
  });

  // ==================== ENDPOINTS DE RESULTADOS ====================

  // Obtener información del circuito (para funcionarios)
  fastify.get("/resultados/circuito/info", {
    schema: {
      tags: ["resultados"],
      summary: "Obtener información del circuito del funcionario",
      response: {
        200: Type.Object({
          circuito: Type.Object({
            id: Type.Number(),
            numero: Type.String(),
            cerrado: Type.Boolean()
          }),
          estadisticas: Type.Object({
            total_habilitados: Type.Number(),
            total_votaron: Type.Number(),
            total_observados: Type.Number()
          })
        }),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      
      // Verificar que sea funcionario
      if (usuario.rol !== 'FUNCIONARIO') {
        return reply.forbidden('Solo los funcionarios pueden acceder a esta información');
      }

      try {
        // Obtener el circuito del funcionario y su estado
        const [circuitoRows]: any[] = await db.query(
          `SELECT c.id, c.numero, c.circuito_cerrado
           FROM CIUDADANO ci
           JOIN PADRON p ON ci.credencial = p.credencial
           JOIN CIRCUITO c ON p.id_circuito = c.id
           WHERE ci.credencial = ?`,
          [usuario.credencial]
        );

        if (circuitoRows.length === 0) {
          return reply.notFound('Funcionario no encontrado en el padrón');
        }

        const circuito = circuitoRows[0];
        const circuitoCerrado = circuito.circuito_cerrado === 1;

        // Obtener estadísticas del circuito
        const [statsRows]: any[] = await db.query(
          `SELECT 
            COUNT(*) as total_habilitados,
            SUM(CASE WHEN voto = 1 THEN 1 ELSE 0 END) as total_votaron,
            SUM(CASE WHEN circuito_final IS NOT NULL AND voto = 1 THEN 1 ELSE 0 END) as total_observados
           FROM PADRON 
           WHERE id_circuito = ?`,
          [circuito.id]
        );

        const estadisticas = statsRows[0];

        return {
          circuito: {
            id: circuito.id,
            numero: circuito.numero,
            cerrado: circuitoCerrado
          },
          estadisticas: {
            total_habilitados: estadisticas.total_habilitados,
            total_votaron: estadisticas.total_votaron,
            total_observados: estadisticas.total_observados
          }
        };

      } catch (error) {
        console.error('Error al obtener información del circuito:', error);
        return reply.internalServerError('Error interno al obtener información del circuito');
      }
    }
  });

  // Obtener resultados por lista (para funcionarios - su circuito)
  fastify.get("/resultados/circuito/listas", {
    schema: {
      tags: ["resultados"],
      summary: "Obtener resultados por lista del circuito del funcionario",
      response: {
        200: Type.Array(Type.Object({
          id_lista: Type.Number(),
          numero_lista: Type.Number(),
          nombre_partido: Type.String(),
          nombre_departamento: Type.String(),
          votos: Type.Number(),
          porcentaje: Type.Number()
        })),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      
      // Verificar que sea funcionario
      if (usuario.rol !== 'FUNCIONARIO') {
        return reply.forbidden('Solo los funcionarios pueden acceder a esta información');
      }

      try {
        // Obtener el circuito del funcionario, su departamento y estado
        const [circuitoRows]: any[] = await db.query(
          `SELECT c.id, c.circuito_cerrado, d.id as id_departamento, d.nombre as nombre_departamento
           FROM CIUDADANO ci
           JOIN PADRON p ON ci.credencial = p.credencial
           JOIN CIRCUITO c ON p.id_circuito = c.id
           JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
           JOIN LOCALIDAD l ON e.id_localidad = l.id
           JOIN DEPARTAMENTO d ON l.id_departamento = d.id
           WHERE ci.credencial = ?`,
          [usuario.credencial]
        );

        if (circuitoRows.length === 0) {
          return reply.notFound('Funcionario no encontrado en el padrón');
        }

        const idCircuito = circuitoRows[0].id;
        const circuitoCerrado = circuitoRows[0].circuito_cerrado === 1;
        const idDepartamento = circuitoRows[0].id_departamento;

        // Verificar que el circuito esté cerrado
        if (!circuitoCerrado) {
          return reply.forbidden('Los resultados solo son visibles cuando el circuito esté cerrado');
        }

        // Obtener total de votos en el circuito
        const [totalRows]: any[] = await db.query(
          `SELECT COUNT(*) as total
           FROM VOTO 
           WHERE id_circuito = ?`,
          [idCircuito]
        );

        const totalVotos = totalRows[0].total;

        // Obtener solo las listas habilitadas para ese circuito (mismo departamento)
        const [resultadosRows]: any[] = await db.query(
          `SELECT 
            l.id as id_lista,
            l.numero as numero_lista,
            p.nombre as nombre_partido,
            d.nombre as nombre_departamento,
            COUNT(v.id) as votos,
            CASE 
              WHEN ? > 0 THEN (COUNT(v.id) * 100.0 / ?)
              ELSE 0 
            END as porcentaje
           FROM LISTA l
           JOIN PARTIDO p ON l.id_partido = p.id
           JOIN DEPARTAMENTO d ON l.id_departamento = d.id
           LEFT JOIN VOTO v ON l.id = v.id_lista AND v.id_circuito = ?
           WHERE l.id_departamento = ?
           GROUP BY l.id, l.numero, p.nombre, d.nombre
           ORDER BY votos DESC, l.numero ASC`,
          [totalVotos, totalVotos, idCircuito, idDepartamento]
        );

        return resultadosRows;

      } catch (error) {
        console.error('Error al obtener resultados por lista:', error);
        return reply.internalServerError('Error interno al obtener resultados por lista');
      }
    }
  });

  // Obtener resultados por partido (para funcionarios - su circuito)
  fastify.get("/resultados/circuito/partidos", {
    schema: {
      tags: ["resultados"],
      summary: "Obtener resultados por partido del circuito del funcionario",
      response: {
        200: Type.Array(Type.Object({
          id_partido: Type.Number(),
          nombre_partido: Type.String(),
          presidente: Type.String(),
          votos: Type.Number(),
          porcentaje: Type.Number()
        })),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      
      // Verificar que sea funcionario
      if (usuario.rol !== 'FUNCIONARIO') {
        return reply.forbidden('Solo los funcionarios pueden acceder a esta información');
      }

      try {
        // Obtener el circuito del funcionario y su estado
        const [circuitoRows]: any[] = await db.query(
          `SELECT c.id, c.circuito_cerrado
           FROM CIUDADANO ci
           JOIN PADRON p ON ci.credencial = p.credencial
           JOIN CIRCUITO c ON p.id_circuito = c.id
           WHERE ci.credencial = ?`,
          [usuario.credencial]
        );

        if (circuitoRows.length === 0) {
          return reply.notFound('Funcionario no encontrado en el padrón');
        }

        const idCircuito = circuitoRows[0].id;
        const circuitoCerrado = circuitoRows[0].circuito_cerrado === 1;

        // Verificar que el circuito esté cerrado
        if (!circuitoCerrado) {
          return reply.forbidden('Los resultados solo son visibles cuando el circuito esté cerrado');
        }

        // Obtener total de votos en el circuito
        const [totalRows]: any[] = await db.query(
          `SELECT COUNT(*) as total
           FROM VOTO 
           WHERE id_circuito = ?`,
          [idCircuito]
        );

        const totalVotos = totalRows[0].total;

        // Obtener resultados por partido
        const [resultadosRows]: any[] = await db.query(
          `SELECT 
            p.id as id_partido,
            p.nombre as nombre_partido,
            CONCAT(ci.nombres, ' ', ci.apellido1, ' ', COALESCE(ci.apellido2, '')) as presidente,
            COUNT(v.id) as votos,
            CASE 
              WHEN ? > 0 THEN (COUNT(v.id) * 100.0 / ?)
              ELSE 0 
            END as porcentaje
           FROM PARTIDO p
           LEFT JOIN INTEGRANTES i ON p.id = i.id_partido AND i.rol = 'PRESIDENTE'
           LEFT JOIN CIUDADANO ci ON i.credencial = ci.credencial
           LEFT JOIN LISTA l ON p.id = l.id_partido
           LEFT JOIN VOTO v ON l.id = v.id_lista AND v.id_circuito = ?
           GROUP BY p.id, p.nombre, presidente
           ORDER BY votos DESC, p.nombre ASC`,
          [totalVotos, totalVotos, idCircuito]
        );

        return resultadosRows;

      } catch (error) {
        console.error('Error al obtener resultados por partido:', error);
        return reply.internalServerError('Error interno al obtener resultados por partido');
      }
    }
  });

  // Obtener resultados de papeletas (para funcionarios - su circuito)
  fastify.get("/resultados/circuito/papeletas", {
    schema: {
      tags: ["resultados"],
      summary: "Obtener resultados de papeletas del circuito del funcionario",
      response: {
        200: Type.Array(Type.Object({
          id_papeleta: Type.Number(),
          nombre_papeleta: Type.String(),
          votos_favor: Type.Number(),
          votos_contra: Type.Number(),
          porcentaje_favor: Type.Number(),
          porcentaje_contra: Type.Number()
        })),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      
      // Verificar que sea funcionario
      if (usuario.rol !== 'FUNCIONARIO') {
        return reply.forbidden('Solo los funcionarios pueden acceder a esta información');
      }

      try {
        // Obtener el circuito del funcionario y su estado
        const [circuitoRows]: any[] = await db.query(
          `SELECT c.id, c.circuito_cerrado
           FROM CIUDADANO ci
           JOIN PADRON p ON ci.credencial = p.credencial
           JOIN CIRCUITO c ON p.id_circuito = c.id
           WHERE ci.credencial = ?`,
          [usuario.credencial]
        );

        if (circuitoRows.length === 0) {
          return reply.notFound('Funcionario no encontrado en el padrón');
        }

        const idCircuito = circuitoRows[0].id;
        const circuitoCerrado = circuitoRows[0].circuito_cerrado === 1;

        // Verificar que el circuito esté cerrado
        if (!circuitoCerrado) {
          return reply.forbidden('Los resultados solo son visibles cuando el circuito esté cerrado');
        }

        // Obtener total de votos en el circuito
        const [totalRows]: any[] = await db.query(
          `SELECT COUNT(*) as total
           FROM VOTO 
           WHERE id_circuito = ?`,
          [idCircuito]
        );

        const totalVotos = totalRows[0].total;

        // Obtener resultados de papeletas SOLO para ese circuito
        const [resultadosRows]: any[] = await db.query(
          `SELECT 
            pa.id as id_papeleta,
            pa.nombre as nombre_papeleta,
            COUNT(pv.id_papeleta) as votos_favor,
            (? - COUNT(pv.id_papeleta)) as votos_contra,
            CASE 
              WHEN ? > 0 THEN (COUNT(pv.id_papeleta) * 100.0 / ?)
              ELSE 0 
            END as porcentaje_favor,
            CASE 
              WHEN ? > 0 THEN ((? - COUNT(pv.id_papeleta)) * 100.0 / ?)
              ELSE 0 
            END as porcentaje_contra
           FROM PAPELETA pa
           LEFT JOIN PAPELETASVOTO pv ON pa.id = pv.id_papeleta
           LEFT JOIN VOTO v ON pv.id_voto = v.id AND v.id_circuito = ?
           GROUP BY pa.id, pa.nombre
           ORDER BY pa.nombre ASC`,
          [totalVotos, totalVotos, totalVotos, totalVotos, totalVotos, totalVotos, idCircuito]
        );

        return resultadosRows;

      } catch (error) {
        console.error('Error al obtener resultados de papeletas:', error);
        return reply.internalServerError('Error interno al obtener resultados de papeletas');
      }
    }
  });

  // ==================== ENDPOINTS PARA ADMIN ====================

  // Obtener lista de circuitos (para admin)
  fastify.get("/resultados/admin/circuitos", {
    schema: {
      tags: ["resultados"],
      summary: "Obtener lista de circuitos para admin",
      response: {
        200: Type.Array(Type.Object({
          id: Type.Number(),
          numero: Type.String(),
          departamento: Type.String()
        }))
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      
      // Verificar que sea admin
      if (usuario.rol !== 'ADMIN') {
        return reply.code(403).send({ error: 'Solo los administradores pueden acceder a esta información' });
      }

      try {
        const [rows]: any[] = await db.query(
          `SELECT 
            c.id,
            c.numero,
            d.nombre as departamento
           FROM CIRCUITO c
           JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
           JOIN LOCALIDAD l ON e.id_localidad = l.id
           JOIN DEPARTAMENTO d ON l.id_departamento = d.id
           ORDER BY d.nombre, c.numero`
        );

        return rows;

      } catch (error) {
        console.error('Error al obtener circuitos:', error);
        return reply.internalServerError('Error interno al obtener circuitos');
      }
    }
  });

  // Obtener lista de departamentos (para admin)
  fastify.get("/resultados/admin/departamentos", {
    schema: {
      tags: ["resultados"],
      summary: "Obtener lista de departamentos para admin",
      response: {
        200: Type.Array(Type.Object({
          id: Type.Number(),
          nombre: Type.String()
        }))
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      
      // Verificar que sea admin
      if (usuario.rol !== 'ADMIN') {
        return reply.code(403).send({ error: 'Solo los administradores pueden acceder a esta información' });
      }

      try {
        const [rows]: any[] = await db.query(
          `SELECT id, nombre FROM DEPARTAMENTO ORDER BY nombre`
        );

        return rows;

      } catch (error) {
        console.error('Error al obtener departamentos:', error);
        return reply.internalServerError('Error interno al obtener departamentos');
      }
    }
  });

  // Obtener resultados por circuito específico (para admin)
  fastify.get("/resultados/admin/circuito/:idCircuito", {
    schema: {
      tags: ["resultados"],
      summary: "Obtener resultados de un circuito específico para admin",
      params: Type.Object({
        idCircuito: Type.Number()
      }),
      response: {
        200: Type.Object({
          circuito: Type.Object({
            id: Type.Number(),
            numero: Type.String(),
            departamento: Type.String(),
            cerrado: Type.Boolean()
          }),
          estadisticas: Type.Object({
            total_habilitados: Type.Number(),
            total_votaron: Type.Number(),
            total_observados: Type.Number()
          }),
          resultados_listas: Type.Array(Type.Any()),
          resultados_partidos: Type.Array(Type.Any()),
          resultados_papeletas: Type.Array(Type.Any())
        }),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      const { idCircuito } = request.params as { idCircuito: number };
      
      // Verificar que sea admin
      if (usuario.rol !== 'ADMIN') {
        return reply.code(403).send({ error: 'Solo los administradores pueden acceder a esta información' });
      }

      try {
        // Obtener información del circuito, su departamento y estado
        const [circuitoRows]: any[] = await db.query(
          `SELECT 
            c.id,
            c.numero,
            c.circuito_cerrado,
            d.id as id_departamento,
            d.nombre as departamento
           FROM CIRCUITO c
           JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
           JOIN LOCALIDAD l ON e.id_localidad = l.id
           JOIN DEPARTAMENTO d ON l.id_departamento = d.id
           WHERE c.id = ?`,
          [idCircuito]
        );

        if (circuitoRows.length === 0) {
          return reply.notFound('Circuito no encontrado');
        }

        const circuito = circuitoRows[0];
        const circuitoCerrado = circuito.circuito_cerrado === 1;
        const idDepartamento = circuito.id_departamento;

        // Verificar que el circuito esté cerrado
        if (!circuitoCerrado) {
          return reply.forbidden('Los resultados solo son visibles cuando el circuito esté cerrado');
        }

        // Obtener estadísticas del circuito
        const [statsRows]: any[] = await db.query(
          `SELECT 
            COUNT(*) as total_habilitados,
            SUM(CASE WHEN voto = 1 THEN 1 ELSE 0 END) as total_votaron,
            SUM(CASE WHEN circuito_final IS NOT NULL AND voto = 1 THEN 1 ELSE 0 END) as total_observados
           FROM PADRON 
           WHERE id_circuito = ?`,
          [idCircuito]
        );

        const estadisticas = statsRows[0];

        // Obtener total de votos en el circuito
        const [totalRows]: any[] = await db.query(
          `SELECT COUNT(*) as total FROM VOTO WHERE id_circuito = ?`,
          [idCircuito]
        );

        const totalVotos = totalRows[0].total;

        // Obtener resultados por lista SOLO del departamento del circuito
        const [listasRows]: any[] = await db.query(
          `SELECT 
            l.id as id_lista,
            l.numero as numero_lista,
            p.nombre as nombre_partido,
            d.nombre as nombre_departamento,
            COUNT(v.id) as votos,
            CASE 
              WHEN ? > 0 THEN (COUNT(v.id) * 100.0 / ?)
              ELSE 0 
            END as porcentaje
           FROM LISTA l
           JOIN PARTIDO p ON l.id_partido = p.id
           JOIN DEPARTAMENTO d ON l.id_departamento = d.id
           LEFT JOIN VOTO v ON l.id = v.id_lista AND v.id_circuito = ?
           WHERE l.id_departamento = ?
           GROUP BY l.id, l.numero, p.nombre, d.nombre
           ORDER BY votos DESC, l.numero ASC`,
          [totalVotos, totalVotos, idCircuito, idDepartamento]
        );

        // Obtener resultados por partido SOLO de partidos con listas en ese departamento
        const [partidosRows]: any[] = await db.query(
          `SELECT 
            p.id as id_partido,
            p.nombre as nombre_partido,
            CONCAT(ci.nombres, ' ', ci.apellido1, ' ', COALESCE(ci.apellido2, '')) as presidente,
            COUNT(v.id) as votos,
            CASE 
              WHEN ? > 0 THEN (COUNT(v.id) * 100.0 / ?)
              ELSE 0 
            END as porcentaje
           FROM PARTIDO p
           LEFT JOIN INTEGRANTES i ON p.id = i.id_partido AND i.rol = 'PRESIDENTE'
           LEFT JOIN CIUDADANO ci ON i.credencial = ci.credencial
           LEFT JOIN LISTA l ON p.id = l.id_partido AND l.id_departamento = ?
           LEFT JOIN VOTO v ON l.id = v.id_lista AND v.id_circuito = ?
           WHERE l.id IS NOT NULL
           GROUP BY p.id, p.nombre, presidente
           ORDER BY votos DESC, p.nombre ASC`,
          [totalVotos, totalVotos, idDepartamento, idCircuito]
        );

        // Obtener resultados de papeletas SOLO para ese circuito
        const [papeletasRows]: any[] = await db.query(
          `SELECT 
            pa.id as id_papeleta,
            pa.nombre as nombre_papeleta,
            COUNT(pv.id_papeleta) as votos_favor,
            (? - COUNT(pv.id_papeleta)) as votos_contra,
            CASE 
              WHEN ? > 0 THEN (COUNT(pv.id_papeleta) * 100.0 / ?)
              ELSE 0 
            END as porcentaje_favor,
            CASE 
              WHEN ? > 0 THEN ((? - COUNT(pv.id_papeleta)) * 100.0 / ?)
              ELSE 0 
            END as porcentaje_contra
           FROM PAPELETA pa
           LEFT JOIN PAPELETASVOTO pv ON pa.id = pv.id_papeleta
           LEFT JOIN VOTO v ON pv.id_voto = v.id AND v.id_circuito = ?
           GROUP BY pa.id, pa.nombre
           ORDER BY pa.nombre ASC`,
          [totalVotos, totalVotos, totalVotos, totalVotos, totalVotos, totalVotos, idCircuito]
        );

        return {
          circuito: {
            id: circuito.id,
            numero: circuito.numero,
            departamento: circuito.departamento,
            cerrado: circuitoCerrado
          },
          estadisticas: {
            total_habilitados: estadisticas.total_habilitados,
            total_votaron: estadisticas.total_votaron,
            total_observados: estadisticas.total_observados
          },
          resultados_listas: listasRows,
          resultados_partidos: partidosRows,
          resultados_papeletas: papeletasRows
        };

      } catch (error) {
        console.error('Error al obtener resultados del circuito:', error);
        return reply.internalServerError('Error interno al obtener resultados del circuito');
      }
    }
  });

  // Obtener resultados por departamento (para admin)
  fastify.get("/resultados/admin/departamento/:idDepartamento", {
    schema: {
      tags: ["resultados"],
      summary: "Obtener resultados de un departamento específico para admin",
      params: Type.Object({
        idDepartamento: Type.Number()
      }),
      response: {
        200: Type.Object({
          departamento: Type.Object({
            id: Type.Number(),
            nombre: Type.String()
          }),
          estadisticas: Type.Object({
            total_habilitados: Type.Number(),
            total_votaron: Type.Number(),
            total_observados: Type.Number()
          }),
          resultados_listas: Type.Array(Type.Any()),
          resultados_partidos: Type.Array(Type.Any()),
          resultados_papeletas: Type.Array(Type.Any())
        }),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      const { idDepartamento } = request.params as { idDepartamento: number };
      
      // Verificar que sea admin
      if (usuario.rol !== 'ADMIN') {
        return reply.code(403).send({ error: 'Solo los administradores pueden acceder a esta información' });
      }

      try {
        // Obtener información del departamento
        const [departamentoRows]: any[] = await db.query(
          `SELECT id, nombre FROM DEPARTAMENTO WHERE id = ?`,
          [idDepartamento]
        );

        if (departamentoRows.length === 0) {
          return reply.notFound('Departamento no encontrado');
        }

        const departamento = departamentoRows[0];

        // Verificar que todos los circuitos del departamento estén cerrados
        const [circuitosAbiertosRows]: any[] = await db.query(
          `SELECT COUNT(*) as circuitos_abiertos
           FROM CIRCUITO c
           JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
           JOIN LOCALIDAD l ON e.id_localidad = l.id
           WHERE l.id_departamento = ? AND c.circuito_cerrado = 0`,
          [idDepartamento]
        );

        if (circuitosAbiertosRows[0].circuitos_abiertos > 0) {
          return reply.forbidden('Los resultados del departamento solo son visibles cuando todos sus circuitos estén cerrados');
        }

        // Obtener estadísticas del departamento
        const [statsRows]: any[] = await db.query(
          `SELECT 
            COUNT(*) as total_habilitados,
            SUM(CASE WHEN p.voto = 1 THEN 1 ELSE 0 END) as total_votaron,
            SUM(CASE WHEN p.circuito_final IS NOT NULL AND p.voto = 1 THEN 1 ELSE 0 END) as total_observados
           FROM PADRON p
           JOIN CIRCUITO c ON p.id_circuito = c.id
           JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
           JOIN LOCALIDAD l ON e.id_localidad = l.id
           WHERE l.id_departamento = ?`,
          [idDepartamento]
        );

        const estadisticas = statsRows[0];

        // Obtener total de votos en el departamento
        const [totalRows]: any[] = await db.query(
          `SELECT COUNT(*) as total
           FROM VOTO v
           JOIN CIRCUITO c ON v.id_circuito = c.id
           JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
           JOIN LOCALIDAD l ON e.id_localidad = l.id
           WHERE l.id_departamento = ?`,
          [idDepartamento]
        );

        const totalVotos = totalRows[0].total;

        // Obtener resultados por lista SOLO del departamento
        const [listasRows]: any[] = await db.query(
          `SELECT 
            l.id as id_lista,
            l.numero as numero_lista,
            p.nombre as nombre_partido,
            d.nombre as nombre_departamento,
            COUNT(v.id) as votos,
            CASE 
              WHEN ? > 0 THEN (COUNT(v.id) * 100.0 / ?)
              ELSE 0 
            END as porcentaje
           FROM LISTA l
           JOIN PARTIDO p ON l.id_partido = p.id
           JOIN DEPARTAMENTO d ON l.id_departamento = d.id
           LEFT JOIN VOTO v ON l.id = v.id_lista
           WHERE l.id_departamento = ?
           GROUP BY l.id, l.numero, p.nombre, d.nombre
           ORDER BY votos DESC, l.numero ASC`,
          [totalVotos, totalVotos, idDepartamento]
        );

        // Obtener resultados por partido SOLO de partidos con listas en ese departamento
        const [partidosRows]: any[] = await db.query(
          `SELECT 
            p.id as id_partido,
            p.nombre as nombre_partido,
            CONCAT(ci.nombres, ' ', ci.apellido1, ' ', COALESCE(ci.apellido2, '')) as presidente,
            COUNT(v.id) as votos,
            CASE 
              WHEN ? > 0 THEN (COUNT(v.id) * 100.0 / ?)
              ELSE 0 
            END as porcentaje
           FROM PARTIDO p
           LEFT JOIN INTEGRANTES i ON p.id = i.id_partido AND i.rol = 'PRESIDENTE'
           LEFT JOIN CIUDADANO ci ON i.credencial = ci.credencial
           LEFT JOIN LISTA l ON p.id = l.id_partido AND l.id_departamento = ?
           LEFT JOIN VOTO v ON l.id = v.id_lista
           WHERE l.id IS NOT NULL
           GROUP BY p.id, p.nombre, presidente
           ORDER BY votos DESC, p.nombre ASC`,
          [totalVotos, totalVotos, idDepartamento]
        );

        // Obtener resultados de papeletas SOLO para ese departamento
        const [papeletasRows]: any[] = await db.query(
          `SELECT 
            pa.id as id_papeleta,
            pa.nombre as nombre_papeleta,
            COUNT(pv.id_papeleta) as votos_favor,
            (? - COUNT(pv.id_papeleta)) as votos_contra,
            CASE 
              WHEN ? > 0 THEN (COUNT(pv.id_papeleta) * 100.0 / ?)
              ELSE 0 
            END as porcentaje_favor,
            CASE 
              WHEN ? > 0 THEN ((? - COUNT(pv.id_papeleta)) * 100.0 / ?)
              ELSE 0 
            END as porcentaje_contra
           FROM PAPELETA pa
           LEFT JOIN PAPELETASVOTO pv ON pa.id = pv.id_papeleta
           LEFT JOIN VOTO v ON pv.id_voto = v.id
           LEFT JOIN CIRCUITO c ON v.id_circuito = c.id
           LEFT JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
           LEFT JOIN LOCALIDAD l ON e.id_localidad = l.id
           WHERE l.id_departamento = ?
           GROUP BY pa.id, pa.nombre
           ORDER BY pa.nombre ASC`,
          [totalVotos, totalVotos, totalVotos, totalVotos, totalVotos, totalVotos, idDepartamento]
        );

        return {
          departamento: {
            id: departamento.id,
            nombre: departamento.nombre
          },
          estadisticas: {
            total_habilitados: estadisticas.total_habilitados,
            total_votaron: estadisticas.total_votaron,
            total_observados: estadisticas.total_observados
          },
          resultados_listas: listasRows,
          resultados_partidos: partidosRows,
          resultados_papeletas: papeletasRows
        };

      } catch (error) {
        console.error('Error al obtener resultados del departamento:', error);
        return reply.internalServerError('Error interno al obtener resultados del departamento');
      }
    }
  });

  // Obtener resultados generales del país (para admin)
  fastify.get("/resultados/admin/generales", {
    schema: {
      tags: ["resultados"],
      summary: "Obtener resultados generales del país para admin",
      response: {
        200: Type.Object({
          estadisticas: Type.Object({
            total_habilitados: Type.Number(),
            total_votaron: Type.Number(),
            total_observados: Type.Number()
          }),
          resultados_listas: Type.Array(Type.Any()),
          resultados_partidos: Type.Array(Type.Any()),
          resultados_papeletas: Type.Array(Type.Any())
        }),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      
      // Verificar que sea admin
      if (usuario.rol !== 'ADMIN') {
        return reply.forbidden('Solo los administradores pueden acceder a esta información');
      }

      try {
        // Verificar que todos los circuitos estén cerrados
        const [circuitosAbiertosRows]: any[] = await db.query(
          `SELECT COUNT(*) as circuitos_abiertos FROM CIRCUITO WHERE circuito_cerrado = 0`
        );

        if (circuitosAbiertosRows[0].circuitos_abiertos > 0) {
          return reply.forbidden('Los resultados generales solo son visibles cuando todos los circuitos estén cerrados');
        }

        // Obtener estadísticas generales
        const [statsRows]: any[] = await db.query(
          `SELECT 
            COUNT(*) as total_habilitados,
            SUM(CASE WHEN voto = 1 THEN 1 ELSE 0 END) as total_votaron,
            SUM(CASE WHEN circuito_final IS NOT NULL AND voto = 1 THEN 1 ELSE 0 END) as total_observados
           FROM PADRON`
        );

        const estadisticas = statsRows[0];

        // Obtener total de votos generales
        const [totalRows]: any[] = await db.query(
          `SELECT COUNT(*) as total FROM VOTO`
        );

        const totalVotos = totalRows[0].total;

        // Obtener resultados por lista
        const [listasRows]: any[] = await db.query(
          `SELECT 
            l.id as id_lista,
            l.numero as numero_lista,
            p.nombre as nombre_partido,
            d.nombre as nombre_departamento,
            COUNT(v.id) as votos,
            CASE 
              WHEN ? > 0 THEN (COUNT(v.id) * 100.0 / ?)
              ELSE 0 
            END as porcentaje
           FROM LISTA l
           JOIN PARTIDO p ON l.id_partido = p.id
           JOIN DEPARTAMENTO d ON l.id_departamento = d.id
           LEFT JOIN VOTO v ON l.id = v.id_lista
           GROUP BY l.id, l.numero, p.nombre, d.nombre
           ORDER BY votos DESC, l.numero ASC`,
          [totalVotos, totalVotos]
        );

        // Obtener resultados por partido
        const [partidosRows]: any[] = await db.query(
          `SELECT 
            p.id as id_partido,
            p.nombre as nombre_partido,
            CONCAT(ci.nombres, ' ', ci.apellido1, ' ', COALESCE(ci.apellido2, '')) as presidente,
            COUNT(v.id) as votos,
            CASE 
              WHEN ? > 0 THEN (COUNT(v.id) * 100.0 / ?)
              ELSE 0 
            END as porcentaje
           FROM PARTIDO p
           LEFT JOIN INTEGRANTES i ON p.id = i.id_partido AND i.rol = 'PRESIDENTE'
           LEFT JOIN CIUDADANO ci ON i.credencial = ci.credencial
           LEFT JOIN LISTA l ON p.id = l.id_partido
           LEFT JOIN VOTO v ON l.id = v.id_lista
           GROUP BY p.id, p.nombre, presidente
           ORDER BY votos DESC, p.nombre ASC`,
          [totalVotos, totalVotos]
        );

        // Obtener resultados de papeletas generales
        const [papeletasRows]: any[] = await db.query(
          `SELECT 
            pa.id as id_papeleta,
            pa.nombre as nombre_papeleta,
            COUNT(pv.id_papeleta) as votos_favor,
            (? - COUNT(pv.id_papeleta)) as votos_contra,
            CASE 
              WHEN ? > 0 THEN (COUNT(pv.id_papeleta) * 100.0 / ?)
              ELSE 0 
            END as porcentaje_favor,
            CASE 
              WHEN ? > 0 THEN ((? - COUNT(pv.id_papeleta)) * 100.0 / ?)
              ELSE 0 
            END as porcentaje_contra
           FROM PAPELETA pa
           LEFT JOIN PAPELETASVOTO pv ON pa.id = pv.id_papeleta
           LEFT JOIN VOTO v ON pv.id_voto = v.id
           GROUP BY pa.id, pa.nombre
           ORDER BY pa.nombre ASC`,
          [totalVotos, totalVotos, totalVotos, totalVotos, totalVotos, totalVotos]
        );

        return {
          estadisticas: {
            total_habilitados: estadisticas.total_habilitados,
            total_votaron: estadisticas.total_votaron,
            total_observados: estadisticas.total_observados
          },
          resultados_listas: listasRows,
          resultados_partidos: partidosRows,
          resultados_papeletas: papeletasRows
        };

      } catch (error) {
        console.error('Error al obtener resultados generales:', error);
        return reply.internalServerError('Error interno al obtener resultados generales');
      }
    }
  });

  // ==================== FUNCIONARIO: ABRIR Y CERRAR MESA (CIRCUITO) ====================

  // Abrir circuito (mesa) - FUNCIONARIO
  fastify.post("/circuito/abrir", {
    schema: {
      tags: ["circuito", "funcionario"],
      summary: "Abrir el circuito (mesa) del funcionario",
      body: Type.Object({
        id_circuito: Type.Number()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        }),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      const { id_circuito } = request.body as { id_circuito: number };

      if (usuario.rol !== 'FUNCIONARIO') {
        return reply.code(403).send({ error: 'Solo los funcionarios pueden abrir su circuito' });
      }

      try {
        // Verificar que el circuito tiene como presidente al usuario
        const [circuitoRows]: any[] = await db.query(
          `SELECT id FROM CIRCUITO WHERE id = ? AND cc_presidente = ? OR cc_secretario = ? OR cc_vocal = ?`,
          [id_circuito, usuario.credencial, usuario.credencial, usuario.credencial]
        );

        if (circuitoRows.length === 0) {
          return reply.code(403).send({ error: 'No autorizado para abrir este circuito' });
        }

        // Abrir el circuito
        await db.query(
          `UPDATE CIRCUITO SET circuito_cerrado = 0 WHERE id = ?`,
          [id_circuito]
        );

        return { success: true, mensaje: 'Circuito abierto correctamente' };

      } catch (error) {
        console.error('Error al abrir circuito:', error);
        return reply.internalServerError('Error interno al abrir circuito');
      }
    }
  });


  // Cerrar circuito (mesa) - FUNCIONARIO
  fastify.post("/circuito/cerrar", {
    schema: {
      tags: ["circuito", "funcionario"],
      summary: "Cerrar el circuito (mesa) del funcionario",
      body: Type.Object({
        id_circuito: Type.Number()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        }),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      const { id_circuito } = request.body as { id_circuito: number };

      if (usuario.rol !== 'FUNCIONARIO') {
        return reply.code(403).send({ error: 'Solo los funcionarios pueden cerrar su circuito' });
      }

      try {
        // Verificar que el circuito tiene como presidente al usuario
        const [circuitoRows]: any[] = await db.query(
          `SELECT id FROM CIRCUITO WHERE id = ? AND cc_presidente = ?`,
          [id_circuito, usuario.credencial]
        );

        if (circuitoRows.length === 0) {
          return reply.code(403).send({ error: 'No autorizado para cerrar este circuito' });
        }

        // Cerrar el circuito
        await db.query(
          `UPDATE CIRCUITO SET circuito_cerrado = 1 WHERE id = ?`,
          [id_circuito]
        );

        return { success: true, mensaje: 'Circuito cerrado correctamente' };

      } catch (error) {
        console.error('Error al cerrar circuito:', error);
        return reply.internalServerError('Error interno al cerrar circuito');
      }
    }
  });


  //Obtener datos de circuito del cual el funcionario es autoridad
  fastify.get("/circuito/mi-circuito", {
    schema: {
      tags: ["circuito", "funcionario"],
      summary: "Obtener datos del circuito del funcionario",
      response: {
        200: Type.Object({
          id: Type.Number(),
          numero: Type.String(),
          circuito_cerrado: Type.Boolean(),
          departamento: Type.String(),
          establecimiento: Type.String(),
          presidente: Type.String(),
          secretario: Type.String(),
          vocal: Type.String()
        }),
        403: Type.Object({
          error: Type.String()
        }),
        404: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;

      if (usuario.rol !== 'FUNCIONARIO') {
        return reply.code(403).send({ error: 'Solo los funcionarios pueden consultar su circuito' });
      }

      try {
        const [rows]: any[] = await db.query(
          `SELECT 
            c.id, c.numero, c.circuito_cerrado,
            d.nombre AS departamento,
            e.direccion AS establecimiento,
            c.cc_presidente AS presidente,
            c.cc_secretario AS secretario,
            c.cc_vocal AS vocal
          FROM CIRCUITO c
          JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
          JOIN LOCALIDAD l ON e.id_localidad = l.id
          JOIN DEPARTAMENTO d ON l.id_departamento = d.id
          WHERE c.cc_presidente = ? OR c.cc_secretario = ? OR c.cc_vocal = ?`,
          [usuario.credencial, usuario.credencial, usuario.credencial]
        );

        if (rows.length === 0) {
          return reply.code(404).send({ error: 'No se encontró un circuito asociado a este funcionario.' });
        }

        const circuito = rows[0];
        circuito.circuito_cerrado = circuito.circuito_cerrado === 1;

        return circuito;

      } catch (error) {
        console.error('Error al obtener circuito del funcionario:', error);
        return reply.internalServerError('Error interno al consultar el circuito');
      }
    }
  });

  // ==================== ADMIN: GESTIÓN GLOBAL DE CIRCUITOS ====================

  // Abrir TODAS las mesas - ADMIN
  fastify.post("/admin/circuitos/abrir-todos", {
    schema: {
      tags: ["admin", "circuito"],
      summary: "Abrir todas las mesas (solo admin)",
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String(),
          circuitos_abiertos: Type.Number()
        }),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      if (usuario.rol !== 'ADMIN') {
        return reply.code(403).send({ error: 'Solo los administradores pueden abrir todas las mesas' });
      }
      try {
        // Abrir todos los circuitos
        const [result]: any[] = await db.query(
          `UPDATE CIRCUITO SET circuito_cerrado = 0`
        );
        
        const circuitosAbiertos = result.affectedRows;
        
        return { 
          success: true, 
          mensaje: `Todas las mesas han sido abiertas correctamente`,
          circuitos_abiertos: circuitosAbiertos
        };
      } catch (error) {
        console.error('Error al abrir todas las mesas:', error);
        return reply.internalServerError('Error interno al abrir todas las mesas');
      }
    }
  });

  // Cerrar TODAS las mesas - ADMIN
  fastify.post("/admin/circuitos/cerrar-todos", {
    schema: {
      tags: ["admin", "circuito"],
      summary: "Cerrar todas las mesas (solo admin)",
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String(),
          circuitos_cerrados: Type.Number()
        }),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      if (usuario.rol !== 'ADMIN') {
        return reply.code(403).send({ error: 'Solo los administradores pueden cerrar todas las mesas' });
      }
      try {
        // Cerrar todos los circuitos
        const [result]: any[] = await db.query(
          `UPDATE CIRCUITO SET circuito_cerrado = 1`
        );
        
        const circuitosCerrados = result.affectedRows;
        
        return { 
          success: true, 
          mensaje: `Todas las mesas han sido cerradas correctamente`,
          circuitos_cerrados: circuitosCerrados
        };
      } catch (error) {
        console.error('Error al cerrar todas las mesas:', error);
        return reply.internalServerError('Error interno al cerrar todas las mesas');
      }
    }
  });

  // ==================== ADMIN: GESTIÓN DE AUTORIDADES ====================

  // Obtener lista de circuitos - ADMIN
  fastify.get("/admin/circuitos", {
    schema: {
      tags: ["admin", "circuito"],
      summary: "Obtener lista de circuitos para admin",
      response: {
        200: Type.Array(Type.Object({
          id: Type.Number(),
          numero: Type.String(),
          departamento: Type.String()
        })),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      
      if (usuario.rol !== 'ADMIN') {
        return reply.code(403).send({ error: 'Solo los administradores pueden acceder a esta información' });
      }

      try {
        const [rows]: any[] = await db.query(
          `SELECT 
            c.id,
            c.numero,
            d.nombre as departamento
           FROM CIRCUITO c
           JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
           JOIN LOCALIDAD l ON e.id_localidad = l.id
           JOIN DEPARTAMENTO d ON l.id_departamento = d.id
           ORDER BY d.nombre, c.numero`
        );

        return rows;
      } catch (error) {
        console.error('Error al obtener circuitos:', error);
        return reply.internalServerError('Error interno al obtener circuitos');
      }
    }
  });

  // Obtener autoridades de un circuito - ADMIN
  fastify.get("/admin/circuito/:idCircuito/autoridades", {
    schema: {
      tags: ["admin", "autoridades"],
      summary: "Obtener autoridades de un circuito específico",
      params: Type.Object({
        idCircuito: Type.Number()
      }),
      response: {
        200: Type.Object({
          presidente: Type.Any(),
          secretario: Type.Any(),
          vocal: Type.Any()
        }),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      const { idCircuito } = request.params as { idCircuito: number };
      
      if (usuario.rol !== 'ADMIN') {
        return reply.code(403).send({ error: 'Solo los administradores pueden acceder a esta información' });
      }
      
      try {
        // Obtener autoridades del circuito (que están en EMPLEADO)
        const [autoridadesRows]: any[] = await db.query(
          `SELECT 
            c.cc_presidente,
            c.cc_secretario,
            c.cc_vocal,
            pres_ci.nombres as presidente_nombres,
            CONCAT(pres_ci.apellido1, ' ', COALESCE(pres_ci.apellido2, '')) as presidente_apellidos,
            sec_ci.nombres as secretario_nombres,
            CONCAT(sec_ci.apellido1, ' ', COALESCE(sec_ci.apellido2, '')) as secretario_apellidos,
            voc_ci.nombres as vocal_nombres,
            CONCAT(voc_ci.apellido1, ' ', COALESCE(voc_ci.apellido2, '')) as vocal_apellidos
           FROM CIRCUITO c
           LEFT JOIN EMPLEADO pres_emp ON c.cc_presidente = pres_emp.credencial
           LEFT JOIN CIUDADANO pres_ci ON pres_emp.credencial = pres_ci.credencial
           LEFT JOIN EMPLEADO sec_emp ON c.cc_secretario = sec_emp.credencial
           LEFT JOIN CIUDADANO sec_ci ON sec_emp.credencial = sec_ci.credencial
           LEFT JOIN EMPLEADO voc_emp ON c.cc_vocal = voc_emp.credencial
           LEFT JOIN CIUDADANO voc_ci ON voc_emp.credencial = voc_ci.credencial
           WHERE c.id = ?`,
          [idCircuito]
        );

        if (autoridadesRows.length === 0) {
          return reply.notFound('Circuito no encontrado');
        }

        const row = autoridadesRows[0];
        
        const autoridades: any = {
          presidente: row.cc_presidente ? {
            credencial: row.cc_presidente,
            nombres: row.presidente_nombres,
            apellidos: row.presidente_apellidos
          } : null,
          secretario: row.cc_secretario ? {
            credencial: row.cc_secretario,
            nombres: row.secretario_nombres,
            apellidos: row.secretario_apellidos
          } : null,
          vocal: row.cc_vocal ? {
            credencial: row.cc_vocal,
            nombres: row.vocal_nombres,
            apellidos: row.vocal_apellidos
          } : null
        };

        return autoridades;
      } catch (error) {
        console.error('Error al obtener autoridades del circuito:', error);
        return reply.internalServerError('Error interno al obtener autoridades');
      }
    }
  });

  // Obtener lista de empleados - ADMIN
  fastify.get("/admin/empleados", {
    schema: {
      tags: ["admin", "empleados"],
      summary: "Obtener lista de empleados para admin",
      response: {
        200: Type.Array(Type.Object({
          credencial: Type.String(),
          nombres: Type.String(),
          apellidos: Type.String()
        })),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      
      if (usuario.rol !== 'ADMIN') {
        return reply.code(403).send({ error: 'Solo los administradores pueden acceder a esta información' });
      }
      
      try {
        const [rows]: any[] = await db.query(
          `SELECT 
            e.credencial,
            c.nombres,
            CONCAT(c.apellido1, ' ', COALESCE(c.apellido2, '')) as apellidos
           FROM EMPLEADO e
           JOIN CIUDADANO c ON e.credencial = c.credencial
           ORDER BY c.nombres, c.apellido1`
        );

        return rows;
      } catch (error) {
        console.error('Error al obtener empleados:', error);
        return reply.internalServerError('Error interno al obtener empleados');
      }
    }
  });

  // Modificar autoridades de un circuito - ADMIN
  fastify.put("/admin/circuito/:idCircuito/autoridades", {
    schema: {
      tags: ["admin", "autoridades"],
      summary: "Modificar autoridades de un circuito específico",
      params: Type.Object({
        idCircuito: Type.Number()
      }),
      body: Type.Object({
        presidente: Type.Optional(Type.String()),
        secretario: Type.Optional(Type.String()),
        vocal: Type.Optional(Type.String())
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        }),
        403: Type.Object({
          error: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT],
    handler: async function (request, reply) {
      const usuario = request.user as unknown as UsuarioLoginType;
      const { idCircuito } = request.params as { idCircuito: number };
      const { presidente, secretario, vocal } = request.body as {
        presidente?: string;
        secretario?: string;
        vocal?: string;
      };
      
      if (usuario.rol !== 'ADMIN') {
        return reply.code(403).send({ error: 'Solo los administradores pueden modificar autoridades' });
      }
      
      try {
        // Verificar que el circuito existe
        const [circuitoRows]: any[] = await db.query(
          `SELECT id FROM CIRCUITO WHERE id = ?`,
          [idCircuito]
        );
        
        if (circuitoRows.length === 0) {
          return reply.notFound('Circuito no encontrado');
        }

        // Verificar que los empleados existen si se proporcionan credenciales
        if (presidente) {
          const [empleadoRows]: any[] = await db.query(
            `SELECT credencial FROM EMPLEADO WHERE credencial = ?`,
            [presidente]
          );
          if (empleadoRows.length === 0) {
            return reply.badRequest('Empleado con credencial de presidente no encontrado');
          }
        }
        
        if (secretario) {
          const [empleadoRows]: any[] = await db.query(
            `SELECT credencial FROM EMPLEADO WHERE credencial = ?`,
            [secretario]
          );
          if (empleadoRows.length === 0) {
            return reply.badRequest('Empleado con credencial de secretario no encontrado');
          }
        }
        
        if (vocal) {
          const [empleadoRows]: any[] = await db.query(
            `SELECT credencial FROM EMPLEADO WHERE credencial = ?`,
            [vocal]
          );
          if (empleadoRows.length === 0) {
            return reply.badRequest('Empleado con credencial de vocal no encontrado');
          }
        }

        // Construir la consulta de actualización
        let updateQuery = 'UPDATE CIRCUITO SET ';
        const updateParams: any[] = [];
        
        if (presidente !== undefined) {
          updateQuery += 'cc_presidente = ?, ';
          updateParams.push(presidente || null);
        }
        if (secretario !== undefined) {
          updateQuery += 'cc_secretario = ?, ';
          updateParams.push(secretario || null);
        }
        if (vocal !== undefined) {
          updateQuery += 'cc_vocal = ?, ';
          updateParams.push(vocal || null);
        }
        
        // Remover la última coma y espacio
        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ' WHERE id = ?';
        updateParams.push(idCircuito);

        await db.query(updateQuery, updateParams);

        return { 
          success: true, 
          mensaje: 'Autoridades del circuito actualizadas correctamente' 
        };
      } catch (error) {
        console.error('Error al modificar autoridades del circuito:', error);
        return reply.internalServerError('Error interno al modificar autoridades');
      }
    }
  });
};

export default eleccionesRoutes; 