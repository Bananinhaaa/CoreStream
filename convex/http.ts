
import { httpRouter } from "./server";
import { httpAction } from "./server";

const http = httpRouter();

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

// Novas rotas para interações sociais
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
