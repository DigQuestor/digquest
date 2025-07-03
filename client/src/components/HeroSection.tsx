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
        {/* Professional Tree Graphic - Original Replit Style */}
        <div className="relative w-full h-48 md:h-96 bg-sand-gradient rounded-xl overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              {/* Sky with realistic gradient */}
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4A90E2" />
                <stop offset="30%" stopColor="#87CEEB" />
                <stop offset="70%" stopColor="#B0E0E6" />
                <stop offset="100%" stopColor="#E6F3FF" />
              </linearGradient>
              
              {/* Realistic tree foliage */}
              <radialGradient id="treeGrad" cx="40%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#90EE90" />
                <stop offset="25%" stopColor="#32CD32" />
                <stop offset="50%" stopColor="#228B22" />
                <stop offset="75%" stopColor="#006400" />
                <stop offset="100%" stopColor="#013220" />
              </radialGradient>
              
              <radialGradient id="treeGrad2" cx="60%" cy="20%" r="70%">
                <stop offset="0%" stopColor="#ADFF2F" />
                <stop offset="30%" stopColor="#7CFC00" />
                <stop offset="60%" stopColor="#32CD32" />
                <stop offset="100%" stopColor="#228B22" />
              </radialGradient>
              
              {/* Tree trunk with bark texture */}
              <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#654321" />
                <stop offset="25%" stopColor="#8B4513" />
                <stop offset="50%" stopColor="#A0522D" />
                <stop offset="75%" stopColor="#8B4513" />
                <stop offset="100%" stopColor="#5D2A0A" />
              </linearGradient>
              
              {/* Realistic ground */}
              <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#DEB887" />
                <stop offset="40%" stopColor="#D2B48C" />
                <stop offset="80%" stopColor="#BC9A6A" />
                <stop offset="100%" stopColor="#8B6F47" />
              </linearGradient>
              
              {/* Advanced filters for realism */}
              <filter id="treeShadow" x="-100%" y="-100%" width="300%" height="300%">
                <feDropShadow dx="4" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.4"/>
              </filter>
              
              <filter id="detectGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <filter id="leafDetail" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence baseFrequency="0.7" numOctaves="3" result="noise"/>
                <feColorMatrix in="noise" type="saturate" values="0"/>
                <feComponentTransfer>
                  <feFuncA type="discrete" tableValues="0.1 0.2 0.3"/>
                </feComponentTransfer>
                <feComposite operator="overlay" in2="SourceGraphic"/>
              </filter>
            </defs>
            
            {/* Realistic sky with depth */}
            <rect width="1200" height="280" fill="url(#skyGrad)" />
            
            {/* Distant hills for depth */}
            <path d="M0,240 Q300,220 600,230 Q900,210 1200,225 L1200,280 L0,280 Z" fill="#8FBC8F" opacity="0.6" />
            <path d="M0,260 Q400,250 800,255 Q1000,245 1200,250 L1200,280 L0,280 Z" fill="#98FB98" opacity="0.4" />
            
            {/* Rolling ground with natural curves */}
            <path d="M0,280 Q200,270 400,275 Q600,265 800,270 Q1000,275 1200,270 L1200,400 L0,400 Z" fill="url(#groundGrad)" />
            
            {/* Ground texture and depth */}
            <ellipse cx="600" cy="350" rx="400" ry="30" fill="#A0522D" opacity="0.3" />
            <ellipse cx="600" cy="340" rx="350" ry="25" fill="#BC9A6A" opacity="0.2" />
            
            {/* Main tree trunk with realistic proportions */}
            <rect x="575" y="180" width="50" height="140" fill="url(#trunkGrad)" filter="url(#treeShadow)" rx="3" />
            
            {/* Bark texture details */}
            <path d="M578 185 L578 315" stroke="#5D2A0A" strokeWidth="2" opacity="0.7" />
            <path d="M585 190 L585 310" stroke="#5D2A0A" strokeWidth="1.5" opacity="0.5" />
            <path d="M595 188 L595 312" stroke="#5D2A0A" strokeWidth="1" opacity="0.6" />
            <path d="M605 192 L605 308" stroke="#5D2A0A" strokeWidth="1.5" opacity="0.5" />
            <path d="M615 187 L615 315" stroke="#5D2A0A" strokeWidth="2" opacity="0.7" />
            <path d="M622 190 L622 310" stroke="#5D2A0A" strokeWidth="1" opacity="0.4" />
            
            {/* Tree roots extending into ground */}
            <path d="M575 320 Q550 340 525 350" stroke="#654321" strokeWidth="6" fill="none" opacity="0.7" />
            <path d="M625 320 Q650 340 675 350" stroke="#654321" strokeWidth="6" fill="none" opacity="0.7" />
            <path d="M600 320 Q600 345 595 360" stroke="#654321" strokeWidth="4" fill="none" opacity="0.6" />
            
            {/* Realistic tree canopy with multiple layers */}
            <circle cx="600" cy="170" r="90" fill="url(#treeGrad)" filter="url(#treeShadow)" />
            <circle cx="560" cy="145" r="70" fill="url(#treeGrad2)" opacity="0.9" />
            <circle cx="640" cy="155" r="75" fill="url(#treeGrad)" opacity="0.85" />
            <circle cx="600" cy="120" r="60" fill="url(#treeGrad2)" opacity="0.8" />
            <circle cx="575" cy="180" r="55" fill="url(#treeGrad)" opacity="0.7" />
            <circle cx="625" cy="175" r="50" fill="url(#treeGrad2)" opacity="0.75" />
            
            {/* Detailed branch structure */}
            <path d="M575 190 Q540 170 510 155" stroke="#8B4513" strokeWidth="6" fill="none" />
            <path d="M510 155 Q500 145 490 135" stroke="#8B4513" strokeWidth="3" fill="none" />
            <path d="M625 195 Q660 175 690 160" stroke="#8B4513" strokeWidth="6" fill="none" />
            <path d="M690 160 Q700 150 710 140" stroke="#8B4513" strokeWidth="3" fill="none" />
            <path d="M600 180 Q600 150 595 120" stroke="#8B4513" strokeWidth="5" fill="none" />
            
            {/* Secondary branches with leaves */}
            <path d="M545 175 Q525 165 515 155" stroke="#A0522D" strokeWidth="3" fill="none" />
            <path d="M655 180 Q675 170 685 160" stroke="#A0522D" strokeWidth="3" fill="none" />
            <circle cx="515" cy="155" r="12" fill="url(#treeGrad2)" opacity="0.6" />
            <circle cx="685" cy="160" r="15" fill="url(#treeGrad)" opacity="0.7" />
            
            {/* Enhanced metal detecting spots */}
            <g filter="url(#detectGlow)">
              {/* Gold detection with realistic glow */}
              <circle cx="350" cy="320" r="12" fill="#FFD700" opacity="0.7">
                <animate attributeName="r" values="10;15;10" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="350" cy="320" r="6" fill="#FFF700" opacity="1">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
              
              {/* Silver detection */}
              <circle cx="850" cy="330" r="10" fill="#C0C0C0" opacity="0.8">
                <animate attributeName="r" values="8;12;8" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="850" cy="330" r="4" fill="#E6E6FA" opacity="0.9" />
              
              {/* Copper detection */}
              <circle cx="450" cy="340" r="8" fill="#B87333" opacity="0.7">
                <animate attributeName="r" values="6;10;6" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
              </circle>
            </g>
            
            {/* Realistic vegetation and grass */}
            <g stroke="#228B22" strokeWidth="2" fill="none" opacity="0.8">
              <path d="M200 300 Q205 290 210 300 Q215 285 220 300 Q225 290 230 300" />
              <path d="M300 310 Q305 300 310 310 Q315 295 320 310" />
              <path d="M750 305 Q755 295 760 305 Q765 290 770 305 Q775 295 780 305" />
              <path d="M900 315 Q905 305 910 315 Q915 300 920 315" />
              <path d="M100 320 Q105 310 110 320 Q115 305 120 320" />
            </g>
            
            {/* Natural ground elements */}
            <ellipse cx="400" cy="325" rx="15" ry="8" fill="#696969" opacity="0.7" />
            <ellipse cx="750" cy="335" rx="12" ry="6" fill="#708090" opacity="0.6" />
            <ellipse cx="250" cy="340" rx="10" ry="5" fill="#778899" opacity="0.5" />
            <circle cx="180" cy="330" r="6" fill="#A0522D" opacity="0.4" />
            <circle cx="950" cy="345" r="4" fill="#8B4513" opacity="0.5" />
            
            {/* Scattered leaves on ground */}
            <ellipse cx="320" cy="315" rx="5" ry="3" fill="#CD853F" opacity="0.6" transform="rotate(35 320 315)" />
            <ellipse cx="680" cy="325" rx="4" ry="2" fill="#D2691E" opacity="0.7" transform="rotate(-25 680 325)" />
            <ellipse cx="500" cy="345" rx="4" ry="2" fill="#8B4513" opacity="0.5" transform="rotate(60 500 345)" />
            <ellipse cx="800" cy="350" rx="3" ry="2" fill="#A0522D" opacity="0.6" transform="rotate(15 800 350)" />
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
