import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, MessageCircle, Trophy, UserPlus, Settings, Hash, X, Upload, Camera, Plus, Lock, MoreHorizontal, Eye, Trash2, LogOut, MapPin, Search, Heart, MessageSquare, Treasure, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-simple";
import { apiRequest } from "@/lib/queryClient";
import type { User, UserConnection, Activity, Group, Message } from "@shared/schema";

interface SocialStats {
  followers: number;
  following: number;
  posts: number;
  finds: number;
}

export default function SocialDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser, isLoading: userLoading } = useAuth();
  
  // All state hooks at the top
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState({
    username: "",
    bio: "",
    email: ""
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL parameters for tab selection
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    return tabParam === 'groups' ? 'groups' : 'feed';
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isBrowseGroupsOpen, setIsBrowseGroupsOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    location: "",
    isPrivate: false
  });
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isViewGroupOpen, setIsViewGroupOpen] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null);

  const { data: socialStats } = useQuery<SocialStats>({
    queryKey: ['/api/social/stats'],
    enabled: !!currentUser && !userLoading,
    retry: false,
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ['/api/social/feed'],
    enabled: !!currentUser && !userLoading,
    retry: false,
  });

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['/api/social/groups'],
    enabled: !!currentUser && !userLoading,
    retry: false,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/social/messages'],
    enabled: !!currentUser && !userLoading,
    retry: false,
  });

  const { data: connections = [] } = useQuery<UserConnection[]>({
    queryKey: ['/api/social/connections'],
    enabled: !!currentUser && !userLoading,
    retry: false,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!currentUser && !userLoading,
    retry: false,
  });

  // All mutation hooks at the top level
  const followMutation = useMutation({
    mutationFn: async ({ targetUserId, action }: { targetUserId: number; action: 'follow' | 'unfollow' }) => {
      await apiRequest("POST", "/api/social/follow", { targetUserId, action });
      return action;
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/connections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/stats'] });
      
      if (action === 'follow') {
        toast({
          title: "✅ Connection Added!",
          description: "You are now following this user and will see their updates in your feed.",
          duration: 4000,
          className: "bg-green-600 text-white border-green-700 font-semibold"
        });
      } else {
        toast({
          title: "Connection Removed",
          description: "You have unfollowed this user.",
          duration: 3000,
        });
      }
    },
    onError: () => {
      toast({
        title: "⚠️ Connection Failed",
        description: "Unable to update connection. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { username: string; bio: string; email: string }) => {
      await apiRequest('PUT', `/api/users/${currentUser?.id}`, profileData);
      
      if (selectedImage) {
        const formData = new FormData();
        formData.append('avatar', selectedImage);
        await apiRequest('POST', `/api/users/${currentUser?.id}/avatar`, formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Notify all useAuth hook instances to refresh
      window.dispatchEvent(new Event('auth-changed'));
      
      setIsSettingsOpen(false);
      setSelectedImage(null);
      setImagePreview(null);
      toast({
        title: "✅ Profile Updated Successfully!",
        description: "Your profile changes have been saved.",
        duration: 3000,
        className: "bg-green-600 text-white border-green-700 font-semibold text-lg"
      });
    },
    onError: () => {
      toast({
        title: "⚠️ Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof newGroup) => {
      const response = await apiRequest("POST", "/api/social/groups", groupData);
      return response.json() as Promise<Group>;
    },
    onSuccess: (createdGroup) => {
      queryClient.setQueryData<Group[]>(['/api/social/groups'], (currentGroups = []) => {
        if (currentGroups.some(group => group.id === createdGroup.id)) {
          return currentGroups;
        }
        return [createdGroup, ...currentGroups];
      });
      toast({
        title: "Group Created",
        description: "Your group has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social/groups'] });
      setIsCreateGroupOpen(false);
      setNewGroup({ name: "", description: "", location: "", isPrivate: false });
    },
    onError: (error) => {
      let errorMessage = "Failed to create group. Please try again.";
      if (error instanceof Error) {
        const cleanMessage = error.message.replace(/^\d+:\s*/, "");
        try {
          const parsedError = JSON.parse(cleanMessage);
          errorMessage = parsedError?.message || cleanMessage;
        } catch {
          errorMessage = cleanMessage;
        }
      }

      toast({
        title: "Create Group Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest("POST", `/api/groups/${groupId}/leave`);
    },
    onSuccess: () => {
      toast({
        title: "Left Group",
        description: "You have left the group.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social/groups'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to leave group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest("DELETE", `/api/groups/${groupId}`);
    },
    onSuccess: () => {
      toast({
        title: "Group Deleted",
        description: "The group has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social/groups'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (data: { groupId: number; groupData: Partial<Group> }) => {
      return apiRequest("PUT", `/api/groups/${data.groupId}`, data.groupData);
    },
    onSuccess: () => {
      toast({
        title: "Group Updated",
        description: "Group details have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social/groups'] });
      setIsEditGroupOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update group. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getUsernameById = (userId: number): string => {
    const user = (allUsers || []).find(u => u.id === userId);
    return user?.username || `User ${userId}`;
  };

  const getUserById = (userId: number): User | undefined => {
    return (allUsers || []).find(u => u.id === userId);
  };

  const searchableUsers = (allUsers || []).filter(user => 
    user.id !== currentUser?.id && 
    (searchTerm === "" || user.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isUserFollowed = (userId: number): boolean => {
    return connections.some(conn => conn.followerId === currentUser?.id && conn.followingId === userId);
  };

  // Event handlers
  const handleSaveSettings = () => {
    updateProfileMutation.mutate(editingProfile);
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) return;
    createGroupMutation.mutate(newGroup);
  };

  const handleLeaveGroup = (groupId: number) => {
    leaveGroupMutation.mutate(groupId);
  };

  const handleDeleteGroup = (groupId: number) => {
    if (confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const handleViewGroup = (group: Group) => {
    setViewingGroup(group);
    setTimeout(() => setIsViewGroupOpen(true), 0);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup({...group}); // Create a copy to avoid modifying the original
    setTimeout(() => setIsEditGroupOpen(true), 0);
  };

  const handleUpdateGroup = () => {
    if (!editingGroup || !editingGroup.name.trim()) return;
    
    updateGroupMutation.mutate({
      groupId: editingGroup.id,
      groupData: {
        name: editingGroup.name,
        description: editingGroup.description,
        location: editingGroup.location,
        isPrivate: editingGroup.isPrivate
      }
    });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
      }
    }
  };

  // Handle loading state
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  // Handle authentication - show login prompt if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-amber-800">Social Dashboard</h1>
          </div>

          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-amber-600" />
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-gray-600">
                Please log in to access social features and connect with other detectorists. 
                Once logged in, you'll be able to follow other users, join groups, send messages, 
                and view your social statistics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-amber-800">Social Dashboard</h1>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Find Users
            </Button>
            
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Profile Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={imagePreview || currentUser?.avatarUrl || ""} />
                        <AvatarFallback>{currentUser?.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={editingProfile.username}
                      onChange={(e) => setEditingProfile({...editingProfile, username: e.target.value})}
                      placeholder={currentUser?.username}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editingProfile.email}
                      onChange={(e) => setEditingProfile({...editingProfile, email: e.target.value})}
                      placeholder={currentUser?.email}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editingProfile.bio}
                      onChange={(e) => setEditingProfile({...editingProfile, bio: e.target.value})}
                      placeholder={currentUser?.bio || "Tell us about yourself..."}
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSaveSettings} 
                    className="w-full"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Followers</h3>
                  <p className="text-lg font-bold text-blue-600">{socialStats?.followers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Following</h3>
                  <p className="text-lg font-bold text-green-600">{socialStats?.following || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Posts</h3>
                  <p className="text-lg font-bold text-purple-600">{socialStats?.posts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Finds</h3>
                  <p className="text-lg font-bold text-amber-600">{socialStats?.finds || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="feed">Activity Feed</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getUserById(activity.userId)?.avatarUrl || ""} />
                          <AvatarFallback>{getUsernameById(activity.userId)[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{getUsernameById(activity.userId)}</p>
                          <p className="text-gray-600">{activity.content}</p>
                          <p className="text-sm text-gray-400">{activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'Unknown date'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent activity to display</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                {connections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connections.map((connection) => {
                      const user = getUserById(connection.followingId);
                      return (
                        <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user?.avatarUrl || ""} />
                              <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user?.username}</p>
                              <p className="text-sm text-gray-500">{user?.bio || "Metal detecting enthusiast"}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => followMutation.mutate({ targetUserId: connection.followingId, action: 'unfollow' })}
                          >
                            Unfollow
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No connections yet. Start following other detectorists!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Your Groups
                  </div>
                  <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Group</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="groupName">Group Name</Label>
                          <Input
                            id="groupName"
                            value={newGroup.name}
                            onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                            placeholder="Enter group name"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="groupDescription">Description</Label>
                          <Textarea
                            id="groupDescription"
                            value={newGroup.description}
                            onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                            placeholder="Describe your group"
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="groupLocation">Location (Optional)</Label>
                          <Input
                            id="groupLocation"
                            value={newGroup.location}
                            onChange={(e) => setNewGroup({...newGroup, location: e.target.value})}
                            placeholder="e.g., London, UK"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Group Visibility</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="groupPrivate"
                              checked={newGroup.isPrivate}
                              onCheckedChange={(checked) => {
                                if (checked === true) {
                                  setNewGroup({ ...newGroup, isPrivate: true });
                                }
                              }}
                            />
                            <Label htmlFor="groupPrivate">Private Group</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="groupPublic"
                              checked={!newGroup.isPrivate}
                              onCheckedChange={(checked) => {
                                if (checked === true) {
                                  setNewGroup({ ...newGroup, isPrivate: false });
                                }
                              }}
                            />
                            <Label htmlFor="groupPublic">Public Group</Label>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleCreateGroup} 
                          className="w-full"
                          disabled={createGroupMutation.isPending || !newGroup.name.trim()}
                        >
                          {createGroupMutation.isPending ? "Creating..." : "Create New Group"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((group) => (
                      <div key={group.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg">{group.name}</h3>
                          {group.isPrivate && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {group.description || "No description provided"}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {group.memberCount} members
                            </span>
                            {group.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {group.location}
                              </span>
                            )}
                          </div>
                          
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewGroup(group)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Group
                              </DropdownMenuItem>
                              {group.creatorId === currentUser?.id ? (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Edit Group
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteGroup(group.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Group
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleLeaveGroup(group.id)}
                                >
                                  <LogOut className="h-4 w-4 mr-2" />
                                  Leave Group
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">You haven't joined any groups yet</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateGroupOpen(true)}
                      className="mr-2"
                    >
                      Create New Group
                    </Button>
                    <Button variant="outline" onClick={() => setIsBrowseGroupsOpen(true)}>
                      Browse Groups
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Recent Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getUserById(message.senderId)?.avatarUrl || ""} />
                          <AvatarFallback>{getUsernameById(message.senderId)[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{getUsernameById(message.senderId)}</p>
                            <p className="text-sm text-gray-400">{message.created_at ? new Date(message.created_at).toLocaleDateString() : 'Unknown date'}</p>
                          </div>
                          <p className="text-gray-600">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No messages yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Group Dialog */}
        <Dialog
          open={isViewGroupOpen}
          modal={false}
          onOpenChange={(open) => {
            setIsViewGroupOpen(open);
            if (!open) {
              setViewingGroup(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {viewingGroup?.name}
              </DialogTitle>
            </DialogHeader>
            {viewingGroup && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600">{viewingGroup.description || "No description provided"}</p>
                </div>
                
                {viewingGroup.location && (
                  <div>
                    <h4 className="font-medium mb-2">Location</h4>
                    <p className="text-gray-600 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {viewingGroup.location}
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Group Info</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {viewingGroup.memberCount} members
                    </span>
                    <span className="flex items-center gap-1">
                      {viewingGroup.isPrivate ? (
                        <>
                          <Lock className="h-4 w-4" />
                          Private Group
                        </>
                      ) : (
                        <>
                          <Hash className="h-4 w-4" />
                          Public Group
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Created by</h4>
                  <p className="text-gray-600">{getUsernameById(viewingGroup.creatorId)}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Group Dialog */}
        <Dialog
          open={isEditGroupOpen}
          modal={false}
          onOpenChange={(open) => {
            setIsEditGroupOpen(open);
            if (!open) {
              setEditingGroup(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
            </DialogHeader>
            {editingGroup && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editGroupName">Group Name</Label>
                  <Input
                    id="editGroupName"
                    value={editingGroup.name}
                    onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})}
                    placeholder="Enter group name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editGroupDescription">Description</Label>
                  <Textarea
                    id="editGroupDescription"
                    value={editingGroup.description || ""}
                    onChange={(e) => setEditingGroup({...editingGroup, description: e.target.value})}
                    placeholder="Describe your group"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editGroupLocation">Location (Optional)</Label>
                  <Input
                    id="editGroupLocation"
                    value={editingGroup.location || ""}
                    onChange={(e) => setEditingGroup({...editingGroup, location: e.target.value})}
                    placeholder="Group location"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Group Visibility</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="editGroupPrivate"
                      checked={editingGroup.isPrivate}
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          setEditingGroup({...editingGroup, isPrivate: true});
                        }
                      }}
                    />
                    <Label htmlFor="editGroupPrivate">Private Group</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="editGroupPublic"
                      checked={!editingGroup.isPrivate}
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          setEditingGroup({...editingGroup, isPrivate: false});
                        }
                      }}
                    />
                    <Label htmlFor="editGroupPublic">Public Group</Label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpdateGroup}
                    disabled={updateGroupMutation.isPending || !editingGroup?.name.trim()}
                    className="flex-1"
                  >
                    {updateGroupMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditGroupOpen(false)}
                    disabled={updateGroupMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Search Users Dialog */}
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Find Users</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchableUsers.length > 0 ? (
                  searchableUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl || ""} />
                          <AvatarFallback>{user.username[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.username}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={isUserFollowed(user.id) ? "outline" : "default"}
                        onClick={() => followMutation.mutate({ 
                          targetUserId: user.id, 
                          action: isUserFollowed(user.id) ? 'unfollow' : 'follow' 
                        })}
                      >
                        {isUserFollowed(user.id) ? 'Unfollow' : 'Follow'}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    {searchTerm ? 'No users found matching your search' : 'No other users available'}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}