
import { v } from "convex/values";
import { query, mutation } from "./server";

export const list = query({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db.query("profiles").collect();
  },
});

export const save = mutation({
  args: v.object({
    profile: v.any(),
    email: v.string(),
    password: v.optional(v.string()),
    followingMap: v.optional(v.any()),
  }),
  handler: async (ctx: any, args: any) => {
    const { profile, email, password, followingMap } = args;
    if (!profile || !profile.username) return;

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q: any) => q.eq("username", profile.username))
      .first();

    const data = {
      ...profile,
      email,
      password: password || '',
      followingMap: followingMap || {},
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("profiles", data);
    }
  },
});

export const updatePresence = mutation({
  args: { username: v.string(), lastSeen: v.number() },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q: any) => q.eq("username", args.username))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: args.lastSeen });
    }
  },
});
