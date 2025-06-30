# DigQuest Project Documentation

## Overview
DigQuest is a comprehensive community platform for metal detecting enthusiasts featuring user authentication with email verification, community forums, finds gallery, interactive maps, social networking, and wellbeing resources. The platform is built with a modern TypeScript stack using Express.js backend and React frontend with Tailwind CSS.

## Recent Changes  
- **2025-01-30**: FINAL FIX - Render completely ignores YAML changes due to severe caching. Directly replaced server/index.ts to eliminate all vite config imports and __dirname references. Uses conditional production static serving.
- **2025-01-30**: FINAL FIX - Render completely ignores YAML changes due to severe caching. Directly replaced server/index.ts to eliminate all vite config imports and __dirname references. Uses conditional production static serving.
- **2025-01-24**: Created production-compatible vite.config.ts removing Replit-specific plugins causing build failures
- **2025-01-24**: Created final Render deployment fix with explicit repo/branch specification and enhanced build debugging
- **2025-01-24**: Identified Render deployment root directory issue - system looking in /opt/render/project/src/ instead of /opt/render/project/
- **2025-01-24**: Fixed critical KML/KMI file privacy issue - uploaded location data now defaults to private instead of being visible to all users
- **2025-01-24**: Added comprehensive event edit/delete functionality with proper authorization controls for event owners
- **2025-01-24**: Added complete Render deployment configuration with Docker support, health checks, and deployment guide
- **2025-01-24**: Successfully uploaded complete project to GitHub repository (https://github.com/DigQuestor/digquest)
- **2025-01-24**: Fixed Render deployment "status 127" error by updating build configuration (package.json, render.yaml, Dockerfile, added tsconfig.server.json)
- **2025-01-24**: Identified vite.config.ts production compatibility issue - Replit-specific plugins causing build failures
- **2025-01-24**: Successfully uploaded source folders (shared/, server/, client/) to GitHub repository manually
- **2025-01-24**: Fixed build script to use npx vite instead of vite command
- **2025-01-24**: Debugging Render deployment - issue with file structure, Render looking in /opt/render/project/src/ instead of root directory
- **2025-01-24**: Fixed Render deployment "status 127" error by updating build configuration (package.json, render.yaml, Dockerfile, added tsconfig.server.json)
- **2025-01-24**: Successfully uploaded complete project to GitHub repository (https://github.com/DigQuestor/digquest)
- **2025-01-24**: Added complete Render deployment configuration with Docker support, health checks, and deployment guide
- **2025-01-24**: Fixed critical KML/KMI file privacy issue - uploaded location data now defaults to private instead of being visible to all users
- **2025-01-24**: Added comprehensive event edit/delete functionality with proper authorization controls for event owners
- **2025-01-23**: Fixed KML file upload functionality in detecting map menu (corrected component prop name)
- **2025-01-23**: Fixed event creation validation issues - simplified schema to accept event dates properly
- **2025-01-23**: Added resend verification email API endpoint (/api/resend-verification) to help users who don't receive verification emails

## Project Architecture

### Backend
- Express.js server with TypeScript
- In-memory storage with MemStorage class
- Email verification system using SendGrid
- Session-based authentication
- S3 integration for file uploads
- API endpoints for users, posts, finds, groups, and social features

### Frontend  
- React with TypeScript and Vite
- Tailwind CSS with shadcn/ui components
- Wouter for routing
- TanStack Query for data fetching
- Real-time features and social networking

### Key Features
- User registration with email verification
- Community forums with categories and commenting
- Finds gallery with image uploads
- Interactive Google Maps integration
- Social networking (follow/unfollow, groups)
- Wellbeing resources and AR features
- Mobile-responsive design

## User Preferences
- Clean, professional communication style
- Focus on user experience and mobile optimization
- Prioritize email verification reliability
- Maintain quirky, informal design aesthetic for the detecting community

## Technical Decisions
- Using in-memory storage for development (MemStorage)
- PostgreSQL database for production deployment
- SendGrid for email delivery
- S3 for image hosting
- Session-based authentication over JWT
- Email verification required for login (except admin account)
- Render platform for cloud deployment with Docker containerization

## Known Issues
- Some users report not receiving verification emails (solution implemented)
- Mobile layout required adjustments for better button visibility (fixed)
- KML file upload in detecting map menu (fixed)
- Community event creation errors (fixed)
- KML/KMI file privacy leak - uploaded locations visible to all users (fixed)

## Support Documentation
- email-verification-solution.md: Complete guide for email verification issues
- help-unverified-user.md: Quick reference for helping users with email problems