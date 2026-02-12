import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Eye, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/forum/LikeButton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Post, User, Category } from "@shared/schema";
import { formatTimeAgo, truncateText } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth-simple";
import { apiRequest } from "@/lib/queryClient";
import { removeForumPost } from "@/lib/storageUtils";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ForumPostProps {
  post: Post;
  isLink?: boolean;
}

const ForumPost = ({ post, isLink = true }: ForumPostProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Function to protect user privacy by masking email addresses used as usernames
  const getDisplayName = (username?: string) => {
    if (!username) return "Anonymous";
    
    // Check if username is an email address (improved regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(username)) {
      // Extract the part before @ and mask the domain
      const [localPart, domain] = username.split('@');
      
      // For very short local parts, show 2 characters, otherwise show 3
      const visibleChars = localPart.length <= 4 ? 2 : 3;
      const maskedLocal = localPart.substring(0, visibleChars) + '***';
      
      // Mask domain but keep the extension
      const domainParts = domain.split('.');
      const extension = domainParts[domainParts.length - 1];
      const maskedDomain = '***.' + extension;
      
      return maskedLocal + '@' + maskedDomain;
    }
    
    return username;
  };
  
  // Enhanced user data query with better caching and error handling
  const { data: author, isLoading: isLoadingAuthor, error: authorError } = useQuery<User>({
    queryKey: [`/api/users/${post.userId}`],
    queryFn: async () => {
      console.log(`Fetching author for post ${post.id}, userId: ${post.userId}`);
      const response = await fetch(`/api/users/${post.userId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error(`Failed to fetch user ${post.userId}:`, response.status);
        throw new Error(`Failed to fetch user: ${response.status}`);
      }
      const data = await response.json();
      console.log(`✅ Fetched author for post ${post.id}:`, data.username);
      return data;
    },
    enabled: !!post.userId && post.userId > 0,
    staleTime: 5000,
    retry: 2
  });
  
  // Debug logging for author fetch issues
  useEffect(() => {
    if (post.userId && !author && !isLoadingAuthor) {
      console.log(`⚠️ Failed to fetch author for post ${post.id}, userId: ${post.userId}`, authorError);
    }
  }, [post.id, post.userId, author, isLoadingAuthor, authorError]);

  // Load avatar URL with proper author-specific fallbacks
  useEffect(() => {
    // Only proceed if we have author data AND it matches the post's userId
    if (!author || author.id !== post.userId) return;

    // First check if the author has an avatarUrl in their API data
    if (author.avatarUrl) {
      setUserAvatarUrl(author.avatarUrl);
      return;
    }

    // Try to get avatar from users cache for this specific userId
    try {
      const usersCache = localStorage.getItem('metal_detecting_users_cache');
      if (usersCache) {
        const users = JSON.parse(usersCache);
        const foundUser = users.find((u: any) => u.id === post.userId);
        if (foundUser?.avatarUrl) {
          console.log(`Found avatar in users cache for forum user ${post.userId}`);
          setUserAvatarUrl(foundUser.avatarUrl);
          return;
        }
      }

      // Only for DigQuestor (userId 1), check special profile storage
      if (post.userId === 1 && author.username?.toLowerCase() === "digquestor") {
        const storedPreset = localStorage.getItem('digquestor_profile');
        if (storedPreset) {
          const profile = JSON.parse(storedPreset);
          if (profile?.avatarUrl) {
            console.log("Found avatar in digquestor_profile for forum post");
            setUserAvatarUrl(profile.avatarUrl);
            return;
          }
        }
      }

      // Generate fallback avatar based on the original post author's userId
      const fallbackAvatar = `https://api.dicebear.com/7.x/personas/svg?seed=${post.userId}`;
      setUserAvatarUrl(fallbackAvatar);

    } catch (error) {
      console.error("Error loading author avatar:", error);
      // Generate fallback avatar based on post's userId
      setUserAvatarUrl(`https://api.dicebear.com/7.x/personas/svg?seed=${post.userId}`);
    }
  }, [author, post.userId]);

  const { data: category, isLoading: isLoadingCategory } = useQuery<Category>({
    queryKey: [`/api/categories/${post.categoryId}`],
  });
  
  // Check if current user is the author of this post (ensure both are numbers for comparison)
  const isAuthor = user && post.userId && Number(post.userId) === Number(user.id);
  
  // Handle post deletion
  const handleDeletePost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthor) return;
    
    try {
      // Call the delete API endpoint
      const response = await apiRequest('DELETE', `/api/posts/${post.id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete post');
      }
      
      // Update the posts in the query cache
      queryClient.setQueryData<Post[]>(['/api/posts'], (oldData = []) => {
        const updatedPosts = oldData.filter(p => p.id !== post.id);
        
        // Also update localStorage using our utility function
        removeForumPost(post.id);
        console.log(`Removed post with ID ${post.id} from localStorage`);
        
        return updatedPosts;
      });
      
      // Invalidate any related queries
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      
      toast({
        title: "Post Deleted",
        description: "Your post has been successfully deleted.",
      });
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const postContent = (
    <div className="flex items-start relative mobile-forum-post">
      {isLoadingAuthor ? (
        <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-full mr-3 md:mr-4 flex-shrink-0" />
      ) : (
        <Avatar className="h-10 w-10 md:h-12 md:w-12 mr-3 md:mr-4 bg-sand-beige border border-earth-brown/30 flex-shrink-0">
          <AvatarImage 
            src={userAvatarUrl || author?.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${author?.id || post.userId}`} 
            alt={author?.username || "User"} 
            onError={(e) => {
              // If the avatar fails to load, replace with dicebear avatar
              e.currentTarget.src = `https://api.dicebear.com/7.x/personas/svg?seed=${author?.id || post.userId}`;
            }}
          />
          <AvatarFallback className="bg-earth-brown text-sand-beige">
            {author?.username?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 gap-1 sm:gap-2">
          <h4 className="font-semibold text-earth-brown text-base md:text-lg break-words min-w-0 flex-1">{post.title}</h4>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {isLoadingCategory ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <Badge className="bg-forest-green text-sand-beige text-xs whitespace-nowrap">
                {category?.name || "Category"}
              </Badge>
            )}
            
            {/* Delete button - only show if user is the author */}
            {isAuthor && (
              <Button 
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 flex-shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete post</span>
              </Button>
            )}
          </div>
        </div>
        <p className="text-gray-700 mb-2 text-sm md:text-base break-words overflow-hidden">{truncateText(post.content, 120)}</p>
        
        {/* Display attached image if exists */}
        {post.imageUrl && (
          <div className="mt-3 mb-3">
            <img
              src={post.imageUrl}
              alt="Post attachment"
              className="rounded-lg max-w-full h-auto max-h-64 object-cover border border-gray-200"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center text-forest-green">
            <span className="font-semibold mr-2">
              {isLoadingAuthor ? "Loading..." : getDisplayName(author?.username)}
            </span>
            <span className="text-gray-500">{post.created_at ? formatTimeAgo(post.created_at) : "Recently"}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-500">
            <span className="flex items-center"><MessageSquare className="h-3 w-3 mr-1" /> {post.comments || 0}</span>
            <span className="flex items-center"><Eye className="h-3 w-3 mr-1" /> {post.views || 0}</span>
            <LikeButton 
              postId={post.id} 
              initialLikes={post.likes || 0}
              className="ml-2"
            />
          </div>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeletePost(e as unknown as React.MouseEvent);
                setDeleteDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // Either wrap in a link or just return the content
  return isLink ? (
    <Link href={`/forum/post/${post.id}`}>
      <div className="block p-4 hover:bg-sand-beige/30 transition duration-300 cursor-pointer">
        {postContent}
      </div>
    </Link>
  ) : (
    <Card className="mb-4">
      <CardContent className="p-4">
        {postContent}
      </CardContent>
    </Card>
  );
};

export default ForumPost;
