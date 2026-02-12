import bcrypt from 'bcrypt';
import * as schema from "./db/schema.js";
const {
  users,
  categories,
  posts,
  comments,
  postLikes,
  findLikes,
  finds,
  findComments,
  locations,
  events,
  stories,
  routes,
  userPreferences,
  imageStorage,
  groups,
  groupMemberships,
  userConnections,
  activities,
  messages,
  achievements,
  userAchievements
} = schema;
import { db } from "./db/db.js";
import { eq, desc, and, sql } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  setEmailVerificationToken(userId: number, token: string, expires: Date): Promise<void>;
  verifyEmail(token: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Categories
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  getAllCategories(): Promise<Category[]>;
  incrementCategoryCount(id: number): Promise<void>;
  recalculateAllCategoryCounts(): Promise<void>;
  
  // Posts
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  getAllPosts(): Promise<Post[]>;
  getPostsByCategory(categoryId: number): Promise<Post[]>;
  getPostsByUser(userId: number): Promise<Post[]>;
  updatePostViewCount(id: number): Promise<void>;
  updatePostCommentCount(id: number): Promise<void>;
  deletePost(id: number): Promise<boolean>;
  
  // Comments
  getComment(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  getAllCommentsByPost(postId: number): Promise<Comment[]>;
  updateComment(id: number, data: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;
  
  // Post likes
  likePost(userId: number, postId: number): Promise<boolean>;
  unlikePost(userId: number, postId: number): Promise<boolean>;
  isPostLikedByUser(userId: number, postId: number): Promise<boolean>;
  getPostLikeCount(postId: number): Promise<number>;
  
  // Find likes
  likeFind(userId: number, findId: number): Promise<boolean>;
  unlikeFind(userId: number, findId: number): Promise<boolean>;
  isFindLikedByUser(userId: number, findId: number): Promise<boolean>;
  getFindLikeCount(findId: number): Promise<number>;
  
  // Finds
  getFind(id: number): Promise<Find | undefined>;
  createFind(find: InsertFind): Promise<Find>;
  updateFind(id: number, findData: Partial<InsertFind>): Promise<Find | undefined>;
  getAllFinds(): Promise<Find[]>;
  getFindsByUser(userId: number): Promise<Find[]>;
  deleteFind(id: number): Promise<boolean>;
  
  // Locations
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  deleteLocation(id: number): Promise<boolean>;
  getAllLocations(): Promise<Location[]>;
  getLocationsByType(type: string): Promise<Location[]>;
  
  // Events
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  getAllEvents(): Promise<Event[]>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  incrementEventAttendeeCount(id: number): Promise<void>;
  
  // Stories
  getStory(id: number): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  getAllStories(): Promise<Story[]>;
  
  // Find Comments
  getFindComment(id: number): Promise<FindComment | undefined>;
  createFindComment(comment: InsertFindComment): Promise<FindComment>;
  getFindCommentsByFind(findId: number): Promise<FindComment[]>;
  updateFindComment(id: number, data: Partial<InsertFindComment>): Promise<FindComment | undefined>;
  deleteFindComment(id: number): Promise<boolean>;
  getAllCommentsByFind(findId: number): Promise<FindComment[]>;
  updateFindCommentCount(id: number): Promise<void>;
  
  // Routes
  getRoute(id: number): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  getAllRoutes(): Promise<Route[]>;
  getRoutesByUser(userId: number): Promise<Route[]>;
  getPublicRoutes(): Promise<Route[]>;
  getRecommendedRoutes(userId: number): Promise<Route[]>;
  deleteRoute(id: number): Promise<boolean>;
  
  // User Preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // Image Storage
  storeImage(imageData: InsertImageStorage): Promise<ImageStorage>;
  getImage(filename: string): Promise<ImageStorage | undefined>;
  deleteImage(filename: string): Promise<boolean>;
  
  // Social Networking Features
  // User Connections
  getUserConnections(userId: number): Promise<UserConnection[]>;
  followUser(followerId: number, followingId: number): Promise<UserConnection>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  getUserSocialStats(userId: number): Promise<{ followers: number; following: number; posts: number; finds: number }>;
  
  // Activity Feed
  createActivity(activity: InsertActivity): Promise<Activity>;
  getUserActivityFeed(userId: number): Promise<Activity[]>;
  getGlobalActivityFeed(): Promise<Activity[]>;
  
  // Groups
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getUserGroups(userId: number): Promise<Group[]>;
  getPublicGroups(): Promise<Group[]>;
  joinGroup(userId: number, groupId: number): Promise<boolean>;
  getAllGroups(): Promise<Group[]>;
  
  // Messages
  sendMessage(message: InsertMessage): Promise<Message>;
  getUserMessages(userId: number): Promise<Message[]>;
  markMessageAsRead(messageId: number): Promise<boolean>;
  
  // User Search
  searchUsers(query: string): Promise<User[]>;
  
  // Achievements
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  awardAchievement(userId: number, achievementId: number): Promise<UserAchievement>;
}

import * as fs from 'fs';
import * as path from 'path';

// File to store data - using a more persistent location that won't be cleared on restarts
const DB_DIR = './data';
const DB_FILE = path.join(DB_DIR, 'db.json');

// Create persistent storage for data to survive server restarts
interface PersistentDataStore {
  // Collections
  users: Record<number, User>;
  categories: Record<number, Category>;
  posts: Record<number, Post>;
  comments: Record<number, Comment>;
  finds: Record<number, Find>;
  findComments: Record<number, FindComment>;
  locations: Record<number, Location>;
  events: Record<number, Event>;
  stories: Record<number, Story>;
  
  // Counters for generating IDs
  userId: number;
  categoryId: number;
  postId: number;
  commentId: number;
  findId: number;
  findCommentId: number;
  locationId: number;
  eventId: number;
  storyId: number;
  
  // Flag to track if default data has been initialized
  initialized: boolean;
}

// Convert maps to objects for JSON serialization
const mapToObject = <T>(map: Map<number, T>): Record<number, T> => {
  const obj: Record<number, T> = {};
  map.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
};

// Convert objects back to maps, restoring Date objects
const objectToMap = <T>(obj: Record<number, T>): Map<number, T> => {
  const map = new Map<number, T>();
  Object.entries(obj).forEach(([key, value]) => {
    // Deep clone and restore dates
    const restoredValue = restoreDates(value);
    map.set(parseInt(key), restoredValue);
  });
  return map;
};

// Helper function to restore Date objects from ISO strings
const restoreDates = <T>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: any = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      // This looks like an ISO date string
      result[key] = new Date(value);
    } else if (value && typeof value === 'object') {
      // Recursively process nested objects
      result[key] = restoreDates(value);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
};

// Create default store
const createDefaultStore = (): PersistentDataStore => ({
  users: {
    1: {
      id: 1,
      username: "DigQuestor",
      email: "admin@digquest.com",
      password: "$2b$10$DummyHashForAdmin",
      emailVerificationToken: null,
      emailVerificationExpires: null,
      avatarUrl: null,
      bio: "Platform Administrator",
      isEmailVerified: true,
      created_at: new Date("2025-01-01T00:00:00.000Z")
    }
  },
  categories: {
    1: { id: 1, name: "General Discussion", description: "General detecting topics", slug: "general-discussion", icon: "MessageCircle", count: 0 },
    2: { id: 2, name: "Finds Gallery", description: "Share your amazing finds", slug: "finds-gallery", icon: "Image", count: 0 },
    3: { id: 3, name: "Equipment Reviews", description: "Detector and equipment discussions", slug: "equipment-reviews", icon: "Settings", count: 0 },
    4: { id: 4, name: "Location Tips", description: "Share detecting locations and tips", slug: "location-tips", icon: "MapPin", count: 0 },
    5: { id: 5, name: "Beginners Corner", description: "Help and advice for newcomers", slug: "beginners-corner", icon: "HelpCircle", count: 0 },
    6: { id: 6, name: "Events & Meetups", description: "Community events and gatherings", slug: "events-meetups", icon: "Calendar", count: 0 }
  },
  posts: {
    1: {
      id: 1,
      title: "Welcome to DigQuest!",
      content: "Welcome to the DigQuest community platform for metal detecting enthusiasts!",
      userId: 1,
      categoryId: 1,
      imageUrl: null,
      views: 0,
      comments: 0,
      likes: 0,
      created_at: new Date("2025-01-01T00:00:00.000Z")
    }
  },
  comments: {},
  finds: {},
  findComments: {},
  locations: {},
  events: {},
  stories: {},
  
  // Counters for generating IDs
  userId: 2,
  categoryId: 7,
  postId: 2,
  commentId: 1, 
  findId: 1,
  findCommentId: 1,
  locationId: 1,
  eventId: 1,
  storyId: 1,
  
  // Flag to track if default data has been initialized
  initialized: true
});

// Save data store to file
const saveDataStore = (store: any): void => {
  try {
    // Ensure directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    
    // Write to temporary file first to avoid corruption if process terminates
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf8');
    
    // On Windows, we may need to unlink first to avoid issues
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.unlinkSync(DB_FILE);
      } catch (e) {
        console.warn('Could not unlink existing DB file, attempting rename anyway');
      }
    }
    
    // Rename for atomic operation
    fs.renameSync(tempFile, DB_FILE);
    
    console.log('Data store saved to file successfully');
  } catch (error) {
    console.error('Error saving data store:', error);
  }
};

// Load data store from file
const loadDataStore = (): PersistentDataStore => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      console.log('Data store loaded from file');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading data store:', error);
  }
  
  console.log('Creating new data store...');
  return createDefaultStore();
};

// Load or create persistent store
const fileStore = loadDataStore();

// Create maps from loaded data
const persistentStore = {
  users: objectToMap(fileStore.users),
  categories: objectToMap(fileStore.categories),
  posts: objectToMap(fileStore.posts),
  comments: objectToMap(fileStore.comments),
  finds: objectToMap(fileStore.finds),
  findComments: objectToMap(fileStore.findComments),
  locations: objectToMap(fileStore.locations),
  events: objectToMap(fileStore.events),
  stories: objectToMap(fileStore.stories),
  
  userId: fileStore.userId,
  categoryId: fileStore.categoryId,
  postId: fileStore.postId,
  commentId: fileStore.commentId,
  findId: fileStore.findId,
  findCommentId: fileStore.findCommentId,
  locationId: fileStore.locationId,
  eventId: fileStore.eventId,
  storyId: fileStore.storyId,
  
  initialized: fileStore.initialized
};

export class MemStorage implements IStorage {
  // Use references to the persistent store
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private finds: Map<number, Find>;
  private findComments: Map<number, FindComment>;
  private locations: Map<number, Location>;
  private events: Map<number, Event>;
  private stories: Map<number, Story>;
  
  private userId: number;
  private categoryId: number;
  private postId: number;
  private commentId: number;
  private findId: number;
  private findCommentId: number;
  private locationId: number;
  private eventId: number;
  private storyId: number;
  
  // Social networking data stores
  private userConnections: Map<number, UserConnection>;
  private activities: Map<number, Activity>;
  private groups: Map<number, Group>;
  private groupMemberships: Map<number, GroupMembership>;
  private messages: Map<number, Message>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  
  // Social networking ID counters
  private userConnectionId: number;
  private activityId: number;
  private groupId: number;
  private groupMembershipId: number;
  private messageId: number;
  private achievementId: number;
  private userAchievementId: number;
  
  constructor() {
    // Use the persistent data store instead of creating new maps
    this.users = persistentStore.users;
    this.categories = persistentStore.categories;
    this.posts = persistentStore.posts;
    this.comments = persistentStore.comments;
    this.finds = persistentStore.finds;
    this.findComments = persistentStore.findComments;
    this.locations = persistentStore.locations;
    this.events = persistentStore.events;
    this.stories = persistentStore.stories;
    
    // Initialize social networking data stores
    this.userConnections = new Map();
    this.activities = new Map();
    this.groups = new Map();
    this.groupMemberships = new Map();
    this.messages = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    
    // Initialize social networking ID counters
    this.userConnectionId = 1;
    this.activityId = 1;
    this.groupId = 1;
    this.groupMembershipId = 1;
    this.messageId = 1;
    this.achievementId = 1;
    this.userAchievementId = 1;
    
    // Use persistent ID counters
    this.userId = persistentStore.userId;
    this.categoryId = persistentStore.categoryId;
    this.postId = persistentStore.postId;
    this.commentId = persistentStore.commentId;
    this.findId = persistentStore.findId;
    this.findCommentId = persistentStore.findCommentId;
    this.locationId = persistentStore.locationId;
    this.eventId = persistentStore.eventId;
    this.storyId = persistentStore.storyId;
    
    // Only initialize data once
    if (!persistentStore.initialized) {
      console.log("Initializing default data for the first time...");
      // Use an immediately invoked async function to properly await initialization
      (async () => {
        await this.initializeDefaultData();
        persistentStore.initialized = true;
        // Save again after marking as initialized
        this.saveToFile();
      })();
    } else {
      console.log("Using existing data. Locations count:", this.locations.size, 
                 "Users count:", this.users.size,
                 "Categories count:", this.categories.size,
                 "Posts count:", this.posts.size);
      
      // Force update DigQuestor password to ensure correct hash
      (async () => {
        try {
          const digQuestorUser = await this.getUserByUsername("DigQuestor");
          if (digQuestorUser) {
            console.log("Force updating DigQuestor password hash...");
            const updates: any = {
              password: "$2b$10$1LGuacLus5jhZ1VpvmY7h.YhQlshdsL8YIfAfuLaCu7yw/7A1HeLy" // V1king75
            };
            
            if (!digQuestorUser.avatarUrl) {
              console.log("Updating DigQuestor user with default avatar URL");
              updates.avatarUrl = "https://api.dicebear.com/7.x/personas/svg?seed=DigQuestor";
              updates.bio = digQuestorUser.bio || "Community manager and avid metal detectorist! I love helping people discover the wellbeing benefits of this amazing hobby.";
            }
            
            await this.updateUser(digQuestorUser.id, updates);
            console.log("DigQuestor password updated successfully");
          }
          
          // Always recalculate category counts to ensure they're correct
          await this.recalculateAllCategoryCounts();
        } catch (error) {
          console.error("Error updating DigQuestor avatar:", error);
        }
      })();
    }
  }
  
  private async initializeDefaultData() {
    console.log("Initializing default data...");
    
    // Add default users
    const defaultUsers: InsertUser[] = [
      {
        username: "DigQuestor",
        email: "danishnest@gmail.com",
        password: "$2b$10$1LGuacLus5jhZ1VpvmY7h.YhQlshdsL8YIfAfuLaCu7yw/7A1HeLy", // Pre-hashed for V1king75
        avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=DigQuestor",
        bio: "Community manager and avid metal detectorist! I love helping people discover the wellbeing benefits of this amazing hobby."
      }
    ];
    
    // Create all default users
    for (const user of defaultUsers) {
      await this.createUser(user);
      console.log(`Created default user: ${user.username}`);
    }
    
    // Define default categories
    const defaultCategories: InsertCategory[] = [
      {
        name: "General Discussions",
        slug: "general-discussions",
        description: "General discussions about metal detecting and related topics",
        icon: "comments"
      },
      {
        name: "Beginner Tips",
        slug: "beginner-tips",
        description: "Tips and advice for new metal detectorists",
        icon: "book"
      },
      {
        name: "Equipment Reviews",
        slug: "equipment-reviews",
        description: "Reviews and discussions about metal detecting equipment",
        icon: "search-dollar"
      },
      {
        name: "Find Identification",
        slug: "find-identification",
        description: "Help with identifying your finds",
        icon: "coins"
      },
      {
        name: "Detecting Locations",
        slug: "detecting-locations",
        description: "Discussion about detecting locations and permissions",
        icon: "map-marker-alt"
      },
      {
        name: "Wellbeing & Mindfulness",
        slug: "wellbeing-mindfulness",
        description: "How metal detecting contributes to wellbeing",
        icon: "heart"
      }
    ];
    
    // Create the categories
    for (const category of defaultCategories) {
      await this.createCategory(category);
      console.log(`Created default category: ${category.name}`);
    }
    
    // Get user IDs for reference
    const digQuestor = await this.getUserByUsername("DigQuestor");
    
    if (!digQuestor) {
      console.error("Default user not found during initialization");
      return; // Exit if user isn't found
    }
    
    // Create welcome post
    const post1 = await this.createPost({
      title: "Welcome to Metal Detecting for Wellbeing!",
      content: "Hello fellow detectorists! Welcome to our community dedicated to the mental health benefits of metal detecting. Whether you're a seasoned hunter or just starting out, this is a place to share your finds, techniques, and how this wonderful hobby improves your wellbeing. Looking forward to seeing your discoveries and hearing your stories!",
      userId: digQuestor.id,
      categoryId: 1 // General Discussions
    });
    console.log("Created welcome post");
    
    // Manually update post stats
    if (post1 && this.posts.has(post1.id)) {
      const updatedPost = { ...this.posts.get(post1.id)!, views: 32, comments: 4 };
      this.posts.set(post1.id, updatedPost);
    }
    
    // Create Mind Sweepers Denmark group for DigQuestor
    const mindSweeperGroup = await this.createGroup({
      name: "Mind Sweepers Denmark",
      description: "A group for metal detecting enthusiasts in Denmark",
      location: "Denmark",
      isPrivate: false,
      creatorId: digQuestor.id
    });
    console.log("Created Mind Sweepers Denmark group for DigQuestor");
    
    // Save all default data to file
    this.saveToFile();
    console.log("Default data initialized and saved to file");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.emailVerificationToken === token
    );
  }

  async setEmailVerificationToken(userId: number, token: string, expires: Date): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.emailVerificationToken = token;
      user.emailVerificationExpires = expires;
      this.saveToFile();
    }
  }

  async verifyEmail(token: string): Promise<User | undefined> {
    const user = await this.getUserByVerificationToken(token);
    if (!user) {
      return undefined;
    }

    // Check if token has expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return undefined;
    }

    // Mark email as verified and clear token
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    
    this.saveToFile();
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    // Update the persistent store ID counter
    persistentStore.userId = this.userId;
    
    // Hash password before storing (only if not already hashed)
    const isAlreadyHashed = insertUser.password.startsWith('$2b$');
    console.log(`Creating user ${insertUser.username}, password starts with: ${insertUser.password.substring(0, 10)}..., isAlreadyHashed: ${isAlreadyHashed}`);
    const hashedPassword = isAlreadyHashed ? insertUser.password : await bcrypt.hash(insertUser.password, 10);
    console.log(`Final password hash for ${insertUser.username}: ${hashedPassword.substring(0, 20)}...`);
    
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      password: hashedPassword,
      id, 
      created_at: createdAt,
      avatarUrl: insertUser.avatarUrl ?? null,
      bio: insertUser.bio ?? null,
      isEmailVerified: false,
      emailVerificationToken: null,
      emailVerificationExpires: null
    };
    this.users.set(id, user);
    
    // Save to file to persist new users immediately
    this.saveToFile();
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    
    if (!user) {
      return undefined;
    }
    
    // Create updated user with new data
    const updatedUser: User = {
      ...user,
      ...userData,
      // Ensure nullable fields have proper values
      avatarUrl: userData.avatarUrl ?? user.avatarUrl,
      bio: userData.bio ?? user.bio,
      // Make sure id and created_at are not modified
      id: user.id,
      created_at: user.created_at
    };
    
    // Store the updated user
    this.users.set(id, updatedUser);
    
    // Save to file to persist the user changes, especially for profile pictures
    this.saveToFile();
    
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Check if user exists
    if (!this.users.has(id)) {
      return false;
    }
    
    // Delete all user content (finds, posts, comments, locations, etc.)
    
    // Delete finds and associated comments
    const userFinds = await this.getFindsByUser(id);
    for (const find of userFinds) {
      // Delete find comments
      const findComments = await this.getAllCommentsByFind(find.id);
      for (const comment of findComments) {
        this.findComments.delete(comment.id);
      }
      // Delete the find
      this.finds.delete(find.id);
    }
    
    // Delete posts and associated comments
    const userPosts = await this.getPostsByUser(id);
    for (const post of userPosts) {
      // Delete post comments
      const postComments = await this.getAllCommentsByPost(post.id);
      for (const comment of postComments) {
        this.comments.delete(comment.id);
      }
      // Delete the post
      this.posts.delete(post.id);
    }
    
    // Delete user's locations
    const allLocations = await this.getAllLocations();
    for (const location of allLocations) {
      if (location.userId === id) {
        this.locations.delete(location.id);
      }
    }
    
    // Delete user's events
    const allEvents = await this.getAllEvents();
    for (const event of allEvents) {
      if (event.userId === id) {
        this.events.delete(event.id);
      }
    }
    
    // Delete user's stories
    const allStories = await this.getAllStories();
    for (const story of allStories) {
      if (story.userId === id) {
        this.stories.delete(story.id);
      }
    }
    
    // Finally, delete the user
    this.users.delete(id);
    
    // Save to file to persist the deletion
    this.saveToFile();
    
    return true;
  }

  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    // Update the persistent store ID counter
    persistentStore.categoryId = this.categoryId;
    
    const category: Category = { 
      ...insertCategory, 
      id, 
      count: 0,
      description: insertCategory.description ?? null,
      icon: insertCategory.icon ?? null
    };
    this.categories.set(id, category);
    return category;
  }
  
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async incrementCategoryCount(id: number): Promise<void> {
    const category = await this.getCategory(id);
    if (category) {
      // Instead of incrementing directly, recalculate the count for just this category
      const postsInCategory = Array.from(this.posts.values()).filter(post => post.categoryId === id);
      const count = postsInCategory.length;
      
      // Set the exact count based on actual posts
      category.count = count;
      this.categories.set(id, category);
      
      // Update the persistent store directly for immediate persistence
      if (persistentStore && persistentStore.categories) {
        persistentStore.categories.set(id, category);
      }
      
      // Save to file IMMEDIATELY to persist the updated count
      this.saveToFile();
      
      console.log(`Updated count for category ${id}: ${category.name} to ${count} based on post count`);
    } else {
      console.warn(`Could not update count for category ${id} because it was not found`);
    }
  }
  
  // Method to recalculate all category counts based on actual posts
  async recalculateAllCategoryCounts(): Promise<void> {
    console.log("Recalculating all category counts...");
    
    try {
      // Get all posts
      const allPosts = Array.from(this.posts.values());
      
      // Count posts by category
      const categoryCounts = new Map<number, number>();
      
      // Initialize counts to zero for all categories
      for (const category of this.categories.values()) {
        categoryCounts.set(category.id, 0);
      }
      
      // Count posts for each category - ensure we only count posts for their specific category
      for (const post of allPosts) {
        if (post.categoryId) {
          // Only increment the count for the specific category this post belongs to
          const currentCount = categoryCounts.get(post.categoryId) || 0;
          categoryCounts.set(post.categoryId, currentCount + 1);
        }
      }
      
      // Update category counts in the database
      let countChanged = false;
      for (const [categoryId, count] of categoryCounts.entries()) {
        const category = await this.getCategory(categoryId);
        if (category) {
          if (category.count !== count) {
            countChanged = true;
            console.log(`Updating count for category ${categoryId} (${category.name}): ${category.count} → ${count}`);
            category.count = count;
            this.categories.set(categoryId, category);
          }
        }
      }
      
      // Only save to file if any counts changed
      if (countChanged) {
        this.saveToFile();
        console.log("Category counts recalculated and saved to file");
      } else {
        console.log("Category counts verified - no changes needed");
      }
    } catch (error) {
      console.error("Error recalculating category counts:", error);
    }
  }
  
  // Post methods
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }
  
  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.postId++;
    // Update the persistent store ID counter
    persistentStore.postId = this.postId;
    
    const createdAt = new Date();
    const post: Post = { 
      ...insertPost, 
      id, 
      views: 0, 
      comments: 0, 
      created_at: createdAt 
    };
    this.posts.set(id, post);
    
    // Note: Don't increment category count here
    // It's already handled in the API route to prevent double counting
    // This eliminates a race condition when incrementing twice
    
    // Save post immediately to ensure persistence
    this.saveToFile();
    
    return post;
  }
  
  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values())
      .sort((a, b) => {
        return (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0);
      });
  }
  
  async getPostsByCategory(categoryId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.categoryId === categoryId)
      .sort((a, b) => {
        return (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0);
      });
  }
  
  async getPostsByUser(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => {
        return (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0);
      });
  }
  
  async updatePostViewCount(id: number): Promise<void> {
    const post = await this.getPost(id);
    if (post) {
      post.views = (post.views || 0) + 1;
      this.posts.set(id, post);
    }
  }
  
  async updatePostCommentCount(id: number): Promise<void> {
    const post = await this.getPost(id);
    if (post) {
      post.comments = (post.comments || 0) + 1;
      this.posts.set(id, post);
    }
  }
  
  async deletePost(id: number): Promise<boolean> {
    const post = await this.getPost(id);
    if (!post) {
      return false;
    }
    
    try {
      // Delete all comments for this post first
      const comments = await this.getAllCommentsByPost(id);
      for (const comment of comments) {
        this.comments.delete(comment.id);
      }
      
      // Get the category to decrement its count
      const categoryId = post.categoryId;
      
      // Then delete the post itself
      this.posts.delete(id);
      
      // Decrement the category count
      if (categoryId) {
        const category = await this.getCategory(categoryId);
        if (category && typeof category.count === 'number' && category.count > 0) {
          category.count--;
          this.categories.set(categoryId, category);
          console.log(`Decremented count for category ${categoryId}: ${category.name} to ${category.count}`);
        }
      }
      
      // Save changes to the file
      this.saveToFile();
      
      console.log(`Post with ID ${id} and its comments deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting post with ID ${id}:`, error);
      return false;
    }
  }
  
  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentId++;
    // Update the persistent store ID counter
    persistentStore.commentId = this.commentId;
    
    const createdAt = new Date();
    const comment: Comment = { ...insertComment, id, created_at: createdAt };
    this.comments.set(id, comment);
    await this.updatePostCommentCount(insertComment.postId);
    return comment;
  }
  
  async getAllCommentsByPost(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => {
        return (a.created_at?.getTime() || 0) - (b.created_at?.getTime() || 0);
      });
  }
  
  // Find methods
  async getFind(id: number): Promise<Find | undefined> {
    return this.finds.get(id);
  }
  
  async createFind(insertFind: InsertFind): Promise<Find> {
    const id = this.findId++;
    // Update the persistent store ID counter
    persistentStore.findId = this.findId;
    
    const createdAt = new Date();
    const find: Find = { 
      ...insertFind, 
      id, 
      created_at: createdAt,
      commentCount: 0,
      period: insertFind.period ?? null,
      description: insertFind.description ?? null,
      location: insertFind.location ?? null
    };
    this.finds.set(id, find);
    
    // Save to file after modification
    this.saveToFile();
    console.log(`Created find with ID ${id} and saved to database file`);
    
    return find;
  }
  
  async updateFind(id: number, findData: Partial<InsertFind>): Promise<Find | undefined> {
    const find = await this.getFind(id);
    
    if (!find) {
      return undefined;
    }
    
    // Create updated find with new data
    const updatedFind: Find = {
      ...find,
      ...findData,
      // Ensure nullable fields have proper values
      period: findData.period ?? find.period,
      description: findData.description ?? find.description,
      location: findData.location ?? find.location,
      // Make sure id, commentCount and created_at are not modified
      id: find.id,
      commentCount: find.commentCount,
      created_at: find.created_at
    };
    
    // Store the updated find
    this.finds.set(id, updatedFind);
    
    // Save to file to persist the changes
    this.saveToFile();
    
    return updatedFind;
  }
  
  // Save current state to file
  private saveToFile(): void {
    const dataToSave: PersistentDataStore = {
      users: mapToObject(this.users),
      categories: mapToObject(this.categories),
      posts: mapToObject(this.posts),
      comments: mapToObject(this.comments),
      finds: mapToObject(this.finds),
      findComments: mapToObject(this.findComments),
      locations: mapToObject(this.locations),
      events: mapToObject(this.events),
      stories: mapToObject(this.stories),
      
      userId: this.userId,
      categoryId: this.categoryId,
      postId: this.postId,
      commentId: this.commentId,
      findId: this.findId,
      findCommentId: this.findCommentId,
      locationId: this.locationId,
      eventId: this.eventId,
      storyId: this.storyId,
      
      initialized: true
    };
    
    saveDataStore(dataToSave);
  }
  
  async getAllFinds(): Promise<Find[]> {
    return Array.from(this.finds.values())
      .sort((a, b) => {
        return (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0);
      });
  }
  
  async getFindsByUser(userId: number): Promise<Find[]> {
    return Array.from(this.finds.values())
      .filter(find => find.userId === userId)
      .sort((a, b) => {
        return (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0);
      });
  }
  
  async deleteFind(id: number): Promise<boolean> {
    // Check if find exists
    const exists = this.finds.has(id);
    
    if (!exists) {
      console.log(`Find ${id} not found for deletion`);
      return false;
    }
    
    console.log(`Deleting find ${id}. Map size before: ${this.finds.size}`);
    
    // Delete any associated comments
    const commentsToDelete = Array.from(this.findComments.values())
      .filter(comment => comment.findId === id);
      
    for (const comment of commentsToDelete) {
      this.findComments.delete(comment.id);
    }
    
    // Delete the find
    const result = this.finds.delete(id);
    
    console.log(`Find deleted: ${result}. Map size after: ${this.finds.size}`);
    
    // Save to file after deletion
    if (result) {
      this.saveToFile();
    }
    
    return result;
  }
  
  // Location methods
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }
  
  async deleteLocation(id: number): Promise<boolean> {
    // Check if location exists before deleting
    const exists = this.locations.has(id);
    
    if (!exists) {
      console.log(`Location ${id} not found for deletion`);
      return false;
    }
    
    console.log(`Deleting location ${id}. Map size before: ${this.locations.size}`);
    
    // Delete from the map
    const result = this.locations.delete(id);
    
    console.log(`Location deleted: ${result}. Map size after: ${this.locations.size}`);
    
    // Save to file after deletion
    if (result) {
      this.saveToFile();
    }
    
    return result;
  }
  
  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.locationId++;
    // Update the persistent store's ID counter
    persistentStore.locationId = this.locationId;
    
    const createdAt = new Date();
    const location: Location = { 
      ...insertLocation, 
      id, 
      created_at: createdAt,
      description: insertLocation.description ?? null,
      type: insertLocation.type ?? null,
      hasPermission: insertLocation.hasPermission ?? null,
      isGroupDig: insertLocation.isGroupDig ?? null,
      isShared: insertLocation.isShared ?? false
    };
    
    console.log(`Creating location with id ${id}. Map size before: ${this.locations.size}`);
    
    // Store the location in the map
    this.locations.set(id, location);
    
    // Double-check that it was stored correctly
    const storedLocation = this.locations.get(id);
    console.log(`After storing: Location ${id} exists in map?: ${!!storedLocation}`);
    console.log(`Map size after: ${this.locations.size}`);
    console.log(`Total locations: ${Array.from(this.locations.values()).length}`);
    
    // Save to file after adding location - CRITICAL for persistence
    this.saveToFile();
    console.log(`Created location with ID ${id} and saved to database file`);
    
    return location;
  }
  
  async getAllLocations(): Promise<Location[]> {
    const allLocations = Array.from(this.locations.values());
    console.log(`Getting all locations. Total in map: ${this.locations.size}, Total in array: ${allLocations.length}`);
    
    if (allLocations.length > 0) {
      console.log(`First few locations: ${JSON.stringify(allLocations.slice(0, 2).map(l => ({ id: l.id, name: l.name })))}`);
    }
    
    return allLocations.sort((a, b) => {
      return (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0);
    });
  }
  
  async getLocationsByType(type: string): Promise<Location[]> {
    return Array.from(this.locations.values())
      .filter(location => location.type === type)
      .sort((a, b) => {
        return (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0);
      });
  }
  
  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventId++;
    const createdAt = new Date();
    // Convert string eventDate to Date object for storage
    const eventDate = new Date(insertEvent.eventDate);
    const event: Event = { 
      ...insertEvent, 
      id, 
      created_at: createdAt,
      attendeeCount: 0,
      description: insertEvent.description ?? null,
      eventDate: eventDate
    };
    this.events.set(id, event);
    this.saveToFile();
    return event;
  }
  
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values())
      .sort((a, b) => {
        // Sort by upcoming events first
        return (a.eventDate?.getTime() || 0) - (b.eventDate?.getTime() || 0);
      });
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent: Event = {
      ...event,
      ...data,
      // Convert string eventDate to Date if provided
      eventDate: data.eventDate ? new Date(data.eventDate) : event.eventDate
    };
    
    this.events.set(id, updatedEvent);
    this.saveToFile();
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const deleted = this.events.delete(id);
    if (deleted) {
      this.saveToFile();
    }
    return deleted;
  }
  
  async incrementEventAttendeeCount(id: number): Promise<void> {
    const event = await this.getEvent(id);
    if (event) {
      event.attendeeCount = (event.attendeeCount || 0) + 1;
      this.events.set(id, event);
    }
  }
  
  // Story methods
  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }
  
  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.storyId++;
    const createdAt = new Date();
    const story: Story = { 
      ...insertStory, 
      id, 
      created_at: createdAt,
      yearsDetecting: insertStory.yearsDetecting ?? null
    };
    this.stories.set(id, story);
    return story;
  }
  
  async getAllStories(): Promise<Story[]> {
    return Array.from(this.stories.values())
      .sort((a, b) => {
        return (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0);
      });
  }
  
  // Find Comment methods
  async getFindComment(id: number): Promise<FindComment | undefined> {
    return this.findComments.get(id);
  }
  
  async createFindComment(insertFindComment: InsertFindComment): Promise<FindComment> {
    const id = this.findCommentId++;
    // Update the persistent store ID counter
    persistentStore.findCommentId = this.findCommentId;
    
    const createdAt = new Date();
    const findComment: FindComment = { ...insertFindComment, id, created_at: createdAt };
    this.findComments.set(id, findComment);
    await this.updateFindCommentCount(insertFindComment.findId);
    return findComment;
  }
  
  async getAllCommentsByFind(findId: number): Promise<FindComment[]> {
    return Array.from(this.findComments.values())
      .filter(comment => comment.findId === findId)
      .sort((a, b) => {
        return (a.created_at?.getTime() || 0) - (b.created_at?.getTime() || 0);
      });
  }
  
  async updateFindCommentCount(id: number): Promise<void> {
    const find = await this.getFind(id);
    if (find) {
      find.commentCount = (find.commentCount || 0) + 1;
      this.finds.set(id, find);
    }
  }

  // Social Networking Methods Implementation
  
  // User Connections
  async getUserConnections(userId: number): Promise<UserConnection[]> {
    return Array.from(this.userConnections.values())
      .filter(connection => connection.followerId === userId || connection.followingId === userId);
  }

  async followUser(followerId: number, followingId: number): Promise<UserConnection> {
    const id = this.userConnectionId++;
    const connection: UserConnection = {
      id,
      followerId,
      followingId,
      connectionType: 'follow',
      created_at: new Date()
    };
    this.userConnections.set(id, connection);
    return connection;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const connection = Array.from(this.userConnections.values())
      .find(c => c.followerId === followerId && c.followingId === followingId);
    
    if (connection) {
      this.userConnections.delete(connection.id);
      return true;
    }
    return false;
  }

  async getUserSocialStats(userId: number): Promise<{ followers: number; following: number; posts: number; finds: number }> {
    const followers = Array.from(this.userConnections.values())
      .filter(c => c.followingId === userId).length;
    
    const following = Array.from(this.userConnections.values())
      .filter(c => c.followerId === userId).length;
    
    const posts = Array.from(this.posts.values())
      .filter(p => p.userId === userId).length;
    
    const finds = Array.from(this.finds.values())
      .filter(f => f.userId === userId).length;

    return { followers, following, posts, finds };
  }

  // Activity Feed
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const newActivity: Activity = {
      ...activity,
      id,
      created_at: new Date()
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  async getUserActivityFeed(userId: number): Promise<Activity[]> {
    // Get activities from users that the current user follows
    const followingIds = Array.from(this.userConnections.values())
      .filter(c => c.followerId === userId)
      .map(c => c.followingId);
    
    return Array.from(this.activities.values())
      .filter(activity => followingIds.includes(activity.userId) || activity.userId === userId)
      .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0))
      .slice(0, 50); // Limit to 50 most recent activities
  }

  async getGlobalActivityFeed(): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.isPublic)
      .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0))
      .slice(0, 100); // Limit to 100 most recent public activities
  }

  // Groups
  async createGroup(group: InsertGroup): Promise<Group> {
    const id = this.groupId++;
    const newGroup: Group = {
      ...group,
      id,
      memberCount: 1,
      created_at: new Date()
    };
    this.groups.set(id, newGroup);
    
    // Auto-join the creator to the group
    await this.joinGroup(group.creatorId, id);
    
    return newGroup;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getAllGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }

  async getUserGroups(userId: number): Promise<Group[]> {
    const userGroupIds = Array.from(this.groupMemberships.values())
      .filter(membership => membership.userId === userId)
      .map(membership => membership.groupId);
    
    return Array.from(this.groups.values())
      .filter(group => userGroupIds.includes(group.id));
  }

  async getPublicGroups(): Promise<Group[]> {
    return Array.from(this.groups.values())
      .filter(group => group.isPublic)
      .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0));
  }

  async joinGroup(userId: number, groupId: number): Promise<boolean> {
    // Check if already a member
    const existingMembership = Array.from(this.groupMemberships.values())
      .find(m => m.userId === userId && m.groupId === groupId);
    
    if (existingMembership) {
      return false; // Already a member
    }

    const id = this.groupMembershipId++;
    const membership: GroupMembership = {
      id,
      userId,
      groupId,
      role: 'member',
      joined_at: new Date()
    };
    this.groupMemberships.set(id, membership);
    
    // Update group member count
    const group = this.groups.get(groupId);
    if (group) {
      group.memberCount = (group.memberCount || 0) + 1;
      this.groups.set(groupId, group);
    }
    
    return true;
  }

  // Messages
  async sendMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = {
      ...message,
      id,
      isRead: false,
      created_at: new Date()
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.receiverId === userId || message.senderId === userId)
      .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0));
  }

  async markMessageAsRead(messageId: number): Promise<boolean> {
    const message = this.messages.get(messageId);
    if (message) {
      message.isRead = true;
      this.messages.set(messageId, message);
      return true;
    }
    return false;
  }

  // User Search
  async searchUsers(query: string): Promise<User[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        (user.email && user.email.toLowerCase().includes(searchTerm))
      )
      .slice(0, 20); // Limit results
  }

  // Achievements
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId);
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementId++;
    const newAchievement: Achievement = {
      ...achievement,
      id,
      created_at: new Date()
    };
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }

  async awardAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    const id = this.userAchievementId++;
    const userAchievement: UserAchievement = {
      id,
      userId,
      achievementId,
      earned_at: new Date()
    };
    this.userAchievements.set(id, userAchievement);
    return userAchievement;
  }

  // Missing methods implementation
  async updateComment(id: number, data: Partial<InsertComment>): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (comment) {
      const updatedComment = { ...comment, ...data };
      this.comments.set(id, updatedComment);
      return updatedComment;
    }
    return undefined;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  async likePost(userId: number, postId: number): Promise<boolean> {
    // For simplicity, we'll track likes as a count on the post
    const post = this.posts.get(postId);
    if (post) {
      post.likes = (post.likes || 0) + 1;
      this.posts.set(postId, post);
      return true;
    }
    return false;
  }

  async unlikePost(userId: number, postId: number): Promise<boolean> {
    const post = this.posts.get(postId);
    if (post && (post.likes || 0) > 0) {
      post.likes = (post.likes || 0) - 1;
      this.posts.set(postId, post);
      return true;
    }
    return false;
  }

  async isPostLikedByUser(userId: number, postId: number): Promise<boolean> {
    // This would require a separate likes tracking table in a real implementation
    return false;
  }

  async getPostLikeCount(postId: number): Promise<number> {
    const post = this.posts.get(postId);
    return post?.likes || 0;
  }

  async likeFind(userId: number, findId: number): Promise<boolean> {
    const find = this.finds.get(findId);
    if (find) {
      find.likes = (find.likes || 0) + 1;
      this.finds.set(findId, find);
      return true;
    }
    return false;
  }

  async unlikeFind(userId: number, findId: number): Promise<boolean> {
    const find = this.finds.get(findId);
    if (find && (find.likes || 0) > 0) {
      find.likes = (find.likes || 0) - 1;
      this.finds.set(findId, find);
      return true;
    }
    return false;
  }

  async isFindLikedByUser(userId: number, findId: number): Promise<boolean> {
    return false;
  }

  async getFindLikeCount(findId: number): Promise<number> {
    const find = this.finds.get(findId);
    return find?.likes || 0;
  }

  async updateFindComment(id: number, data: Partial<InsertFindComment>): Promise<FindComment | undefined> {
    const comment = this.findComments.get(id);
    if (comment) {
      const updatedComment = { ...comment, ...data };
      this.findComments.set(id, updatedComment);
      return updatedComment;
    }
    return undefined;
  }

  async deleteFindComment(id: number): Promise<boolean> {
    return this.findComments.delete(id);
  }

  async getPublicRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values())
      .filter(route => route.isPublic);
  }

  async getRecommendedRoutes(userId: number): Promise<Route[]> {
    // Simple recommendation: return public routes from followed users
    const followingIds = Array.from(this.userConnections.values())
      .filter(c => c.followerId === userId)
      .map(c => c.followingId);
    
    return Array.from(this.routes.values())
      .filter(route => route.isPublic && followingIds.includes(route.userId))
      .slice(0, 10);
  }

  // Add missing route data structure
  private routes: Map<number, Route> = new Map();
  private routeId: number = 1;

  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const id = this.routeId++;
    const newRoute: Route = {
      ...route,
      id,
      created_at: new Date()
    };
    this.routes.set(id, newRoute);
    return newRoute;
  }

  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getRoutesByUser(userId: number): Promise<Route[]> {
    return Array.from(this.routes.values())
      .filter(route => route.userId === userId);
  }

  async deleteRoute(id: number): Promise<boolean> {
    return this.routes.delete(id);
  }

  // Add missing user preferences methods
  private userPreferences: Map<number, UserPreferences> = new Map();
  private userPreferencesId: number = 1;

  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values())
      .find(prefs => prefs.userId === userId);
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.userPreferencesId++;
    const newPrefs: UserPreferences = {
      ...preferences,
      id,
      created_at: new Date()
    };
    this.userPreferences.set(id, newPrefs);
    return newPrefs;
  }

  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const existing = await this.getUserPreferences(userId);
    if (existing) {
      const updated = { ...existing, ...preferences };
      this.userPreferences.set(existing.id, updated);
      return updated;
    }
    return undefined;
  }

  // Add missing image storage methods
  private imageStorage: Map<string, ImageStorage> = new Map();

  async storeImage(imageData: InsertImageStorage): Promise<ImageStorage> {
    const image: ImageStorage = {
      ...imageData,
      uploadDate: new Date()
    };
    this.imageStorage.set(imageData.filename, image);
    return image;
  }

  async getImage(filename: string): Promise<ImageStorage | undefined> {
    return this.imageStorage.get(filename);
  }

  async deleteImage(filename: string): Promise<boolean> {
    return this.imageStorage.delete(filename);
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async setEmailVerificationToken(userId: number, token: string, expires: Date): Promise<void> {
    await db.update(users)
      .set({ 
        emailVerificationToken: token, 
        emailVerificationExpires: expires 
      })
      .where(eq(users.id, userId));
  }

  async verifyEmail(token: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ 
        isEmailVerified: true, 
        emailVerificationToken: null, 
        emailVerificationExpires: null 
      })
      .where(eq(users.emailVerificationToken, token))
      .returning();
    return user;
  }

  async verifyEmailManual(userId: number): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ 
        isEmailVerified: true, 
        emailVerificationToken: null, 
        emailVerificationExpires: null 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Categories
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async updateCategoryCount(id: number, count: number): Promise<void> {
    await db.update(categories).set({ count }).where(eq(categories.id, id));
  }

  // Posts
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async getPostsByCategory(categoryId: number): Promise<Post[]> {
    return db.select().from(posts).where(eq(posts.categoryId, categoryId)).orderBy(desc(posts.created_at));
  }

  async getAllPosts(): Promise<Post[]> {
    return db.select().from(posts).orderBy(desc(posts.created_at));
  }

  async deletePost(id: number): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return result.rowCount > 0;
  }

  async updatePostViewCount(id: number): Promise<void> {
    await db.update(posts)
      .set({ views: sql`views + 1` })
      .where(eq(posts.id, id));
  }

  async getPostsByUser(userId: number): Promise<Post[]> {
    return db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.created_at));
  }

  async updatePostCommentCount(id: number): Promise<void> {
    await db.update(posts)
      .set({ comments: sql`comments + 1` })
      .where(eq(posts.id, id));
  }

  async incrementCategoryCount(id: number): Promise<void> {
    await db.update(categories)
      .set({ count: sql`count + 1` })
      .where(eq(categories.id, id));
  }

  async recalculateAllCategoryCounts(): Promise<void> {
    console.log("Recalculating all category counts...");
    
    try {
      // Get all categories
      const allCategories = await db.select().from(categories);
      
      // For each category, count the actual posts
      for (const category of allCategories) {
        const [result] = await db
          .select({ count: sql<number>`count(*)` })
          .from(posts)
          .where(eq(posts.categoryId, category.id));
        
        const actualCount = result.count;
        
        // Update the category count if it's different
        if (category.count !== actualCount) {
          console.log(`Updating count for category ${category.id} (${category.name}): ${category.count} → ${actualCount}`);
          await db.update(categories)
            .set({ count: actualCount })
            .where(eq(categories.id, category.id));
        }
      }
      
      console.log("Category counts recalculated successfully");
    } catch (error) {
      console.error("Error recalculating category counts:", error);
    }
  }

  // Comments
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getCommentsByPost(postId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.postId, postId)).orderBy(comments.created_at);
  }

  async getAllCommentsByPost(postId: number): Promise<Comment[]> {
    return this.getCommentsByPost(postId);
  }

  async updateComment(id: number, data: Partial<InsertComment>): Promise<Comment | undefined> {
    const [updatedComment] = await db.update(comments).set(data).where(eq(comments.id, id)).returning();
    return updatedComment;
  }

  async updatePost(id: number, data: Partial<InsertPost>): Promise<Post | undefined> {
    const [updatedPost] = await db.update(posts).set(data).where(eq(posts.id, id)).returning();
    return updatedPost;
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Post likes
  async likePost(userId: number, postId: number): Promise<boolean> {
    try {
      // Check if already liked
      const existingLike = await db.select().from(postLikes).where(
        and(eq(postLikes.userId, userId), eq(postLikes.postId, postId))
      ).limit(1);
      
      if (existingLike.length > 0) {
        return false; // Already liked
      }

      // Add like
      await db.insert(postLikes).values({ userId, postId });
      
      // Update post like count
      await db.update(posts).set({ likes: sql`likes + 1` }).where(eq(posts.id, postId));
      
      return true;
    } catch (error) {
      console.error("Error liking post:", error);
      return false;
    }
  }

  async unlikePost(userId: number, postId: number): Promise<boolean> {
    try {
      const result = await db.delete(postLikes).where(
        and(eq(postLikes.userId, userId), eq(postLikes.postId, postId))
      );
      
      if ((result.rowCount || 0) > 0) {
        // Update post like count
        await db.update(posts).set({ likes: sql`GREATEST(likes - 1, 0)` }).where(eq(posts.id, postId));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error unliking post:", error);
      return false;
    }
  }

  async isPostLikedByUser(userId: number, postId: number): Promise<boolean> {
    const result = await db.select().from(postLikes).where(
      and(eq(postLikes.userId, userId), eq(postLikes.postId, postId))
    ).limit(1);
    
    return result.length > 0;
  }

  async getPostLikeCount(postId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(postLikes).where(eq(postLikes.postId, postId));
    return result[0]?.count || 0;
  }

  // Finds
  async getFind(id: number): Promise<Find | undefined> {
    const [find] = await db.select().from(finds).where(eq(finds.id, id));
    return find;
  }

  async createFind(find: InsertFind): Promise<Find> {
    const [newFind] = await db.insert(finds).values(find).returning();
    return newFind;
  }

  async getAllFinds(): Promise<Find[]> {
    return db.select().from(finds).orderBy(desc(finds.created_at));
  }

  async updateFind(id: number, updateData: Partial<InsertFind>): Promise<Find | undefined> {
    const [updatedFind] = await db.update(finds).set(updateData).where(eq(finds.id, id)).returning();
    return updatedFind || undefined;
  }

  async deleteFind(id: number): Promise<boolean> {
    const result = await db.delete(finds).where(eq(finds.id, id));
    return result.rowCount > 0;
  }

  // Find Comments
  async createFindComment(comment: InsertFindComment): Promise<FindComment> {
    const [newComment] = await db.insert(findComments).values(comment).returning();
    
    // Update the find's comment count
    await db.update(finds).set({ commentCount: sql`comment_count + 1` }).where(eq(finds.id, comment.findId));
    
    return newComment;
  }

  async getFindCommentsByFind(findId: number): Promise<FindComment[]> {
    return db.select().from(findComments).where(eq(findComments.findId, findId));
  }

  async updateFindComment(id: number, data: Partial<InsertFindComment>): Promise<FindComment | undefined> {
    const [updatedComment] = await db.update(findComments).set(data).where(eq(findComments.id, id)).returning();
    return updatedComment || undefined;
  }

  async deleteFindComment(id: number): Promise<boolean> {
    const result = await db.delete(findComments).where(eq(findComments.id, id));
    return result.rowCount > 0;
  }

  async getAllCommentsByFind(findId: number): Promise<FindComment[]> {
    return this.getFindCommentsByFind(findId);
  }

  async getFindComment(id: number): Promise<FindComment | undefined> {
    const [comment] = await db.select().from(findComments).where(eq(findComments.id, id));
    return comment;
  }

  async updateFindCommentCount(id: number): Promise<void> {
    await db.update(finds)
      .set({ commentCount: sql`comment_count + 1` })
      .where(eq(finds.id, id));
  }

  async getFindsByUser(userId: number): Promise<Find[]> {
    return db.select().from(finds).where(eq(finds.userId, userId)).orderBy(desc(finds.created_at));
  }

  async getLocationsByType(type: string): Promise<Location[]> {
    return db.select().from(locations).where(eq(locations.name, type));
  }

  async incrementEventAttendeeCount(id: number): Promise<void> {
    await db.update(events)
      .set({ attendeeCount: sql`attendee_count + 1` })
      .where(eq(events.id, id));
  }

  // Locations
  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  async getAllLocations(): Promise<Location[]> {
    return db.select().from(locations);
  }

  async deleteLocation(id: number): Promise<boolean> {
    const result = await db.delete(locations).where(eq(locations.id, id));
    return result.rowCount > 0;
  }

  // Events
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    // Convert string eventDate to Date object for database
    const eventData = {
      ...event,
      eventDate: new Date(event.eventDate)
    };
    const [newEvent] = await db.insert(events).values(eventData).returning();
    return newEvent;
  }

  async getAllEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(events.eventDate);
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
    // Convert string eventDate to Date object for database if provided
    const updateData = data.eventDate ? {
      ...data,
      eventDate: new Date(data.eventDate)
    } : data;
    
    const [updatedEvent] = await db.update(events).set(updateData).where(eq(events.id, id)).returning();
    return updatedEvent || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount > 0;
  }

  // Stories
  async getStory(id: number): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story;
  }

  async createStory(story: InsertStory): Promise<Story> {
    const [newStory] = await db.insert(stories).values(story).returning();
    return newStory;
  }

  async getAllStories(): Promise<Story[]> {
    return db.select().from(stories).orderBy(desc(stories.created_at));
  }

  async deleteStory(id: number): Promise<boolean> {
    const result = await db.delete(stories).where(eq(stories.id, id));
    return result.rowCount > 0;
  }

  // Routes
  async getRoute(id: number): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route;
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const [newRoute] = await db.insert(routes).values(route).returning();
    return newRoute;
  }

  async getAllRoutes(): Promise<Route[]> {
    return db.select().from(routes);
  }

  async getRoutesByUser(userId: number): Promise<Route[]> {
    return db.select().from(routes).where(eq(routes.userId, userId));
  }

  async deleteRoute(id: number): Promise<boolean> {
    const result = await db.delete(routes).where(eq(routes.id, id));
    return result.rowCount > 0;
  }

  // User Preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const [newPrefs] = await db.insert(userPreferences).values(prefs).returning();
    return newPrefs;
  }

  async updateUserPreferences(userId: number, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const [updatedPrefs] = await db.update(userPreferences)
      .set(prefs)
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updatedPrefs;
  }

  async deleteUserPreferences(userId: number): Promise<boolean> {
    const result = await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
    return result.rowCount > 0;
  }

  // Find likes methods
  async likeFind(userId: number, findId: number): Promise<boolean> {
    try {
      // Check if already liked
      const existingLike = await db
        .select()
        .from(findLikes)
        .where(and(eq(findLikes.userId, userId), eq(findLikes.findId, findId)));
      
      if (existingLike.length > 0) {
        return false; // Already liked
      }
      
      // Insert new like
      await db.insert(findLikes).values({ userId, findId });
      
      // Update find like count
      await db
        .update(finds)
        .set({ likes: sql`${finds.likes} + 1` })
        .where(eq(finds.id, findId));
      
      return true;
    } catch (error) {
      console.error("Error liking find:", error);
      return false;
    }
  }

  async unlikeFind(userId: number, findId: number): Promise<boolean> {
    try {
      // Remove like
      const result = await db
        .delete(findLikes)
        .where(and(eq(findLikes.userId, userId), eq(findLikes.findId, findId)));
      
      if ((result.rowCount || 0) > 0) {
        // Update find like count
        await db
          .update(finds)
          .set({ likes: sql`GREATEST(${finds.likes} - 1, 0)` })
          .where(eq(finds.id, findId));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error unliking find:", error);
      return false;
    }
  }

  async isFindLikedByUser(userId: number, findId: number): Promise<boolean> {
    try {
      const likes = await db
        .select()
        .from(findLikes)
        .where(and(eq(findLikes.userId, userId), eq(findLikes.findId, findId)));
      
      return likes.length > 0;
    } catch (error) {
      console.error("Error checking find like status:", error);
      return false;
    }
  }

  async getFindLikeCount(findId: number): Promise<number> {
    try {
      const [find] = await db
        .select({ likes: finds.likes })
        .from(finds)
        .where(eq(finds.id, findId));
      
      return find?.likes || 0;
    } catch (error) {
      console.error("Error getting find like count:", error);
      return 0;
    }
  }

  // Social Networking Features - Database Implementation
  
  // User Connections
  async getUserConnections(userId: number): Promise<UserConnection[]> {
    return await db.select().from(userConnections)
      .where(and(
        sql`(follower_id = ${userId} OR following_id = ${userId})`,
        eq(userConnections.status, 'active')
      ));
  }

  async followUser(followerId: number, followingId: number): Promise<UserConnection> {
    // Check if connection already exists
    const existing = await db.select().from(userConnections)
      .where(and(
        eq(userConnections.followerId, followerId),
        eq(userConnections.followingId, followingId)
      )).limit(1);
    
    if (existing.length > 0) {
      // Update status to active if it exists
      const [updated] = await db.update(userConnections)
        .set({ status: 'active' })
        .where(eq(userConnections.id, existing[0].id))
        .returning();
      return updated;
    }
    
    // Create new connection
    const [newConnection] = await db.insert(userConnections).values({
      followerId,
      followingId,
      status: 'active',
      connectionType: 'follow'
    }).returning();
    
    return newConnection;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const result = await db.update(userConnections)
      .set({ status: 'inactive' })
      .where(and(
        eq(userConnections.followerId, followerId),
        eq(userConnections.followingId, followingId)
      ));
    
    return (result.rowCount || 0) > 0;
  }

  async getUserSocialStats(userId: number): Promise<{ followers: number; following: number; posts: number; finds: number }> {
    const [followersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userConnections)
      .where(and(
        eq(userConnections.followingId, userId),
        eq(userConnections.status, 'active')
      ));

    const [followingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userConnections)
      .where(and(
        eq(userConnections.followerId, userId),
        eq(userConnections.status, 'active')
      ));

    const [postsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.userId, userId));

    const [findsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(finds)
      .where(eq(finds.userId, userId));

    return {
      followers: followersResult.count,
      following: followingResult.count,
      posts: postsResult.count,
      finds: findsResult.count
    };
  }

  // Activity Feed
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async getUserActivityFeed(userId: number): Promise<Activity[]> {
    // Get activities from users the current user follows
    const followingIds = await db
      .select({ followingId: userConnections.followingId })
      .from(userConnections)
      .where(and(
        eq(userConnections.followerId, userId),
        eq(userConnections.status, 'active')
      ));

    const userIds = [userId, ...followingIds.map(f => f.followingId)];
    
    return await db.select().from(activities)
      .where(sql`user_id = ANY(${userIds})`)
      .orderBy(desc(activities.created_at))
      .limit(50);
  }

  async getGlobalActivityFeed(): Promise<Activity[]> {
    return await db.select().from(activities)
      .orderBy(desc(activities.created_at))
      .limit(50);
  }

  // Groups - Using database storage
  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values({
      ...group,
      memberCount: 1
    }).returning();
    
    // Add creator as admin member
    await db.insert(groupMemberships).values({
      userId: group.creatorId,
      groupId: newGroup.id,
      role: 'admin',
      status: 'active'
    });
    
    return newGroup;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getAllGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }

  async getUserGroups(userId: number): Promise<Group[]> {
    const userGroups = await db
      .select()
      .from(groups)
      .innerJoin(groupMemberships, eq(groups.id, groupMemberships.groupId))
      .where(and(
        eq(groupMemberships.userId, userId),
        eq(groupMemberships.status, 'active')
      ));
    
    // Extract just the groups data from the joined result
    return userGroups.map(result => result.groups);
  }

  async getPublicGroups(): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.isPrivate, false));
  }

  async joinGroup(userId: number, groupId: number): Promise<boolean> {
    try {
      // Check if already a member
      const existingMembership = await db.select().from(groupMemberships)
        .where(and(
          eq(groupMemberships.userId, userId),
          eq(groupMemberships.groupId, groupId)
        )).limit(1);
      
      if (existingMembership.length > 0) {
        return false; // Already a member
      }

      // Add membership
      await db.insert(groupMemberships).values({
        userId,
        groupId,
        role: 'member',
        status: 'active'
      });
      
      // Update group member count
      await db.update(groups)
        .set({ memberCount: sql`member_count + 1` })
        .where(eq(groups.id, groupId));
      
      return true;
    } catch (error) {
      console.error("Error joining group:", error);
      return false;
    }
  }

  // Messages
  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values({
      ...message,
      isRead: false
    }).returning();
    return newMessage;
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(sql`receiver_id = ${userId} OR sender_id = ${userId}`)
      .orderBy(desc(messages.created_at));
  }

  async markMessageAsRead(messageId: number): Promise<boolean> {
    const result = await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
    return (result.rowCount || 0) > 0;
  }

  // User Search
  async searchUsers(query: string): Promise<User[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(users)
      .where(sql`LOWER(username) LIKE ${searchTerm} OR LOWER(email) LIKE ${searchTerm}`)
      .limit(20);
  }

  // Achievements
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async awardAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    const [userAchievement] = await db.insert(userAchievements).values({
      userId,
      achievementId
    }).returning();
    return userAchievement;
  }

  // Image Storage
  async storeImage(imageData: InsertImageStorage): Promise<ImageStorage> {
    const [newImage] = await db.insert(imageStorage).values({
      ...imageData,
      uploadDate: new Date()
    }).returning();
    return newImage;
  }

  async getImage(filename: string): Promise<ImageStorage | undefined> {
    const [image] = await db.select().from(imageStorage).where(eq(imageStorage.filename, filename));
    return image;
  }

  async deleteImage(filename: string): Promise<boolean> {
    const result = await db.delete(imageStorage).where(eq(imageStorage.filename, filename));
    return (result.rowCount || 0) > 0;
  }
}

// Use memory storage by default - more reliable for both development and production
let storageInstance: IStorage;

// Use DatabaseStorage in production when DATABASE_URL is available
if (process.env.DATABASE_URL) {
  console.log("Using DatabaseStorage with PostgreSQL for persistent data storage");
  storageInstance = new DatabaseStorage();
} else {
  console.log("Using MemStorage with file-based persistence (./data/db.json)");
  storageInstance = new MemStorage();
}

export const storage = storageInstance;