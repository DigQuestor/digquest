import { storage } from './storage';

export async function generateSitemap(): Promise<string> {
  const baseUrl = 'https://digquest.org';
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Static pages
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/forum', priority: '0.9', changefreq: 'daily' },
    { url: '/finds-gallery', priority: '0.9', changefreq: 'daily' },
    { url: '/ar-routes', priority: '0.8', changefreq: 'weekly' },
    { url: '/diggers-match', priority: '0.8', changefreq: 'weekly' },
    { url: '/wellbeing', priority: '0.7', changefreq: 'monthly' },
  ];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages
  for (const page of staticPages) {
    sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  try {
    // Add dynamic forum posts
    const posts = await storage.getAllPosts();
    for (const post of posts.slice(0, 100)) { // Limit to latest 100 posts
      sitemap += `
  <url>
    <loc>${baseUrl}/forum/post/${post.id}</loc>
    <lastmod>${post.created_at?.toISOString().split('T')[0] || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    // Add finds
    const finds = await storage.getAllFinds();
    for (const find of finds.slice(0, 100)) { // Limit to latest 100 finds
      sitemap += `
  <url>
    <loc>${baseUrl}/finds/${find.id}</loc>
    <lastmod>${find.created_at?.toISOString().split('T')[0] || currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap content:', error);
  }

  sitemap += `
</urlset>`;

  return sitemap;
}