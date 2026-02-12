
import { v } from "convex/values";
import { mutation, query } from "./server";

/**
 * Retorna os vídeos mais populares (Trending)
 */
export const getTrending = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videos")
      .order("desc")
      .take(args.limit);
  },
});

/**
 * Retorna o perfil público de um usuário
 */
export const getPublicProfile = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

/**
 * Busca vídeos por texto na descrição
 */
export const searchVideos = query({
  args: { queryText: v.string() },
  handler: async (ctx, args) => {
    const term = args.queryText.toLowerCase();
    const allVideos = await ctx.db.query("videos").collect();
    return allVideos.filter(v => 
      v.description.toLowerCase().includes(term) || 
      v.username.toLowerCase().includes(term)
    );
  },
});

/**
 * Alterna o estado de "curtida" em um vídeo.
 */
export const toggleLike = mutation({
  args: { 
    videoId: v.string(), 
    increment: v.boolean(),
    ownerUsername: v.string() 
  },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("id", args.videoId))
      .first();

    if (video) {
      const newLikes = Math.max(0, (video.likes || 0) + (args.increment ? 1 : -1));
      await ctx.db.patch(video._id, { likes: newLikes });
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.ownerUsername))
      .first();

    if (profile) {
      const newTotalLikes = Math.max(0, (profile.likes || 0) + (args.increment ? 1 : -1));
      await ctx.db.patch(profile._id, { likes: newTotalLikes });
    }
  },
});

export const toggleFollow = mutation({
  args: { 
    myUsername: v.string(), 
    targetUsername: v.string(),
    isFollowing: v.boolean()
  },
  handler: async (ctx, args) => {
    const me = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.myUsername))
      .first();

    const target = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.targetUsername))
      .first();

    if (!me || !target) return;

    const myFollowingMap = { ...(me.followingMap || {}) };
    if (args.isFollowing) {
      myFollowingMap[args.targetUsername] = true;
    } else {
      delete myFollowingMap[args.targetUsername];
    }

    await ctx.db.patch(me._id, {
      followingMap: myFollowingMap,
      following: Math.max(0, (me.following || 0) + (args.isFollowing ? 1 : -1))
    });

    await ctx.db.patch(target._id, {
      followers: Math.max(0, (target.followers || 0) + (args.isFollowing ? 1 : -1))
    });
  },
});

export const addComment = mutation({
  args: {
    videoId: v.string(),
    comment: v.any(),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("id", args.videoId))
      .first();

    if (video) {
      const comments = [...(video.comments || []), args.comment];
      await ctx.db.patch(video._id, { comments });
    }
  },
});

export const deleteComment = mutation({
  args: {
    videoId: v.string(),
    commentId: v.string(),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("id", args.videoId))
      .first();

    if (video) {
      const comments = (video.comments || []).filter((c: any) => c.id !== args.commentId);
      await ctx.db.patch(video._id, { comments });
    }
  },
});

export const repost = mutation({
  args: {
    username: v.string(),
    videoId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("id", args.videoId))
      .first();

    if (!user || !video) return;

    const reposts = [...(user.repostedVideoIds || [])];
    if (!reposts.includes(args.videoId)) {
      reposts.push(args.videoId);
      await ctx.db.patch(user._id, { repostedVideoIds: reposts });
      await ctx.db.patch(video._id, { reposts: (video.reposts || 0) + 1 });
    }
  },
});
