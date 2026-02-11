import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Post, Category } from "@shared/schema";
import { Plus, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ForumPost from "@/components/forum/ForumPost";
import NewPostForm from "@/components/forum/NewPostForm";
import { useAuth } from "@/hooks/use-auth-simple";
import { getStoredForumPosts } from "@/lib/storageUtils";

const Forum = () => {
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all posts
  const { data: posts, isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    // Add a custom select function to merge localStorage posts even if API returns empty
    select: (apiPosts) => {
      try {
        console.log("Forum select function - API posts received:", apiPosts?.length || 0);
        // Always check localStorage for additional posts
        const storedPosts = getStoredForumPosts();
        console.log("Forum select function - localStorage posts:", storedPosts.length);
        
        if (!storedPosts.length) {
          // No stored posts, just return API posts
          return apiPosts;
        }
        
        if (!apiPosts || apiPosts.length === 0) {
          // No API posts but we have localStorage posts - use those
          console.log("Forum - No API posts but found localStorage posts, using those instead");
          return storedPosts;
        }
        
        // We have both - merge them
        const postsMap = new Map<number, Post>();
        
        // Add API posts
        apiPosts.forEach(post => postsMap.set(post.id, post));
        
        // Add localStorage posts with priority
        storedPosts.forEach(post => postsMap.set(post.id, post));
        
        // Convert back to array
        const mergedPosts = Array.from(postsMap.values());
        
        console.log("Forum - Merged posts from API and localStorage:", mergedPosts.length);
        
        // Sort by newest first
        mergedPosts.sort((a, b) => {
          const dateAStr = a.created_at || new Date().toISOString();
          const dateBStr = b.created_at || new Date().toISOString();
          const dateA = new Date(dateAStr).getTime();
          const dateB = new Date(dateBStr).getTime();
          return dateB - dateA;
        });
        
        return mergedPosts;
      } catch (error) {
        console.error("Error in Forum select function:", error);
        return apiPosts;
      }
    }
  });
  
  // Refetch posts when the forum mounts to ensure we show the latest data
  useEffect(() => {
    refetchPosts();
  }, [refetchPosts]);

  // Fetch all categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
  
  // Log categories when they're available
  useEffect(() => {
    if (categories && categories.length > 0) {
      console.log("Categories fetched in Forum component:", categories.length);
      categories.forEach(cat => {
        console.log(`Category ${cat.id}: ${cat.name} - ${cat.count} posts`);
      });
    }
  }, [categories]);
  
  // Load saved posts from localStorage and check URL parameters when component mounts
  useEffect(() => {
    try {
      // Parse URL for category parameter
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      
      if (categoryParam) {
        console.log(`Setting selected category from URL: ${categoryParam}`);
        setSelectedCategory(categoryParam);
      }
      
      // This function ensures posts from localStorage are merged with API posts
      const syncPostsWithLocalStorage = () => {
        // Load saved posts from localStorage using our utility function
        const storedPosts = getStoredForumPosts();
        
        // If we have posts from our utility function, update the query cache
        if (storedPosts && storedPosts.length > 0) {
          console.log(`Loaded ${storedPosts.length} posts from localStorage using utility function`);
          
          // Combine API posts with localStorage posts
          const existingPosts = queryClient.getQueryData<Post[]>(['/api/posts']) || [];
          
          // Use a Map to deduplicate by ID
          const postsMap = new Map();
          
          // Add existing API posts to the map
          existingPosts.forEach(post => postsMap.set(post.id, post));
          
          // Add localStorage posts, overwriting duplicates
          storedPosts.forEach((post: Post) => postsMap.set(post.id, post));
          
          // Convert back to array
          const combinedPosts = Array.from(postsMap.values());
          
          // Sort by latest created_at
          combinedPosts.sort((a, b) => {
            // Make sure we have valid created_at dates and convert them to timestamps
            const dateAStr = a.created_at || new Date().toISOString();
            const dateBStr = b.created_at || new Date().toISOString();
            
            const dateA = new Date(dateAStr).getTime();
            const dateB = new Date(dateBStr).getTime();
            
            return dateB - dateA; // Newest first
          });
          
          console.log(`Total posts after merging: ${combinedPosts.length}`);
          
          // Update the query cache
          queryClient.setQueryData(['/api/posts'], combinedPosts);
          
          return combinedPosts;
        }
        return null;
      };
      
      // Sync when component mounts
      syncPostsWithLocalStorage();
      
      // Also sync when the forum page gains focus (user switches back to tab)
      const handleFocus = () => {
        console.log("Window focused - syncing posts with localStorage");
        syncPostsWithLocalStorage();
      };
      
      // Also sync periodically (every 30 seconds)
      const syncInterval = setInterval(() => {
        console.log("Periodic sync - syncing posts with localStorage");
        syncPostsWithLocalStorage();
      }, 30000);
      
      window.addEventListener('focus', handleFocus);
      
      // Cleanup
      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(syncInterval);
      };
    } catch (error) {
      console.error("Error loading posts from localStorage or parsing URL:", error);
    }
  }, [queryClient, refetchPosts]);

  // Debug log for mobile issue
  useEffect(() => {
    if (posts) {
      console.log(`DEBUG - Forum posts received from cache: ${posts.length}`);
      posts.forEach((post, index) => {
        console.log(`DEBUG - Post ${index}: ID=${post.id}, Title=${post.title.substring(0, 20)}...`);
      });
    } else {
      console.log('DEBUG - Posts array is null or undefined');
    }
    
    // Add check for UA to detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log(`DEBUG - Device type: ${isMobile ? 'Mobile' : 'Desktop'}`);
    
    // Also check viewport size
    console.log(`DEBUG - Viewport size: ${window.innerWidth}x${window.innerHeight}`);
    
    // Check localStorage directly
    try {
      const rawStoredPosts = localStorage.getItem('forum_posts');
      if (rawStoredPosts) {
        const parsedPosts = JSON.parse(rawStoredPosts);
        console.log(`DEBUG - Posts directly from localStorage: ${parsedPosts.length}`);
      } else {
        console.log('DEBUG - No posts found directly in localStorage');
      }
    } catch (e) {
      console.error('DEBUG - Error checking localStorage:', e);
    }
  }, [posts]);

  // Filter posts based on search and category
  const filteredPosts: Post[] = posts?.filter(post => {
    const matchesSearch = searchQuery 
      ? post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    const matchesCategory = selectedCategory
      ? post.categoryId === parseInt(selectedCategory)
      : true;
    
    const result = matchesSearch && matchesCategory;
    
    return result;
  }) || [];
  
  // Debug log filtered posts
  useEffect(() => {
    console.log(`DEBUG - Filtered posts: ${filteredPosts.length}`);
  }, [filteredPosts]);

  return (
    <>
      <Helmet>
        <title>Forum | DigQuest - Metal Detecting Community</title>
        <meta name="description" content="Join discussions on metal detecting techniques, share your finds, and connect with other enthusiasts in our forum." />
        <link rel="canonical" href="https://digquest.org/forum" />
      </Helmet>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="font-display text-4xl text-earth-brown mb-2">Community Forum</h1>
            <p className="text-gray-600">Share your experiences, ask questions, and connect with fellow detectorists</p>
          </div>
          <Button 
            className="bg-metallic-gold hover:bg-yellow-600 text-forest-green font-semibold transition duration-300 flex items-center"
            onClick={() => setIsNewPostOpen(true)}
            disabled={!user}
          >
            <Plus className="h-4 w-4 mr-2" /> New Post
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 order-2 md:order-1">
            <Card>
              <CardHeader className="bg-forest-green text-sand-beige">
                <CardTitle className="font-display text-xl">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-earth-brown" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div 
                      className={`p-2 rounded cursor-pointer transition duration-200 ${!selectedCategory ? 'bg-sand-beige font-semibold' : 'hover:bg-sand-beige/50'}`}
                      onClick={() => setSelectedCategory(null)}
                    >
                      All Categories
                    </div>
                    {categories?.map(category => (
                      <div 
                        key={category.id} 
                        className={`flex justify-between items-center p-2 rounded cursor-pointer transition duration-200 ${selectedCategory === category.id.toString() ? 'bg-sand-beige font-semibold' : 'hover:bg-sand-beige/50'}`}
                        onClick={() => setSelectedCategory(category.id.toString())}
                      >
                        <span>{category.name}</span>
                        <Badge variant="outline" className="bg-earth-brown/10">
                          {category.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader className="bg-forest-green text-sand-beige">
                <CardTitle className="font-display text-xl">Forum Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Be respectful to all community members</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Share the location of your finds at your discretion</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Report any potential treasure finds as required by law</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Obtain permission before detecting on private land</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3 order-1 md:order-2">
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search posts..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-64">
                    <Select
                      value={selectedCategory || "all"}
                      onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
                    >
                      <SelectTrigger>
                        <div className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="All Categories" />
                        </div>
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[100]">
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories?.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="mb-4 bg-sand-beige">
                <TabsTrigger value="recent" className="data-[state=active]:bg-earth-brown data-[state=active]:text-sand-beige">
                  Recent Posts
                </TabsTrigger>
                <TabsTrigger value="popular" className="data-[state=active]:bg-earth-brown data-[state=active]:text-sand-beige">
                  Most Popular
                </TabsTrigger>
                {user && (
                  <TabsTrigger value="my-posts" className="data-[state=active]:bg-earth-brown data-[state=active]:text-sand-beige">
                    My Posts
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="recent" className="mt-0">
                {isLoadingPosts ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-earth-brown" />
                  </div>
                ) : filteredPosts && filteredPosts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPosts.map(post => (
                      <ForumPost key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-sand-beige/50 rounded-lg p-8 text-center">
                    <h3 className="text-xl font-display text-earth-brown mb-2">No posts found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery 
                        ? "Try adjusting your search or filters"
                        : "Be the first to start a discussion!"
                      }
                    </p>
                    {user && (
                      <Button 
                        className="bg-metallic-gold hover:bg-yellow-600 text-forest-green"
                        onClick={() => setIsNewPostOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Create New Post
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="popular" className="mt-0">
                {isLoadingPosts ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-earth-brown" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts
                      ?.sort((a, b) => (b.views || 0) - (a.views || 0))
                      .map(post => (
                        <ForumPost key={post.id} post={post} />
                      ))}
                  </div>
                )}
              </TabsContent>

              {user && (
                <TabsContent value="my-posts" className="mt-0">
                  {isLoadingPosts ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-earth-brown" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPosts
                        ?.filter(post => post.userId === user?.id)
                        .map(post => (
                          <ForumPost key={post.id} post={post} />
                        ))}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onInteractOutside={(e) => {
          // Prevent closing when clicking on Select dropdown
          const target = e.target as HTMLElement;
          if (target.closest('[role="listbox"]') || target.closest('[data-radix-select-content]')) {
            e.preventDefault();
          }
        }}>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share your thoughts, questions, or discoveries with the community.
          </DialogDescription>
          <div className="pb-4">
            <NewPostForm onPostCreated={() => {
              setIsNewPostOpen(false);
              // Force immediate refetch of posts after creation
              refetchPosts();
              console.log("Post created - refetching forum posts");
            }} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Forum;
