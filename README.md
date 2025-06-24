# DigQuest - Metal Detecting Community Platform

A comprehensive community platform for metal detecting enthusiasts featuring user authentication, forums, finds gallery, interactive maps, and social networking.

## Features

- 🔐 User registration with email verification
- 💬 Community forums with categories and commenting
- 📸 Finds gallery with image uploads
- 🗺️ Interactive Google Maps integration with KML/KMI import
- 👥 Social networking (follow/unfollow, groups)
- 🎯 Wellbeing resources and AR features
- 📱 Mobile-responsive design
- 🎉 Community events and group management

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (production), In-memory (development)
- **Authentication**: Session-based with email verification
- **File Storage**: AWS S3
- **Email**: SendGrid
- **Maps**: Google Maps API
- **Deployment**: Render with Docker

## Environment Variables

Required environment variables for deployment:
- `DATABASE_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SENDGRID_API_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`
- `STRIPE_SECRET_KEY`
- `VITE_STRIPE_PUBLIC_KEY`

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

## Deployment

This project is configured for deployment on Render platform using Docker containerization.
