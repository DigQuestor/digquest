import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Star, Users, CalendarDays, Plus, Award, MessageSquare, MapPin, Camera, Info, Shovel } from "lucide-react";
import { Post, User, Category, Event } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ForumPost from "@/components/forum/ForumPost.tsx";
import NewPostForm from "@/components/forum/NewPostForm.tsx";
import NewEventForm from "@/components/events/NewEventForm.tsx";
import EventCard from "@/components/events/EventCard.tsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth-simple";
import { getStoredForumPosts, getStoredEvents, saveEventsToStorage } from "@/lib/storageUtils";

const CommunitySection = () => {
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [mergedPosts, setMergedPosts] = useState<Post[]>([]);

  // Light cache management - only clear if needed
  useEffect(() => {
    // Only clear cache once per session, not on every mount
    const sessionKey = 'cache_cleared_this_session';
    if (!sessionStorage.getItem(sessionKey)) {
      queryClient.removeQueries({ queryKey: ['/api/users'] });
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, []);

  // Listen for auth changes to refresh community members when profile is updated
  useEffect(() => {
    const handleAuthChange = async () => {
      console.log("Auth change detected in CommunitySection, refreshing users...");
      // Force refetch to get latest user data including updated avatars
      await refetchUsers();
      console.log("Users refetched successfully");
    };
    
    window.addEventListener('auth-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, [refetchUsers]);

  const { data: posts, isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchInterval: false
  });
  
  // Effect to merge posts from API with posts from localStorage
  useEffect(() => {
    try {
      // Always check localStorage first to ensure we have data even if API fails
      const storedPosts = getStoredForumPosts();
      console.log("Found stored posts in localStorage:", storedPosts.length);
      
      // Create a map for easy lookup and deduplication
      const postsMap = new Map<number, Post>();
      
      // Start with localStorage posts as a base (in case API fails or returns nothing)
      storedPosts.forEach((post: Post) => {
        // Validate post object before using
        if (post && post.id && post.title && post.content) {
          postsMap.set(post.id, post);
        }
      });
      
      // Then add API posts if available
      if (posts && Array.isArray(posts)) {
        posts.forEach((post: Post) => {
          if (post && post.id) {
            postsMap.set(post.id, post);
          }
        });
      } else {
        // If API posts are not available, log it but continue with localStorage posts
        console.log("No posts received from API, using localStorage posts only");
      }
      
      // Convert map back to array
      const allPosts = Array.from(postsMap.values());
      
      // Sort by most recent first (with more robust date handling)
      allPosts.sort((a: Post, b: Post) => {
        // Ensure we have valid dates to work with
        const dateAStr = a.created_at || new Date().toISOString();
        const dateBStr = b.created_at || new Date().toISOString();
        
        const dateA = new Date(dateAStr).getTime();
        const dateB = new Date(dateBStr).getTime();
        
        return dateB - dateA; // Newest first
      });
      
      // Log debug info
      console.log("Total posts after merging:", allPosts.length);
      
      // If we have no posts after all our efforts, create a welcome post
      if (allPosts.length === 0) {
        console.warn("No posts found in API or localStorage. This should not happen.");
      }
      
      // Take the 3 most recent posts for display
      const recentPosts = allPosts.slice(0, 3);
      console.log("Showing recent posts:", recentPosts.length);
      
      // Update state with merged posts
      setMergedPosts(recentPosts);
      
      // Also update the query cache (if we have posts) so other components can use them
      if (allPosts.length > 0) {
        queryClient.setQueryData(['/api/posts'], allPosts);
      }
    } catch (error) {
      console.error("Error merging posts in CommunitySection:", error);
      // Set empty array in case of error
      setMergedPosts([]);
    }
  }, [posts, queryClient]);

  const { data: categories = [], refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    refetchInterval: false // Disable automatic polling
  });
  
  // Log categories when they're available
  useEffect(() => {
    if (categories && categories.length > 0) {
      console.log("Categories in CommunitySection:", categories.length);
      categories.forEach(cat => {
        console.log(`Category ${cat.id}: ${cat.name} - ${cat.count} posts`);
      });
    }
  }, [categories]);

  // Get users from the server with forced refresh
  const { data: serverUsers = [], refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    select: (data: User[]) => {
      // First sync the auth cache with server data to remove deleted users
      if (data && Array.isArray(data)) {
        // Import and use the userCache sync function
        try {
          const userCacheKey = 'metal_detecting_users_cache';
          const safeStringify = (obj: any) => JSON.stringify(obj, (key, value) => {
            if (key === 'created_at' && value instanceof Date) {
              return value.toISOString();
            }
            return value;
          });
          
          localStorage.setItem(userCacheKey, safeStringify(data));
          console.log(`User cache synced with server. ${data.length} users cached.`);
        } catch (error) {
          console.error("Failed to sync user cache:", error);
        }
      }
      return data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // No cache - always fetch fresh data
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchInterval: false // Disable automatic polling
  });
  
  // Get events from the server (simplified to avoid performance issues)
  const { data: serverEvents = [], isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchInterval: false // Disable automatic polling
  });
  
  // Use server events directly to avoid localStorage performance issues
  const events = serverEvents;
  
  // Removed localStorage synchronization to prevent browser freezing
  
  // Use all users from the server data
  const users = serverUsers || [];
  
  // Function to determine if a user is currently online
  const isUserOnline = (checkUser: User) => {
    // Current logged-in user is always considered online
    if (user && checkUser.id === user.id) {
      return true;
    }
    
    // For demonstration, consider users with recent forum posts as potentially online
    // In a real implementation, this would use last activity timestamps
    const recentPosts = mergedPosts.filter(post => 
      post.userId === checkUser.id && 
      post.created_at && 
      new Date(post.created_at).getTime() > Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    );
    
    return recentPosts.length > 0;
  };

  // Function to protect user privacy by masking email addresses used as usernames
  const getDisplayName = (user: User) => {
    const username = user.username;
    
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
    
  // Function to determine user badges - simplified to reduce clutter
  const getUserBadges = (user: User) => {
    const badges = [];
    
    // Founder badge for user ID 1 (current user)
    if (user.id === 1) {
      badges.push({
        icon: <Award className="h-3 w-3 text-yellow-500" />,
        color: "bg-yellow-100 border-yellow-300",
        name: "Founder",
      });
    }
    
    // Active poster badge - based on username for demo
    // Simplifying logic to prevent too many badges
    if (user.username.toLowerCase().includes("quest") && !badges.length) {
      badges.push({
        icon: <MessageSquare className="h-3 w-3 text-blue-500" />,
        color: "bg-blue-100 border-blue-300",
        name: "Top Poster",
      });
    }
    
    // Reduce the total number of badges showing at once to avoid clutter
    return badges.slice(0, 1);
  };

  return (
    <section className="mb-6 md:mb-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 gap-2">
        <h2 className="font-display text-xl md:text-3xl text-earth-brown">Community Forum</h2>
        <Link href="/forum" className="text-forest-green hover:text-earth-brown font-semibold flex items-center transition duration-300 text-sm md:text-base">
          All Topics <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
        </Link>
      </div>
      
      <Card className="mb-4 md:mb-6">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-forest-green text-sand-beige p-3 md:p-4 gap-3 sm:gap-0">
          <CardTitle className="font-display text-lg md:text-xl text-sand-beige">Hot Topics</CardTitle>
          <Button 
            className="bg-metallic-gold hover:bg-yellow-600 text-forest-green font-semibold flex items-center transition duration-300 w-full sm:w-auto mobile-button"
            onClick={() => setIsNewPostOpen(true)}
            disabled={!user}
          >
            <Plus className="h-4 w-4 mr-2" /> New Post
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {isLoadingPosts ? (
              // Skeleton loaders for posts
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="p-4">
                  <div className="flex items-start">
                    <Skeleton className="w-12 h-12 rounded-full mr-4" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : Array.isArray(mergedPosts) && mergedPosts.length > 0 ? (
              mergedPosts.map((post: Post) => (
                <ForumPost key={post.id} post={post} />
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No forum posts available yet. Be the first to start a discussion!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-display text-xl text-earth-brown mb-3 flex items-center">
              <Star className="h-5 w-5 text-metallic-gold mr-2" /> Popular Categories
            </h3>
            <ul className="space-y-2">
              {categories && categories.length > 0 ? (
                categories.map((category: Category) => (
                  <li key={category.id} className="p-2 hover:bg-sand-beige rounded transition duration-300">
                    <Link href={`/forum?category=${category.id}`} className="flex justify-between items-center">
                      <span className="font-semibold text-forest-green">{category.name}</span>
                      <span className="bg-earth-brown text-sand-beige text-xs px-2 py-1 rounded-full">
                        {category.count} posts
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                Array(5).fill(0).map((_, index) => (
                  <li key={index} className="flex justify-between items-center p-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-display text-xl text-earth-brown flex items-center">
                <Users className="h-5 w-5 text-metallic-gold mr-2" /> Community Members
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-forest-green hover:text-earth-brown text-sm p-1"
                onClick={() => setShowAllMembers(true)}
              >
                View All
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {showAllMembers ? "All members of our detecting community." : "Online members of our detecting community."}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {users && users.length > 0 ? (
                (showAllMembers ? users : users.filter(isUserOnline)).map((user: User) => (
                  <div key={user.id} className="flex flex-col items-center p-2 hover:bg-sand-beige rounded transition duration-300">
                    <div className="relative">
                      <img 
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${user.username}`}
                        alt={`${user.username}'s avatar`} 
                        className="w-12 h-12 rounded-full mb-1 object-cover" 
                        onError={(e) => {
                          console.log(`Avatar failed to load for ${user.username}, URL was:`, e.currentTarget.src);
                          // Fallback if the image fails to load
                          e.currentTarget.src = `https://api.dicebear.com/7.x/personas/svg?seed=${user.username}`;
                        }}
                        onLoad={() => {
                          if (user.username === 'DigQuestor') {
                            console.log(`DigQuestor avatar loaded successfully with URL:`, user.avatarUrl);
                          }
                        }}
                      />
                      
                      {/* Online indicator with shovel icon */}
                      {isUserOnline(user) && (
                        <div className="absolute -top-0.5 -right-0.5">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="rounded-full p-1 bg-green-500 border-2 border-white shadow-md flex items-center justify-center">
                                  <Shovel className="h-2.5 w-2.5 text-white" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="p-2">
                                <p className="text-xs">Currently Online</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                      
                      {/* Badge display */}
                      {getUserBadges(user).length > 0 && (
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="rounded-full p-0.5 bg-metallic-gold border border-yellow-600 shadow-md flex items-center justify-center">
                                  {getUserBadges(user)[0].icon}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="p-3 border-metallic-gold">
                                <div className="text-center">
                                  <div className="flex items-center justify-center mb-1">
                                    <Award className="h-4 w-4 text-metallic-gold mr-1.5" />
                                    <span className="font-semibold">{getUserBadges(user)[0].name}</span>
                                  </div>
                                  <p className="text-xs text-gray-600">Valued community member</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                    
                    <span className="text-xs font-semibold text-forest-green text-center truncate w-full">
                      {getDisplayName(user)}
                    </span>
                  </div>
                ))
              ) : (
                Array(6).fill(0).map((_, index) => (
                  <div key={index} className="flex flex-col items-center p-2">
                    <Skeleton className="w-12 h-12 rounded-full mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-display text-xl text-earth-brown mb-3 flex items-center">
              <CalendarDays className="h-5 w-5 text-metallic-gold mr-2" /> Upcoming Events
            </h3>
            
            {events.length === 0 && !isLoadingEvents ? (
              <div className="mb-3 py-2 px-3 bg-amber-50 rounded-md text-amber-700 text-sm flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <p>No events are currently scheduled. Create an event to get started!</p>
              </div>
            ) : null}
            
            <div className="space-y-3">
              {isLoadingEvents && events.length === 0 ? (
                // Skeleton loaders for events
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="border-l-4 border-gray-200 pl-3 py-1">
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))
              ) : events.length > 0 ? (
                // Render actual events
                events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                // If no events and not loading, show example events
                <>
                  <div className="border-l-4 border-gray-300 pl-3 py-1 opacity-60">
                    <h4 className="font-semibold text-forest-green">Weekend Group Dig <span className="text-xs font-normal text-gray-500">(Example)</span></h4>
                    <p className="text-sm text-gray-700">Sat, June 10 • Suffolk Fields</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      <span>14 attending</span>
                    </div>
                  </div>
                  <div className="border-l-4 border-gray-300 pl-3 py-1 opacity-60">
                    <h4 className="font-semibold text-forest-green">Beginners Workshop <span className="text-xs font-normal text-gray-500">(Example)</span></h4>
                    <p className="text-sm text-gray-700">Wed, June 14 • Online</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      <span>23 attending</span>
                    </div>
                  </div>
                </>
              )}
              <Button 
                className="w-full mt-2 bg-forest-green hover:bg-green-900 text-sand-beige transition duration-300"
                disabled={!user}
                onClick={() => setIsNewEventOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Create Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share your thoughts, questions, or discoveries with the community.
          </DialogDescription>
          <NewPostForm onPostCreated={() => setIsNewPostOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Create Community Event</DialogTitle>
          <DialogDescription>
            Organize a get-together with fellow detectorists.
          </DialogDescription>
          <NewEventForm onEventCreated={() => setIsNewEventOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* All Members Dialog */}
      <Dialog open={showAllMembers} onOpenChange={setShowAllMembers}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogTitle className="text-earth-brown font-display text-2xl flex items-center">
            <Users className="h-6 w-6 text-metallic-gold mr-2" />
            All Community Members
          </DialogTitle>
          <DialogDescription>
            Browse all registered members of the DigQuest community.
          </DialogDescription>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
            {users && users.length > 0 ? (
              users.map((user: User) => (
                <div key={user.id} className="flex flex-col items-center p-3 hover:bg-sand-beige rounded-lg transition duration-300">
                  <div className="relative mb-2">
                    <img 
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${user.username}`}
                      alt={`${user.username}'s avatar`} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-earth-brown/20" 
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/personas/svg?seed=${user.username}`;
                      }}
                    />
                    
                    {/* Online indicator with shovel icon */}
                    {isUserOnline(user) && (
                      <div className="absolute -top-1 -right-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="rounded-full p-1.5 bg-green-500 border-2 border-white shadow-md flex items-center justify-center">
                                <Shovel className="h-3 w-3 text-white" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-2">
                              <p className="text-xs">Currently Online</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                    
                    {/* Badge display */}
                    {getUserBadges(user).length > 0 && (
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="rounded-full p-1 bg-metallic-gold border border-yellow-600 shadow-md flex items-center justify-center">
                                {getUserBadges(user)[0].icon}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="p-3 border-metallic-gold">
                              <div className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                  <Award className="h-4 w-4 text-metallic-gold mr-1.5" />
                                  <span className="font-semibold">{getUserBadges(user)[0].name}</span>
                                </div>
                                <p className="text-xs text-gray-600">Valued community member</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                  
                  <span className="text-sm font-semibold text-forest-green text-center truncate w-full">
                    {getDisplayName(user)}
                  </span>
                  
                  {user.bio && (
                    <p className="text-xs text-gray-600 text-center mt-1 line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No community members found.</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Total Members: <span className="font-semibold text-forest-green">{users?.length || 0}</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CommunitySection;
