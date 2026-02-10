import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Edit, Trash2, Check, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatTimeAgo, getAvatarUrl } from '@/lib/utils';
import { Category, insertPostSchema } from "@shared/schema";
import { userCache } from '@/hooks/use-auth-simple';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FindCommentListProps {
  findId: number | null;
}

export function FindCommentList({ findId }: FindCommentListProps) {
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [userAvatarUrls, setUserAvatarUrls] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Function to protect user privacy by masking email addresses used as usernames
  const getDisplayName = (username?: string) => {
    if (!username) return "Unknown User";
    
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

  // Get current user from cache - we'll check ownership in the component
  const currentUserId = 1; // For now, using the logged-in user ID

  // Fetch comments for this find
  const { 
    data: comments, 
    isLoading: isCommentsLoading,
    error: commentsError
  } = useQuery<FindComment[]>({
    queryKey: [`/api/finds/${findId}/comments`],
    enabled: !!findId,
    staleTime: 10 * 1000, // Consider data fresh for 10 seconds
    refetchOnWindowFocus: true,
  });

  // Get all users for mapping user data to comments
  const { 
    data: users,
    isLoading: isUsersLoading
  } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 60 * 1000, // Users data can be fresh for longer
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      const response = await apiRequest('PUT', `/api/find-comments/${commentId}`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/finds/${findId}/comments`] });
      setEditingCommentId(null);
      setEditContent('');
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest('DELETE', `/api/find-comments/${commentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/finds/${findId}/comments`] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Load avatar URLs with fallback to localStorage profiles  
  useEffect(() => {
    if (!users) return;

    const avatarMap: Record<number, string> = {};

    users.forEach(user => {
      // First check if the user has an avatarUrl in their data
      if (user.avatarUrl) {
        avatarMap[user.id] = user.avatarUrl;
        return;
      }

      // For DigQuestor user, check localStorage profiles
      if (user.username?.toLowerCase() === "digquestor") {
        // Try different profile keys in localStorage
        const profileKeys = ['user_profile', 'metal_detecting_user', 'digquestor_profile'];
        
        for (const key of profileKeys) {
          try {
            const storedProfile = localStorage.getItem(key);
            if (storedProfile) {
              const profile = JSON.parse(storedProfile);
              if (profile?.avatarUrl) {
                console.log(`Found avatar in ${key} for find comments`);
                avatarMap[user.id] = profile.avatarUrl;
                return;
              }
            }
          } catch (error) {
            console.error(`Error parsing ${key}:`, error);
          }
        }
      }
    });

    setUserAvatarUrls(avatarMap);
  }, [users]);

  // Find user data for a comment
  const getUserForComment = (userId: number) => {
    // First try to get from API-fetched users
    const apiUser = users?.find(user => user.id === userId);
    if (apiUser) return apiUser;
    
    // If not found from API, try to get from cache
    const cachedUser = userCache.getUserById(userId);
    if (cachedUser) return cachedUser;
    
    // Finally fallback to null
    return null;
  };

  if (isCommentsLoading || isUsersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[100px] w-full rounded-md" />
        <Skeleton className="h-[100px] w-full rounded-md" />
      </div>
    );
  }

  if (commentsError) {
    return (
      <div className="text-center py-4 text-red-500">
        <p>Failed to load comments. Please try again later.</p>
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md">
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  const handleEditStart = (comment: FindComment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleEditSave = () => {
    if (editingCommentId && editContent.trim()) {
      updateCommentMutation.mutate({
        commentId: editingCommentId,
        content: editContent.trim()
      });
    }
  };

  const handleDelete = (commentId: number) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  return (
    <div className="space-y-6">
      {comments.map((comment) => {
        const user = getUserForComment(comment.userId);
        const isOwner = comment.userId === currentUserId;
        const isEditing = editingCommentId === comment.id;
        
        return (
          <div key={comment.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={userAvatarUrls[comment.userId] || user?.avatarUrl || getAvatarUrl(comment.userId)} 
                  alt={user?.username || 'User'} 
                />
                <AvatarFallback>
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h4 className="font-semibold text-forest-green">
                    {getDisplayName(user?.username)}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(comment.created_at || new Date())}
                    </span>
                    {isOwner && !isEditing && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditStart(comment)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(comment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Edit your comment..."
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleEditSave}
                        disabled={!editContent.trim() || updateCommentMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditCancel}
                        disabled={updateCommentMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-gray-700 whitespace-pre-line">
                    {comment.content}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
