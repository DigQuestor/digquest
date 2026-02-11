import { z } from "zod";

// Zod schema for creating a post (used by client forms)
export const insertPostSchema = z.object({
	title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
	content: z.string().min(10, "Content must be at least 10 characters"),
	categoryId: z.number().min(1, "Please select a category"),
	imageUrl: z.string().optional(),
});

export type PostFormValues = z.infer<typeof insertPostSchema>;

export const insertUserSchema = z.object({
	username: z.string().min(3),
	email: z.string().email(),
	password: z.string().min(6),
});

export const insertCommentSchema = z.object({
	postId: z.number().min(1),
	content: z.string().min(1),
});

export const insertFindSchema = z.object({
	title: z.string().min(1),
	userId: z.number().optional(),
});

export const insertFindCommentSchema = z.object({
	findId: z.number().min(1),
	content: z.string().min(1),
});

export const insertLocationSchema = z.object({
	name: z.string().min(1),
	lat: z.number().optional(),
	lng: z.number().optional(),
});

export const insertEventSchema = z.object({
	title: z.string().min(1),
	date: z.string().optional(),
});

export const insertStorySchema = z.object({
	title: z.string().min(1),
	content: z.string().optional(),
});

// Minimal shared schema shim to satisfy server imports during build.
// This file provides lightweight placeholders for tables and types
// used by the server bundle. Replace with the real Drizzle schema
// when integrating with a database.

// Table placeholders (value exports)
export const users = {} as const;
export const categories = {} as const;
export const posts = {} as const;
export const comments = {} as const;
export const postLikes = {} as const;
export const findLikes = {} as const;
export const finds = {} as const;
export const findComments = {} as const;
export const locations = {} as const;
export const events = {} as const;
export const stories = {} as const;
export const routes = {} as const;
export const userPreferences = {} as const;
export const imageStorage = {} as const;
export const groups = {} as const;
export const groupMemberships = {} as const;
export const userConnections = {} as const;
export const activities = {} as const;
export const messages = {} as const;
export const achievements = {} as const;
export const userAchievements = {} as const;

// Type placeholders (minimal shapes)
export interface User { id: number; username?: string; email?: string }
export type InsertUser = Partial<User>;

export interface Category { id: number; name?: string; slug?: string }
export type InsertCategory = Partial<Category>;

export interface Post { id: number; title?: string; content?: string; userId?: number; categoryId?: number }
export type InsertPost = Partial<Post>;

export interface Comment { id: number; postId?: number; content?: string; userId?: number }
export type InsertComment = Partial<Comment>;

export interface PostLike { id: number; userId?: number; postId?: number }
export type InsertPostLike = Partial<PostLike>;

export interface Find { id: number; userId?: number }
export type InsertFind = Partial<Find>;

export interface FindComment { id: number; findId?: number; content?: string }
export type InsertFindComment = Partial<FindComment>;

export interface Location { id: number; name?: string }
export type InsertLocation = Partial<Location>;

export interface Event { id: number; title?: string }
export type InsertEvent = Partial<Event>;

export interface Story { id: number; title?: string }
export type InsertStory = Partial<Story>;

export interface Route { id: number; name?: string }
export type InsertRoute = Partial<Route>;

export interface UserPreferences { id: number; userId?: number }
export type InsertUserPreferences = Partial<UserPreferences>;

export interface ImageStorage { id: number; filename?: string }
export type InsertImageStorage = Partial<ImageStorage>;

export interface Group { id: number; name?: string }
export type InsertGroup = Partial<Group>;

export interface GroupMembership { id: number; groupId?: number; userId?: number }
export type InsertGroupMembership = Partial<GroupMembership>;

export interface UserConnection { id: number; followerId?: number; followingId?: number }
export type InsertUserConnection = Partial<UserConnection>;

export interface Activity { id: number; userId?: number; type?: string }
export type InsertActivity = Partial<Activity>;

export interface Message { id: number; fromId?: number; toId?: number; content?: string }
export type InsertMessage = Partial<Message>;

export interface Achievement { id: number; name?: string }
export type InsertAchievement = Partial<Achievement>;

export interface UserAchievement { id: number; userId?: number; achievementId?: number }
export type InsertUserAchievement = Partial<UserAchievement>;

// Keep this file intentionally simple; it's a compatibility shim.
