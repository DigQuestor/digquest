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
        {/* Original Replit Style - Real Tree Photo Background */}
        <div 
          className="relative w-full h-48 md:h-96 rounded-xl overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI2MDAiIHZpZXdCb3g9IjAgMCAxMDAwIDYwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JlZW5HcmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjAlIiB5Mj0iMTAwJSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM0NjgwNDAiLz4KPHN0b3Agb2Zmc2V0PSIyMCUiIHN0b3AtY29sb3I9IiMzNjcwMzAiLz4KPHN0b3Agb2Zmc2V0PSI0MCUiIHN0b3AtY29sb3I9IiMyZDUwMTYiLz4KPHN0b3Agb2Zmc2V0PSI2MCUiIHN0b3AtY29sb3I9IiMyNDQwMTAiLz4KPHN0b3Agb2Zmc2V0PSI4MCUiIHN0b3AtY29sb3I9IiMxZTMwMGEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMWEyMDA4Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0idHJ1bmtHcmFkIiBjeD0iNDAlIiBjeT0iMzAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzZkNGMyYiIvPgo8c3RvcCBvZmZzZXQ9IjMwJSIgc3RvcC1jb2xvcj0iIzVhNDAyMyIvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM0YTMwMWIiLz4KPC9yYWRpYWxHcmFkaWVudD4KPC9kZWZzPgo8cmVjdCB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjZ3JlZW5HcmFkKSIvPgo8IS0tIE1haW4gVHJ1bmsgLS0+CjxyZWN0IHg9IjQwMCIgeT0iMTAwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0idXJsKCN0cnVua0dyYWQpIiByeD0iMjAiLz4KPCEtLSBMZWZ0IEJyYW5jaGVzIC0tPgo8ZWxsaXBzZSBjeD0iMzAwIiBjeT0iMjAwIiByeD0iODAiIHJ5PSI0MCIgZmlsbD0iIzJkNTAxNiIgb3BhY2l0eT0iMC44IiB0cmFuc2Zvcm09InJvdGF0ZSgtMjAgMzAwIDIwMCkiLz4KPGVsbGlwc2UgY3g9IjI1MCIgY3k9IjI4MCIgcng9IjcwIiByeT0iMzUiIGZpbGw9IiMzNjcwMzAiIG9wYWNpdHk9IjAuNyIgdHJhbnNmb3JtPSJyb3RhdGUoLTM1IDI1MCAyODApIi8+CjxlbGxpcHNlIGN4PSIyMDAiIGN5PSIzNjAiIHJ4PSI2MCIgcnk9IjMwIiBmaWxsPSIjNDY4MDQwIiBvcGFjaXR5PSIwLjYiIHRyYW5zZm9ybT0icm90YXRlKC01MCAyMDAgMzYwKSIvPgo8IS0tIFJpZ2h0IEJyYW5jaGVzIC0tPgo8ZWxsaXBzZSBjeD0iNzAwIiBjeT0iMjAwIiByeD0iODAiIHJ5PSI0MCIgZmlsbD0iIzJkNTAxNiIgb3BhY2l0eT0iMC44IiB0cmFuc2Zvcm09InJvdGF0ZSgyMCA3MDAgMjAwKSIvPgo8ZWxsaXBzZSBjeD0iNzUwIiBjeT0iMjgwIiByeD0iNzAiIHJ5PSIzNSIgZmlsbD0iIzM2NzAzMCIgb3BhY2l0eT0iMC43IiB0cmFuc2Zvcm09InJvdGF0ZSgzNSA3NTAgMjgwKSIvPgo8ZWxsaXBzZSBjeD0iODAwIiBjeT0iMzYwIiByeD0iNjAiIHJ5PSIzMCIgZmlsbD0iIzQ2ODA0MCIgb3BhY2l0eT0iMC42IiB0cmFuc2Zvcm09InJvdGF0ZSg1MCA4MDAgMzYwKSIvPgo8IS0tIFRvcCBCcmFuY2hlcyAtLT4KPGVsbGlwc2UgY3g9IjUwMCIgY3k9IjE1MCIgcng9IjEyMCIgcnk9IjUwIiBmaWxsPSIjMmQ1MDE2IiBvcGFjaXR5PSIwLjkiLz4KPGVsbGlwc2UgY3g9IjQ1MCIgY3k9IjEwMCIgcng9IjkwIiByeT0iNDAiIGZpbGw9IiMzNjcwMzAiIG9wYWNpdHk9IjAuOCIvPgo8ZWxsaXBzZSBjeD0iNTUwIiBjeT0iMTAwIiByeD0iOTAiIHJ5PSI0MCIgZmlsbD0iIzM2NzAzMCIgb3BhY2l0eT0iMC44Ii8+CjxlbGxpcHNlIGN4PSI1MDAiIGN5PSI1MCIgcng9IjYwIiByeT0iMzAiIGZpbGw9IiM0NjgwNDAiIG9wYWNpdHk9IjAuNyIvPgo8IS0tIEJhcmsgVGV4dHVyZSAtLT4KPHJlY3QgeD0iNDEwIiB5PSIxMDAiIHdpZHRoPSI0IiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzNhMjQxNSIgb3BhY2l0eT0iMC42Ii8+CjxyZWN0IHg9IjQzMCIgeT0iMTAwIiB3aWR0aD0iNCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMzYTI0MTUiIG9wYWNpdHk9IjAuNiIvPgo8cmVjdCB4PSI0NTAiIHk9IjEwMCIgd2lkdGg9IjQiIGhlaWdodD0iNTAwIiBmaWxsPSIjM2EyNDE1IiBvcGFjaXR5PSIwLjYiLz4KPHJlY3QgeD0iNDcwIiB5PSIxMDAiIHdpZHRoPSI0IiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzNhMjQxNSIgb3BhY2l0eT0iMC42Ii8+CjxyZWN0IHg9IjQ5MCIgeT0iMTAwIiB3aWR0aD0iNCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMzYTI0MTUiIG9wYWNpdHk9IjAuNiIvPgo8cmVjdCB4PSI1MTAiIHk9IjEwMCIgd2lkdGg9IjQiIGhlaWdodD0iNTAwIiBmaWxsPSIjM2EyNDE1IiBvcGFjaXR5PSIwLjYiLz4KPHJlY3QgeD0iNTMwIiB5PSIxMDAiIHdpZHRoPSI0IiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzNhMjQxNSIgb3BhY2l0eT0iMC42Ii8+CjxyZWN0IHg9IjU1MCIgeT0iMTAwIiB3aWR0aD0iNCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMzYTI0MTUiIG9wYWNpdHk9IjAuNiIvPgo8cmVjdCB4PSI1NzAiIHk9IjEwMCIgd2lkdGg9IjQiIGhlaWdodD0iNTAwIiBmaWxsPSIjM2EyNDE1IiBvcGFjaXR5PSIwLjYiLz4KPHJlY3QgeD0iNTkwIiB5PSIxMDAiIHdpZHRoPSI0IiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzNhMjQxNSIgb3BhY2l0eT0iMC42Ii8+Cjwvc3ZnPgo=')`,
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
