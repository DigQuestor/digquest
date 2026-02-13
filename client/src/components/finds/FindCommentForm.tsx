import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth-simple';

// Create a schema for comment validation
const findCommentSchema = z.object({
  content: z.string().min(3, {
    message: "Comment must be at least 3 characters.",
  }).max(1000, {
    message: "Comment cannot be longer than 1000 characters."
  }),
});

type FindCommentFormValues = z.infer<typeof findCommentSchema>;

interface FindCommentFormProps {
  findId: number | null;
  onCommentAdded?: () => void;
}

export function FindCommentForm({ findId, onCommentAdded }: FindCommentFormProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define form
  const form = useForm<FindCommentFormValues>({
    resolver: zodResolver(findCommentSchema),
    defaultValues: {
      content: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data: FindCommentFormValues) => {
    if (isAuthLoading) {
      toast({
        title: "Checking Authentication",
        description: "Please wait while we verify your session.",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to comment on finds.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest('POST', `/api/finds/${findId}/comments`, {
        content: data.content,
        userId: user.id,
      });

      if (response.ok) {
        toast({
          title: "Comment Added",
          description: "Your comment has been posted successfully.",
        });

        // Reset form
        form.reset();

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [`/api/finds/${findId}/comments`] });
        
        // Callback when comment is added
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 text-center">
        <p className="text-gray-600">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 text-center">
        <p className="text-gray-600 mb-2">You need to be logged in to comment on finds.</p>
        <Button variant="outline" className="text-forest-green hover:text-meadow-green">
          Log In to Comment
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold mb-3 text-earth-brown">Add a Comment</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Share your thoughts about this find..."
                    className="min-h-[100px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Comments should be relevant to the find and respectful.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="bg-forest-green hover:bg-meadow-green"
            disabled={isAuthLoading || isSubmitting}
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      </Form>
    </div>
  );
}