import { Type, Static } from "@sinclair/typebox";

export const UsuarioLoginSchema = Type.Object({
  credencial: Type.String(),
  rol: Type.Union([
    Type.Literal("ADMIN"),
    Type.Literal("VOTANTE"),
    Type.Literal("FUNCIONARIO"),
  ]),
});

export type UsuarioLoginType = Static<typeof UsuarioLoginSchema>;