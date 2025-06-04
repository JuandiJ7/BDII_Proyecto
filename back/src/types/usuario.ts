import { Type, Static } from "@sinclair/typebox";

export const LoginSchema = Type.Object(
  {
    credencial: Type.String({ description: "Credencial del ciudadano" }),
    contraseña: Type.String({ description: "Contraseña del ciudadano" }),
  },
  {
    examples: [{ credencial: "JCD21812", contraseña: "@Juan1" }],
  }
);
export type LoginType = Static<typeof LoginSchema>;

// Nuevo esquema reflejando la estructura real de la tabla CIUDADANO
export const UsuarioSchema = Type.Object(
  {
    cc: Type.String({ description: "Credencial cívica del ciudadano" }),
    nombre: Type.String(),
    apellido: Type.String(),
    ci: Type.String(),
    fecha_nac: Type.String({ format: "date" }),
    direccion: Type.String(),
  },
  {
    additionalProperties: false,
    examples: [
      {
        cc: "JCD21812",
        nombre: "Juan Diego",
        apellido: "Jacques Sánchez",
        ci: "54818839",
        fecha_nac: "2003-06-27",
        direccion: "Apolon 1590",
        id_departamento: null,
        rol: "votante",
      },
    ],
  }
);

export const IdCiudadanoSchema = Type.Object({
  cc: Type.String({ description: "Credencial cívica del ciudadano" }),
});
export type IdCiudadanoType = Static<typeof IdCiudadanoSchema>;

export const NuevoUsuarioSchema = Type.Object(
  {
    cc: Type.String({ description: "Credencial cívica del ciudadano" }),
    nombre: Type.String({ description: "Nombre del ciudadano" }),
    apellido: Type.String({ description: "Apellido del ciudadano" }),
    ci: Type.String({ description: "Cédula de identidad" }),
    fecha_nac: Type.String({ format: "date", description: "Fecha de nacimiento" }),
    direccion: Type.String({ description: "Dirección del ciudadano" }),
    contraseña: Type.String({ description: "Contraseña para iniciar sesión" }),
    contraseña2: Type.String({ description: "Confirmación de la contraseña" }),
  },
  {
    examples: [
      {
        cc: "JCD21812",
        nombre: "Juan Diego",
        apellido: "Jacques Sánchez",
        ci: "54818839",
        fecha_nac: "2003-06-27",
        direccion: "Apolon 1590",
        contraseña: "@Juan1",
        contraseña2: "@Juan1",
      },
    ],
  }
);

export type NuevoUsuarioType = Static<typeof NuevoUsuarioSchema>;


export type UsuarioType = Static<typeof UsuarioSchema>;
