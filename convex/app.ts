
import { v } from "convex/values";
import { mutation, query } from "./server";

/**
 * Alterna o estado de "curtida" em um vídeo.
 * Atualiza o contador do vídeo e o total de likes no perfil do dono.
 */
export const toggleLike = mutation({
  args: { 
    videoId: v.string(), 
    increment: v.boolean(),
    ownerUsername: v.string() 
  },
  handler: async (ctx, args) => {
    // 1. Atualiza o vídeo
    const video = await ctx.db
      .query("videos")
      .withIndex("by_videoId", (q) => q.eq("id", args.videoId))
      .first();

    if (video) {
      const newLikes = Math.max(0, (video.likes || 0) + (args.increment ? 1 : -1));
      await ctx.db.patch(video._id, { likes: newLikes });
    }

    // 2. Atualiza o perfil do dono do vídeo (total de likes recebidos)
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

/**
 * Lógica de seguir/parar de seguir.
 * Atualiza o mapa de seguimento do usuário e os contadores de ambos.
 */
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

    // Atualiza meu perfil (quem eu sigo)
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

    // Atualiza o perfil alvo (seguidores dele)
    await ctx.db.patch(target._id, {
      followers: Math.max(0, (target.followers || 0) + (args.isFollowing ? 1 : -1))
    });
  },
});

/**
 * Adiciona um comentário a um vídeo.
 */
export const addComment = mutation({
  args: {
    videoId: v.string(),
    comment: v.any(), // Objeto do tipo Comment definido no types.ts
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

/**
 * Remove um comentário de um vídeo.
 */
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

/**
 * Republica um vídeo.
 */
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

    // Adiciona ao perfil do usuário
    const reposts = [...(user.repostedVideoIds || [])];
    if (!reposts.includes(args.videoId)) {
      reposts.push(args.videoId);
      await ctx.db.patch(user._id, { repostedVideoIds: reposts });

      // Incrementa no vídeo
      await ctx.db.patch(video._id, { reposts: (video.reposts || 0) + 1 });
    }
  },
});
