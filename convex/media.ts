
import { v } from "convex/values";
import { mutation, query } from "./server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getPublicUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
