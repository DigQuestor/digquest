import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, MapPin, User, Calendar, MessageCircle, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatDate, getPeriodBadgeColor, formatLocation } from "@/lib/utils";
import { Find, User as UserType } from "@shared/schema";
import { FindCommentForm } from "@/components/finds/FindCommentForm";
import { FindCommentList } from "@/components/finds/FindCommentList";
import { useAuth } from "@/hooks/use-auth-simple";
import { useToast } from "@/hooks/use-toast";

type DetailFind = Find & {
  title?: string;
  description?: string | null;
  location?: string | null;
  period?: string | null;
  created_at?: string | Date | null;
  imageUrl?: string | null;
};

type DetailUser = UserType & {
  username?: string;
  avatarUrl?: string | null;
  created_at?: string | Date | null;
};

const FindDetail = () => {
  const [, params] = useRoute<{ id: string }>("/finds/:id");
  const [, setLocation] = useLocation();
  const findId = params?.id ? Number.parseInt(params.id, 10) : null;
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: find, isLoading, error } = useQuery<DetailFind>({
    queryKey: ['/api/finds/' + findId],
    enabled: !!findId, // Only run query if findId exists
  });

  // Get user data for the find
  const { data: user, isLoading: isUserLoading } = useQuery<DetailUser>({
    queryKey: ['/api/users/' + find?.userId],
    enabled: !!find?.userId, // Only run query if find.userId exists
  });

  // Get actual comment count by fetching comments
  const { data: comments } = useQuery<any[]>({
    queryKey: [`/api/finds/${findId}/comments`],
    enabled: !!findId,
    staleTime: 0, // Always fetch fresh comment data
  });

  // Load avatar URL with fallback to localStorage profiles
  useEffect(() => {
    if (!user) return;

    // First check if the user has an avatarUrl in their data
    if (user.avatarUrl) {
      setUserAvatarUrl(user.avatarUrl);
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
              console.log(`Found avatar in ${key} for find detail`);
              setUserAvatarUrl(profile.avatarUrl);
              return;
            }
          }
        } catch (error) {
          console.error(`Error parsing ${key}:`, error);
        }
      }
    }

    // No avatar found, will fall back to dicebear
    setUserAvatarUrl(null);
  }, [user]);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check if current user is the owner of this find
  const isOwner = currentUser?.id === find?.userId;

  // Handle find deletion
  const handleDelete = () => {
    if (!findId || !currentUser?.id) return;

    fetch(`/api/finds/${findId}?userId=${currentUser.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(async (response) => {
        if (response.ok) {
          toast({
            title: "✅ Find Deleted Successfully",
            description: "Your find has been permanently removed from the gallery.",
            className: "bg-green-600 text-white border-green-700 font-semibold shadow-xl",
            duration: 3000,
          });

          // Invalidate finds query
          queryClient.invalidateQueries({ queryKey: ['/api/finds'] });

          // Redirect to finds gallery
          setTimeout(() => {
            setLocation('/finds');
          }, 1500);
        } else {
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Loading Find... | Metal Detecting Wellbeing</title>
          <link rel="canonical" href="https://digquest.org/finds" />
        </Helmet>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-5 w-32 mb-6" />
          <Skeleton className="h-96 w-full mb-6" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (error || !find) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Find Not Found | Metal Detecting Wellbeing</title>
          <link rel="canonical" href="https://digquest.org/finds" />
        </Helmet>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-earth-brown mb-4">Find Not Found</h1>
          <p className="text-gray-600 mb-6">The find you're looking for could not be found or doesn't exist.</p>
          <Link href="/finds">
            <Button className="bg-forest-green hover:bg-meadow-green text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Finds Gallery
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{find.title || "Find Details"} | Metal Detecting Wellbeing</title>
        <meta name="description" content={find.description || `Details about ${find.title || "this find"} - a find from the Metal Detecting Wellbeing community.`} />
        <link rel="canonical" href={`https://digquest.org/finds/${findId}`} />
      </Helmet>

      {/* Back button */}
      <div className="mb-6">
        <Link href="/finds">
          <Button variant="outline" className="text-forest-green hover:text-meadow-green">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Finds Gallery
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Find header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-earth-brown mb-2">{find.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <Badge className={getPeriodBadgeColor(find.period || 'Unknown')}>
                  {find.period || 'Unknown Period'}
                </Badge>
                <div className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>{formatLocation(find.location || "Unknown location")}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>{formatDate(find.created_at || new Date())}</span>
                </div>
              </div>
            </div>
            {/* Delete button - only shown to the owner */}
            {isOwner && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Find
              </Button>
            )}
          </div>
        </div>

        {/* Find image */}
        <div className="relative">
          <img 
            src={find.imageUrl || "https://images.unsplash.com/photo-1589656966895-2f33e7653819?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800"} 
            alt={find.title || "Find image"} 
            className="w-full h-full max-h-[500px] object-contain bg-gray-100 p-4"
            onError={(e) => {
              console.error(`❌ Failed to load image in FindDetail for find ${findId}:`, find.imageUrl);
              console.error('Find object:', find);
              // Fallback image if the actual image fails to load
              e.currentTarget.src = "https://images.unsplash.com/photo-1589656966895-2f33e7653819?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800";
            }}
            onLoad={() => {
              console.log(`✅ Successfully loaded image in FindDetail for find ${findId}:`, find.imageUrl);
            }}
          />
        </div>

        {/* Find description and details */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-forest-green mb-4">About this find</h2>
          <p className="text-gray-700 mb-8 whitespace-pre-line">
            {find.description || "No description provided"}
          </p>

          {/* User info */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-earth-brown mb-4">Posted by</h3>
            {isUserLoading ? (
              <div className="flex items-center">
                <Skeleton className="h-12 w-12 rounded-full mr-3" />
                <Skeleton className="h-5 w-40" />
              </div>
            ) : user ? (
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarImage
                    src={userAvatarUrl || user.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${user.id}`}
                    alt={user.username || "User"}
                  />
                  <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-forest-green">{user.username || "Unknown User"}</p>
                  <p className="text-sm text-gray-600">Member since {formatDate(user.created_at || new Date())}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-forest-green">Unknown User</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Comments section */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-xl font-bold text-forest-green mb-6 flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              Comments
            </h3>
            
            {/* Comment form */}
            {findId && <FindCommentForm findId={findId} />}
            
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-earth-brown mb-4">
                {comments?.length || 0} {(comments?.length || 0) === 1 ? 'Comment' : 'Comments'}
              </h4>
              
              {/* Comment list */}
              {findId && <FindCommentList findId={findId} />}
            </div>
          </div>
        </div>
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
                  <li>All {comments?.length || 0} comment{comments?.length !== 1 ? 's' : ''}</li>
                  <li>All likes and interactions</li>
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
    </div>
  );
};

export default FindDetail;