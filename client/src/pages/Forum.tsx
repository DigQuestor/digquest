import { useState, useEffect, useMemo } from "react";
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

const Forum = () => {
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all posts - simplified to use API data only
  const { data: posts, isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
  });
  
  // Simple refetch on mount to ensure latest data
  useEffect(() => {
    console.log("📋 Forum loaded - fetching latest posts");
    refetchPosts();
  }, [refetchPosts]);
  
  // Log posts for debugging
  useEffect(() => {
    console.log("📝 Forum posts updated:", {
      total: posts?.length || 0,
      loading: isLoadingPosts,
      data: posts ? posts.map(p => ({ id: p.id, title: p.title })) : null
    });
  }, [posts, isLoadingPosts]);

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

  const popularPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      const likesDiff = (b.likes || 0) - (a.likes || 0);
      if (likesDiff !== 0) return likesDiff;

      const commentsDiff = (b.comments || 0) - (a.comments || 0);
      if (commentsDiff !== 0) return commentsDiff;

      const viewsDiff = (b.views || 0) - (a.views || 0);
      if (viewsDiff !== 0) return viewsDiff;

      const createdAtA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdAtB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createdAtB - createdAtA;
    });
  }, [filteredPosts]);
  
  // Debug log for filtered posts
  useEffect(() => {
    console.log(`🔍 Filtered posts:`, {
      total: filteredPosts.length,
      searchQuery,
      selectedCategory,
      rawPostsCount: posts?.length || 0
    });
  }, [filteredPosts, searchQuery, selectedCategory, posts]);

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
            onClick={() => {
              if (!isAuthLoading && user) {
                setIsNewPostOpen(true);
              }
            }}
            disabled={isAuthLoading || !user}
          >
            <Plus className="h-4 w-4 mr-2" /> {isAuthLoading ? "Checking Session..." : "New Post"}
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
                {!isAuthLoading && user && (
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
                ) : popularPosts.length > 0 ? (
                  <div className="space-y-4">
                    {popularPosts.map(post => (
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
              console.log("Post creation completed - closing dialog");
              // Close dialog (refetch already happened in form)
              setIsNewPostOpen(false);
            }} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Forum;
