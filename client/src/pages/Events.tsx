import { useState } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { Plus, Calendar, MapPin, Users, Clock, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth-simple";
import { format, isPast, isToday, isTomorrow } from "date-fns";

const Events = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  // Fetch events
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Filter events based on search and filter
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "upcoming") {
      return matchesSearch && !isPast(new Date(event.eventDate));
    } else if (filter === "past") {
      return matchesSearch && isPast(new Date(event.eventDate));
    }
    return matchesSearch;
  });

  const getEventDateText = (date: string) => {
    const eventDate = new Date(date);
    if (isToday(eventDate)) return "Today";
    if (isTomorrow(eventDate)) return "Tomorrow";
    return format(eventDate, "MMM d, yyyy");
  };

  const getEventTimeText = (date: string) => {
    return format(new Date(date), "h:mm a");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Community Events | DigQuest - Metal Detecting Community</title>
        <meta name="description" content="Join metal detecting events in your area. Connect with fellow detectorists and discover new treasure hunting locations." />
        <link rel="canonical" href="https://digquest.org/events" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-forest-green mb-2">Community Events</h1>
          <p className="text-gray-600">Join fellow detectorists at upcoming events and group digs</p>
        </div>
        {user && (
          <Button 
            className="bg-forest-green hover:bg-green-700 text-white"
            onClick={() => window.location.href = '/events/create'}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search events by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-forest-green hover:bg-green-700" : ""}
          >
            All Events
          </Button>
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            onClick={() => setFilter("upcoming")}
            className={filter === "upcoming" ? "bg-forest-green hover:bg-green-700" : ""}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === "past" ? "default" : "outline"}
            onClick={() => setFilter("past")}
            className={filter === "past" ? "bg-forest-green hover:bg-green-700" : ""}
          >
            Past
          </Button>
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-forest-green line-clamp-2">
                      {event.title}
                    </CardTitle>
                    {isPast(new Date(event.eventDate)) && (
                      <Badge variant="secondary" className="text-xs">Past</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-metallic-gold" />
                    <span>{getEventDateText(event.eventDate)} at {getEventTimeText(event.eventDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-metallic-gold" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-metallic-gold" />
                    <span>{event.attendeeCount || 0} attending</span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-700 line-clamp-2 mt-2">
                      {event.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {filter === "upcoming" ? "No upcoming events" : 
             filter === "past" ? "No past events" : "No events found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? "Try adjusting your search terms" : "Be the first to create an event for the community!"}
          </p>
          {user && !searchTerm && (
            <Button 
              className="bg-forest-green hover:bg-green-700 text-white"
              onClick={() => window.location.href = '/events/create'}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Event
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Events;