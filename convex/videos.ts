
import { v } from "convex/values";
import { query, mutation } from "./server";

export const list = query({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db.query("videos").order("desc").collect();
  },
});

export const save = mutation({
  args: {
    id: v.string(),
    url: v.string(),
    username: v.string(),
    displayName: v.string(),
    avatar: v.string(),
    description: v.string(),
    likes: v.number(),
    comments: v.array(v.any()),
    reposts: v.number(),
    views: v.number(),
    music: v.string(),
    isVerified: v.boolean(),
    storageId: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // Busca pelo ID customizado usando o novo nome de índice 'by_videoId'
    const existing = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q: any) => q.eq("id", args.id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("videos", args);
    }
  },
});
