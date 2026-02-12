import { format } from "date-fns";
import { Calendar, MapPin, Users, Clock, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EditEventForm } from "./EditEventForm";
import { useAuth } from "@/hooks/use-auth-simple";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Event } from "@shared/schema";

type CardEvent = Event & {
  title?: string;
  date?: string | Date | null;
  location?: string | null;
  description?: string | null;
  attendeeCount?: number | null;
  userId?: number;
};

interface EventCardProps {
  event: CardEvent;
}

const EventCard = ({ event }: EventCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Format the date for display
  const formatEventDate = (dateString?: string | Date | null) => {
    try {
      if (!dateString) return "Date unavailable";
      const date = new Date(dateString);
      return format(date, "EEE, MMM d");
    } catch (error) {
      return "Date unavailable";
    }
  };
  
  // Format location with a fallback
  const formatLocation = (location?: string | null) => {
    return location || "Location TBD";
  };

  const attendMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/join`);
      if (!response.ok) {
        throw new Error("Failed to join event");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You've joined the event!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join event",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest("DELETE", `/api/events/${eventId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete event");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "Event has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const handleAttend = () => {
    attendMutation.mutate(event.id);
  };

  const handleDeleteEvent = () => {
    deleteEventMutation.mutate(event.id);
  };

  const handleEventUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
  };

  const isEventOwner = user && user.id === event.userId;

  return (
    <div className="border-l-4 border-metallic-gold pl-3 py-3 hover:bg-amber-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-forest-green">
          {event.title || "Untitled Event"}
        </h4>
        {isEventOwner && (
          <div className="flex items-center gap-1">
            <EditEventForm 
              event={event} 
              onEventUpdated={handleEventUpdated}
            />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Delete Event
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{event.title || "this event"}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteEvent}
                    disabled={deleteEventMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-700 mb-2">
        {formatEventDate(event.date)} • {formatLocation(event.location)}
      </p>
      
      {event.description && (
        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {event.attendeeCount || 0} attending
          </span>
        </div>
        
        <Button 
          size="sm" 
          onClick={handleAttend}
          disabled={attendMutation.isPending}
          className="bg-forest-green hover:bg-green-900 text-sand-beige transition duration-300"
        >
          {attendMutation.isPending ? "Joining..." : "Attend"}
        </Button>
      </div>
    </div>
  );
};

export default EventCard;