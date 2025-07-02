import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import fs from "fs";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { db } from "./db";
import "./types"; // Import session type definitions

// Initialize Stripe with your secret key (only if key is provided)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16", // Use the appropriate API version
  });
}
import express from "express";
import { 
  insertUserSchema, 
  insertPostSchema, 
  insertCommentSchema, 
  insertFindSchema, 
  insertFindCommentSchema,
  insertLocationSchema, 
  insertEventSchema, 
  insertStorySchema 
} from "@shared/schema";
import multer from "multer";
import path from "path";
import { generateSitemap } from "./sitemap";
import { sendEmail, generateVerificationToken, createVerificationEmail } from "./emailService";
import { uploadToS3 } from "./s3Service";

// Configure multer for memory storage (files will be uploaded to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Keep local uploads directory for backward compatibility with existing images
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created uploads directory:", uploadDir);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Render
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Authentication endpoints
  app.get("/api/auth/user", async (req, res) => {
    try {
      console.log("Auth check - Session ID:", req.sessionID);
      console.log("Auth check - Session userId:", req.session?.userId);
      console.log("Auth check - Session data:", JSON.stringify(req.session));
      
      // Check if user is authenticated via session
      if (!req.session?.userId) {
        console.log("Auth failed - No userId in session");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.log("Auth failed - User not found for ID:", req.session.userId);
        return res.status(401).json({ message: "User not found" });
      }
      
      console.log("Auth success - User found:", user.username);
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching authenticated user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));
  
  // Image upload endpoint for forum posts
  app.post("/api/upload-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Upload to S3
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'forum-images'
      );

      res.json({ imageUrl: uploadResult.url });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });
  
  //---------- Social Networking Routes ----------//
  
  // Get user's social stats
  app.get("/api/social/stats/:userId?", async (req, res) => {
    try {
      // Check if user is authenticated via session
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const userId = req.params.userId ? parseInt(req.params.userId) : user.id;
      
      // Use the storage method to get real stats for any user
      const stats = await storage.getUserSocialStats(userId);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching social stats:", error);
      res.status(500).json({ message: "Failed to fetch social stats" });
    }
  });

  // Get user's activity feed
  app.get("/api/social/feed/:userId?", async (req, res) => {
    try {
      // Check if user is authenticated via session
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const userId = req.params.userId ? parseInt(req.params.userId) : user.id;
      
      // Mock activity feed data
      const activities = [
        {
          id: 1,
          userId: 2,
          activityType: "find",
          entityType: "find",
          entityId: 29,
          content: "BigBird shared a new find: Patterened Spindle Whorl",
          isPublic: true,
          created_at: new Date('2024-12-15T10:30:00Z')
        },
        {
          id: 2,
          userId: 25,
          activityType: "join",
          entityType: "group",
          entityId: 1,
          content: "DirtySapper joined the Metal Detecting Enthusiasts group",
          isPublic: true,
          created_at: new Date('2024-12-14T15:45:00Z')
        }
      ];
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      res.status(500).json({ message: "Failed to fetch activity feed" });
    }
  });

  // Get user's connections
  app.get("/api/social/connections/:userId?", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.params.userId ? parseInt(req.params.userId) : req.session.userId;
      const connections = await storage.getUserConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  // Follow/unfollow a user
  app.post("/api/social/follow", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { targetUserId, action } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ message: "Invalid target user" });
      }

      const followerId = req.session.userId;
      let result = false;

      if (action === 'follow') {
        const connection = await storage.followUser(followerId, targetUserId);
        result = !!connection;
      } else if (action === 'unfollow') {
        result = await storage.unfollowUser(followerId, targetUserId);
      }

      res.json({ success: result });
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      res.status(500).json({ message: "Failed to update connection" });
    }
  });

  // Get all groups
  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  // Get user's groups
  app.get("/api/social/groups/:userId?", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.params.userId ? parseInt(req.params.userId) : req.session.userId;
      const groups = await storage.getUserGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  // Get all public groups for browsing
  app.get("/api/social/public-groups", async (req, res) => {
    try {
      const groups = await storage.getPublicGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching public groups:", error);
      res.status(500).json({ message: "Failed to fetch public groups" });
    }
  });

  // Create a new group
  app.post("/api/groups", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const groupData = {
        ...req.body,
        creatorId: req.session.userId
      };

      const group = await storage.createGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  // Get specific group
  app.get("/api/groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await storage.getGroup(id);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  // Join a group
  app.post("/api/groups/:id/join", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const groupId = parseInt(req.params.id);
      const membership = await storage.joinGroup(user.id, groupId);
      res.status(201).json(membership);
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  // Leave a group
  app.post("/api/groups/:id/leave", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const groupId = parseInt(req.params.id);
      const success = await storage.leaveGroup(user.id, groupId);
      
      if (success) {
        res.json({ message: "Left group successfully" });
      } else {
        res.status(404).json({ message: "Group membership not found" });
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(500).json({ message: "Failed to leave group" });
    }
  });

  // Get group members
  app.get("/api/groups/:id/members", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const members = await storage.getGroupMembers(groupId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ message: "Failed to fetch group members" });
    }
  });

  // Update group
  app.put("/api/groups/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const groupId = parseInt(req.params.id);
      const group = await storage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Only creator can update group
      if (group.creatorId !== user.id) {
        return res.status(403).json({ message: "Only group creator can update group" });
      }

      const updatedGroup = await storage.updateGroup(groupId, req.body);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  // Delete group
  app.delete("/api/groups/:id", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const groupId = parseInt(req.params.id);
      const group = await storage.getGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Only creator can delete group
      if (group.creatorId !== user.id) {
        return res.status(403).json({ message: "Only group creator can delete group" });
      }

      const success = await storage.deleteGroup(groupId);
      
      if (success) {
        res.json({ message: "Group deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete group" });
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // Get public groups
  app.get("/api/social/groups/public", async (req, res) => {
    try {
      const groups = await storage.getPublicGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching public groups:", error);
      res.status(500).json({ message: "Failed to fetch public groups" });
    }
  });

  // Create a new group
  app.post("/api/social/groups", async (req, res) => {
    try {
      // Check if user is authenticated via session
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const userId = user.id;

      const groupData = { ...req.body, creatorId: userId };
      const group = await storage.createGroup(groupData);
      
      await storage.createActivity({
        userId,
        activityType: "create",
        entityType: "group",
        entityId: group.id,
        content: `Created group "${group.name}"`,
        isPublic: true,
      });

      res.json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  // Join a group
  app.post("/api/social/groups/:groupId/join", async (req, res) => {
    try {
      const user = await storage.getUser(1); // DigQuestor is user ID 1
      if (!user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const userId = user.id;
      const groupId = parseInt(req.params.groupId);

      const success = await storage.joinGroup(userId, groupId);
      res.json({ success });
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  // Get user's messages
  app.get("/api/social/messages/:userId?", async (req, res) => {
    try {
      // Check if user is authenticated via session
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const userId = req.params.userId ? parseInt(req.params.userId) : user.id;
      
      // Mock messages data
      const messages = [
        {
          id: 1,
          senderId: 2,
          receiverId: userId,
          content: "Hey! Found an amazing Roman coin at the beach today. Want to see pics?",
          isRead: false,
          created_at: new Date('2024-12-17T14:30:00Z'),
          sender: {
            id: 2,
            username: "BigBird",
            avatarUrl: null
          }
        },
        {
          id: 2,
          senderId: 3,
          receiverId: userId,
          content: "Thanks for the tip about the park location! Found some great finds there.",
          isRead: true,
          created_at: new Date('2024-12-16T10:15:00Z'),
          sender: {
            id: 3,
            username: "TreasureHunter23",
            avatarUrl: null
          }
        }
      ];
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post("/api/social/messages", async (req, res) => {
    try {
      // Check if user is authenticated via session
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const messageData = { ...req.body, senderId: user.id };
      const message = await storage.sendMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Mark message as read
  app.patch("/api/social/messages/:messageId/read", async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const success = await storage.markMessageAsRead(messageId);
      res.json({ success });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Get user achievements
  app.get("/api/social/achievements/:userId?", async (req, res) => {
    try {
      // Check if user is authenticated via session
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const userId = req.params.userId ? parseInt(req.params.userId) : user.id;

      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Search users
  app.get("/api/social/search/users", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }

      const users = await storage.searchUsers(q);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  //---------- Authentication Routes ----------//
  
  // Get current authenticated user (duplicate removed - using the main one at the top)

  //---------- Users Routes ----------//
  
  // Register user

  
  // Login user
  app.post("/api/users/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      console.log("Login attempt for username:", username);
      console.log("User found:", !!user);
      
      if (!user) {
        console.log("User not found for username:", username);
        // Provide helpful message for accounts that may have been removed
        return res.status(401).json({ 
          message: "Account not found. If you previously had an account, it may have been removed during cleanup. Please register a new account to continue using DigQuest.",
          accountNotFound: true
        });
      }
      
      console.log("Retrieved user ID:", user.id);
      console.log("Stored password hash:", user.password);
      console.log("Provided password:", password);
      
      // Check password using bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("Password validation result:", isValidPassword);
      
      if (!isValidPassword) {
        console.log("Password validation failed for user:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if email is verified (skip for DigQuestor admin account)
      if (user.username !== "DigQuestor" && !user.isEmailVerified) {
        return res.status(403).json({ 
          message: "Please verify your email address before logging in. Check your inbox for the verification email.",
          emailVerificationRequired: true
        });
      }
      
      // Establish session
      req.session.userId = user.id;
      req.session.username = user.username;
      
      console.log("Login - Setting session data:", {
        sessionId: req.sessionID,
        userId: user.id,
        username: user.username
      });
      
      // Save session explicitly and wait for completion
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log("Session saved successfully for user:", user.username);
            resolve();
          }
        });
      });
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      
      console.log("Login successful - sending user data for:", user.username);
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Login page redirect
  app.get("/api/login", async (req, res) => {
    res.redirect('/');
  });

  // Logout user
  app.post("/api/users/logout", async (req, res) => {
    try {
      // Clear session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Error logging out" });
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.status(200).json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Error logging out" });
    }
  });

  // Admin password update endpoint (for fixing DigQuestor password)
  app.post("/api/admin/update-password", async (req, res) => {
    try {
      const { username, newPassword, adminKey } = req.body;
      
      // Simple admin verification - in production this would be more secure
      if (adminKey !== "admin123" || username !== "DigQuestor") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update the user with new password
      const updatedUser = await storage.updateUser(user.id, {
        password: hashedPassword
      });
      
      if (updatedUser) {
        console.log(`Password updated for user: ${username}`);
        res.json({ message: "Password updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to update password" });
      }
      
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Error updating password" });
    }
  });

  // Password reset endpoint
  app.post("/api/users/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.status(200).json({ 
          message: "If an account with that email exists, you'll receive password reset instructions." 
        });
      }
      
      // Generate password reset token and expiry
      const token = generateVerificationToken();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      // Update user with reset token
      await storage.updateUser(user.id, {
        emailVerificationToken: token,
        emailVerificationExpires: expires
      });
      
      // Create password reset email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      
      const emailData = {
        to: user.email,
        from: 'noreply@digquest.org',
        subject: 'Reset Your DigQuest Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B4513;">Reset Your Password</h2>
            <p>Hello ${user.username},</p>
            <p>You requested to reset your password for your DigQuest account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #FFD700; color: #2F4F2F; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Happy detecting!<br>The DigQuest Team</p>
          </div>
        `,
        text: `
          Reset Your Password
          
          Hello ${user.username},
          
          You requested to reset your password for your DigQuest account. Copy and paste this link into your browser to reset your password:
          
          ${resetUrl}
          
          This link will expire in 1 hour.
          
          If you didn't request this password reset, please ignore this email.
          
          Happy detecting!
          The DigQuest Team
        `
      };
      
      const emailSent = await sendEmail(emailData);
      
      if (emailSent) {
        res.status(200).json({ 
          message: "If an account with that email exists, you'll receive password reset instructions." 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to send reset email. Please try again later." 
        });
      }
      
    } catch (error) {
      console.error("Error sending password reset email:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Send activation email to manually verified users
  app.post("/api/send-activation-email", async (req, res) => {
    try {
      const { username, email } = req.body;
      
      if (!username || !email) {
        return res.status(400).json({ message: "Username and email are required" });
      }
      
      const emailData = {
        to: email,
        from: 'noreply@digquest.org',
        subject: 'Your DigQuest Account is Now Active!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #8B4513; text-align: center;">Welcome to DigQuest!</h2>
            
            <p>Hello ${username},</p>
            
            <p>Great news! Your DigQuest account has been successfully activated and you can now log in.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #8B4513; margin-top: 0;">What you can do now:</h3>
              <ul>
                <li>Share your metal detecting finds with the community</li>
                <li>Access interactive maps with detecting locations</li>
                <li>Connect with fellow detectorists in our forums</li>
                <li>Track your achievements and discoveries</li>
                <li>Join local detecting events and meetups</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${req.protocol}://${req.get('host')}" 
                 style="background-color: #DAA520; color: #2F4F2F; padding: 12px 24px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;
                        display: inline-block;">
                Log In to DigQuest
              </a>
            </div>
            
            <p>Thank you for joining our community of metal detecting enthusiasts!</p>
            
            <p>Happy hunting!<br>
            The DigQuest Team</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              If you didn't create a DigQuest account, please ignore this email.
            </p>
          </div>
        `
      };
      
      const success = await sendEmail(emailData);
      
      if (success) {
        res.json({ message: `Activation email sent to ${username}` });
      } else {
        res.status(500).json({ message: "Failed to send activation email" });
      }
    } catch (error) {
      console.error("Error sending activation email:", error);
      res.status(500).json({ message: "Failed to send activation email" });
    }
  });
  
  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords before sending
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get user by username - needed for login/registration flow
  // IMPORTANT: This route must come before the /:id route to avoid conflicts
  app.get("/api/users/by-username/:username", async (req, res) => {
    try {
      const username = req.params.username;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Delete user account
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deletion of the default DigQuestor account
      if (user.username === "DigQuestor") {
        return res.status(403).json({ message: "Cannot delete the default account" });
      }
      
      // Delete user and their content
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete user" });
      }
      
      res.status(200).json({ message: "User account and all associated data deleted successfully" });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Update user profile
  app.put("/api/users/:id", upload.single("profilePicture"), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Parse request body
      const body = JSON.parse(JSON.stringify(req.body));
      
      // Build update data
      const updateData: Partial<InsertUser> = {};
      
      // Optional fields that can be updated
      if (body.username) updateData.username = body.username;
      if (body.email) updateData.email = body.email;
      if (body.bio) updateData.bio = body.bio;
      
      // Handle password update if provided
      if (body.password) {
        // In a real app, would validate old password and hash new password
        updateData.password = body.password;
      }
      
      // Handle profile picture upload
      if (req.file && req.file.buffer && req.file.originalname) {
        try {
          const uploadResult = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'profile-pictures'
          );
          updateData.avatarUrl = uploadResult.url;
        } catch (error) {
          console.error('S3 upload error:', error);
          return res.status(500).json({ message: "Failed to upload profile picture" });
        }
      } else if (body.avatarUrl) {
        // Also handle data URLs sent directly in the request body
        updateData.avatarUrl = body.avatarUrl;
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update user" });
      }
      
      // Don't send password back
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Upload user avatar
  app.post("/api/users/:id/avatar", upload.single('avatar'), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Upload to S3
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'avatars'
      );

      // Update user's avatar URL
      const updatedUser = await storage.updateUser(userId, {
        avatarUrl: uploadResult.url
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ 
        message: "Avatar updated successfully",
        avatarUrl: uploadResult.url 
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // Resend verification email
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Generate new verification token and expiry
      const token = generateVerificationToken();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Update user with new token
      await storage.updateUser(user.id, {
        emailVerificationToken: token,
        emailVerificationExpires: expires
      });
      
      // Send verification email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const emailData = createVerificationEmail(user.email, user.username, token, baseUrl);
      
      const emailSent = await sendEmail(emailData);
      
      if (emailSent) {
        res.status(200).json({ 
          message: "Verification email sent successfully! Please check your inbox and spam folder.",
          emailSent: true 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to send verification email. Please try again later.",
          emailSent: false 
        });
      }
      
    } catch (error) {
      console.error("Error resending verification email:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Verification token is required" });
      }
      
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      // Check if token has expired
      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
      }
      
      // Verify the user's email
      const verifiedUser = await storage.verifyEmail(token);
      
      if (!verifiedUser) {
        return res.status(500).json({ message: "Failed to verify email" });
      }
      
      // Don't send password back
      const { password, ...userWithoutPassword } = verifiedUser;
      
      res.status(200).json({ 
        message: "Email verified successfully! You can now log in to your account.",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Resend verification email endpoint
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { identifier } = req.body; // Can be username or email
      
      if (!identifier) {
        return res.status(400).json({ message: "Username or email is required" });
      }
      
      // Find user by email or username
      let user;
      if (identifier.includes('@')) {
        user = await storage.getUserByEmail(identifier);
      } else {
        user = await storage.getUserByUsername(identifier);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Generate new verification token and set expiration (24 hours)
      const verificationToken = generateVerificationToken();
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      
      await storage.setEmailVerificationToken(user.id, verificationToken, expires);
      
      // Send verification email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const emailData = createVerificationEmail(user.email, user.username, verificationToken, baseUrl);
      
      const emailSent = await sendEmail(emailData);
      
      if (emailSent) {
        res.status(200).json({ 
          message: `Verification email sent to ${user.email}. Please check your inbox and spam folder.`,
          emailSent: true
        });
      } else {
        res.status(500).json({ 
          message: "Failed to send verification email. Please try again later.",
          emailSent: false
        });
      }
      
    } catch (error) {
      console.error("Error resending verification email:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  //---------- Categories Routes ----------//
  
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get category by ID
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(200).json(category);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  //---------- Posts Routes ----------//
  
  // Create a post
  app.post("/api/posts", async (req, res) => {
    try {
      console.log("POST /api/posts received data:", req.body);
      const postData = insertPostSchema.parse(req.body);
      console.log("Parsed post data:", postData);
      
      // Check if user exists
      const user = await storage.getUser(postData.userId);
      console.log("Found user:", user ? "Yes" : "No", "for userId:", postData.userId);
      if (!user) {
        console.log("User not found with id:", postData.userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if category exists
      const category = await storage.getCategory(postData.categoryId);
      console.log("Found category:", category ? "Yes" : "No", "for categoryId:", postData.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const post = await storage.createPost(postData);
      console.log("Post created successfully with id:", post.id);
      
      // Increment the category count now that a post has been added to it
      await storage.incrementCategoryCount(postData.categoryId);
      console.log("Incremented count for category:", postData.categoryId);
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Create new post with image upload
  app.post("/api/posts/with-image", upload.single("image"), async (req, res) => {
    try {
      console.log("Creating post with image. File:", req.file ? "Yes" : "No");
      console.log("Post body data:", req.body);
      
      // Handle image upload to S3 if file is present
      let imageUrl = undefined;
      if (req.file) {
        try {
          const uploadResult = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'forum-images'
          );
          imageUrl = uploadResult.url;
        } catch (error) {
          console.error('S3 upload error:', error);
          return res.status(500).json({ message: "Failed to upload image" });
        }
      }

      // Parse the post data from the form
      const postData = {
        title: req.body.title,
        content: req.body.content,
        userId: parseInt(req.body.userId),
        categoryId: parseInt(req.body.categoryId),
        imageUrl
      };
      
      // Validate the data
      const validatedData = insertPostSchema.parse(postData);
      console.log("Validated post data:", validatedData);
      
      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if category exists
      const category = await storage.getCategory(validatedData.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const post = await storage.createPost(validatedData);
      console.log("Post with image created successfully with id:", post.id);
      
      // Increment the category count
      await storage.incrementCategoryCount(validatedData.categoryId);
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post with image:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get all posts
  app.get("/api/posts", async (req, res) => {
    try {
      const categoryId = req.query.categoryId 
        ? parseInt(req.query.categoryId as string) 
        : undefined;
        
      const userId = req.query.userId
        ? parseInt(req.query.userId as string)
        : undefined;
      
      let posts;
      
      if (categoryId && !isNaN(categoryId)) {
        posts = await storage.getPostsByCategory(categoryId);
      } else if (userId && !isNaN(userId)) {
        posts = await storage.getPostsByUser(userId);
      } else {
        posts = await storage.getAllPosts();
      }
      
      res.status(200).json(posts);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get post by ID
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Increment view count
      await storage.updatePostViewCount(postId);
      
      // Get updated post with incremented view count
      const updatedPost = await storage.getPost(postId);
      
      res.status(200).json(updatedPost);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Delete a post
  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Check if post exists
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Store the category ID before deleting the post
      const categoryId = post.categoryId;
      
      // For security, we could check if the user is authorized to delete this post
      // For now, we'll allow any user to delete any post since we're not handling auth
      
      const success = await storage.deletePost(postId);
      
      if (success) {
        res.status(200).json({ message: "Post deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete post" });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  //---------- Comments Routes ----------//
  
  // Create a comment
  app.post("/api/comments", async (req, res) => {
    try {
      console.log("Creating comment with data:", req.body);
      const commentData = insertCommentSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(commentData.userId);
      if (!user) {
        console.log("User not found:", commentData.userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if post exists
      const post = await storage.getPost(commentData.postId);
      if (!post) {
        console.log("Post not found:", commentData.postId);
        return res.status(404).json({ message: "Post not found" });
      }
      
      console.log("Creating comment for post:", commentData.postId);
      const comment = await storage.createComment(commentData);
      console.log("Comment created successfully:", comment.id);
      
      // Update post comment count
      try {
        await storage.updatePostCommentCount(commentData.postId);
        console.log("Post comment count updated for post:", commentData.postId);
      } catch (countError) {
        console.error("Failed to update post comment count:", countError);
        // Don't fail the request if count update fails
      }
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get comments by post ID
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const comments = await storage.getAllCommentsByPost(postId);
      res.status(200).json(comments);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Update a comment
  app.put("/api/comments/:id", async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      // Get the existing comment to check if it exists
      const existingComment = await storage.getComment(commentId);
      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Update the comment content
      const updatedComment = await storage.updateComment(commentId, { content: content.trim() });
      
      if (!updatedComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  // Delete a comment
  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);

      // Get the existing comment to get post info for count update
      const existingComment = await storage.getComment(commentId);
      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const success = await storage.deleteComment(commentId);
      
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Update post comment count (decrease by 1)
      try {
        const post = await storage.getPost(existingComment.postId);
        if (post) {
          await storage.updatePost(existingComment.postId, { 
            comments: Math.max(0, (post.comments || 0) - 1) 
          });
        }
      } catch (countError) {
        console.error("Failed to update post comment count:", countError);
        // Don't fail the request if count update fails
      }

      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Like/Unlike a post
  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = 1; // For now, using user ID 1 (DigQuestor) as current user
      
      const success = await storage.likePost(userId, postId);
      
      if (success) {
        const likeCount = await storage.getPostLikeCount(postId);
        res.json({ 
          message: "Post liked successfully", 
          likes: likeCount,
          isLiked: true 
        });
      } else {
        res.status(400).json({ message: "Post already liked or error occurred" });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:id/like", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = 1; // For now, using user ID 1 (DigQuestor) as current user
      
      const success = await storage.unlikePost(userId, postId);
      
      if (success) {
        const likeCount = await storage.getPostLikeCount(postId);
        res.json({ 
          message: "Post unliked successfully", 
          likes: likeCount,
          isLiked: false 
        });
      } else {
        res.status(400).json({ message: "Post not liked or error occurred" });
      }
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  // Check if user has liked a post
  app.get("/api/posts/:id/like-status", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = 1; // For now, using user ID 1 (DigQuestor) as current user
      
      const isLiked = await storage.isPostLikedByUser(userId, postId);
      const likeCount = await storage.getPostLikeCount(postId);
      
      res.json({ 
        isLiked, 
        likes: likeCount 
      });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: "Failed to check like status" });
    }
  });

  // Like/Unlike a find
  app.post("/api/finds/:id/like", async (req, res) => {
    try {
      const findId = parseInt(req.params.id);
      const userId = 1; // For now, using user ID 1 (DigQuestor) as current user
      
      const success = await storage.likeFind(userId, findId);
      
      if (success) {
        const likeCount = await storage.getFindLikeCount(findId);
        res.json({ 
          message: "Find liked successfully", 
          likes: likeCount,
          isLiked: true 
        });
      } else {
        res.status(400).json({ message: "Find already liked or error occurred" });
      }
    } catch (error) {
      console.error("Error liking find:", error);
      res.status(500).json({ message: "Failed to like find" });
    }
  });

  app.delete("/api/finds/:id/like", async (req, res) => {
    try {
      const findId = parseInt(req.params.id);
      const userId = 1; // For now, using user ID 1 (DigQuestor) as current user
      
      const success = await storage.unlikeFind(userId, findId);
      
      if (success) {
        const likeCount = await storage.getFindLikeCount(findId);
        res.json({ 
          message: "Find unliked successfully", 
          likes: likeCount,
          isLiked: false 
        });
      } else {
        res.status(400).json({ message: "Find not liked or error occurred" });
      }
    } catch (error) {
      console.error("Error unliking find:", error);
      res.status(500).json({ message: "Failed to unlike find" });
    }
  });

  // Check if user has liked a find
  app.get("/api/finds/:id/like-status", async (req, res) => {
    try {
      const findId = parseInt(req.params.id);
      const userId = 1; // For now, using user ID 1 (DigQuestor) as current user
      
      const isLiked = await storage.isFindLikedByUser(userId, findId);
      const likeCount = await storage.getFindLikeCount(findId);
      
      res.json({ 
        isLiked, 
        likes: likeCount 
      });
    } catch (error) {
      console.error("Error checking find like status:", error);
      res.status(500).json({ message: "Failed to check find like status" });
    }
  });
  
  //---------- Finds Routes ----------//
  
  // Create a find (with image upload)
  app.post("/api/finds", upload.single("image"), async (req, res) => {
    try {
      console.log("=== FIND UPLOAD REQUEST START ===");
      console.log("Request body:", req.body);
      console.log("File details:", {
        filePresent: req.file ? "Yes" : "No",
        buffer: req.file?.buffer ? "Present" : "Missing",
        originalname: req.file?.originalname || "Missing",
        mimetype: req.file?.mimetype || "Missing",
        size: req.file?.size || 0,
        fieldname: req.file?.fieldname || "Missing",
        encoding: req.file?.encoding || "Missing"
      });
      
      // Handle image upload to S3 if file is present
      let imageUrl = null;
      if (req.file && req.file.buffer && req.file.originalname && req.file.buffer.length > 0) {
        try {
          console.log("Starting S3 upload for file:", req.file.originalname);
          const uploadResult = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'finds'
          );
          imageUrl = uploadResult.url;
          console.log("S3 upload completed, URL:", imageUrl);
        } catch (error) {
          console.error('S3 upload error details:', error);
          console.error('Error stack:', error.stack);
          return res.status(500).json({ message: `Failed to upload image: ${error.message}` });
        }
      } else if (req.file) {
        console.log("File upload validation failed - missing required properties");
        console.log("File object:", JSON.stringify(req.file, null, 2));
        return res.status(400).json({ message: "Invalid file upload - missing required properties" });
      }

      // Create a cleaned data object with proper type handling
      const cleanedData = {
        title: req.body.title,
        description: req.body.description || null,
        location: req.body.location || null,
        period: req.body.period || null,
        userId: parseInt(req.body.userId),
        imageUrl
      };
      
      console.log("Cleaned find data:", cleanedData);
      // Validate the data
      const findData = insertFindSchema.parse(cleanedData);
      
      // Check if user exists
      const user = await storage.getUser(findData.userId);
      if (!user) {
        console.log("User not found with ID:", findData.userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("Creating find with data:", findData);
      const find = await storage.createFind(findData);
      console.log("Find created successfully with ID:", find.id);
      
      res.status(201).json(find);
    } catch (error) {
      console.error("Error creating find:", error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get all finds
  app.get("/api/finds", async (req, res) => {
    try {
      const userId = req.query.userId
        ? parseInt(req.query.userId as string)
        : undefined;
      
      let finds;
      
      if (userId && !isNaN(userId)) {
        finds = await storage.getFindsByUser(userId);
        console.log(`Getting finds by user ID ${userId}. Total: ${finds.length}`);
      } else {
        finds = await storage.getAllFinds();
        console.log(`Getting all finds. Total: ${finds.length}`);
      }
      
      res.status(200).json(finds);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get a specific find by ID
  app.get("/api/finds/:id", async (req, res) => {
    try {
      const findId = parseInt(req.params.id);
      
      if (isNaN(findId)) {
        return res.status(400).json({ message: "Invalid find ID" });
      }
      
      const find = await storage.getFind(findId);
      
      if (!find) {
        return res.status(404).json({ message: "Find not found" });
      }
      
      res.status(200).json(find);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Update find by ID
  app.patch("/api/finds/:id", upload.single("image"), async (req, res) => {
    try {
      const findId = parseInt(req.params.id);
      const userId = parseInt(req.body.userId);
      
      if (isNaN(findId)) {
        return res.status(400).json({ message: "Invalid find ID" });
      }
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get the find to verify ownership
      const find = await storage.getFind(findId);
      
      if (!find) {
        return res.status(404).json({ message: "Find not found" });
      }
      
      // Check if the user making the request is the owner
      if (find.userId !== userId) {
        return res.status(403).json({ 
          message: "You don't have permission to update this find" 
        });
      }
      
      // Create a cleaned data object with proper type handling
      const cleanedData: Partial<any> = {
        title: req.body.title,
        description: req.body.description || null,
        location: req.body.location || null,
        period: req.body.period || null,
      };
      
      // Handle image upload to S3 if file is present
      if (req.file && req.file.buffer && req.file.originalname) {
        try {
          const uploadResult = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'finds'
          );
          cleanedData.imageUrl = uploadResult.url;
        } catch (error) {
          console.error('S3 upload error:', error);
          return res.status(500).json({ message: "Failed to upload image" });
        }
      }
      
      console.log("Updating find with data:", cleanedData);
      
      // Update the find
      const updatedFind = await storage.updateFind(findId, cleanedData);
      
      if (updatedFind) {
        res.status(200).json(updatedFind);
      } else {
        res.status(500).json({ message: "Failed to update find" });
      }
    } catch (error) {
      console.error("Error updating find:", error);
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Delete find by ID (with user verification)
  app.delete("/api/finds/:id", async (req, res) => {
    try {
      const findId = parseInt(req.params.id);
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(findId)) {
        return res.status(400).json({ message: "Invalid find ID" });
      }
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get the find to verify ownership
      const find = await storage.getFind(findId);
      
      if (!find) {
        return res.status(404).json({ message: "Find not found" });
      }
      
      // Check if the user making the request is the owner
      if (find.userId !== userId) {
        return res.status(403).json({ 
          message: "You don't have permission to delete this find" 
        });
      }
      
      // Delete the find
      const deleted = await storage.deleteFind(findId);
      
      if (deleted) {
        res.status(200).json({ message: "Find deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete find" });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Create a comment on a find
  app.post("/api/finds/:id/comments", async (req, res) => {
    try {
      const findId = parseInt(req.params.id);
      
      if (isNaN(findId)) {
        return res.status(400).json({ message: "Invalid find ID" });
      }
      
      const find = await storage.getFind(findId);
      
      if (!find) {
        return res.status(404).json({ message: "Find not found" });
      }
      
      // Create a cleaned data object for validation
      const cleanedData = {
        content: req.body.content,
        userId: parseInt(req.body.userId),
        findId: findId
      };
      
      // Validate with schema
      const commentData = insertFindCommentSchema.parse(cleanedData);
      
      // Check if user exists
      const user = await storage.getUser(commentData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newComment = await storage.createFindComment(commentData);
      res.status(201).json(newComment);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get all comments for a find
  app.get("/api/finds/:id/comments", async (req, res) => {
    try {
      const findId = parseInt(req.params.id);
      
      if (isNaN(findId)) {
        return res.status(400).json({ message: "Invalid find ID" });
      }
      
      const find = await storage.getFind(findId);
      
      if (!find) {
        return res.status(404).json({ message: "Find not found" });
      }
      
      const comments = await storage.getAllCommentsByFind(findId);
      res.status(200).json(comments);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Update a find comment
  app.put("/api/find-comments/:commentId", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const { content } = req.body;
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: "Content is required" });
      }

      const updatedComment = await storage.updateFindComment(commentId, { content: content.trim() });
      if (!updatedComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating find comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  // Delete a find comment
  app.delete("/api/find-comments/:commentId", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const deleted = await storage.deleteFindComment(commentId);
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting find comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });
  
  //---------- Locations Routes ----------//
  
  // Create a location
  app.post("/api/locations", async (req, res) => {
    try {
      console.log("Received location creation request:", req.body);
      
      // Manually handle null values for optional fields before validation
      const cleanedData = {
        name: req.body.name,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        userId: req.body.userId,
        description: req.body.description || null,
        isPrivate: req.body.isPrivate !== false, // Default to private unless explicitly set to false
        terrainType: req.body.terrainType || null,
        accessInfo: req.body.accessInfo || null,
        bestTimeToVisit: req.body.bestTimeToVisit || null
      };
      
      console.log("Cleaned location data:", cleanedData);
      
      const locationData = insertLocationSchema.parse(cleanedData);
      
      // Check if user exists
      const user = await storage.getUser(locationData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const location = await storage.createLocation(locationData);
      console.log("Location created successfully:", location);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get all locations (filtered by privacy settings)
  app.get("/api/locations", async (req, res) => {
    try {
      const type = req.query.type as string;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
      
      let locations;
      
      if (type) {
        locations = await storage.getLocationsByType(type);
        console.log(`Getting locations by type '${type}'. Total: ${locations.length}`);
      } else {
        locations = await storage.getAllLocations();
        console.log(`Getting all locations. Total: ${locations.length}`);
      }
      
      // Filter locations based on privacy settings
      // Show only: 1) User's own locations, 2) Explicitly shared locations (isPrivate = false)
      const filteredLocations = locations.filter(location => {
        // Always show user's own locations
        if (userId && location.userId === userId) {
          return true;
        }
        // Only show other users' locations if they are explicitly shared (not private)
        return !location.isPrivate;
      });
      
      console.log(`Filtered locations for user ${userId}. Showing: ${filteredLocations.length}/${locations.length}`);
      res.status(200).json(filteredLocations);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get location by ID
  app.get("/api/locations/:id", async (req, res) => {
    try {
      const locationId = parseInt(req.params.id);
      
      if (isNaN(locationId)) {
        return res.status(400).json({ message: "Invalid location ID" });
      }
      
      const location = await storage.getLocation(locationId);
      
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.status(200).json(location);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Delete a location
  app.delete("/api/locations/:id", async (req, res) => {
    try {
      const locationId = parseInt(req.params.id);
      const userId = parseInt(req.query.userId as string);
      
      if (isNaN(locationId)) {
        return res.status(400).json({ message: "Invalid location ID" });
      }
      
      // Check if location exists
      const location = await storage.getLocation(locationId);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      // Check if the user is the creator of the location
      if (location.userId !== userId) {
        return res.status(403).json({ message: "You can only delete locations you've created" });
      }
      
      // Delete from the locations map
      const deleted = await storage.deleteLocation(locationId);
      
      if (deleted) {
        console.log(`Location ${locationId} deleted successfully by user ${userId}`);
        res.status(200).json({ message: "Location deleted successfully" });
      } else {
        console.log(`Failed to delete location ${locationId}`);
        res.status(500).json({ message: "Failed to delete location" });
      }
      
    } catch (error) {
      console.error("Error deleting location:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  //---------- Stripe Payment Routes ----------//
  
  // Create a payment intent for donations
  app.post("/api/create-payment-intent", async (req, res) => {
    console.log("Received create-payment-intent request:", req.body);
    
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment processing is not configured" });
      }

      const { amount, email, name } = req.body;
      
      if (!amount || amount <= 0) {
        console.log("Invalid amount:", amount);
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      console.log(`Creating payment intent for ${amount} USD from ${email}`);
      
      // Create a payment intent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        description: "Voluntary donation for DigQuest community",
        receipt_email: email,
        metadata: {
          name: name || "Anonymous",
          type: "donation"
        }
      });

      console.log("Payment intent created:", paymentIntent.id);
      
      // Make sure we're not returning HTML instead of JSON
      res.setHeader('Content-Type', 'application/json');
      
      // Return the client secret to the client
      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        res.status(400).json({ message: error.message });
      } else {
        console.error("Unknown error type:", typeof error);
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  //---------- Events Routes ----------//
  
  // Create an event
  app.post("/api/events", async (req, res) => {
    try {
      console.log("Received event data:", req.body);
      
      // Validate the data using the schema directly (keep eventDate as string)
      const validatedData = insertEventSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("Creating event with data:", validatedData);
      const event = await storage.createEvent(validatedData);
      console.log("Event created:", event);
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Event creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Update event
  app.put("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const updateData = insertEventSchema.parse(req.body);
      
      // Check if event exists
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if user is the owner of the event
      if (existingEvent.userId !== updateData.userId) {
        return res.status(403).json({ message: "Not authorized to edit this event" });
      }
      
      const updatedEvent = await storage.updateEvent(eventId, updateData);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Event update error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update event" });
      }
    }
  });

  // Delete event
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      // Check if event exists
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Allow event owner to delete
      const deleted = await storage.deleteEvent(eventId);
      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Event deletion error:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });
  
  // Get all events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.status(200).json(events);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get event by ID
  app.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.status(200).json(event);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Join an event (increment attendee count)
  app.post("/api/events/:id/join", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      await storage.incrementEventAttendeeCount(eventId);
      
      // Get updated event with incremented attendee count
      const updatedEvent = await storage.getEvent(eventId);
      
      res.status(200).json(updatedEvent);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  //---------- Stories Routes ----------//
  
  // Create a story
  app.post("/api/stories", async (req, res) => {
    try {
      const storyData = insertStorySchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(storyData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const story = await storage.createStory(storyData);
      res.status(201).json(story);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get all stories
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getAllStories();
      res.status(200).json(stories);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Verification token is required" });
      }
      
      const user = await storage.verifyEmail(token);
      
      if (!user) {
        return res.status(400).json({ 
          message: "Invalid or expired verification token. Please request a new verification email." 
        });
      }
      
      res.json({ 
        message: "Email verified successfully! You can now fully access DigQuest.",
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          isEmailVerified: user.isEmailVerified 
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Server error during email verification" });
    }
  });

  // Test email endpoint to verify SendGrid configuration
  app.post("/api/test-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const success = await sendEmail({
        to: email,
        from: 'noreply@digquest.org',
        subject: 'DigQuest Email Test',
        text: 'This is a test email to verify SendGrid configuration with single sender verification.',
        html: '<p>This is a test email to verify SendGrid configuration with single sender verification.</p>'
      });

      if (success) {
        res.json({ message: "Test email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });

  // Manual verification endpoint for admin use
  app.post("/api/admin/verify-user", async (req, res) => {
    try {
      const { username, email } = req.body;
      
      if (!username && !email) {
        return res.status(400).json({ message: "Username or email is required" });
      }
      
      let user;
      if (email) {
        user = await storage.getUserByEmail(email);
      } else {
        user = await storage.getUserByUsername(username);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isEmailVerified) {
        return res.json({ message: `User ${user.username} is already verified` });
      }
      
      // Manually verify the user
      await storage.verifyEmailManual(user.id);
      
      res.json({ 
        message: `User ${user.username} has been manually verified and can now log in`,
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (error) {
      console.error("Manual verification error:", error);
      res.status(500).json({ message: "Failed to verify user" });
    }
  });

  // Resend verification email endpoint
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      
      await storage.setEmailVerificationToken(user.id, verificationToken, expires);
      
      // Send verification email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const emailData = createVerificationEmail(user.email, user.username, verificationToken, baseUrl);
      
      const emailSent = await sendEmail(emailData);
      
      if (!emailSent) {
        return res.status(500).json({ 
          message: "Failed to send verification email. Please try again later." 
        });
      }
      
      res.json({ message: "Verification email sent successfully! Please check your inbox." });
    } catch (error: any) {
      res.status(500).json({ message: "Server error sending verification email" });
    }
  });

  // User registration endpoint for signup modal
  app.post("/api/users/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(parsed.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(parsed.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(parsed.password, 10);
      
      const user = await storage.createUser({
        ...parsed,
        password: hashedPassword,
      });
      
      // Generate verification token and set expiration (24 hours)
      const verificationToken = generateVerificationToken();
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      
      await storage.setEmailVerificationToken(user.id, verificationToken, expires);
      
      // Send verification email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const emailData = createVerificationEmail(user.email, user.username, verificationToken, baseUrl);
      
      const emailSent = await sendEmail(emailData);
      
      if (!emailSent) {
        console.warn(`Failed to send verification email to ${user.email}`);
      }
      
      // Don't return sensitive data
      const { password, emailVerificationToken, ...userWithoutSensitiveData } = user;
      res.status(201).json({ 
        message: "Account created successfully! Please check your email to verify your account before logging in.",
        emailVerificationRequired: true,
        emailSent: emailSent,
        user: userWithoutSensitiveData
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // SEO Routes - Dynamic Sitemap
  app.get("/sitemap.xml", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/xml');
      const sitemap = await generateSitemap();
      res.send(sitemap);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get("/robots.txt", (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /
Allow: /finds
Allow: /forum
Allow: /map
Allow: /wellbeing
Allow: /events
Allow: /partnership
Disallow: /api/
Disallow: /admin
Sitemap: https://digquest.org/sitemap.xml

# Specific bot permissions
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: facebookexternalhit
Allow: /
Allow: /finds/*
Allow: /forum/*

# Block spam bots
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /`);
  });

  // SEO Enhancement Routes
  app.get("/api/seo/meta/:page", async (req, res) => {
    try {
      const page = req.params.page;
      let metaData = {};

      switch (page) {
        case 'finds':
          const finds = await storage.getAllFinds();
          metaData = {
            title: `Metal Detecting Finds Gallery - ${finds.length} Treasure Discoveries | DigQuest`,
            description: `Browse ${finds.length} amazing metal detecting finds and treasure discoveries from the UK community. See Roman coins, medieval artifacts, and modern treasures found by fellow detectorists.`,
            keywords: 'metal detecting finds, treasure gallery, Roman coins, medieval artifacts, UK finds, detector discoveries'
          };
          break;
        case 'forum':
          const posts = await storage.getAllPosts();
          metaData = {
            title: `Metal Detecting Forum - ${posts.length} Community Discussions | DigQuest`,
            description: `Join ${posts.length} active discussions in the UK's premier metal detecting forum. Get advice, share experiences, and connect with fellow treasure hunters.`,
            keywords: 'metal detecting forum, detector community, treasure hunting advice, UK detectorists'
          };
          break;
        case 'wellbeing':
          metaData = {
            title: 'Mental Health & Wellbeing Through Metal Detecting | DigQuest',
            description: 'Discover how metal detecting promotes mental health and wellbeing. Learn about the therapeutic benefits of treasure hunting and connecting with nature.',
            keywords: 'metal detecting wellbeing, mental health benefits, outdoor therapy, treasure hunting wellness'
          };
          break;
        default:
          metaData = {
            title: 'DigQuest - Metal Detecting Community & Treasure Hunting Platform',
            description: 'Join the UK\'s premier metal detecting community. Share finds, connect with fellow detectorists, discover detecting locations, and promote wellbeing through treasure hunting.',
            keywords: 'metal detecting, treasure hunting, UK detectorists, finds gallery, forum, community'
          };
      }

      res.json(metaData);
    } catch (error) {
      console.error('SEO meta error:', error);
      res.status(500).json({ error: 'Failed to generate meta data' });
    }
  });

  // Canonical URL middleware to prevent duplicate content issues
  app.use((req, res, next) => {
    // Redirect trailing slashes (except root)
    if (req.path !== '/' && req.path.endsWith('/')) {
      return res.redirect(301, req.path.slice(0, -1) + req.search);
    }
    
    // Ensure HTTPS canonical URLs
    if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    
    next();
  });

  // Individual page canonical and content enhancements
  app.get("/finds/:id", async (req, res) => {
    try {
      const findId = parseInt(req.params.id);
      const find = await storage.getFind(findId);
      
      if (!find) {
        return res.status(404).send('Find not found');
      }

      // Generate rich HTML content for better indexing
      const canonicalUrl = `https://digquest.org/finds/${findId}`;
      const pageTitle = `${find.title} - Metal Detecting Find | DigQuest`;
      const pageDescription = find.description 
        ? `${find.description.substring(0, 150)}...` 
        : `Discover this amazing metal detecting find: ${find.title}. Found by the DigQuest community.`;

      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDescription}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${pageDescription}">
  <meta property="og:image" content="${find.imageUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${find.title}",
    "description": "${pageDescription}",
    "image": "${find.imageUrl}",
    "url": "${canonicalUrl}",
    "datePublished": "${find.created_at?.toISOString() || new Date().toISOString()}",
    "author": {
      "@type": "Organization",
      "name": "DigQuest Community"
    }
  }
  </script>
</head>
<body>
  <h1>${find.title}</h1>
  <img src="${find.imageUrl}" alt="${find.title}" style="max-width: 100%; height: auto;">
  ${find.description ? `<p>${find.description}</p>` : ''}
  ${find.location ? `<p><strong>Location:</strong> ${find.location}</p>` : ''}
  ${find.period ? `<p><strong>Period:</strong> ${find.period}</p>` : ''}
  <p><a href="/">Return to DigQuest</a></p>
</body>
</html>
      `);
    } catch (error) {
      res.status(500).send('Error loading find');
    }
  });

  app.get("/forum/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).send('Post not found');
      }

      const canonicalUrl = `https://digquest.org/forum/${postId}`;
      const pageTitle = `${post.title} - Metal Detecting Forum | DigQuest`;
      const pageDescription = post.content 
        ? `${post.content.substring(0, 150)}...` 
        : `Join the discussion: ${post.title} in the DigQuest metal detecting community forum.`;

      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDescription}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${pageDescription}">
  <meta property="og:url" content="${canonicalUrl}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": "${post.title}",
    "text": "${pageDescription}",
    "url": "${canonicalUrl}",
    "datePublished": "${post.created_at?.toISOString() || new Date().toISOString()}",
    "author": {
      "@type": "Organization", 
      "name": "DigQuest Community"
    }
  }
  </script>
</head>
<body>
  <h1>${post.title}</h1>
  <div>${post.content}</div>
  <p><a href="/forum">Return to Forum</a> | <a href="/">Return to DigQuest</a></p>
</body>
</html>
      `);
    } catch (error) {
      res.status(500).send('Error loading post');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
