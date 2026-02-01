
import { httpRouter } from "./server";
import { httpAction } from "./server";

const http = httpRouter();

// Endpoint para listar vídeos
http.route({
  path: "/listVideos",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const videos = await ctx.runQuery("videos:list");
    return new Response(JSON.stringify({ value: videos }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }),
});

// Endpoint para listar perfis
http.route({
  path: "/listProfiles",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const profiles = await ctx.runQuery("profiles:list");
    return new Response(JSON.stringify({ value: profiles }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }),
});

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
