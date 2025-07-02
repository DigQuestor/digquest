import { Link } from "wouter";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth-simple";
import { useState } from "react";
import SignupModal from "@/components/auth/SignupModal.tsx";

const HeroSection = () => {
  const { user } = useAuth();
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const handleJoinCommunity = () => {
    if (!user) {
      setIsSignupModalOpen(true);
    }
  };

  return (
    <section className="mb-6 md:mb-12">
      <div className="relative rounded-xl overflow-hidden shadow-glow interactive-card">
        {/* Enhanced Tree SVG Background */}
        <div className="relative w-full h-48 md:h-96 bg-sand-gradient rounded-xl overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#87CEEB" />
                <stop offset="50%" stopColor="#B0E0E6" />
                <stop offset="100%" stopColor="#F5F5DC" />
              </linearGradient>
              <linearGradient id="treeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#32CD32" />
                <stop offset="30%" stopColor="#228B22" />
                <stop offset="100%" stopColor="#006400" />
              </linearGradient>
              <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#A0522D" />
                <stop offset="50%" stopColor="#8B4513" />
                <stop offset="100%" stopColor="#654321" />
              </linearGradient>
              <filter id="treeShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.3"/>
              </filter>
            </defs>
            
            {/* Enhanced Sky background */}
            <rect width="1200" height="400" fill="url(#skyGrad)" />
            
            {/* Enhanced Ground with texture */}
            <path d="M0,320 Q300,300 600,280 Q900,300 1200,320 L1200,400 L0,400 Z" fill="#8B6F47" />
            <path d="M0,330 Q600,310 1200,330 L1200,400 L0,400 Z" fill="#A0522D" opacity="0.3" />
            
            {/* Enhanced Tree trunk with gradient */}
            <rect x="580" y="200" width="40" height="120" fill="url(#trunkGrad)" filter="url(#treeShadow)" />
            <rect x="578" y="200" width="4" height="120" fill="#CD853F" opacity="0.6" />
            
            {/* Enhanced Tree foliage with multiple layers */}
            <circle cx="600" cy="180" r="85" fill="url(#treeGrad)" opacity="0.95" filter="url(#treeShadow)" />
            <circle cx="560" cy="160" r="65" fill="url(#treeGrad)" opacity="0.85" filter="url(#treeShadow)" />
            <circle cx="640" cy="160" r="65" fill="url(#treeGrad)" opacity="0.85" filter="url(#treeShadow)" />
            <circle cx="600" cy="140" r="50" fill="url(#treeGrad)" opacity="0.9" />
            <circle cx="580" cy="170" r="45" fill="#228B22" opacity="0.7" />
            <circle cx="620" cy="170" r="45" fill="#228B22" opacity="0.7" />
            
            {/* Enhanced detecting spots with glow effect */}
            <circle cx="300" cy="330" r="10" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="300" cy="330" r="15" fill="#FFD700" opacity="0.3" />
            
            <circle cx="900" cy="340" r="8" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="900" cy="340" r="12" fill="#FFD700" opacity="0.3" />
            
            <circle cx="450" cy="335" r="6" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="450" cy="335" r="10" fill="#FFD700" opacity="0.3" />
          </svg>
          
          {/* Overlay content */}
          <div className="absolute inset-0 bg-gradient-to-r from-earth-brown/30 to-forest-green/30">
            <div className="absolute bottom-2 md:bottom-4 left-4 md:left-8 lg:left-16 right-4 md:right-8">
              <h2 className="font-display text-xl md:text-3xl lg:text-5xl text-sand-beige mb-2 md:mb-4 glass-effect py-1 md:py-2 px-2 md:px-4 rounded-lg font-bold drop-shadow-lg">
                History Unearthed
              </h2>
              <p className="text-sand-beige text-sm md:text-lg lg:text-xl font-medium mb-1 glass-effect py-1 md:py-2 px-2 md:px-3 rounded drop-shadow-lg">
                Join our community of metal detecting enthusiasts improving wellbeing one find at a time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Community action area below the hero image */}
      <div className="mt-4 md:mt-6 glass-effect rounded-lg p-4 md:p-6 shadow-treasure border border-earth-brown/30 interactive-card">
        {user === null ? (
          // Non-logged in user view
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left md:mr-8">
              <h3 className="text-lg md:text-2xl font-semibold text-forest-green mb-2 metal-detector-icon">Ready to start your detecting journey?</h3>
              <p className="text-earth-brown text-base md:text-lg">Connect with fellow detectorists and share your adventures.</p>
            </div>
            
            <Button 
              className="treasure-gradient hover:shadow-treasure text-white font-bold py-3 px-6 rounded-lg text-base md:text-lg transition-all duration-300 transform hover:scale-105 shadow-glow flex items-center w-full md:w-auto animate-pulse-glow mobile-button"
              onClick={handleJoinCommunity}
            >
              <UserPlus className="h-5 w-5 mr-2" /> Join Our Community
            </Button>
          </div>
        ) : (
          // Logged in user view - No welcome text, just buttons
          <div className="flex flex-row justify-center">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Link href="/forum" className="w-full sm:w-auto">
                <Button 
                  className="treasure-gradient hover:shadow-treasure text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-glow w-full interactive-card"
                >
                  Visit Forum
                </Button>
              </Link>
              <Link href="/finds" className="w-full sm:w-auto">
                <Button 
                  className="earth-gradient hover:shadow-treasure text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-glow w-full interactive-card"
                >
                  Browse Finds
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)} 
      />
    </section>
  );
};

export default HeroSection;
