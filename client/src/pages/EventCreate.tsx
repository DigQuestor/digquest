import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewEventForm from "@/components/events/NewEventForm";

const EventCreate = () => {
  const [, setLocation] = useLocation();

  const handleEventCreated = () => {
    // Navigate back to events page after successful creation
    setLocation("/events");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Create Event | DigQuest - Metal Detecting Community</title>
        <meta name="description" content="Create a new metal detecting event for the community. Organize group digs and meetups." />
        <link rel="canonical" href="https://digquest.org/events/create" />
      </Helmet>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/events")}
          className="text-forest-green hover:bg-forest-green/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-forest-green">Create New Event</h1>
          <p className="text-gray-600 mt-2">Organize a metal detecting event for the community</p>
        </div>
      </div>

      {/* Event Creation Form */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-forest-green">Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewEventForm onEventCreated={handleEventCreated} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EventCreate;