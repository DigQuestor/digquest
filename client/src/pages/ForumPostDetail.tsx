import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Post, Comment, User, Category } from "@shared/schema";
import { ArrowLeft, Send, ChevronDown, MessageSquare, Calendar, Share, Loader2, Trash2, Edit2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { removeForumPost } from "@/lib/storageUtils";
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
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth-simple";
import { useToast } from "@/hooks/use-toast";
import { getAvatarUrl, formatDate, formatTimeAgo } from "@/lib/utils";

const ForumPostDetail = () => {
  const [, params] = useRoute("/forum/post/:id");
  const postId = params?.id ? parseInt(params.id) : 0;
  const [commentText, setCommentText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [commentDeleteDialogOpen, setCommentDeleteDialogOpen] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  if (!postId) {
    return <div className="container mx-auto px-4 py-8">Post not found</div>;
  }
  
  // Find post from local cache first
  const cachedPosts = queryClient.getQueryData<Post[]>(['/api/posts']) || [];
  const cachedPost = cachedPosts.find(post => post.id === postId);
  
  // Fetch post details (or use cached data)
  const { data: post, isLoading: isLoadingPost } = useQuery<Post>({
    queryKey: [`/api/posts/${postId}`],
    initialData: cachedPost,
  });
  
  // Fetch post author
  const { data: author, isLoading: isLoadingAuthor } = useQuery<User>({
    queryKey: [`/api/users/${post?.userId}`],
    enabled: !!post?.userId,
  });
  
  // Fetch post category
  const { data: category, isLoading: isLoadingCategory } = useQuery<Category>({
    queryKey: [`/api/categories/${post?.categoryId}`],
    enabled: !!post?.categoryId,
  });
  
  // Fetch comments
  const { data: comments, isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${postId}/comments`],
    enabled: !!postId,
  });
  
  // Create a map to cache comment authors
  const [commentAuthors, setCommentAuthors] = useState<Record<number, User>>({});
  
  // Fetch comment authors when comments are loaded
  useEffect(() => {
    if (!comments || comments.length === 0) return;
    
    // Helper function to fetch a single user
    const fetchUser = async (userId: number) => {
      // Skip if we already have this user's data
      if (commentAuthors[userId]) return;
      
      try {
        const response = await apiRequest("GET", `/api/users/${userId}`);
        const userData = await response.json();
        
        if (userData) {
          // Add user data to our cache
          setCommentAuthors(prev => ({
            ...prev,
            [userId]: userData
          }));
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
      }
    };
    
    // Create a Set of unique user IDs manually
    const userIdsSet = new Set<number>();
    for (const comment of comments) {
      userIdsSet.add(comment.userId);
    }
    
    // Fetch each user
    for (const userId of userIdsSet) {
      fetchUser(userId);
    }
  }, [comments]);
  
  // Handle post deletion
  const handleDeletePost = async () => {
    if (!user || !post) return;
    
    // Check if the user has permission to delete this post
    const isAuthor = user.id === post.userId;
    if (!isAuthor) {
      toast({
        title: "Permission Denied",
        description: "You can only delete your own posts.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Call the delete API endpoint
      const response = await apiRequest('DELETE', `/api/posts/${postId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete post');
      }
      
      // Update the posts in the query cache
      queryClient.setQueryData<Post[]>(['/api/posts'], (oldData = []) => {
        const updatedPosts = oldData.filter(p => p.id !== postId);
        
        // Also update localStorage using our utility function
        removeForumPost(postId);
        console.log(`Removed post with ID ${postId} from localStorage`);
        
        return updatedPosts;
      });
      
      // Invalidate categories to update counts
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      
      toast({
        title: "Post Deleted",
        description: "Your post has been successfully deleted.",
      });
      
      // Navigate back to the forum
      setLocation('/forum');
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !commentText.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    
    try {
      const newComment = {
        postId: postId,
        userId: user.id,
        content: commentText.trim()
      };
      
      const response = await apiRequest("POST", "/api/comments", newComment);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit comment');
      }
      
      const createdComment = await response.json();
      
      // Update comment count on post
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      // Update posts list to refresh comment counts on forum page
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      // Clear comment input
      setCommentText("");
      
      toast({
        title: "Comment Posted",
        description: "Your comment has been posted successfully.",
      });
      
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Comment Failed",
        description: error.message || "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId || !editCommentText.trim()) return;

    try {
      await apiRequest("PUT", `/api/comments/${editingCommentId}`, {
        content: editCommentText.trim()
      });

      // Update the comment in the cache
      queryClient.setQueryData<Comment[]>([`/api/posts/${postId}/comments`], (old = []) => 
        old.map(comment => 
          comment.id === editingCommentId 
            ? { ...comment, content: editCommentText.trim() }
            : comment
        )
      );

      setEditingCommentId(null);
      setEditCommentText("");

      toast({
        title: "Comment Updated",
        description: "Your comment has been successfully updated.",
      });
    } catch (error: any) {
      console.error("Error updating comment:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  const handleDeleteComment = (commentId: number) => {
    setDeletingCommentId(commentId);
    setCommentDeleteDialogOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!deletingCommentId) return;

    try {
      await apiRequest("DELETE", `/api/comments/${deletingCommentId}`);

      // Invalidate caches to fetch updated data from server
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
      // Update posts list to refresh comment counts on forum page
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });

      setCommentDeleteDialogOpen(false);
      setDeletingCommentId(null);

      toast({
        title: "Comment Deleted",
        description: "Your comment has been successfully deleted.",
      });
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoadingPost) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest-green" />
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-600">Post not found</h1>
        <p className="mt-2">The post you're looking for does not exist or has been removed.</p>
        <Link href="/forum">
          <Button className="mt-4 bg-forest-green hover:bg-green-800 text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forum
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} | DigQuest Forum</title>
        <meta name="description" content={`Join the discussion about ${post.title} in the DigQuest metal detecting forum.`} />
        <link rel="canonical" href={`https://digquest.org/forum/post/${postId}`} />
      </Helmet>
      
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link href="/forum">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forum
              </Button>
            </Link>
            
            {/* Only show delete button if user is the author */}
            {user && post && user.id === post.userId && (
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Post
              </Button>
            )}
          </div>
          
          <Card className="shadow-md">
            <CardHeader className="flex flex-col space-y-2">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10 border-2 border-metallic-gold">
                  <AvatarImage src={author?.avatarUrl || getAvatarUrl(author?.username || 'user')} />
                  <AvatarFallback className="bg-forest-green text-white">
                    {author?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{author?.username || 'Unknown User'}</p>
                  <p className="text-sm text-gray-500">{post.created_at ? formatDate(post.created_at) : 'Recently'}</p>
                </div>
              </div>
              <CardTitle className="text-2xl text-earth-brown">{post.title}</CardTitle>
              {category && (
                <Badge className="self-start bg-forest-green hover:bg-forest-green/90 text-white">
                  {category.name}
                </Badge>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="prose prose-earth-brown max-w-none">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
              
              <div className="mt-6 flex items-center text-sm text-gray-500">
                <div className="flex items-center mr-4">
                  <Calendar className="h-4 w-4 mr-1" />
                  {post.created_at ? formatTimeAgo(post.created_at) : 'Recently'}
                </div>
                <div className="flex items-center mr-4">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {post.comments || 0} comments
                </div>
                <div className="flex items-center">
                  <Share className="h-4 w-4 mr-1" />
                  {post.views || 0} views
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <h2 className="text-xl font-semibold text-earth-brown mb-4">Comments {comments?.length ? `(${comments.length})` : ''}</h2>
        
        {isAuthLoading ? (
          <Card className="shadow-md mb-6">
            <CardContent className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-forest-green" />
            </CardContent>
          </Card>
        ) : user ? (
          <Card className="shadow-md mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleCommentSubmit}>
                <Textarea
                  placeholder="Share your thoughts..."
                  className="resize-none mb-3"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-forest-green hover:bg-green-800 text-white"
                    disabled={!commentText.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md mb-6 bg-gray-50">
            <CardContent className="py-4 text-center">
              <p className="text-gray-600">Please <Link href="/login" className="text-forest-green hover:underline">log in</Link> to comment on this post.</p>
            </CardContent>
          </Card>
        )}
        
        {isLoadingComments ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map(comment => (
              <Card key={comment.id} className="shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarImage 
                        src={commentAuthors[comment.userId]?.avatarUrl || getAvatarUrl(commentAuthors[comment.userId]?.username || 'user')} 
                      />
                      <AvatarFallback className="bg-forest-green/80 text-white text-xs">
                        {commentAuthors[comment.userId]?.username?.substring(0, 1).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm">
                          {commentAuthors[comment.userId]?.username || `User #${comment.userId}`}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{comment.created_at ? formatTimeAgo(comment.created_at) : 'Recently'}</span>
                          {user && comment.userId === user.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                                  <Edit2 className="mr-2 h-3 w-3" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-3 w-3" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="min-h-[60px]"
                            placeholder="Edit your comment..."
                          />
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={handleSaveEdit}
                              disabled={!editCommentText.trim()}
                              className="bg-forest-green hover:bg-green-800"
                            >
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm bg-gray-50">
            <CardContent className="py-6 text-center">
              <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No comments yet. Be the first to contribute to this discussion!</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <span>⚠️</span> Permanently Delete This Post?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base space-y-3">
              <div className="p-2 bg-gray-100 rounded border border-gray-300">
                <p className="font-semibold text-gray-900">"{post?.title}"</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="font-semibold text-red-900 mb-2">This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                  <li>Your forum post{post?.imageUrl ? ' and attached image' : ''}</li>
                  <li>All comments on this post ({post?.comments || 0})</li>
                  <li>All likes on this post ({post?.likes || 0})</li>
                </ul>
              </div>
              <p className="font-bold text-gray-900">This action CANNOT be undone!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-semibold">No, Keep This Post</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePost}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Yes, Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comment delete confirmation dialog */}
      <AlertDialog open={commentDeleteDialogOpen} onOpenChange={setCommentDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteComment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ForumPostDetail;