
import { defineSchema as convexDefineSchema, defineTable as convexDefineTable } from "convex/server";

/**
 * No Convex, as funções 'query' e 'mutation' de produção são geradas via CLI.
 * Para passar pelo build do TypeScript sem os arquivos gerados, definimos
 * estes wrappers que apenas retornam a configuração fornecida.
 */
export const query = (config: any) => config;
export const mutation = (config: any) => config;

export const defineSchema = convexDefineSchema;
export const defineTable = convexDefineTable;
