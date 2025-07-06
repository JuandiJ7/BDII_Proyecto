import { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
// import { UsuarioLoginType } from "../../types/usuarioLogin.js"; 
import db from "../../services/db.js";

const adminRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  
  // ==================== GESTIÓN DE CIRCUITOS ====================
  
  // Obtener estado de todos los circuitos
  fastify.get("/circuitos/estado", {
    schema: {
      tags: ["admin"],
      summary: "Obtener estado de todos los circuitos",
      response: {
        200: Type.Array(Type.Object({
          id: Type.Number(),
          numero: Type.String(),
          departamento: Type.String(),
          establecimiento: Type.String(),
          circuito_cerrado: Type.Boolean(),
          presidente: Type.String(),
          secretario: Type.String(),
          vocal: Type.String()
        }))
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      try {
        const [rows]: any[] = await db.query(
          `SELECT 
            c.id,
            c.numero,
            d.nombre as departamento,
            e.direccion as establecimiento,
            c.circuito_cerrado,
            CONCAT(ci_pres.nombres, ' ', ci_pres.apellido1, ' ', COALESCE(ci_pres.apellido2, '')) as presidente,
            CONCAT(ci_sec.nombres, ' ', ci_sec.apellido1, ' ', COALESCE(ci_sec.apellido2, '')) as secretario,
            CONCAT(ci_voc.nombres, ' ', ci_voc.apellido1, ' ', COALESCE(ci_voc.apellido2, '')) as vocal
           FROM CIRCUITO c
           JOIN ESTABLECIMIENTO e ON c.id_establecimiento = e.id
           JOIN LOCALIDAD l ON e.id_localidad = l.id
           JOIN DEPARTAMENTO d ON l.id_departamento = d.id
           LEFT JOIN CIUDADANO ci_pres ON c.cc_presidente = ci_pres.credencial
           LEFT JOIN CIUDADANO ci_sec ON c.cc_secretario = ci_sec.credencial
           LEFT JOIN CIUDADANO ci_voc ON c.cc_vocal = ci_voc.credencial
           ORDER BY d.nombre, c.numero`
        );

        return rows.map((row: any) => ({
          ...row,
          circuito_cerrado: row.circuito_cerrado === 1
        }));

      } catch (error) {
        console.error('Error al obtener estado de circuitos:', error);
        return reply.internalServerError('Error interno al obtener estado de circuitos');
      }
    }
  });

  // Abrir todos los circuitos
  fastify.post("/circuitos/abrir-todos", {
    schema: {
      tags: ["admin"],
      summary: "Abrir todos los circuitos (cerrar todas las mesas)",
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String(),
          circuitos_afectados: Type.Number()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      try {
        const [result]: any[] = await db.query(
          `UPDATE CIRCUITO SET circuito_cerrado = 0`
        );

        return {
          success: true,
          mensaje: 'Todos los circuitos han sido abiertos',
          circuitos_afectados: result.affectedRows
        };

      } catch (error) {
        console.error('Error al abrir circuitos:', error);
        return reply.internalServerError('Error interno al abrir circuitos');
      }
    }
  });

  // Cerrar todos los circuitos
  fastify.post("/circuitos/cerrar-todos", {
    schema: {
      tags: ["admin"],
      summary: "Cerrar todos los circuitos (abrir todas las mesas)",
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String(),
          circuitos_afectados: Type.Number()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      try {
        const [result]: any[] = await db.query(
          `UPDATE CIRCUITO SET circuito_cerrado = 1`
        );

        return {
          success: true,
          mensaje: 'Todos los circuitos han sido cerrados',
          circuitos_afectados: result.affectedRows
        };

      } catch (error) {
        console.error('Error al cerrar circuitos:', error);
        return reply.internalServerError('Error interno al cerrar circuitos');
      }
    }
  });

  // Modificar autoridades de mesa
  fastify.put("/circuitos/:idCircuito/autoridades", {
    schema: {
      tags: ["admin"],
      summary: "Modificar autoridades de un circuito",
      params: Type.Object({
        idCircuito: Type.Number()
      }),
      body: Type.Object({
        cc_presidente: Type.String(),
        cc_secretario: Type.String(),
        cc_vocal: Type.String()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      const { idCircuito } = request.params as { idCircuito: number };
      const { cc_presidente, cc_secretario, cc_vocal } = request.body as {
        cc_presidente: string;
        cc_secretario: string;
        cc_vocal: string;
      };

      try {
        // Verificar que el circuito existe
        const [circuitoRows]: any[] = await db.query(
          `SELECT id FROM CIRCUITO WHERE id = ?`,
          [idCircuito]
        );

        if (circuitoRows.length === 0) {
          return reply.notFound('Circuito no encontrado');
        }

        // Verificar que los ciudadanos existen
        const [ciudadanosRows]: any[] = await db.query(
          `SELECT credencial FROM CIUDADANO WHERE credencial IN (?, ?, ?)`,
          [cc_presidente, cc_secretario, cc_vocal]
        );

        if (ciudadanosRows.length !== 3) {
          return reply.badRequest('Uno o más ciudadanos no encontrados');
        }

        // Actualizar autoridades
        await db.query(
          `UPDATE CIRCUITO 
           SET cc_presidente = ?, cc_secretario = ?, cc_vocal = ?
           WHERE id = ?`,
          [cc_presidente, cc_secretario, cc_vocal, idCircuito]
        );

        return {
          success: true,
          mensaje: 'Autoridades del circuito actualizadas correctamente'
        };

      } catch (error) {
        console.error('Error al actualizar autoridades:', error);
        return reply.internalServerError('Error interno al actualizar autoridades');
      }
    }
  });

  // ==================== GESTIÓN DE CIUDADANOS ====================
  
  // Crear nuevo ciudadano
  fastify.post("/ciudadanos", {
    schema: {
      tags: ["admin"],
      summary: "Crear un nuevo ciudadano",
      body: Type.Object({
        credencial: Type.String(),
        nombres: Type.String(),
        apellido1: Type.String(),
        apellido2: Type.Optional(Type.String()),
        cedula: Type.String(),
        fecha_nac: Type.String(),
        direccion: Type.String()
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      const ciudadano = request.body as {
        credencial: string;
        nombres: string;
        apellido1: string;
        apellido2?: string;
        cedula: string;
        fecha_nac: string;
        direccion: string;
      };

      try {
        // Verificar que la credencial no existe
        const [existingRows]: any[] = await db.query(
          `SELECT credencial FROM CIUDADANO WHERE credencial = ?`,
          [ciudadano.credencial]
        );

        if (existingRows.length > 0) {
          return reply.badRequest('Ya existe un ciudadano con esa credencial');
        }

        // Verificar que la cédula no existe
        const [cedulaRows]: any[] = await db.query(
          `SELECT cedula FROM CIUDADANO WHERE cedula = ?`,
          [ciudadano.cedula]
        );

        if (cedulaRows.length > 0) {
          return reply.badRequest('Ya existe un ciudadano con esa cédula');
        }

        // Insertar ciudadano
        await db.query(
          `INSERT INTO CIUDADANO (credencial, nombres, apellido1, apellido2, cedula, fecha_nac, direccion)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            ciudadano.credencial,
            ciudadano.nombres,
            ciudadano.apellido1,
            ciudadano.apellido2 || null,
            ciudadano.cedula,
            ciudadano.fecha_nac,
            ciudadano.direccion
          ]
        );

        return reply.code(201).send({
          success: true,
          mensaje: 'Ciudadano creado correctamente'
        });

      } catch (error) {
        console.error('Error al crear ciudadano:', error);
        return reply.internalServerError('Error interno al crear ciudadano');
      }
    }
  });

  // Obtener ciudadanos no registrados en padrón
  fastify.get("/ciudadanos/sin-padron", {
    schema: {
      tags: ["admin"],
      summary: "Obtener ciudadanos que no están en el padrón",
      response: {
        200: Type.Array(Type.Object({
          credencial: Type.String(),
          nombres: Type.String(),
          apellido1: Type.String(),
          apellido2: Type.Optional(Type.String()),
          cedula: Type.String(),
          fecha_nac: Type.String(),
          direccion: Type.String()
        }))
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      try {
        const [rows]: any[] = await db.query(
          `SELECT c.*
           FROM CIUDADANO c
           LEFT JOIN PADRON p ON c.credencial = p.credencial
           WHERE p.credencial IS NULL
           ORDER BY c.apellido1, c.apellido2, c.nombres`
        );

        return rows;

      } catch (error) {
        console.error('Error al obtener ciudadanos sin padrón:', error);
        return reply.internalServerError('Error interno al obtener ciudadanos sin padrón');
      }
    }
  });

  // Agregar ciudadano al padrón
  fastify.post("/padron/agregar", {
    schema: {
      tags: ["admin"],
      summary: "Agregar ciudadano al padrón",
      body: Type.Object({
        credencial: Type.String(),
        id_circuito: Type.Number()
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      const { credencial, id_circuito } = request.body as {
        credencial: string;
        id_circuito: number;
      };

      try {
        // Verificar que el ciudadano existe
        const [ciudadanoRows]: any[] = await db.query(
          `SELECT credencial FROM CIUDADANO WHERE credencial = ?`,
          [credencial]
        );

        if (ciudadanoRows.length === 0) {
          return reply.badRequest('Ciudadano no encontrado');
        }

        // Verificar que el circuito existe
        const [circuitoRows]: any[] = await db.query(
          `SELECT id FROM CIRCUITO WHERE id = ?`,
          [id_circuito]
        );

        if (circuitoRows.length === 0) {
          return reply.badRequest('Circuito no encontrado');
        }

        // Verificar que no esté ya en el padrón
        const [padronRows]: any[] = await db.query(
          `SELECT credencial FROM PADRON WHERE credencial = ?`,
          [credencial]
        );

        if (padronRows.length > 0) {
          return reply.badRequest('El ciudadano ya está en el padrón');
        }

        // Agregar al padrón
        await db.query(
          `INSERT INTO PADRON (credencial, id_circuito, habilitado, voto)
           VALUES (?, ?, 0, 0)`,
          [credencial, id_circuito]
        );

        return reply.code(201).send({
          success: true,
          mensaje: 'Ciudadano agregado al padrón correctamente'
        });

      } catch (error) {
        console.error('Error al agregar al padrón:', error);
        return reply.internalServerError('Error interno al agregar al padrón');
      }
    }
  });

  // ==================== ACTUALIZACIÓN MASIVA DE PADRÓN ====================
  fastify.post("/padron/actualizar", {
    schema: {
      tags: ["admin"],
      summary: "Actualizar el padrón agregando automáticamente todos los ciudadanos que no estén en el padrón y tengan circuito asignado",
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          agregados: Type.Number(),
          sin_circuito: Type.Number(),
          mensaje: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      try {
        // Obtener ciudadanos sin padrón
        const [ciudadanos]: any[] = await db.query(
          `SELECT c.credencial FROM CIUDADANO c
           LEFT JOIN PADRON p ON c.credencial = p.credencial
           WHERE p.credencial IS NULL`
        );

        let agregados = 0;
        let sin_circuito = 0;

        for (const ciudadano of ciudadanos) {
          // Extraer serie y número de la credencial
          const credencial = ciudadano.credencial;
          const serie = credencial.substring(0, 3);
          const numero = parseInt(credencial.substring(3), 10);

          // Buscar circuito correspondiente
          const [circuitoRows]: any[] = await db.query(
            `SELECT id FROM CIRCUITO WHERE ? BETWEEN serie_desde AND serie_hasta AND ? BETWEEN numero_desde AND numero_hasta LIMIT 1`,
            [serie, numero]
          );

          if (circuitoRows.length === 0) {
            sin_circuito++;
            continue;
          }
          const id_circuito = circuitoRows[0].id;

          // Insertar en padrón
          await db.query(
            `INSERT INTO PADRON (credencial, id_circuito, habilitado, voto) VALUES (?, ?, 0, 0)` ,
            [credencial, id_circuito]
          );
          agregados++;
        }

        return {
          success: true,
          agregados,
          sin_circuito,
          mensaje: `Se agregaron ${agregados} ciudadanos al padrón. ${sin_circuito} no tenían circuito y no fueron agregados.`
        };
      } catch (error) {
        console.error('Error al actualizar padrón:', error);
        return reply.internalServerError('Error interno al actualizar padrón');
      }
    }
  });

  // ==================== GESTIÓN DE POLICÍAS ====================
  
  // Obtener policías
  fastify.get("/policias", {
    schema: {
      tags: ["admin"],
      summary: "Obtener todos los policías",
      response: {
        200: Type.Array(Type.Object({
          credencial: Type.String(),
          nombres: Type.String(),
          apellido1: Type.String(),
          apellido2: Type.Optional(Type.String()),
          cedula: Type.String(),
          comisaria: Type.String(),
          establecimiento: Type.String()
        }))
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      try {
        const [rows]: any[] = await db.query(
          `SELECT 
            p.credencial,
            c.nombres,
            c.apellido1,
            c.apellido2,
            c.cedula,
            co.nombre as comisaria,
            e.direccion as establecimiento
           FROM POLICIA p
           JOIN CIUDADANO c ON p.credencial = c.credencial
           JOIN COMISARIA co ON p.id_comisaria = co.id
           JOIN ESTABLECIMIENTO e ON p.id_establecimiento = e.id
           ORDER BY c.apellido1, c.apellido2, c.nombres`
        );

        return rows;

      } catch (error) {
        console.error('Error al obtener policías:', error);
        return reply.internalServerError('Error interno al obtener policías');
      }
    }
  });

  // Agregar policía
  fastify.post("/policias", {
    schema: {
      tags: ["admin"],
      summary: "Agregar un policía",
      body: Type.Object({
        credencial: Type.String(),
        id_comisaria: Type.Number(),
        id_establecimiento: Type.Number()
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      const { credencial, id_comisaria, id_establecimiento } = request.body as {
        credencial: string;
        id_comisaria: number;
        id_establecimiento: number;
      };

      try {
        // Verificar que el ciudadano existe
        const [ciudadanoRows]: any[] = await db.query(
          `SELECT credencial FROM CIUDADANO WHERE credencial = ?`,
          [credencial]
        );

        if (ciudadanoRows.length === 0) {
          return reply.badRequest('Ciudadano no encontrado');
        }

        // Verificar que la comisaría existe
        const [comisariaRows]: any[] = await db.query(
          `SELECT id FROM COMISARIA WHERE id = ?`,
          [id_comisaria]
        );

        if (comisariaRows.length === 0) {
          return reply.badRequest('Comisaría no encontrada');
        }

        // Verificar que el establecimiento existe
        const [establecimientoRows]: any[] = await db.query(
          `SELECT id FROM ESTABLECIMIENTO WHERE id = ?`,
          [id_establecimiento]
        );

        if (establecimientoRows.length === 0) {
          return reply.badRequest('Establecimiento no encontrado');
        }

        // Verificar que no esté ya asignado como policía
        const [policiaRows]: any[] = await db.query(
          `SELECT credencial FROM POLICIA WHERE credencial = ?`,
          [credencial]
        );

        if (policiaRows.length > 0) {
          return reply.badRequest('El ciudadano ya está asignado como policía');
        }

        // Agregar policía
        await db.query(
          `INSERT INTO POLICIA (credencial, id_comisaria, id_establecimiento)
           VALUES (?, ?, ?)`,
          [credencial, id_comisaria, id_establecimiento]
        );

        return reply.code(201).send({
          success: true,
          mensaje: 'Policía agregado correctamente'
        });

      } catch (error) {
        console.error('Error al agregar policía:', error);
        return reply.internalServerError('Error interno al agregar policía');
      }
    }
  });

  // Eliminar policía
  fastify.delete("/policias/:credencial", {
    schema: {
      tags: ["admin"],
      summary: "Eliminar un policía",
      params: Type.Object({
        credencial: Type.String()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      const { credencial } = request.params as { credencial: string };

      try {
        const [result]: any[] = await db.query(
          `DELETE FROM POLICIA WHERE credencial = ?`,
          [credencial]
        );

        if (result.affectedRows === 0) {
          return reply.notFound('Policía no encontrado');
        }

        return {
          success: true,
          mensaje: 'Policía eliminado correctamente'
        };

      } catch (error) {
        console.error('Error al eliminar policía:', error);
        return reply.internalServerError('Error interno al eliminar policía');
      }
    }
  });

  // Editar policía (cambiar comisaría y establecimiento)
  fastify.put("/policias/:credencial", {
    schema: {
      tags: ["admin"],
      summary: "Editar un policía (comisaría y establecimiento)",
      params: Type.Object({
        credencial: Type.String()
      }),
      body: Type.Object({
        id_comisaria: Type.Number(),
        id_establecimiento: Type.Number()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      const { credencial } = request.params as { credencial: string };
      const { id_comisaria, id_establecimiento } = request.body as {
        id_comisaria: number;
        id_establecimiento: number;
      };

      try {
        // Verificar que el policía existe
        const [policiaRows]: any[] = await db.query(
          `SELECT credencial FROM POLICIA WHERE credencial = ?`,
          [credencial]
        );
        if (policiaRows.length === 0) {
          return reply.notFound('Policía no encontrado');
        }

        // Verificar que la comisaría existe
        const [comisariaRows]: any[] = await db.query(
          `SELECT id FROM COMISARIA WHERE id = ?`,
          [id_comisaria]
        );
        if (comisariaRows.length === 0) {
          return reply.badRequest('Comisaría no encontrada');
        }

        // Verificar que el establecimiento existe
        const [establecimientoRows]: any[] = await db.query(
          `SELECT id FROM ESTABLECIMIENTO WHERE id = ?`,
          [id_establecimiento]
        );
        if (establecimientoRows.length === 0) {
          return reply.badRequest('Establecimiento no encontrado');
        }

        // Actualizar comisaría y establecimiento
        await db.query(
          `UPDATE POLICIA SET id_comisaria = ?, id_establecimiento = ? WHERE credencial = ?`,
          [id_comisaria, id_establecimiento, credencial]
        );

        return {
          success: true,
          mensaje: 'Policía actualizado correctamente'
        };
      } catch (error) {
        console.error('Error al editar policía:', error);
        return reply.internalServerError('Error interno al editar policía');
      }
    }
  });

  // ==================== GESTIÓN DE EMPLEADOS ====================
  
  // Obtener empleados
  fastify.get("/empleados", {
    schema: {
      tags: ["admin"],
      summary: "Obtener todos los empleados",
      response: {
        200: Type.Array(Type.Object({
          credencial: Type.String(),
          nombres: Type.String(),
          apellido1: Type.String(),
          apellido2: Type.Optional(Type.String()),
          cedula: Type.String(),
          organismo: Type.String()
        }))
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      try {
        const [rows]: any[] = await db.query(
          `SELECT 
            e.credencial,
            c.nombres,
            c.apellido1,
            c.apellido2,
            c.cedula,
            o.nombre as organismo
           FROM EMPLEADO e
           JOIN CIUDADANO c ON e.credencial = c.credencial
           JOIN ORGANISMO o ON e.id_organismo = o.id
           ORDER BY c.apellido1, c.apellido2, c.nombres`
        );

        return rows;

      } catch (error) {
        console.error('Error al obtener empleados:', error);
        return reply.internalServerError('Error interno al obtener empleados');
      }
    }
  });

  // Agregar empleado
  fastify.post("/empleados", {
    schema: {
      tags: ["admin"],
      summary: "Agregar un empleado",
      body: Type.Object({
        credencial: Type.String(),
        id_organismo: Type.Number()
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      const { credencial, id_organismo } = request.body as {
        credencial: string;
        id_organismo: number;
      };

      try {
        // Verificar que el ciudadano existe
        const [ciudadanoRows]: any[] = await db.query(
          `SELECT credencial FROM CIUDADANO WHERE credencial = ?`,
          [credencial]
        );

        if (ciudadanoRows.length === 0) {
          return reply.badRequest('Ciudadano no encontrado');
        }

        // Verificar que el organismo existe
        const [organismoRows]: any[] = await db.query(
          `SELECT id FROM ORGANISMO WHERE id = ?`,
          [id_organismo]
        );

        if (organismoRows.length === 0) {
          return reply.badRequest('Organismo no encontrado');
        }

        // Verificar que no esté ya asignado como empleado
        const [empleadoRows]: any[] = await db.query(
          `SELECT credencial FROM EMPLEADO WHERE credencial = ?`,
          [credencial]
        );

        if (empleadoRows.length > 0) {
          return reply.badRequest('El ciudadano ya está asignado como empleado');
        }

        // Agregar empleado
        await db.query(
          `INSERT INTO EMPLEADO (credencial, id_organismo)
           VALUES (?, ?)`,
          [credencial, id_organismo]
        );

        return reply.code(201).send({
          success: true,
          mensaje: 'Empleado agregado correctamente'
        });

      } catch (error) {
        console.error('Error al agregar empleado:', error);
        return reply.internalServerError('Error interno al agregar empleado');
      }
    }
  });

  // Eliminar empleado
  fastify.delete("/empleados/:credencial", {
    schema: {
      tags: ["admin"],
      summary: "Eliminar un empleado",
      params: Type.Object({
        credencial: Type.String()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      const { credencial } = request.params as { credencial: string };

      try {
        const [result]: any[] = await db.query(
          `DELETE FROM EMPLEADO WHERE credencial = ?`,
          [credencial]
        );

        if (result.affectedRows === 0) {
          return reply.notFound('Empleado no encontrado');
        }

        return {
          success: true,
          mensaje: 'Empleado eliminado correctamente'
        };

      } catch (error) {
        console.error('Error al eliminar empleado:', error);
        return reply.internalServerError('Error interno al eliminar empleado');
      }
    }
  });

  // Editar empleado (cambiar organismo)
  fastify.put("/empleados/:credencial", {
    schema: {
      tags: ["admin"],
      summary: "Editar un empleado (organismo)",
      params: Type.Object({
        credencial: Type.String()
      }),
      body: Type.Object({
        id_organismo: Type.Number()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          mensaje: Type.String()
        })
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      const { credencial } = request.params as { credencial: string };
      const { id_organismo } = request.body as { id_organismo: number };

      try {
        // Verificar que el empleado existe
        const [empleadoRows]: any[] = await db.query(
          `SELECT credencial FROM EMPLEADO WHERE credencial = ?`,
          [credencial]
        );
        if (empleadoRows.length === 0) {
          return reply.notFound('Empleado no encontrado');
        }

        // Verificar que el organismo existe
        const [organismoRows]: any[] = await db.query(
          `SELECT id FROM ORGANISMO WHERE id = ?`,
          [id_organismo]
        );
        if (organismoRows.length === 0) {
          return reply.badRequest('Organismo no encontrado');
        }

        // Actualizar organismo
        await db.query(
          `UPDATE EMPLEADO SET id_organismo = ? WHERE credencial = ?`,
          [id_organismo, credencial]
        );

        return {
          success: true,
          mensaje: 'Empleado actualizado correctamente'
        };
      } catch (error) {
        console.error('Error al editar empleado:', error);
        return reply.internalServerError('Error interno al editar empleado');
      }
    }
  });

  // ==================== DATOS AUXILIARES ====================
  
  // Obtener comisarías
  fastify.get("/comisarias", {
    schema: {
      tags: ["admin"],
      summary: "Obtener todas las comisarías",
      response: {
        200: Type.Array(Type.Object({
          id: Type.Number(),
          nombre: Type.String()
        }))
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      try {
        const [rows]: any[] = await db.query(
          `SELECT id, nombre FROM COMISARIA ORDER BY nombre`
        );

        return rows;

      } catch (error) {
        console.error('Error al obtener comisarías:', error);
        return reply.internalServerError('Error interno al obtener comisarías');
      }
    }
  });

  // Obtener organismos
  fastify.get("/organismos", {
    schema: {
      tags: ["admin"],
      summary: "Obtener todos los organismos",
      response: {
        200: Type.Array(Type.Object({
          id: Type.Number(),
          nombre: Type.String()
        }))
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      try {
        const [rows]: any[] = await db.query(
          `SELECT id, nombre FROM ORGANISMO ORDER BY nombre`
        );

        return rows;

      } catch (error) {
        console.error('Error al obtener organismos:', error);
        return reply.internalServerError('Error interno al obtener organismos');
      }
    }
  });

  // Obtener establecimientos
  fastify.get("/establecimientos", {
    schema: {
      tags: ["admin"],
      summary: "Obtener todos los establecimientos",
      response: {
        200: Type.Array(Type.Object({
          id: Type.Number(),
          direccion: Type.String()
        }))
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      try {
        const [rows]: any[] = await db.query(
          `SELECT id, direccion FROM ESTABLECIMIENTO ORDER BY direccion`
        );

        return rows;

      } catch (error) {
        console.error('Error al obtener establecimientos:', error);
        return reply.internalServerError('Error interno al obtener establecimientos');
      }
    }
  });

  // Obtener ciudadanos que no son empleados
  fastify.get("/ciudadanos/sin-empleado", {
    schema: {
      tags: ["admin"],
      summary: "Obtener ciudadanos que no están en la tabla EMPLEADO",
      response: {
        200: Type.Array(Type.Object({
          credencial: Type.String(),
          nombres: Type.String(),
          apellido1: Type.String(),
          apellido2: Type.Optional(Type.String()),
          cedula: Type.String(),
          fecha_nac: Type.String(),
          direccion: Type.String()
        }))
      }
    },
    onRequest: [fastify.verifyJWT, fastify.verifyAdmin],
    handler: async function (request, reply) {
      try {
        const [rows]: any[] = await db.query(
          `SELECT c.*
           FROM CIUDADANO c
           LEFT JOIN EMPLEADO e ON c.credencial = e.credencial
           WHERE e.credencial IS NULL
           ORDER BY c.apellido1, c.apellido2, c.nombres`
        );
        return rows;
      } catch (error) {
        console.error('Error al obtener ciudadanos sin empleado:', error);
        return reply.internalServerError('Error interno al obtener ciudadanos sin empleado');
      }
    }
  });
};

export default adminRoutes; 