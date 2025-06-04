import { Type, Static } from "@sinclair/typebox";

export const UsuarioLoginSchema = Type.Object({
  credencial: Type.String(),
  rol: Type.Union([
    Type.Literal("admin"),
    Type.Literal("votante"),
    Type.Literal("funcionario"),
  ]),
});

export type UsuarioLoginType = Static<typeof UsuarioLoginSchema>;