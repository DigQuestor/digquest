import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import HeroSection from "@/components/HeroSection.tsx";
import FeaturedFinds from "@/components/FeaturedFinds.tsx";
import CommunitySection from "@/components/CommunitySection.tsx";
import MapSection from "@/components/MapSection.tsx";
import WellbeingSection from "@/components/WellbeingSection.tsx";
import FindDetailLink from "@/components/finds/FindDetailLink.tsx";
import OnboardingTour from "@/components/OnboardingTour.tsx";
import AchievementSystem from "@/components/AchievementSystem.tsx";
import { useAuth } from "@/hooks/use-auth-simple";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Play, Users, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";
import treeImage from "@/assets/couple-sunset-lake.jpg";
import detectingGroupImage from "@/assets/detecting-group.webp";

const Home = () => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user is new and should see onboarding
  useEffect(() => {
    if (user) {
      // Skip onboarding for DigQuestor admin account
      if (user.username === "DigQuestor") {
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
        setHasCompletedOnboarding(true);
        setShowOnboarding(false);
        return;
      }
      
      // Check if user has seen onboarding before
      const hasSeenOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
      
      if (!hasSeenOnboarding) {
        // This is their first time - show onboarding
        setShowOnboarding(true);
        setHasCompletedOnboarding(false);
      } else {
        // They've seen it before, don't show it
        setHasCompletedOnboarding(true);
        setShowOnboarding(false);
      }
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    // Mark onboarding as completed for this user
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  return (
    <>
      <Helmet>
        <title>DigQuest - Metal Detecting for Wellbeing</title>
        <meta name="description" content="Join our community of metal detecting enthusiasts improving wellbeing one find at a time. Discover buried history and connect with like-minded people." />
        <link rel="canonical" href="https://digquest.org/" />
      </Helmet>

      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-full overflow-x-hidden">
        {/* Welcome message for new users only */}
        {user && !hasCompletedOnboarding && !localStorage.getItem(`onboarding_completed_${user.id}`) && (
          <Card className="mb-4 md:mb-6 border-2 border-metallic-gold/30 bg-gradient-to-r from-metallic-gold/10 to-earth-brown/10">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 md:h-8 md:w-8 text-metallic-gold flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base md:text-lg font-bold text-earth-brown break-words">Welcome to DigQuest, {user.username}!</h3>
                    <p className="text-xs md:text-sm text-gray-600">Take our quick tour to get started with the community</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
                      setHasCompletedOnboarding(true);
                    }}
                    className="text-gray-600 hover:text-gray-800 mobile-button"
                  >
                    Skip
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setShowOnboarding(true)}
                    className="bg-forest-green hover:bg-green-900 mobile-button"
                  >
                    <Play className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Start </span>Tour
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <HeroSection />
        
        {/* Add achievements section for logged-in users */}
        {user && (
          <div className="my-12">
            <AchievementSystem compact={true} />
          </div>
        )}
        
        {/* Groups Section for logged-in users */}
        {user && (
          <div className="my-12">
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="relative min-h-[12rem] sm:h-48 bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600">
                {/* Background image overlay - Enhanced tree visibility */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-75"
                  style={{
                    backgroundImage: `url(${detectingGroupImage})`,
                    backgroundPosition: 'center center',
                    backgroundSize: 'cover',
                    filter: 'brightness(1.1) contrast(1.2) saturate(1.3)'
                  }}
                />
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
                
                <CardContent className="relative min-h-[12rem] sm:h-full p-4 sm:p-6 lg:p-8 flex flex-col items-start justify-center text-white gap-4">
                  {/* Content wrapper with proper spacing */}
                  <div className="w-full space-y-4">
                    {/* Header section */}
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 flex-shrink-0">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 text-white drop-shadow-lg">
                          Join Detecting Groups
                        </h3>
                        <p className="text-xs sm:text-sm text-white/90 drop-shadow leading-relaxed">
                          Connect with local detectorists, share knowledge, and organize group treasure hunts
                        </p>
                      </div>
                    </div>
                    
                    {/* Features section */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-white/80 ml-8 sm:ml-12">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Active Groups
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Weekly Hunts
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Meetups
                      </span>
                    </div>
                    
                    {/* Button section */}
                    <div className="flex justify-center sm:justify-start ml-0 sm:ml-12">
                      <Link href="/social?tab=groups" className="inline-block">
                        <Button className="bg-white text-amber-700 hover:bg-white/90 font-semibold px-6 py-2.5 text-sm sm:text-base shadow-lg">
                          Explore Groups
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        )}
        
        <FeaturedFinds />
        <CommunitySection />
        <MapSection />
        <WellbeingSection />
      </div>

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
};

export default Home;
