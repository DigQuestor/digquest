import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LogIn, 
  UserPlus, 
  Shovel,
  LogOut,
  Settings,
  ChevronDown,
  User as UserIcon,
  Home, 
  MessageSquare, 
  Camera, 
  Map, 
  Heart,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoginModal from "@/components/auth/LoginModal.tsx";
import SignupModal from "@/components/auth/SignupModal.tsx";
import { useAuth } from "@/hooks/use-auth-simple";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import headerImage from "@/assets/header-image.svg";

const Header = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [location] = useLocation();
  const [displayName, setDisplayName] = useState<string>("");
  
  // Using our mock auth from use-auth-simple
  const { user, logout } = useAuth();
  
  // Update avatar and display name when user changes
  useEffect(() => {
    if (user) {
      console.log("Header user update:", user);
      
      // Explicitly load the avatar URL from user object
      if (user.avatarUrl) {
        console.log("Setting avatar URL:", user.avatarUrl.substring(0, 30) + "...");
        setAvatarUrl(user.avatarUrl);
      } else {
        console.log("No avatar URL found for user");
        setAvatarUrl(null);
      }
      
      // Set display name
      setDisplayName(user.username || "User");
    } else {
      setAvatarUrl(null);
      setDisplayName("");
    }
  }, [user]);

  // Search functionality removed as it was not functional

  return (
    <header className="relative bg-forest-green/80 text-white py-4 shadow-md overflow-hidden">
      {/* Header background image */}
      <div className="absolute inset-0 w-full h-full opacity-45">
        <img 
          src="https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
          alt="Peaceful meadow for metal detecting" 
          className="w-full h-full object-cover" />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center relative z-10">
        <div className="flex items-center mb-4 md:mb-0">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <Shovel className="h-8 w-8 text-metallic-gold mr-3" />
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">DigQuest</h1>
            </div>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row items-center">
          {/* Search functionality removed as it was not serving any purpose */}
          <div className="flex space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 p-1 hover:bg-white/10 shadow-md">
                      <Avatar className="h-8 w-8 border-2 border-metallic-gold">
                        {avatarUrl ? (
                          <AvatarImage 
                            src={avatarUrl} 
                            alt={displayName}
                            onError={(e) => {
                              console.error("Failed to load avatar image");
                              e.currentTarget.style.display = 'none';
                            }} 
                          />
                        ) : null}
                        <AvatarFallback className="bg-forest-green text-white">
                          {displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-white">
                        <span className="font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">{displayName}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="flex items-center" asChild>
                      <Link href="/profile/edit">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Edit Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center text-red-600" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button 
                  className="bg-white hover:bg-gray-100 text-forest-green font-semibold transition duration-300 flex items-center shadow-md"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  <LogIn className="h-4 w-4 mr-2" /> Login
                </Button>
                <Button 
                  className="bg-metallic-gold hover:bg-yellow-600 text-forest-green font-semibold transition duration-300 flex items-center shadow-md"
                  onClick={() => setIsSignupModalOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="bg-forest-green py-3 shadow-md">
        <div className="container mx-auto px-4">
          <div 
            className="flex items-center space-x-3 md:space-x-6 overflow-x-auto overflow-y-hidden scrollbar-hide pb-2 -mb-2 min-w-0" 
            style={{
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
            }}
          >
            <Link href="/" 
              className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit
                ${location === '/' 
                  ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                  : 'text-white hover:text-metallic-gold'}`}
            >
              <Home className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              Home
            </Link>
            
            <Link href="/forum" 
              className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit
                ${location === '/forum' 
                  ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                  : 'text-white hover:text-metallic-gold'}`}
            >
              <MessageSquare className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              Community
            </Link>
            
            <Link href="/finds" 
              className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit
                ${location === '/finds' 
                  ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                  : 'text-white hover:text-metallic-gold'}`}
            >
              <Camera className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              Finds Gallery
            </Link>
            
            <Link href="/detecting-map" 
              className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit
                ${location === '/detecting-map' 
                  ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                  : 'text-white hover:text-metallic-gold'}`}
            >
              <Map className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              Detecting Map
            </Link>
            
            <Link href="/wellbeing" 
              className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit
                ${location === '/wellbeing' 
                  ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                  : 'text-white hover:text-metallic-gold'}`}
            >
              <Heart className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              Wellbeing
            </Link>
            
            <Link href="/events" 
              className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit
                ${location === '/events' 
                  ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                  : 'text-white hover:text-metallic-gold'}`}
            >
              <Users className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              Events
            </Link>
          </div>
        </div>
      </nav>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      
      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)}
        onOpenLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </header>
  );
};

export default Header;
