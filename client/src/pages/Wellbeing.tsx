import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Story, User } from "@shared/schema";
import { Heart, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-simple";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Extend the story schema for form validation
const storyFormSchema = z.object({
  content: z.string().min(20, "Your story must be at least 20 characters long"),
  yearsDetecting: z.coerce.number().min(0, "Years must be 0 or greater").optional(),
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

const Wellbeing = () => {
  const [isShareStoryOpen, setIsShareStoryOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: stories, isLoading: isLoadingStories } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
  });

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      content: "",
      yearsDetecting: 0,
    },
  });

  const onSubmit = async (data: StoryFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to share your story.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Include user ID in the submission
      const storyData = {
        ...data,
        userId: user.id,
      };

      await apiRequest("POST", "/api/stories", storyData);
      
      toast({
        title: "Story Shared",
        description: "Thank you for sharing your metal detecting journey!",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      setIsShareStoryOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem sharing your story. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Wellbeing | DigQuest - Metal Detecting for Mental Health</title>
        <meta name="description" content="Discover how metal detecting can improve your mental and physical wellbeing. Read community stories and learn about the therapeutic benefits of this hobby." />
        <link rel="canonical" href="https://digquest.org/wellbeing" />
      </Helmet>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="font-display text-4xl text-earth-brown mb-2">Metal Detecting for Wellbeing</h1>
            <p className="text-gray-600">Discover how this rewarding hobby can improve your mental and physical health</p>
          </div>
          <Button 
            className="bg-metallic-gold hover:bg-yellow-600 text-forest-green font-semibold transition duration-300 flex items-center"
            onClick={() => setIsShareStoryOpen(true)}
            disabled={!user}
          >
            <Heart className="h-4 w-4 mr-2" /> Share Your Story
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="overflow-hidden shadow-lg">
            <div className="h-64 bg-gray-200">
              <img 
                src="https://images.pexels.com/photos/1230302/pexels-photo-1230302.jpeg?auto=compress&cs=tinysrgb&w=600&h=400" 
                alt="Person metal detecting in a peaceful meadow" 
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-6">
              <h2 className="font-display text-2xl text-earth-brown mb-3">Mental Health Benefits</h2>
              <p className="text-gray-700 mb-4">Metal detecting offers numerous mental health benefits. The activity promotes mindfulness by requiring focus on the present moment as you listen for signals and interpret them.</p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success mt-1 mr-2" />
                  <span>Reduces anxiety and stress through outdoor activity</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success mt-1 mr-2" />
                  <span>Promotes mindfulness and present-moment awareness</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success mt-1 mr-2" />
                  <span>Provides a sense of purpose and achievement</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success mt-1 mr-2" />
                  <span>Offers solitude and time for reflection</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success mt-1 mr-2" />
                  <span>Creates a sense of connection with history and place</span>
                </li>
              </ul>
              
              <div className="bg-sand-beige/50 p-4 rounded-md">
                <h3 className="font-semibold text-forest-green mb-2">Expert Insight</h3>
                <p className="text-sm italic">"Time spent in nature combined with the focused attention required for metal detecting creates a powerful mindfulness practice that can significantly reduce symptoms of anxiety and depression."</p>
                <p className="text-xs mt-1">- Dr. Emma Richards, Environmental Psychologist</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden shadow-lg">
            <div className="h-64 bg-gray-200">
              <img 
                src="https://images.unsplash.com/photo-1484910292437-025e5d13ce87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400" 
                alt="Person exploring in nature with detecting equipment" 
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-6">
              <h2 className="font-display text-2xl text-earth-brown mb-3">Physical Benefits</h2>
              <p className="text-gray-700 mb-4">Metal detecting isn't just good for the mind—it's great exercise too! A typical day of detecting can involve walking several miles across varied terrain, improving cardiovascular health.</p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success mt-1 mr-2" />
                  <span>Low-impact exercise suitable for all ages</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success mt-1 mr-2" />
                  <span>Improves cardiovascular health through walking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success mt-1 mr-2" />
                  <span>Builds arm and shoulder strength</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success mt-1 mr-2" />
                  <span>Increased Vitamin D from sunshine exposure</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success mt-1 mr-2" />
                  <span>Improved sleep patterns from outdoor activity</span>
                </li>
              </ul>
              
              <div className="bg-sand-beige/50 p-4 rounded-md">
                <h3 className="font-semibold text-forest-green mb-2">Health Benefits</h3>
                <p className="text-sm italic">"Regular metal detecting can burn between 250-400 calories per hour, comparable to moderate-intensity activities like brisk walking, while providing mental stimulation that keeps practitioners engaged for longer periods."</p>
                <p className="text-xs mt-1">- Journal of Outdoor Recreation and Health, 2022</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12">
          <h2 className="font-display text-3xl text-earth-brown mb-6 text-center">Getting Started for Wellbeing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="bg-metallic-gold/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="font-display text-2xl text-earth-brown">1</span>
                </div>
                <h3 className="font-display text-xl text-earth-brown mb-2">Start Simple</h3>
                <p className="text-gray-700">Begin with an entry-level detector and comfortable equipment. Focus on the experience rather than expensive gear.</p>
                <ul className="mt-3 space-y-1 text-sm">
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Entry-level detector ($150-$300)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Comfortable footwear and weather-appropriate clothing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Simple digging tool and finds pouch</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="bg-metallic-gold/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="font-display text-2xl text-earth-brown">2</span>
                </div>
                <h3 className="font-display text-xl text-earth-brown mb-2">Find Your Space</h3>
                <p className="text-gray-700">Seek out locations that offer both detecting potential and peaceful surroundings that help you relax and connect with nature.</p>
                <ul className="mt-3 space-y-1 text-sm">
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Public beaches (check local regulations)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Parks with metal detecting permission</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Private land with proper permission</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="bg-metallic-gold/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="font-display text-2xl text-earth-brown">3</span>
                </div>
                <h3 className="font-display text-xl text-earth-brown mb-2">Set Intentions</h3>
                <p className="text-gray-700">Approach detecting with a mindset focused on the process rather than just the finds. Enjoy the journey rather than fixating on results.</p>
                <ul className="mt-3 space-y-1 text-sm">
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Practice mindfulness during your detecting session</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Set a time goal rather than a finds goal</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-metallic-gold mr-2">•</span>
                    <span>Keep a journal of your thoughts and experiences</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="font-display text-3xl text-earth-brown mb-6">Community Stories</h2>
          
          {isLoadingStories ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-earth-brown" />
            </div>
          ) : stories && stories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="bg-sand-beige/50 p-8 rounded-lg text-center">
              <h3 className="font-display text-xl text-earth-brown mb-2">No stories yet</h3>
              <p className="text-gray-700 mb-4">Be the first to share your metal detecting wellbeing story!</p>
              {user && (
                <Button 
                  onClick={() => setIsShareStoryOpen(true)}
                  className="bg-metallic-gold hover:bg-yellow-600 text-forest-green"
                >
                  <Heart className="h-4 w-4 mr-2" /> Share Your Experience
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="bg-forest-green text-sand-beige p-8 rounded-xl shadow-lg">
          <h2 className="font-display text-3xl mb-4 text-center">Join a Wellbeing Detecting Event</h2>
          <p className="text-center mb-6 max-w-2xl mx-auto">Experience the mental and physical benefits of metal detecting with like-minded people. Our community events focus on the therapeutic aspects of detecting in beautiful locations.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-forest-green/70 p-6 rounded-lg border border-metallic-gold">
              <h3 className="font-display text-xl mb-3">Upcoming Wellbeing Events</h3>
              
              <div className="mb-4 py-2 px-3 bg-amber-50/90 rounded-md text-amber-800 text-sm">
                <p className="text-center font-medium mb-1">Example Events</p>
                <p>These are for demonstration purposes only. Real wellbeing events will be listed here once created.</p>
              </div>
              
              <ul className="space-y-4">
                <li className="border-l-4 border-metallic-gold pl-3 py-1">
                  <h4 className="font-semibold">Mindful Detecting Retreat <span className="text-xs font-normal text-sand-beige/80">(Example)</span></h4>
                  <p className="text-sm">June 15 • Lake District</p>
                  <p className="text-xs mt-1">A weekend of guided mindful detecting, meditation, and relaxation.</p>
                </li>
                <li className="border-l-4 border-metallic-gold pl-3 py-1">
                  <h4 className="font-semibold">Beginners Wellbeing Workshop <span className="text-xs font-normal text-sand-beige/80">(Example)</span></h4>
                  <p className="text-sm">July 10 • Yorkshire Dales</p>
                  <p className="text-xs mt-1">Learn detecting basics with a focus on mindfulness and stress relief.</p>
                </li>
                <li className="border-l-4 border-metallic-gold pl-3 py-1">
                  <h4 className="font-semibold">Beach Therapy Day <span className="text-xs font-normal text-sand-beige/80">(Example)</span></h4>
                  <p className="text-sm">July 24 • Cornwall Coast</p>
                  <p className="text-xs mt-1">Combine the calming effects of the ocean with metal detecting.</p>
                </li>
              </ul>
            </div>
            
            <div className="bg-forest-green/70 p-6 rounded-lg border border-metallic-gold">
              <h3 className="font-display text-xl mb-3">Benefits of Group Detecting</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-metallic-gold mt-1 mr-2" />
                  <span>Social connection reduces feelings of isolation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-metallic-gold mt-1 mr-2" />
                  <span>Learn new techniques from experienced detectorists</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-metallic-gold mt-1 mr-2" />
                  <span>Shared excitement when discoveries are made</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-metallic-gold mt-1 mr-2" />
                  <span>Enhanced safety when detecting in remote areas</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-metallic-gold mt-1 mr-2" />
                  <span>Accountability helps maintain a regular practice</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-4 bg-metallic-gold hover:bg-yellow-600 text-forest-green"
                disabled={!user}
              >
                Register for Events
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isShareStoryOpen} onOpenChange={setIsShareStoryOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Share Your Wellbeing Story</DialogTitle>
          <DialogDescription>
            Tell us how metal detecting has positively impacted your wellbeing.
          </DialogDescription>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="yearsDetecting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years Metal Detecting</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Story</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Share how metal detecting has impacted your wellbeing..." 
                        className="min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsShareStoryOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-metallic-gold hover:bg-yellow-600 text-forest-green">
                  Share Story
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Story card component
interface StoryCardProps {
  story: Story;
}

const StoryCard = ({ story }: StoryCardProps) => {
  // Modify to handle the case when userId might not be available
  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ['/api/users', story.userId],
    enabled: !!story.userId, // Only run the query if userId is present
  });

  // Generate a deterministic seed for the avatar
  const avatarSeed = story.userId?.toString() || story.content.substring(0, 5) || 'user';

  return (
    <Card className="bg-sand-beige/50">
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${avatarSeed}`}
              alt={user?.username || "User"}
            />
            <AvatarFallback>{isLoadingUser ? "..." : (user?.username?.charAt(0).toUpperCase() || "U")}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-forest-green">{user?.username || "Anonymous User"}</h4>
            <p className="text-xs text-gray-500">
              Metal detecting for {story.yearsDetecting || 0} year{story.yearsDetecting !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <p className="text-gray-700 text-sm">"{story.content}"</p>
      </CardContent>
    </Card>
  );
};

export default Wellbeing;
