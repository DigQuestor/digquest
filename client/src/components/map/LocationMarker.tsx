import { useState, useCallback } from "react";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { Location, User } from "@shared/schema";

interface LocationMarkerProps {
  location: Location;
  lat: number;
  lng: number;
}

const LocationMarker = ({ location, lat, lng }: LocationMarkerProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${location.userId}`],
  });

  // Debounced handlers to prevent rapid state changes
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleClick = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className={`custom-marker absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${isHovered ? 'z-10' : 'z-0'}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <MapPin 
            className={`h-8 w-8 text-rust-orange drop-shadow-lg ${isHovered ? 'scale-125' : 'scale-100'} transition-transform duration-200`} 
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="bg-forest-green text-sand-beige py-2 px-4">
            <CardTitle className="text-lg font-display">{location.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm mb-2">{location.description || "No description provided."}</p>
            
            <div className="flex gap-2 mb-3">
              {location.type && (
                <Badge variant="outline" className="bg-sand-beige text-forest-green text-xs">
                  {location.type}
                </Badge>
              )}
              {location.hasPermission && (
                <Badge className="bg-success text-white text-xs">
                  Permission Granted
                </Badge>
              )}
              {location.isGroupDig && (
                <Badge className="bg-metallic-gold text-forest-green text-xs">
                  Group Dig
                </Badge>
              )}
            </div>
            
            <div className="flex items-center mt-2">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${user?.id || location.userId}`}
                  alt={user?.username || "User"}
                />
                <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600">Added by {user?.username || "Anonymous"}</span>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default LocationMarker;
