
// Importando do shim local "./server" para evitar conflitos de resolução de módulos e garantir acesso às definições corretas
import { defineSchema, defineTable } from "./server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    username: v.string(),
    displayName: v.string(),
    email: v.string(),
    password: v.optional(v.string()),
    bio: v.string(),
    avatar: v.optional(v.string()),
    followers: v.number(),
    following: v.number(),
    likes: v.number(),
    isVerified: v.boolean(),
    isAdmin: v.boolean(),
    isBanned: v.boolean(),
    profileColor: v.string(),
    followingMap: v.any(), // Record<string, boolean>
    repostedVideoIds: v.array(v.string()),
    notifications: v.array(v.any()),
    lastSeen: v.number(),
  }).index("by_username", ["username"]),

  videos: defineTable({
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
  }).index("by_username", ["username"]),
});
