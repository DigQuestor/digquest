import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Medal, 
  Crown, 
  Zap, 
  Target, 
  Users, 
  MessageSquare, 
  Camera, 
  Map, 
  Navigation,
  Heart,
  Award,
  Gift,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth-simple";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "community" | "detecting" | "exploration" | "social";
  points: number;
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  isSecret?: boolean;
  unlockedAt?: string;
}

interface AchievementSystemProps {
  showNotifications?: boolean;
  compact?: boolean;
}

const AchievementSystem = ({ showNotifications = true, compact = false }: AchievementSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [achievementState, setAchievementState] = useState<Record<string, { isUnlocked: boolean; progress: number; unlockedAt?: string }>>({});
  const [hasCheckedInitialAchievements, setHasCheckedInitialAchievements] = useState(false);

  // Load achievements from localStorage on mount
  useEffect(() => {
    const savedAchievements = localStorage.getItem(`digquest-achievements-${user?.id}`);
    if (savedAchievements) {
      try {
        setAchievementState(JSON.parse(savedAchievements));
      } catch (error) {
        console.error('Error loading saved achievements:', error);
      }
    }
  }, [user?.id]);

  // Save achievements to localStorage when state changes
  useEffect(() => {
    if (user?.id && Object.keys(achievementState).length > 0) {
      localStorage.setItem(`digquest-achievements-${user.id}`, JSON.stringify(achievementState));
    }
  }, [achievementState, user?.id]);

  // Function to update achievement progress
  const updateAchievementProgress = (achievementId: string, newProgress: number, suppressNotification = false) => {
    setAchievementState(prev => {
      const current = prev[achievementId] || { isUnlocked: false, progress: 0 };
      const achievement = baseAchievements.find(a => a.id === achievementId);
      const isNowUnlocked = achievement && newProgress >= achievement.maxProgress;
      
      // Only show notification if this is a new unlock and notifications are enabled
      if (isNowUnlocked && !current.isUnlocked && showNotifications && !suppressNotification && hasCheckedInitialAchievements) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span className="text-lg font-bold">Achievement Unlocked!</span>
            </div>
          ),
          description: (
            <div className="space-y-2 mt-2">
              <p className="font-bold text-lg text-yellow-600">{achievement.name}</p>
              <p className="text-base text-gray-700">{achievement.description}</p>
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-base font-bold text-yellow-800">+{achievement.points} Points Earned!</p>
              </div>
            </div>
          ),
        });
      }
      
      return {
        ...prev,
        [achievementId]: {
          isUnlocked: isNowUnlocked || current.isUnlocked,
          progress: Math.min(newProgress, achievement?.maxProgress || newProgress),
          unlockedAt: isNowUnlocked && !current.isUnlocked ? new Date().toISOString() : current.unlockedAt
        }
      };
    });
  };

  // Check and update achievements based on user actions
  useEffect(() => {
    if (!user || hasCheckedInitialAchievements) return;

    // Simulate checking user stats and updating achievements
    const checkAchievements = async () => {
      try {
        // Get user stats from API
        const [postsRes, findsRes, locationsRes] = await Promise.all([
          fetch('/api/posts'),
          fetch('/api/finds'),
          fetch('/api/locations')
        ]);
        
        const posts = await postsRes.json();
        const finds = await findsRes.json();
        const locations = await locationsRes.json();
        
        // Update achievements based on actual data
        const userPosts = posts.filter((p: any) => p.userId === user.id);
        const userFinds = finds.filter((f: any) => f.userId === user.id);
        
        // Update forum participation achievements (suppress notifications on initial load)
        updateAchievementProgress('first-post', userPosts.length, true);
        updateAchievementProgress('forum-regular', userPosts.length, true);
        updateAchievementProgress('community-leader', userPosts.length, true);
        
        // Update detecting achievements (suppress notifications on initial load)
        updateAchievementProgress('first-find', userFinds.length, true);
        updateAchievementProgress('treasure-hunter', userFinds.length, true);
        updateAchievementProgress('detecting-master', userFinds.length, true);
        
        // Update exploration achievements based on locations visited (suppress notifications on initial load)
        updateAchievementProgress('location-scout', Math.min(locations.length, 10), true);
        updateAchievementProgress('map-explorer', Math.min(locations.length, 25), true);
        
        // Mark initial check as complete
        setHasCheckedInitialAchievements(true);
        
      } catch (error) {
        console.error('Error checking achievements:', error);
        // Still mark as checked to prevent infinite retries
        setHasCheckedInitialAchievements(true);
      }
    };

    checkAchievements();
  }, [user, hasCheckedInitialAchievements]);

  // Base achievement definitions
  const baseAchievements: Achievement[] = [
    // Welcome & Onboarding
    {
      id: "welcome-aboard",
      name: "Welcome Aboard",
      description: "Complete the DigQuest welcome tour",
      icon: <Trophy className="h-6 w-6 text-metallic-gold" />,
      category: "community",
      points: 50,
      isUnlocked: true,
      progress: 1,
      maxProgress: 1,
      unlockedAt: "2024-01-15"
    },
    {
      id: "digquest-explorer",
      name: "DigQuest Explorer",
      description: "Complete all onboarding steps",
      icon: <Crown className="h-6 w-6 text-purple-500" />,
      category: "community",
      points: 100,
      isUnlocked: true,
      progress: 1,
      maxProgress: 1,
      unlockedAt: "2024-01-15"
    },

    // Community Achievements
    {
      id: "first-post",
      name: "Breaking the Ice",
      description: "Make your first forum post",
      icon: <MessageSquare className="h-6 w-6 text-forest-green" />,
      category: "community",
      points: 25,
      isUnlocked: false,
      progress: 0,
      maxProgress: 1
    },
    {
      id: "forum-helper",
      name: "Forum Helper",
      description: "Help 10 community members by replying to their posts",
      icon: <Users className="h-6 w-6 text-blue-500" />,
      category: "social",
      points: 100,
      isUnlocked: false,
      progress: 0,
      maxProgress: 10
    },
    {
      id: "conversation-starter",
      name: "Conversation Starter",
      description: "Create 5 forum discussions",
      icon: <Sparkles className="h-6 w-6 text-purple-500" />,
      category: "social",
      points: 75,
      isUnlocked: false,
      progress: 0,
      maxProgress: 5
    },

    // Detecting & Finds
    {
      id: "first-treasure",
      name: "First Treasure",
      description: "Upload your first find to the gallery",
      icon: <Camera className="h-6 w-6 text-earth-brown" />,
      category: "detecting",
      points: 30,
      isUnlocked: false,
      progress: 0,
      maxProgress: 1
    },
    {
      id: "treasure-hunter",
      name: "Treasure Hunter",
      description: "Upload 10 finds to the gallery",
      icon: <Gift className="h-6 w-6 text-metallic-gold" />,
      category: "detecting",
      points: 150,
      isUnlocked: false,
      progress: 0,
      maxProgress: 10
    },
    {
      id: "historian",
      name: "Historian",
      description: "Upload finds from 5 different historical periods",
      icon: <Medal className="h-6 w-6 text-amber-600" />,
      category: "detecting",
      points: 200,
      isUnlocked: false,
      progress: 0,
      maxProgress: 5
    },

    // Exploration
    {
      id: "map-explorer",
      name: "Map Explorer",
      description: "Visit 5 different detecting locations",
      icon: <Map className="h-6 w-6 text-blue-500" />,
      category: "exploration",
      points: 75,
      isUnlocked: false,
      progress: 0,
      maxProgress: 5
    },
    {
      id: "route-master",
      name: "Route Master",
      description: "Complete 3 AR-guided detecting routes",
      icon: <Navigation className="h-6 w-6 text-purple-500" />,
      category: "exploration",
      points: 125,
      isUnlocked: false,
      progress: 0,
      maxProgress: 3
    },
    {
      id: "pathfinder",
      name: "Pathfinder",
      description: "Share 5 new detecting locations with the community",
      icon: <Target className="h-6 w-6 text-green-500" />,
      category: "exploration",
      points: 100,
      isUnlocked: false,
      progress: 0,
      maxProgress: 5
    },

    // Social & Wellbeing
    {
      id: "wellbeing-advocate",
      name: "Wellbeing Advocate",
      description: "Share a story about how detecting improves your wellbeing",
      icon: <Heart className="h-6 w-6 text-red-500" />,
      category: "social",
      points: 60,
      isUnlocked: false,
      progress: 0,
      maxProgress: 1
    },
    {
      id: "community-leader",
      name: "Community Leader",
      description: "Get 50 likes on your posts and finds",
      icon: <Star className="h-6 w-6 text-metallic-gold" />,
      category: "social",
      points: 250,
      isUnlocked: false,
      progress: 0,
      maxProgress: 50
    },

    // Secret Achievements
    {
      id: "early-bird",
      name: "Early Bird",
      description: "Join DigQuest in its first month",
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      category: "community",
      points: 500,
      isUnlocked: true,
      progress: 1,
      maxProgress: 1,
      isSecret: true,
      unlockedAt: "2024-01-15"
    }
  ];

  // Merge base achievements with dynamic state
  const achievements: Achievement[] = baseAchievements.map(baseAchievement => {
    const state = achievementState[baseAchievement.id];
    return {
      ...baseAchievement,
      isUnlocked: state?.isUnlocked ?? baseAchievement.isUnlocked,
      progress: state?.progress ?? baseAchievement.progress,
      unlockedAt: state?.unlockedAt ?? baseAchievement.unlockedAt
    };
  });

  const categories = [
    { id: "all", name: "All", icon: <Award className="h-4 w-4" /> },
    { id: "community", name: "Community", icon: <Users className="h-4 w-4" /> },
    { id: "detecting", name: "Detecting", icon: <Camera className="h-4 w-4" /> },
    { id: "exploration", name: "Exploration", icon: <Map className="h-4 w-4" /> },
    { id: "social", name: "Social", icon: <Heart className="h-4 w-4" /> }
  ];

  const filteredAchievements = selectedCategory === "all" 
    ? achievements 
    : achievements.filter((achievement: Achievement) => achievement.category === selectedCategory);

  const totalPoints = achievements
    .filter((achievement: Achievement) => achievement.isUnlocked)
    .reduce((sum: number, achievement: Achievement) => sum + achievement.points, 0);

  const unlockedCount = achievements.filter((achievement: Achievement) => achievement.isUnlocked).length;
  const totalCount = achievements.filter((achievement: Achievement) => !achievement.isSecret).length;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "community": return "text-forest-green";
      case "detecting": return "text-earth-brown";
      case "exploration": return "text-blue-500";
      case "social": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getProgressColor = (progress: number, maxProgress: number) => {
    const percentage = (progress / maxProgress) * 100;
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-gray-300";
  };

  if (compact) {
    return (
      <Card className="w-full bg-gradient-to-r from-sand-beige/20 to-metallic-gold/10 border-metallic-gold/20">
        <CardContent className="p-4">
          {/* Horizontal layout header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-metallic-gold/20">
                <Trophy className="h-4 w-4 text-metallic-gold" />
              </div>
              <span className="text-sm font-bold text-earth-brown">Achievements</span>
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {unlockedCount}/{totalCount}
              </Badge>
            </div>
            <Badge className="bg-metallic-gold text-black font-bold text-xs px-2 py-0.5">
              {totalPoints} pts
            </Badge>
          </div>
          
          {/* Redesigned compact progress section */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-metallic-gold" />
                  <span className="text-xs font-medium text-earth-brown">Overall Progress</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-metallic-gold">
                  {Math.round((unlockedCount / totalCount) * 100)}%
                </span>
                <span className="text-xs text-gray-500">complete</span>
              </div>
            </div>
            <div className="relative w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-metallic-gold via-yellow-500 to-metallic-gold h-full rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Horizontal achievements showcase */}
          <div className="flex items-center gap-3">
            {/* Recent unlocked achievements */}
            <div className="flex gap-1.5">
              {achievements.filter(a => a.isUnlocked).slice(0, 3).map((achievement) => (
                <div
                  key={achievement.id}
                  className="group relative p-1.5 rounded-lg bg-gradient-to-br from-white to-green-50 border border-green-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedAchievement(achievement)}
                  title={achievement.name}
                >
                  <div className="flex items-center justify-center">
                    {React.cloneElement(achievement.icon as React.ReactElement, {
                      className: "h-4 w-4 text-green-600"
                    })}
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white leading-none">✓</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Divider */}
            {achievements.filter(a => a.isUnlocked).length > 0 && achievements.find(a => !a.isUnlocked) && (
              <div className="w-px h-8 bg-gray-300"></div>
            )}
            
            {/* Next achievement preview */}
            {(() => {
              const nextAchievement = achievements.find(a => !a.isUnlocked);
              return nextAchievement ? (
                <div 
                  className="flex-1 min-w-0 p-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 cursor-pointer hover:shadow-sm transition-all"
                  onClick={() => setSelectedAchievement(nextAchievement)}
                >
                  <div className="flex items-center gap-2">
                    <div className="opacity-50">
                      {React.cloneElement(nextAchievement.icon as React.ReactElement, {
                        className: "h-4 w-4"
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{nextAchievement.name}</p>
                      <p className="text-[10px] text-gray-600 truncate">{nextAchievement.description}</p>
                      {nextAchievement.maxProgress > 1 && (
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-forest-green h-1 rounded-full transition-all"
                              style={{ width: `${(nextAchievement.progress / nextAchievement.maxProgress) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      +{nextAchievement.points}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-center text-xs text-gray-500 py-2">
                  All achievements unlocked! 🎉
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-metallic-gold" />
              <div>
                <p className="text-2xl font-bold">{unlockedCount}</p>
                <p className="text-sm text-gray-600">Achievements Unlocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-sm text-gray-600">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round((unlockedCount / totalCount) * 100)}%</p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? "bg-forest-green hover:bg-green-900" : ""}
              >
                {category.icon}
                <span className="ml-1">{category.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              achievement.isUnlocked
                ? "border-green-200 bg-green-50/50"
                : "border-gray-200"
            }`}
            onClick={() => setSelectedAchievement(achievement)}
          >
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className={achievement.isUnlocked ? "" : "grayscale opacity-50"}>
                    {achievement.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`${getCategoryColor(achievement.category)} bg-transparent border`}>
                      {achievement.category}
                    </Badge>
                    {achievement.isUnlocked && (
                      <Badge className="bg-green-500 text-white">
                        +{achievement.points} pts
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className={`font-semibold ${achievement.isUnlocked ? "text-gray-900" : "text-gray-500"}`}>
                    {achievement.name}
                  </h3>
                  <p className={`text-sm ${achievement.isUnlocked ? "text-gray-600" : "text-gray-400"}`}>
                    {achievement.description}
                  </p>
                </div>
                
                {!achievement.isUnlocked && achievement.maxProgress > 1 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(achievement.progress, achievement.maxProgress)}`}
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {achievement.isUnlocked && achievement.unlockedAt && (
                  <p className="text-xs text-green-600">
                    Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievement Detail Dialog */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedAchievement?.icon}
              {selectedAchievement?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedAchievement?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAchievement && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Category:</span>
                <Badge className={`${getCategoryColor(selectedAchievement.category)} bg-transparent border capitalize`}>
                  {selectedAchievement.category}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Points:</span>
                <Badge className="bg-metallic-gold text-black">
                  {selectedAchievement.points} points
                </Badge>
              </div>
              
              {selectedAchievement.isUnlocked ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Trophy className="h-5 w-5" />
                    <span className="font-medium">Achievement Unlocked!</span>
                  </div>
                  {selectedAchievement.unlockedAt && (
                    <p className="text-sm text-green-600 mt-1">
                      Earned on {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAchievement.maxProgress > 1 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress:</span>
                        <span>{selectedAchievement.progress}/{selectedAchievement.maxProgress}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${getProgressColor(selectedAchievement.progress, selectedAchievement.maxProgress)}`}
                          style={{ width: `${(selectedAchievement.progress / selectedAchievement.maxProgress) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Keep participating in the community to unlock this achievement!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AchievementSystem;