
import { httpRouter } from "./server";
import { httpAction } from "./server";

const http = httpRouter();

/**
 * ROTA: GET /api/trending
 * Retorna os vídeos em alta.
 */
http.route({
  path: "/api/trending",
  method: "GET",
  handler: httpAction(async (ctx: any) => {
    const videos = await ctx.runQuery("app:getTrending", { limit: 10 });
    return new Response(JSON.stringify(videos), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });
  }),
});

/**
 * ROTA: GET /api/user?username=...
 * Retorna dados de um perfil.
 */
http.route({
  path: "/api/user",
  method: "GET",
  handler: httpAction(async (ctx: any, request: Request) => {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");
    if (!username) return new Response("Username required", { status: 400 });

    const profile = await ctx.runQuery("app:getPublicProfile", { username });
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }),
});

/**
 * ROTA: POST /api/search
 * Busca vídeos.
 */
http.route({
  path: "/api/search",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const { queryText } = await request.json();
    const results = await ctx.runQuery("app:searchVideos", { queryText });
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }),
});

// Mantendo rotas internas do app
http.route({
  path: "/listVideos",
  method: "POST",
  handler: httpAction(async (ctx: any) => {
    const videos = await ctx.runQuery("videos:list");
    return new Response(JSON.stringify({ value: videos }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }),
});

http.route({
  path: "/listProfiles",
  method: "POST",
  handler: httpAction(async (ctx: any) => {
    const profiles = await ctx.runQuery("profiles:list");
    return new Response(JSON.stringify({ value: profiles }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }),
});

http.route({
  path: "/saveVideo",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const args = await request.json();
    await ctx.runMutation("videos:save", args);
    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/saveProfile",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const args = await request.json();
    await ctx.runMutation("profiles:save", args);
    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/toggleLike",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const args = await request.json();
    await ctx.runMutation("app:toggleLike", args);
    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/toggleFollow",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const args = await request.json();
    await ctx.runMutation("app:toggleFollow", args);
    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/addComment",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const args = await request.json();
    await ctx.runMutation("app:addComment", args);
    return new Response(null, { status: 200 });
  }),
});

export default http;
