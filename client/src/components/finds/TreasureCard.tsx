import { Link } from "wouter";
import { MapPin, MessageCircle, Trash2, Edit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Find, User } from "@shared/schema";
import { getPeriodBadgeColor, formatLocation } from "@/lib/utils";
import { useAuth, findStorage } from "@/hooks/use-auth-simple";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import EditFindForm from "@/components/finds/EditFindForm";
import { FindLikeButton } from "@/components/finds/FindLikeButton";

interface TreasureCardProps {
  find: Find;
}

const TreasureCard = ({ find }: TreasureCardProps) => {
  const { user: currentUser } = useAuth();
  
  // Get actual comment count by fetching comments
  const { data: comments } = useQuery<any[]>({
    queryKey: [`/api/finds/${find.id}/comments`],
    enabled: !!find.id,
    staleTime: 0, // Always fetch fresh comment data
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  // Use state to store user avatar URL
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  
  // Make sure to request the correct user for this find
  // Use enabled: !!find.userId to prevent query from running with invalid userId
  const { data: user, isError: userError } = useQuery<User>({
    queryKey: [`/api/users/${find.userId}`],
    enabled: !!find.userId,
    staleTime: 1000 * 60 * 5, // Cache user data for 5 minutes
    // Don't refetch on window focus to prevent switching users when tab refocuses
    refetchOnWindowFocus: false
  });
  
  // Try to get username from localStorage if API query fails
  const [username, setUsername] = useState<string | undefined>();

  // Add useEffect to load avatar URL when user data changes
  // Effect to get username from localStorage if API fails
  useEffect(() => {
    if (userError || !find.userId) {
      // If API fails or no userId, try to get username from localStorage
      try {
        // First check if the find itself has a username property (from localStorage)
        if ((find as any).username) {
          setUsername((find as any).username);
          return;
        }
        
        // Try to look up different user records in localStorage
        const storedUsers = localStorage.getItem('metal_detecting_users');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const foundUser = users.find((u: any) => u.id === find.userId);
          if (foundUser?.username) {
            setUsername(foundUser.username);
            return;
          }
        }
        
        // If we still don't have a username, format a user ID display
        if (find.userId !== 1) {
          // Only if it's not user ID 1 (to avoid default "DigQuestor" for all)
          setUsername(`User #${find.userId}`);
        }
      } catch (error) {
        console.error("Error getting username from localStorage:", error);
      }
    }
  }, [userError, find.userId, find]);

  // Effect to handle avatar URLs
  useEffect(() => {
    // For DigQuestor (userId 1), use the updated avatar from API or fallback to generated avatar
    if (find.userId === 1) {
      // Try to get DigQuestor's avatar from API first
      if (user && user.id === 1 && user.avatarUrl) {
        console.log(`DigQuestor avatar loaded successfully with URL:`, user.avatarUrl);
        setUserAvatarUrl(user.avatarUrl);
        return;
      }
      
      // If API data not available, try users cache
      try {
        const usersCache = localStorage.getItem('metal_detecting_users_cache');
        if (usersCache) {
          const users = JSON.parse(usersCache);
          const digquestor = users.find((u: any) => u.id === 1);
          if (digquestor?.avatarUrl) {
            console.log(`Found DigQuestor avatar in cache:`, digquestor.avatarUrl);
            setUserAvatarUrl(digquestor.avatarUrl);
            return;
          }
        }
      } catch (error) {
        console.error("Error loading DigQuestor from cache:", error);
      }
      
      // Fallback to generated avatar
      const fallbackAvatar = "https://api.dicebear.com/7.x/personas/svg?seed=DigQuestor";
      console.log(`Using fallback avatar for DigQuestor:`, fallbackAvatar);
      setUserAvatarUrl(fallbackAvatar);
      return;
    }
    
    // For other users, use API data if available
    if (user && user.id === find.userId && user.avatarUrl) {
      console.log(`Using API avatar for user ${find.userId}:`, user.avatarUrl);
      setUserAvatarUrl(user.avatarUrl);
      return;
    }
    
    // Try users cache for other users
    try {
      const usersCache = localStorage.getItem('metal_detecting_users_cache');
      if (usersCache) {
        const users = JSON.parse(usersCache);
        const foundUser = users.find((u: any) => u.id === find.userId);
        if (foundUser?.avatarUrl) {
          console.log(`Found avatar in users cache for user ${find.userId}`);
          setUserAvatarUrl(foundUser.avatarUrl);
          return;
        }
      }
    } catch (error) {
      console.error("Error loading from users cache:", error);
    }
    
    // Generate fallback avatar for users other than DigQuestor
    const fallbackAvatar = `https://api.dicebear.com/7.x/personas/svg?seed=${find.userId}`;
    setUserAvatarUrl(fallbackAvatar);
    
  }, [user, find.userId]);

  // Check if current user is the owner of this find
  const isOwner = currentUser?.id === find.userId;
  
  // Handle successful find update
  const handleFindUpdated = () => {
    setIsEditOpen(false);
    toast({
      title: "Find updated",
      description: "Your find has been successfully updated.",
      variant: "default",
    });
    // Invalidate and refetch finds query to update the UI
    queryClient.invalidateQueries({ queryKey: ['/api/finds'] });
  };
  
  // Handle edit button click
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to find detail
    e.stopPropagation(); // Prevent event bubbling
    setIsEditOpen(true);
  };

  // Handle find deletion
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to find detail
    e.stopPropagation(); // Prevent event bubbling

    if (confirm("Are you sure you want to delete this find? This action cannot be undone.")) {
      // Call the API to delete the find
      fetch(`/api/finds/${find.id}?userId=${currentUser?.id}`, {
        method: 'DELETE',
      })
        .then(async (response) => {
          if (response.ok) {
            // Show success toast
            toast({
              title: "Find deleted",
              description: "Your find has been successfully deleted.",
              variant: "default",
            });
            
            // Invalidate and refetch finds query to update the UI
            queryClient.invalidateQueries({ queryKey: ['/api/finds'] });
            
            // Also remove from local storage to keep things in sync
            import('@/lib/storageUtils').then(({ removeFindFromStorage }) => {
              removeFindFromStorage(find.id);
            });
          } else {
            // Show error toast with message from API
            const errorData = await response.json();
            toast({
              title: "Error",
              description: errorData.message || "Failed to delete find",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          console.error("Error deleting find:", error);
          toast({
            title: "Error",
            description: "There was a problem deleting your find. Please try again.",
            variant: "destructive",
          });
        });
    }
  };

  return (
    <>
      <div className="treasure-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 w-full h-80 flex flex-col relative">
        <Link href={`/finds/${find.id}`} className="block">
          {/* Card-style photo area */}
          <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
            <img 
              src={find.imageUrl} 
              alt={find.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback image if the actual image fails to load
                e.currentTarget.src = "https://images.unsplash.com/photo-1589656966895-2f33e7653819?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300";
              }}
            />
            
            {/* Period badge in corner like a card suit */}
            <div className="absolute top-3 right-3">
              <Badge className={`${getPeriodBadgeColor(find.period || 'Unknown')} text-xs px-2 py-1 shadow-sm`}>
                {find.period || 'Unknown'}
              </Badge>
            </div>
            
            {/* Edit and Delete buttons - only shown to the owner */}
            {isOwner && (
              <div className="absolute top-2 left-2 flex gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-7 h-7 rounded-full opacity-80 hover:opacity-100 bg-white shadow-sm"
                  onClick={handleEdit}
                  title="Edit this find"
                >
                  <Edit className="h-3 w-3 text-earth-brown" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="w-7 h-7 rounded-full opacity-80 hover:opacity-100 shadow-sm"
                  onClick={handleDelete}
                  title="Delete this find"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Card-style info area */}
          <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
            {/* Title */}
            <h3 className="font-display text-lg font-bold text-earth-brown text-center truncate">
              {find.title}
            </h3>
            
            {/* User info - compact */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <Avatar className="w-6 h-6">
                <AvatarImage
                  src={userAvatarUrl || user?.avatarUrl || undefined}
                  alt={user?.username || "User"}
                  onError={(e) => {
                    console.error("Failed to load avatar image:", e.currentTarget.src);
                    e.currentTarget.src = `https://api.dicebear.com/7.x/personas/svg?seed=${user?.id || find.userId}`;
                  }}
                />
                <AvatarFallback className="text-xs">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-forest-green text-sm">
                {user?.username || username || (find.userId ? `User #${find.userId}` : "Anonymous")}
              </span>
            </div>
            
            {/* Location, comments, and likes - compact row */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <div className="flex items-center">
                <MapPin className="mr-1 h-3 w-3 text-rust-orange" />
                <span className="truncate max-w-16">{formatLocation(find.location || "Unknown")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <MessageCircle className="mr-1 h-3 w-3" />
                  <span>{comments?.length || 0}</span>
                </div>
                <FindLikeButton 
                  findId={find.id} 
                  initialLikes={find.likes || 0}
                  className="text-gray-500 hover:text-red-500"
                />
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto sm:max-h-[600px]">
          <DialogTitle className="text-earth-brown font-display text-2xl">Edit Your Find</DialogTitle>
          <DialogDescription>
            Update the details of your metal detecting discovery.
          </DialogDescription>
          <div className="pb-10"> {/* Added padding to ensure save button is visible */}
            {find && (
              <EditFindForm 
                find={find} 
                onFindUpdated={handleFindUpdated} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TreasureCard;