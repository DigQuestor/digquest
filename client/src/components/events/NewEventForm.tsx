import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-simple";
import { getStoredEvents, saveEventsToStorage } from "@/lib/storageUtils";

// Extend the event schema for form validation
const eventFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  eventDate: z.string().refine((val) => {
    try {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    } catch (e) {
      return false;
    }
  }, "Event date must be in the future"),
  userId: z.number().min(1, "User ID is required"),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface NewEventFormProps {
  onEventCreated?: () => void;
}

const NewEventForm = ({ onEventCreated }: NewEventFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up the form with react-hook-form and zod validation
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      eventDate: "",
      userId: user ? user.id : 0,
    },
    mode: "onChange",
  });

  // Update userId when user object changes
  useEffect(() => {
    if (user) {
      form.setValue('userId', user.id);
    }
  }, [user, form]);

  const onSubmit = async (data: EventFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create an event.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Keep eventDate as string for the API
      const eventData = {
        ...data,
        userId: user.id,
        // Keep eventDate as ISO string
        eventDate: data.eventDate,
      };

      console.log("Submitting event:", eventData);
      const response = await apiRequest("POST", "/api/events", eventData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create event");
      }
      
      // Get the newly created event from the response
      const newEvent = await response.json();
      console.log("Event created successfully:", newEvent);
      
      // Save the new event to localStorage
      const storedEvents = getStoredEvents();
      const updatedEvents = [newEvent, ...storedEvents];
      saveEventsToStorage(updatedEvents);
      console.log("Event saved to localStorage successfully");
      
      toast({
        title: "Event Created",
        description: "Your event has been successfully scheduled.",
      });
      
      // Reset form and invalidate queries to refresh data
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      
      if (onEventCreated) {
        onEventCreated();
      }
    } catch (error) {
      console.error("Event creation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was a problem creating your event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="What's your event about?" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Where will this event take place?" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date and Time</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="datetime-local" 
                    {...field} 
                  />
                  <CalendarDays className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide details about the event, what to bring, etc..." 
                  className="min-h-24" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-metallic-gold hover:bg-yellow-600 text-forest-green"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewEventForm;