import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Event, User } from "@shared/schema";
import { ArrowLeft, Users, Calendar, MapPin, Clock, Loader2, Share, ThumbsUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth-simple";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, isPast } from "date-fns";

const EventDetail = () => {
  const [, params] = useRoute("/events/:id");
  const [, setLocation] = useLocation();
  const eventId = params?.id ? parseInt(params.id) : null;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isJoining, setIsJoining] = useState(false);

  // Fetch event data
  const { data: event, isLoading: isLoadingEvent } = useQuery<Event>({
    queryKey: ['/api/events/' + eventId],
    enabled: !!eventId, // Only run query if eventId exists
  });

  // Fetch event organizer data
  const { data: organizer, isLoading: isLoadingOrganizer } = useQuery<User>({
    queryKey: ['/api/users/' + event?.userId],
    enabled: !!event?.userId, // Only run query if userId exists
  });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const handleJoinEvent = async () => {
    if (!user || !eventId) return;
    
    setIsJoining(true);
    
    try {
      const response = await apiRequest('POST', `/api/events/${eventId}/join`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to join event');
      }
      
      // Update local cache
      queryClient.invalidateQueries({ queryKey: ['/api/events/' + eventId] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      
      toast({
        title: "Success!",
        description: "You've joined this event.",
      });
    } catch (error) {
      console.error('Error joining event:', error);
      toast({
        title: "Failed to join",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  // Format date for display
  const formatEventDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE, MMMM do, yyyy 'at' h:mm a");
    } catch (error) {
      return "Date not available";
    }
  };
  
  // Check if event is in the past
  const isEventPast = (dateString?: string | Date) => {
    if (!dateString) return false;
    try {
      return isPast(new Date(dateString));
    } catch (error) {
      return false;
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Loading Event... | Metal Detecting Wellbeing</title>
          <link rel="canonical" href="https://digquest.org/" />
        </Helmet>
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-forest-green" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Event Not Found | Metal Detecting Wellbeing</title>
          <link rel="canonical" href="https://digquest.org/" />
        </Helmet>
        <Card className="border-red-200 shadow-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold text-red-500 mb-4">Event Not Found</h1>
              <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
              <Button 
                variant="outline"
                className="bg-forest-green text-white hover:bg-green-700"
                onClick={() => setLocation('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPastEvent = isEventPast(event.date);

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{event.title} | Metal Detecting Wellbeing</title>
        <meta name="description" content={`Join ${event.title}, a community event for metal detecting enthusiasts.`} />
        <link rel="canonical" href={`https://digquest.org/events/${eventId}`} />
      </Helmet>
      
      <div className="mb-6">
        <Link href="/" className="text-forest-green hover:text-earth-brown font-medium flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Link>
      </div>
      
      <Card className="shadow-md mb-6">
        <CardHeader className="bg-forest-green text-white">
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl font-display">
              {event.title}
            </CardTitle>
            <Badge variant="outline" className="bg-metallic-gold text-forest-green border-metallic-gold">
              {isPastEvent ? "Past Event" : "Upcoming Event"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center mb-4 text-gray-700">
                <Calendar className="h-5 w-5 mr-2 text-metallic-gold" />
                <span className="font-semibold">{formatEventDate(event.date)}</span>
              </div>
              
              <div className="flex items-center mb-4 text-gray-700">
                <MapPin className="h-5 w-5 mr-2 text-metallic-gold" />
                <span>{event.location}</span>
              </div>
              
              <div className="flex items-center mb-6 text-gray-700">
                <Users className="h-5 w-5 mr-2 text-metallic-gold" />
                <span><strong>{event.attendeeCount || 0}</strong> {event.attendeeCount === 1 ? 'person' : 'people'} attending</span>
              </div>
              
              <Separator className="my-4" />
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-forest-green mb-2">About This Event</h3>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {event.description || "No description provided."}
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-64 flex flex-col gap-4">
              <Card className="shadow-sm border-gray-200">
                <CardContent className="pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Organized by</h3>
                  {isLoadingOrganizer ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : organizer ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-gray-200">
                        <AvatarImage 
                          src={organizer.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${organizer.username}`} 
                          alt={organizer.username} 
                        />
                        <AvatarFallback className="bg-forest-green text-white">
                          {organizer.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-forest-green">{organizer.username}</div>
                        <div className="text-xs text-gray-500">Event organizer</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Organizer information unavailable</div>
                  )}
                </CardContent>
              </Card>
              
              {!isPastEvent && (
                <Button 
                  className="bg-forest-green hover:bg-green-700 text-white"
                  disabled={isJoining || !user}
                  onClick={handleJoinEvent}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="mr-2 h-4 w-4" /> Join Event
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                variant="outline"
                className="border-gray-300 text-gray-700"
                onClick={() => {
                  // Use navigator.share API if available
                  if (navigator.share) {
                    navigator.share({
                      title: event.title,
                      text: `Check out this metal detecting event: ${event.title}`,
                      url: window.location.href,
                    }).catch(error => console.log('Error sharing', error));
                  } else {
                    // Fallback to copying to clipboard
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link copied",
                      description: "Event link copied to clipboard.",
                    });
                  }
                }}
              >
                <Share className="mr-2 h-4 w-4" /> Share Event
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Only show this section if user isn't authenticated */}
      {!user && (
        <Card className="shadow-sm border-amber-200 bg-amber-50 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center text-amber-800">
              <Info className="h-5 w-5 mr-2 text-amber-600" />
              <p>You need to be logged in to join this event.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventDetail;