
// Adicionando defineSchema e defineTable ao shim para resolver erros de exportação e garantir consistência nos utilitários do servidor
import { query as convexQuery, mutation as convexMutation, defineSchema as convexDefineSchema, defineTable as convexDefineTable } from "convex/server";

// Exportamos versões genéricas para que o TypeScript não reclame da falta de tipos gerados
export const query = convexQuery;
export const mutation = convexMutation;
export const defineSchema = convexDefineSchema;
export const defineTable = convexDefineTable;
