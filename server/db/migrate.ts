import { sql } from 'drizzle-orm';
import { db, pool } from './db.js';

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        avatar_url TEXT,
        bio TEXT,
        is_email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token TEXT,
        email_verification_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        post_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create posts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        category_id INTEGER NOT NULL REFERENCES categories(id),
        image_url TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create comments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create post_likes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        post_id INTEGER NOT NULL REFERENCES posts(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create finds table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS finds (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        period TEXT,
        image_url TEXT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create find_likes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS find_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        find_id INTEGER NOT NULL REFERENCES finds(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create find_comments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS find_comments (
        id SERIAL PRIMARY KEY,
        find_id INTEGER NOT NULL REFERENCES finds(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create locations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        latitude TEXT NOT NULL,
        longitude TEXT NOT NULL,
        type TEXT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        has_permission BOOLEAN DEFAULT FALSE,
        is_group_dig BOOLEAN DEFAULT FALSE,
        is_private BOOLEAN DEFAULT FALSE,
        terrain_type TEXT,
        access_info TEXT,
        best_time_to_visit TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT,
        location TEXT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        attendees INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create stories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stories (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create routes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS routes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        waypoints JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create user_preferences table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
        email_notifications BOOLEAN DEFAULT TRUE,
        theme TEXT DEFAULT 'light',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create image_storage table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS image_storage (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create groups table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        creator_id INTEGER NOT NULL REFERENCES users(id),
        member_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create group_memberships table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS group_memberships (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES groups(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        role TEXT DEFAULT 'member',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create user_connections table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_connections (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER NOT NULL REFERENCES users(id),
        following_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create activities table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        from_id INTEGER NOT NULL REFERENCES users(id),
        to_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create achievements table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create user_achievements table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        achievement_id INTEGER NOT NULL REFERENCES achievements(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Seed default categories if they don't exist
    await db.execute(sql`
      INSERT INTO categories (name, slug, description, post_count)
      SELECT 'General Discussion', 'general-discussion', 'General community discussions', 0
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'general-discussion')
    `);
    
    await db.execute(sql`
      INSERT INTO categories (name, slug, description, post_count)
      SELECT 'Metal Detecting', 'metal-detecting', 'Tips, techniques, and equipment discussions', 0
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'metal-detecting')
    `);
    
    await db.execute(sql`
      INSERT INTO categories (name, slug, description, post_count)
      SELECT 'Unearthed Treasures', 'unearthed-treasures', 'Share your amazing finds and discoveries', 0
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'unearthed-treasures')
    `);
    
    // If both categories exist, move posts to the new category before cleanup
    await db.execute(sql`
      UPDATE posts
      SET category_id = target.id
      FROM categories source, categories target
      WHERE source.slug = 'finds-gallery'
        AND target.slug = 'unearthed-treasures'
        AND posts.category_id = source.id
        AND source.id <> target.id
    `);

    // Remove the old category when the new one already exists
    await db.execute(sql`
      DELETE FROM categories
      WHERE slug = 'finds-gallery'
        AND EXISTS (SELECT 1 FROM categories WHERE slug = 'unearthed-treasures')
    `);

    // Otherwise rename existing "finds-gallery" category to "unearthed-treasures"
    await db.execute(sql`
      UPDATE categories
      SET name = 'Unearthed Treasures',
          slug = 'unearthed-treasures',
          description = 'Share your amazing finds and discoveries'
      WHERE slug = 'finds-gallery'
        AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'unearthed-treasures')
    `);
    
    await db.execute(sql`
      INSERT INTO categories (name, slug, description, post_count)
      SELECT 'Equipment Reviews', 'equipment-reviews', 'Reviews and recommendations for detectors and gear', 0
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'equipment-reviews')
    `);
    
    await db.execute(sql`
      INSERT INTO categories (name, slug, description, post_count)
      SELECT 'Location Tips', 'location-tips', 'Share detecting locations and tips', 0
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'location-tips')
    `);
    
    await db.execute(sql`
      INSERT INTO categories (name, slug, description, post_count)
      SELECT 'Wellbeing', 'wellbeing', 'Mental health and community support', 0
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'wellbeing')
    `);
    
    console.log('✅ Database migrations completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    return false;
  }
}
