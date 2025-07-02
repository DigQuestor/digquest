import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-simple";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertStorySchema } from "@shared/schema";

// Extend the story schema for form validation
const storyFormSchema = z.object({
  content: z.string().min(20, "Your story must be at least 20 characters long"),
  yearsDetecting: z.coerce.number().min(0, "Years must be 0 or greater").optional(),
  userId: z.number().optional(),
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

const WellbeingSection = () => {
  const [isShareStoryOpen, setIsShareStoryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

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

    setIsSubmitting(true);

    try {
      // Include user ID in the submission and handle null values properly
      const storyData = {
        content: data.content,
        yearsDetecting: data.yearsDetecting || null,
        userId: user.id,
      };

      console.log("Submitting story:", storyData);
      
      // Use direct fetch with proper error handling instead of apiRequest
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit story');
      }
      
      toast({
        title: "Story Shared",
        description: "Thank you for sharing your metal detecting journey!",
      });
      
      // Invalidate the stories query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      
      setIsShareStoryOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting story:", error);
      toast({
        title: "Error",
        description: "There was a problem sharing your story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mb-6 md:mb-12">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h2 className="font-display text-xl md:text-3xl text-earth-brown">Wellbeing Benefits</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mobile-grid">
        <Card className="overflow-hidden shadow-lg mobile-card">
          <img 
            src="https://images.pexels.com/photos/1230302/pexels-photo-1230302.jpeg?auto=compress&cs=tinysrgb&w=600&h=400" 
            alt="Person metal detecting in a peaceful meadow" 
            className="w-full h-48 md:h-64 object-cover"
          />
          <CardContent className="p-4 md:p-6 card-content-mobile">
            <h3 className="font-display text-lg md:text-2xl text-earth-brown mb-2 md:mb-3">Mental Health Benefits</h3>
            <p className="text-gray-700 mb-3 md:mb-4 text-sm md:text-base">Metal detecting offers numerous mental health benefits. The activity promotes mindfulness by requiring focus on the present moment as you listen for signals and interpret them.</p>
            <ul className="space-y-1 md:space-y-2 mb-3 md:mb-4">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-success mt-0.5 md:mt-1 mr-2 flex-shrink-0" />
                <span className="text-sm md:text-base">Reduces anxiety and stress through outdoor activity</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-success mt-0.5 md:mt-1 mr-2 flex-shrink-0" />
                <span className="text-sm md:text-base">Promotes mindfulness and present-moment awareness</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-success mt-0.5 md:mt-1 mr-2 flex-shrink-0" />
                <span className="text-sm md:text-base">Provides a sense of purpose and achievement</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-success mt-0.5 md:mt-1 mr-2 flex-shrink-0" />
                <span className="text-sm md:text-base">Offers solitude and time for reflection</span>
              </li>
            </ul>
            <Link href="/wellbeing" className="text-forest-green hover:text-earth-brown font-semibold transition duration-300 flex items-center text-sm md:text-base">
              Read More <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
            </Link>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden shadow-lg">
          <img 
            src="https://images.unsplash.com/photo-1484910292437-025e5d13ce87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400" 
            alt="Person exploring in nature with detecting equipment" 
            className="w-full h-64 object-cover"
          />
          <CardContent className="p-6">
            <h3 className="font-display text-2xl text-earth-brown mb-3">Physical Benefits</h3>
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
            </ul>
            <Link href="/wellbeing" className="text-forest-green hover:text-earth-brown font-semibold transition duration-300 flex items-center">
              Read More <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6 shadow-lg">
        <CardContent className="p-6">
          <h3 className="font-display text-2xl text-earth-brown mb-4">Community Stories</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Example stories - in a real app these would come from an API */}
            <div className="bg-sand-beige rounded-lg p-4">
              <div className="flex items-center mb-3">
                <img 
                  src="https://api.dicebear.com/7.x/personas/svg?seed=Sarah" 
                  alt="User avatar" 
                  className="w-10 h-10 rounded-full mr-3" 
                />
                <div>
                  <h4 className="font-semibold text-forest-green">Sarah J.</h4>
                  <p className="text-xs text-gray-500">Metal detecting for 3 years</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">"After my anxiety diagnosis, I was looking for something to help me get outdoors. Metal detecting has been transformative - the methodical searching is almost meditative."</p>
            </div>
            
            <div className="bg-sand-beige rounded-lg p-4">
              <div className="flex items-center mb-3">
                <img 
                  src="https://api.dicebear.com/7.x/personas/svg?seed=Mike" 
                  alt="User avatar" 
                  className="w-10 h-10 rounded-full mr-3" 
                />
                <div>
                  <h4 className="font-semibold text-forest-green">Mike T.</h4>
                  <p className="text-xs text-gray-500">Metal detecting for 7 years</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">"After retirement, I needed something to keep me active. Detecting gets me walking 5+ miles some days, and I've lost 20 pounds! Plus the history you uncover is fascinating."</p>
            </div>
            
            <div className="bg-sand-beige rounded-lg p-4">
              <div className="flex items-center mb-3">
                <img 
                  src="https://api.dicebear.com/7.x/personas/svg?seed=Emma" 
                  alt="User avatar" 
                  className="w-10 h-10 rounded-full mr-3" 
                />
                <div>
                  <h4 className="font-semibold text-forest-green">Emma L.</h4>
                  <p className="text-xs text-gray-500">Metal detecting for 2 years</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">"I was struggling with depression when a friend invited me detecting. Now I have a wonderful hobby that gets me outdoors and I've made so many friends through the community."</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Button 
              className="bg-metallic-gold hover:bg-yellow-600 text-forest-green font-bold py-3 px-6 rounded-lg text-lg transition duration-300 transform hover:scale-105 shadow-lg"
              onClick={() => setIsShareStoryOpen(true)}
              disabled={!user}
            >
              <Heart className="h-5 w-5 mr-2" /> Share Your Story
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <Button type="button" variant="outline" onClick={() => setIsShareStoryOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-metallic-gold hover:bg-yellow-600 text-forest-green"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-forest-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Share Story"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default WellbeingSection;