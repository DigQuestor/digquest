import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Trophy,
  MessageSquare,
  Camera,
  Map,
  Navigation,
  Heart,
  Star,
  CheckCircle,
  Gift
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth-simple";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  completionReward?: {
    achievement: string;
    points: number;
  };
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const OnboardingTour = ({ isOpen, onClose, onComplete }: OnboardingTourProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to DigQuest!",
      description: "Your gateway to the metal detecting community",
      icon: <Trophy className="h-8 w-8 text-metallic-gold" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mb-4 p-4 bg-gradient-to-br from-metallic-gold/20 to-earth-brown/20 rounded-lg">
              <Trophy className="h-16 w-16 text-metallic-gold mx-auto mb-2" />
              <h3 className="text-xl font-bold text-earth-brown">Welcome, {user?.username}!</h3>
            </div>
            <p className="text-gray-600">
              DigQuest is your complete platform for metal detecting adventures, community connection, 
              and wellbeing through treasure hunting. Let's show you around!
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-forest-green/10 rounded-lg">
              <MessageSquare className="h-6 w-6 text-forest-green mx-auto mb-1" />
              <p className="text-sm font-medium">Share & Learn</p>
            </div>
            <div className="text-center p-3 bg-earth-brown/10 rounded-lg">
              <Camera className="h-6 w-6 text-earth-brown mx-auto mb-1" />
              <p className="text-sm font-medium">Show Your Finds</p>
            </div>
            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
              <Map className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <p className="text-sm font-medium">Discover Locations</p>
            </div>
            <div className="text-center p-3 bg-purple-500/10 rounded-lg">
              <Navigation className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              <p className="text-sm font-medium">AR Route Guidance</p>
            </div>
          </div>
        </div>
      ),
      completionReward: {
        achievement: "Welcome Aboard",
        points: 50
      }
    },
    {
      id: "forum",
      title: "Join the Conversation",
      description: "Connect with fellow detectorists",
      icon: <MessageSquare className="h-8 w-8 text-forest-green" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mb-4 p-4 bg-gradient-to-br from-forest-green/20 to-green-600/20 rounded-lg">
              <MessageSquare className="h-12 w-12 text-forest-green mx-auto mb-2" />
              <h3 className="text-lg font-bold">Community Forums</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Our forums are where the magic happens! Get advice, share stories, and help identify finds.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-forest-green">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">Beginner Tips</Badge>
                <span className="text-xs text-gray-500">Perfect for newcomers</span>
              </div>
              <p className="text-sm">Learn the basics of metal detecting</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">Find Identification</Badge>
                <span className="text-xs text-gray-500">Expert help available</span>
              </div>
              <p className="text-sm">Get help identifying your discoveries</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">Wellbeing & Mindfulness</Badge>
                <span className="text-xs text-gray-500">Mental health focus</span>
              </div>
              <p className="text-sm">How detecting improves wellbeing</p>
            </div>
          </div>
        </div>
      ),
      completionReward: {
        achievement: "Community Explorer",
        points: 30
      }
    },
    {
      id: "finds",
      title: "Share Your Treasures",
      description: "Upload and showcase your finds",
      icon: <Camera className="h-8 w-8 text-earth-brown" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mb-4 p-4 bg-gradient-to-br from-earth-brown/20 to-amber-600/20 rounded-lg">
              <Camera className="h-12 w-12 text-earth-brown mx-auto mb-2" />
              <h3 className="text-lg font-bold">Finds Gallery</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Share your discoveries with the community! Every find tells a story and inspires others.
            </p>
          </div>
          
          <Card className="bg-gradient-to-br from-metallic-gold/10 to-earth-brown/10">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <Gift className="h-8 w-8 text-metallic-gold mx-auto" />
                <p className="text-sm font-medium">Pro Tip!</p>
                <p className="text-xs text-gray-600">
                  Include the historical period (Roman, Medieval, Victorian) and any interesting backstory. 
                  The community loves learning about the history behind finds!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      completionReward: {
        achievement: "Treasure Shower",
        points: 40
      }
    },
    {
      id: "map",
      title: "Explore Detecting Locations",
      description: "Discover and share great detecting spots",
      icon: <Map className="h-8 w-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mb-4 p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
              <Map className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold">Interactive Map</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Find detecting locations shared by the community, complete with permissions info and find potential.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Permission Confirmed</p>
                <p className="text-xs text-gray-500">Landowner permission verified</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Group Digs Welcome</p>
                <p className="text-xs text-gray-500">Perfect for community events</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Historical Significance</p>
                <p className="text-xs text-gray-500">Roman, Medieval, or Victorian sites</p>
              </div>
            </div>
          </div>
        </div>
      ),
      completionReward: {
        achievement: "Explorer",
        points: 35
      }
    },
    {
      id: "ar",
      title: "AR Route Recommendations",
      description: "Next-generation detecting guidance",
      icon: <Navigation className="h-8 w-8 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mb-4 p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
              <Navigation className="h-12 w-12 text-purple-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold">AR Routes</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Point your camera and see personalized detecting routes overlaid on your view! 
              Revolutionary technology for modern treasure hunters.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live AR Overlays</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Personalized Recommendations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Real-time Distance & Difficulty</span>
            </div>
          </div>
          
          <div className="text-center">
            <Badge className="bg-purple-500 text-white mb-2">
              🚀 Cutting Edge Technology
            </Badge>
            <p className="text-xs text-gray-500">
              Requires camera and location permissions
            </p>
          </div>
        </div>
      ),
      completionReward: {
        achievement: "Tech Pioneer",
        points: 50
      }
    },
    {
      id: "complete",
      title: "You're All Set!",
      description: "Welcome to the DigQuest community",
      icon: <Trophy className="h-8 w-8 text-metallic-gold" />,
      content: (
        <div className="space-y-3">
          <div className="text-center">
            <div className="mb-3 p-4 bg-gradient-to-br from-metallic-gold/20 to-earth-brown/20 rounded-lg">
              <Trophy className="h-12 w-12 text-metallic-gold mx-auto mb-2" />
              <h3 className="text-lg font-bold text-earth-brown">Congratulations!</h3>
              <p className="text-xs text-gray-600 mt-1">
                You've completed the DigQuest tour
              </p>
            </div>
          </div>
          
          <Card className="border-2 border-metallic-gold/30 bg-gradient-to-br from-metallic-gold/5 to-earth-brown/5">
            <CardContent className="pt-4 pb-3">
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold">🏆 Tour Complete Achievement</p>
                <Badge className="bg-metallic-gold text-black px-3 py-1">
                  DigQuest Explorer • 205 Points
                </Badge>
                <p className="text-xs text-gray-600">
                  You're now ready to start your detecting journey!
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-center text-gray-500">Quick Links:</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="outline" size="sm" className="text-xs py-1 h-8">
                Browse Forum
              </Button>
              <Button variant="outline" size="sm" className="text-xs py-1 h-8">
                Upload Find
              </Button>
              <Button variant="outline" size="sm" className="text-xs py-1 h-8">
                Explore Map
              </Button>
              <Button variant="outline" size="sm" className="text-xs py-1 h-8">
                Try AR Routes
              </Button>
            </div>
          </div>
        </div>
      ),
      completionReward: {
        achievement: "DigQuest Explorer",
        points: 100
      }
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const currentStepId = steps[currentStep].id;
      if (!completedSteps.includes(currentStepId)) {
        setCompletedSteps([...completedSteps, currentStepId]);
        
        // Show achievement notification
        const reward = steps[currentStep].completionReward;
        if (reward) {
          toast({
            title: (
              <div className="flex items-center gap-2 text-white">
                <span className="text-2xl">🏆</span>
                <span className="text-lg font-bold leading-none">Achievement Unlocked!</span>
              </div>
            ),
            description: (
              <div className="mt-2 space-y-2.5 text-white">
                <p className="text-lg font-bold leading-tight">{reward.achievement}</p>
                <p className="text-sm font-medium text-white/90">Step {currentStep + 1} completed</p>
                <div className="mt-2 rounded border border-metallic-gold/70 bg-metallic-gold px-3 py-2">
                  <p className="text-base font-bold text-black">+{reward.points} Points Earned!</p>
                </div>
              </div>
            ),
            duration: 5000,
            className: "border-forest-green bg-forest-green text-white shadow-xl",
          });
        }
      }
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Award final achievement
    toast({
      title: (
        <div className="flex items-center gap-2 text-white">
          <span className="text-2xl">🎉</span>
          <span className="text-lg font-bold leading-none">Welcome to DigQuest!</span>
        </div>
      ),
      description: (
        <div className="mt-2 space-y-2.5 text-white">
          <p className="text-lg font-bold leading-tight">DigQuest Explorer</p>
          <p className="text-sm font-medium text-white/90">All tour steps completed!</p>
          <div className="mt-2 rounded border border-metallic-gold/70 bg-metallic-gold px-3 py-2">
            <p className="text-base font-bold text-black">+100 Points Earned!</p>
          </div>
          <p className="text-sm font-medium text-white/90">Happy detecting! 🏆</p>
        </div>
      ),
      duration: 5000,
      className: "border-forest-green bg-forest-green text-white shadow-xl",
    });
    
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    toast({
      title: "✓ Tour Skipped",
      description: "You can always restart the tour from your profile settings.",
      duration: 3000,
      className: "bg-blue-600 text-white border-blue-700 font-semibold text-lg",
    });
    onClose();
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {currentStepData.icon}
              {currentStepData.title}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="py-4">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              <Button onClick={handleNext} className="bg-forest-green hover:bg-green-900">
                {currentStep === steps.length - 1 ? (
                  <>
                    <Trophy className="h-4 w-4 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;