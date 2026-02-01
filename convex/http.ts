
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
  path: "/deleteVideo",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const args = await request.json();
    await ctx.runMutation("videos:remove", args);
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
  path: "/updatePresence",
  method: "POST",
  handler: httpAction(async (ctx: any, request: Request) => {
    const args = await request.json();
    await ctx.runMutation("profiles:updatePresence", args);
    return new Response(null, { status: 200 });
  }),
});

export default http;
