# AWS S3 CORS Configuration for DigQuest Images

## Your images aren't displaying because S3 needs CORS configuration!

Even with "Block all public access" turned OFF and a bucket policy for public-read, browsers block S3 images without proper CORS headers.

## Steps to Fix CORS:

### 1. Go to AWS S3 Console
- Navigate to: https://s3.console.aws.amazon.com/s3/buckets/digquest-images
- Or search for S3 → click on "digquest-images" bucket

### 2. Click the "Permissions" Tab
(Same tab where you changed "Block public access")

### 3. Scroll Down to "Cross-origin resource sharing (CORS)"
- Click the **"Edit"** button

### 4. Paste This CORS Configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://www.digquest.org",
            "https://digquest.org",
            "http://localhost:5000",
            "http://localhost:5173"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### 5. Click "Save changes"

### 6. Test It
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Go to Finds Gallery
3. Images should now display!

---

## What This Does:
- Allows browsers to load images from your S3 bucket
- Permits GET and HEAD requests (viewing images)
- Works with your production domain (digquest.org) and localhost for development
- Sets a 50-minute cache for CORS preflight requests

## Alternative: Use CloudFront
If CORS still doesn't work, consider using AWS CloudFront CDN which handles CORS automatically and is faster.

---

**After adding CORS, all images should immediately become visible!**
