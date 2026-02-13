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
import EditFindForm from "@/components/finds/EditFindForm";
import { FindLikeButton } from "@/components/finds/FindLikeButton";
import { removeFindFromStorage } from "@/lib/storageUtils";

type TreasureFind = Find & {
  title?: string;
  period?: string | null;
  imageUrl?: string | null;
  location?: string | null;
  likes?: number | null;
  username?: string;
};

type TreasureUser = User & {
  avatarUrl?: string | null;
  username?: string;
};

interface TreasureCardProps {
  find: TreasureFind;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // Use state to store user avatar URL
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  
  // Make sure to request the correct user for this find
  // Use enabled: !!find.userId to prevent query from running with invalid userId
  const { data: user, isError: userError } = useQuery<TreasureUser>({
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

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to find detail
    e.stopPropagation(); // Prevent event bubbling
    setDeleteDialogOpen(true);
  };
  
  // Handle find deletion
  const handleDelete = () => {
      // Call the API to delete the find
      fetch(`/api/finds/${find.id}?userId=${currentUser?.id}`, {
        method: 'DELETE',
      })
        .then(async (response) => {
          if (response.ok) {
            // Show success toast
            toast({
              title: "✅ Find Deleted Successfully",
              description: "Your find has been permanently removed from the gallery.",
              className: "bg-green-600 text-white border-green-700 font-semibold shadow-xl",
              duration: 3000,
            });
            
            // Invalidate and refetch finds query to update the UI
            queryClient.invalidateQueries({ queryKey: ['/api/finds'] });
            
            // Also remove from local storage to keep things in sync
            removeFindFromStorage(find.id);
          } else {
            // Show error toast with message from API
            const errorData = await response.json();
            toast({
              title: "❌ Error",
              description: errorData.message || "Failed to delete find",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          console.error("Error deleting find:", error);
          toast({
            title: "❌ Error",
            description: "An unexpected error occurred while deleting the find.",
            variant: "destructive",
          });
        });
  };

  return (
    <>
      <div className="treasure-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 w-full h-80 flex flex-col relative">
        <Link href={`/finds/${find.id}`} className="block">
          {/* Card-style photo area */}
          <div className="aspect-[4/3] w-full bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
            {find.imageUrl ? (
              <img 
                src={find.imageUrl} 
                alt={find.title} 
                className="w-full h-full object-contain object-center"
                loading="lazy"
                onError={(e) => {
                  console.error(`❌ Failed to load image for find ${find.id}:`, find.imageUrl);
                  console.error('Find object:', find);
                  // Show a clear error message in place of the image
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.image-error-message')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'image-error-message absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-4 text-center';
                    errorDiv.innerHTML = `
                      <div class="text-red-600 font-bold text-lg mb-2">⚠️ Image Can't Load</div>
                      <div class="text-red-800 text-sm mb-1">Image uploaded but browser blocked it</div>
                      <div class="text-red-700 text-xs font-bold">AWS S3 needs CORS configured!</div>
                      <div class="text-red-600 text-xs mt-1">See AWS_S3_CORS_SETUP.md</div>
                    `;
                    parent.appendChild(errorDiv);
                  }
                }}
                onLoad={() => {
                  console.log(`✅ Successfully loaded image for find ${find.id}:`, find.imageUrl);
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50 p-4 text-center">
                <div className="text-amber-600 font-bold text-lg mb-2">📷 No Image</div>
                <div className="text-amber-800 text-sm">This find was uploaded without an image</div>
              </div>
            )}
            
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
                  onClick={handleDeleteClick}
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
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>Permanently Delete This Find?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base space-y-3">
              <div className="bg-gray-100 p-3 rounded border border-gray-300">
                <p className="font-bold text-lg text-gray-900">"{find.title}"</p>
              </div>
              <div className="bg-red-50 p-4 rounded border-2 border-red-300">
                <p className="font-semibold text-red-800 text-base mb-2">⚠️ This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1 text-red-700">
                  <li>The find and its image</li>
                  <li>All comments and interactions</li>
                  <li>All likes received</li>
                </ul>
                <p className="mt-3 font-bold text-red-900">This action CANNOT be undone!</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold text-base">No, Keep This Find</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-base"
            >
              Yes, Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto sm:max-h-[600px]">
          <div className="relative">
            <DialogTitle className="text-earth-brown font-display text-2xl">Edit Your Find</DialogTitle>
            <DialogDescription>
              Update the details of your metal detecting discovery.
            </DialogDescription>
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-gray-200 hover:bg-gray-300 p-2 shadow focus:outline-none"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="pb-10">
              {find && (
                <EditFindForm 
                  find={find} 
                  onFindUpdated={handleFindUpdated} 
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TreasureCard;