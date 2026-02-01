
import { v } from "convex/values";
import { query, mutation } from "./server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("profiles").collect();
  },
});

export const save = mutation({
  args: v.any(),
  handler: async (ctx, args) => {
    const { profile, email, password, followingMap } = args;
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", profile.username))
      .first();

    const data = {
      ...profile,
      email,
      password,
      followingMap,
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
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: args.lastSeen });
    }
  },
});
