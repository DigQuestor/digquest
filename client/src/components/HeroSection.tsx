import { Link } from "wouter";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth-simple";
import { useState } from "react";
import SignupModal from "@/components/auth/SignupModal.tsx";
import treeImage from "@/assets/tree-trunk-close-up-with-a-blurred-lake-background_1751574934471.jpg";

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
        {/* New Tree Trunk Background */}
        <div 
          className="relative w-full h-48 md:h-96 rounded-xl overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${treeImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
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
