import { pgTable, text, serial, integer, boolean, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  created_at: timestamp("created_at").defaultNow(),
});

// Forum categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  count: integer("count").default(0),
});

// Forum posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url"),
  views: integer("views").default(0),
  comments: integer("comments").default(0),
  likes: integer("likes").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

// Forum comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Post likes
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  postId: integer("post_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Find likes
export const findLikes = pgTable("find_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  findId: integer("find_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Treasure finds
export const finds = pgTable("finds", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  userId: integer("user_id").notNull(),
  location: text("location"),
  imageUrl: text("image_url").notNull(),
  likes: integer("likes").default(0),
  period: text("period"),
  commentCount: integer("comment_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

// Locations for metal detecting
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  userId: integer("user_id").notNull(),
  isPrivate: boolean("is_private").default(true),
  terrainType: text("terrain_type"),
  accessInfo: text("access_info"),
  bestTimeToVisit: text("best_time_to_visit"),
  created_at: timestamp("created_at").defaultNow(),
});

// Events
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  eventDate: timestamp("event_date").notNull(),
  userId: integer("user_id").notNull(),
  attendeeCount: integer("attendee_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

// Wellbeing stories
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  yearsDetecting: integer("years_detecting"),
  created_at: timestamp("created_at").defaultNow(),
});

// Find comments
export const findComments = pgTable("find_comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  findId: integer("find_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Detecting routes
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  startLat: text("start_lat").notNull(),
  startLng: text("start_lng").notNull(),
  endLat: text("end_lat").notNull(),
  endLng: text("end_lng").notNull(),
  waypoints: text("waypoints"),
  estimatedDuration: integer("estimated_duration"),
  difficulty: text("difficulty"),
  terrainType: text("terrain_type"),
  historicalPeriods: text("historical_periods"),
  isPublic: boolean("is_public").default(false),
  rating: integer("rating").default(0),
  completedCount: integer("completed_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

// User preferences
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  preferredTerrain: text("preferred_terrain"),
  preferredDifficulty: text("preferred_difficulty"),
  maxDistance: integer("max_distance"),
  historicalInterests: text("historical_interests"),
  created_at: timestamp("created_at").defaultNow(),
});

// Social Networking Features

// User connections (follow/friend system)
export const userConnections = pgTable("user_connections", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  status: text("status").notNull().default("pending"),
  connectionType: text("connection_type").notNull().default("follow"),
  created_at: timestamp("created_at").defaultNow(),
});

// User groups/clubs
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  coverImageUrl: text("cover_image_url"),
  creatorId: integer("creator_id").notNull(),
  isPrivate: boolean("is_private").default(false),
  memberCount: integer("member_count").default(1),
  location: text("location"),
  tags: text("tags"),
  rules: text("rules"),
  created_at: timestamp("created_at").defaultNow(),
});

// Group memberships
export const groupMemberships = pgTable("group_memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  groupId: integer("group_id").notNull(),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("pending"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Activity feed
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: text("activity_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  content: text("content"),
  isPublic: boolean("is_public").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// Likes system
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Direct messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  messageType: text("message_type").default("text"),
  attachmentUrl: text("attachment_url"),
  created_at: timestamp("created_at").defaultNow(),
});

// Achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  badgeType: text("badge_type").notNull(),
  criteria: text("criteria"),
  points: integer("points").default(0),
  isActive: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
  progress: integer("progress").default(0),
});

// User profiles
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  yearsDetecting: integer("years_detecting"),
  favoriteFinds: text("favorite_finds"),
  detectorBrand: text("detector_brand"),
  detectorModel: text("detector_model"),
  searchTechniques: text("search_techniques"),
  specialtyPeriods: text("specialty_periods"),
  location: text("location"),
  isLocationPublic: boolean("is_location_public").default(false),
  socialLinks: text("social_links"),
  totalFinds: integer("total_finds").default(0),
  totalPoints: integer("total_points").default(0),
  reputation: integer("reputation").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

// Mentorships
export const mentorships = pgTable("mentorships", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull(),
  menteeId: integer("mentee_id").notNull(),
  status: text("status").notNull().default("pending"),
  focusAreas: text("focus_areas"),
  notes: text("notes"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow(),
});

// Challenges
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  challengeType: text("challenge_type").notNull(),
  rules: text("rules"),
  rewards: text("rewards"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  creatorId: integer("creator_id").notNull(),
  participantCount: integer("participant_count").default(0),
  isActive: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// Challenge participations
export const challengeParticipations = pgTable("challenge_participations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  progress: text("progress"),
  score: integer("score").default(0),
  completedAt: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow(),
});

// User onboarding
export const userOnboarding = pgTable("user_onboarding", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  currentStep: text("current_step").default("welcome"),
  completedSteps: text("completed_steps"),
  isCompleted: boolean("is_completed").default(false),
  skippedTour: boolean("skipped_tour").default(false),
  lastActiveStep: timestamp("last_active_step").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Image storage
export const imageStorage = pgTable("image_storage", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(),
  size: integer("size").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Relations
export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.creatorId],
    references: [users.id],
  }),
  memberships: many(groupMemberships),
}));

export const groupMembershipsRelations = relations(groupMemberships, ({ one }) => ({
  group: one(groups, {
    fields: [groupMemberships.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMemberships.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  avatarUrl: true,
  bio: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  description: true,
  icon: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  userId: true,
  categoryId: true,
  imageUrl: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  userId: true,
  postId: true,
});

export const insertPostLikeSchema = createInsertSchema(postLikes).pick({
  userId: true,
  postId: true,
});

export const insertFindSchema = createInsertSchema(finds).pick({
  title: true,
  description: true,
  latitude: true,
  longitude: true,
  userId: true,
  location: true,
  imageUrl: true,
  period: true,
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  description: true,
  latitude: true,
  longitude: true,
  userId: true,
  isPrivate: true,
  terrainType: true,
  accessInfo: true,
  bestTimeToVisit: true,
});

export const insertEventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Event location is required"),
  eventDate: z.string().min(1, "Event date is required"),
  userId: z.number(),
});

export const insertStorySchema = createInsertSchema(stories).pick({
  content: true,
  userId: true,
  yearsDetecting: true,
});

export const insertFindCommentSchema = createInsertSchema(findComments).pick({
  content: true,
  userId: true,
  findId: true,
});

export const insertRouteSchema = createInsertSchema(routes).pick({
  name: true,
  description: true,
  userId: true,
  startLat: true,
  startLng: true,
  endLat: true,
  endLng: true,
  waypoints: true,
  estimatedDuration: true,
  difficulty: true,
  terrainType: true,
  historicalPeriods: true,
  isPublic: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  preferredTerrain: true,
  preferredDifficulty: true,
  maxDistance: true,
  historicalInterests: true,
});

// Social networking schemas
export const insertUserConnectionSchema = createInsertSchema(userConnections).pick({
  followerId: true,
  followingId: true,
  connectionType: true,
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  avatarUrl: true,
  coverImageUrl: true,
  creatorId: true,
  isPrivate: true,
  location: true,
  tags: true,
  rules: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  activityType: true,
  entityType: true,
  entityId: true,
  content: true,
  isPublic: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
  messageType: true,
  attachmentUrl: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  name: true,
  description: true,
  iconUrl: true,
  badgeType: true,
  criteria: true,
  points: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementId: true,
  progress: true,
});

export const insertUserOnboardingSchema = createInsertSchema(userOnboarding).pick({
  userId: true,
  currentStep: true,
  completedSteps: true,
  isCompleted: true,
  skippedTour: true,
});

export const insertImageStorageSchema = createInsertSchema(imageStorage).pick({
  filename: true,
  originalName: true,
  mimeType: true,
  data: true,
  size: true,
  uploadedBy: true,
});

export const insertGroupMembershipSchema = createInsertSchema(groupMemberships).pick({
  userId: true,
  groupId: true,
  role: true,
  status: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;
export type PostLike = typeof postLikes.$inferSelect;

export type InsertFind = z.infer<typeof insertFindSchema>;
export type Find = typeof finds.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;

export type InsertFindComment = z.infer<typeof insertFindCommentSchema>;
export type FindComment = typeof findComments.$inferSelect;

export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Social networking types
export type InsertUserConnection = z.infer<typeof insertUserConnectionSchema>;
export type UserConnection = typeof userConnections.$inferSelect;

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertUserOnboarding = z.infer<typeof insertUserOnboardingSchema>;
export type UserOnboarding = typeof userOnboarding.$inferSelect;

export type InsertImageStorage = z.infer<typeof insertImageStorageSchema>;
export type ImageStorage = typeof imageStorage.$inferSelect;
