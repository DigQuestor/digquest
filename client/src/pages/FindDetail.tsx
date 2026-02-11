import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { ArrowLeft, MapPin, User, Calendar, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, getPeriodBadgeColor, formatLocation } from "@/lib/utils";
import { Find, User as UserType } from "@shared/schema";
import { FindCommentForm } from "@/components/finds/FindCommentForm";
import { FindCommentList } from "@/components/finds/FindCommentList";

const FindDetail = () => {
  const [, params] = useRoute("/finds/:id");
  const findId = params?.id ? parseInt(params.id) : null;
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const { data: find, isLoading, error } = useQuery<Find>({
    queryKey: ['/api/finds/' + findId],
    enabled: !!findId, // Only run query if findId exists
  });

  // Get user data for the find
  const { data: user, isLoading: isUserLoading } = useQuery<UserType>({
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
        <title>{find.title} | Metal Detecting Wellbeing</title>
        <meta name="description" content={find.description || `Details about ${find.title} - a find from the Metal Detecting Wellbeing community.`} />
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
            <div>
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
          </div>
        </div>

        {/* Find image */}
        <div className="relative">
          <img 
            src={find.imageUrl} 
            alt={find.title} 
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
                    alt={user.username}
                  />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-forest-green">{user.username}</p>
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
    </div>
  );
};

export default FindDetail;