
import { defineSchema as convexDefineSchema, defineTable as convexDefineTable, httpRouter as convexHttpRouter } from "convex/server";

export const query = (config: any) => config;
export const mutation = (config: any) => config;
export const httpAction = (config: any) => config;

export const defineSchema = convexDefineSchema;
export const defineTable = convexDefineTable;
export const httpRouter = convexHttpRouter;
