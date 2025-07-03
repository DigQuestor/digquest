import { useLocation, Link } from "wouter";
import { 
  Home, 
  MessageSquare, 
  Camera, 
  Map, 
  Heart,
  Users,
  Navigation as NavigationIcon
} from "lucide-react";

const Navigation = () => {
  const [location] = useLocation();

  return (
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
            className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit cursor-pointer
              ${location === '/' 
                ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                : 'text-sand-beige hover:text-metallic-gold'}
            `}
          >
            <Home className="h-4 w-4 mr-1 md:mr-2" /> Home
          </Link>
          
          <Link href="/forum" 
            className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit cursor-pointer
              ${location === '/forum' 
                ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                : 'text-sand-beige hover:text-metallic-gold'}
            `}
          >
            <MessageSquare className="h-4 w-4 mr-1 md:mr-2" /> Community
          </Link>
          
          <Link href="/finds" 
            className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit cursor-pointer
              ${location === '/finds' 
                ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                : 'text-sand-beige hover:text-metallic-gold'}
            `}
          >
            <Camera className="h-4 w-4 mr-1 md:mr-2" /> Finds Gallery
          </Link>
          
          <Link href="/map" 
            className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit cursor-pointer
              ${location === '/map' 
                ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                : 'text-sand-beige hover:text-metallic-gold'}
            `}
          >
            <Map className="h-4 w-4 mr-1 md:mr-2" /> Detecting Map
          </Link>
          
          <Link href="/ar-routes" 
            className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit cursor-pointer
              ${location === '/ar-routes' 
                ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                : 'text-sand-beige hover:text-metallic-gold'}
            `}
          >
            <NavigationIcon className="h-4 w-4 mr-1 md:mr-2" /> AR Routes
          </Link>
          
          <Link href="/social" 
            className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit cursor-pointer
              ${location === '/social' 
                ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                : 'text-sand-beige hover:text-metallic-gold'}
            `}
          >
            <Users className="h-4 w-4 mr-1 md:mr-2" /> Social
          </Link>
          
          <Link href="/wellbeing" 
            className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base flex-shrink-0 min-w-fit cursor-pointer
              ${location === '/wellbeing' 
                ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                : 'text-sand-beige hover:text-metallic-gold'}
            `}
          >
            <Heart className="h-4 w-4 mr-1 md:mr-2" /> Wellbeing
          </Link>
          
          <Link href="/diggers-match" 
            className={`whitespace-nowrap transition-colors duration-300 px-3 py-2 font-medium flex items-center text-sm md:text-base relative flex-shrink-0 min-w-fit cursor-pointer
              ${location === '/diggers-match' 
                ? 'text-metallic-gold border-b-2 border-metallic-gold' 
                : 'text-sand-beige hover:text-metallic-gold'}
            `}
          >
            <Heart className="h-4 w-4 mr-1 md:mr-2 text-red-400" /> 
            <span>Digger's Match</span>
            <span className="ml-1 text-xs bg-red-500 text-white px-1 rounded">PREMIUM</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
