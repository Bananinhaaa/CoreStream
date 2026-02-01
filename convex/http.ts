
import { httpRouter } from "./server";
import { api } from "./_generated/api";
import { httpAction } from "./server";

const http = httpRouter();

// Endpoint para salvar vídeos
http.route({
  path: "/saveVideo",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const args = await request.json();
    await ctx.runMutation("videos:save", args);
    return new Response(null, { status: 200 });
  }),
});

// Endpoint para salvar perfis
http.route({
  path: "/saveProfile",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const args = await request.json();
    await ctx.runMutation("profiles:save", args);
    return new Response(null, { status: 200 });
  }),
});

// Endpoint para atualizar presença
http.route({
  path: "/updatePresence",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const args = await request.json();
    await ctx.runMutation("profiles:updatePresence", args);
    return new Response(null, { status: 200 });
  }),
});

export default http;
