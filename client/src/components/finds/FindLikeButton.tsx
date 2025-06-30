import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FindLikeButtonProps {
  findId: number;
  initialLikes: number;
  className?: string;
}

export const FindLikeButton = ({ findId, initialLikes, className }: FindLikeButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [initialIsLiked] = useState(false); // Default to not liked

  const { data: likeStatus } = useQuery({
    queryKey: [`/api/finds/${findId}/like-status`],
    initialData: { isLiked: initialIsLiked, likes: initialLikes },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (likeStatus?.isLiked) {
        const response = await apiRequest("DELETE", `/api/finds/${findId}/like`);
        return await response.json();
      } else {
        const response = await apiRequest("POST", `/api/finds/${findId}/like`);
        return await response.json();
      }
    },
    onSuccess: (data) => {
      // Update the like status cache
      queryClient.setQueryData([`/api/finds/${findId}/like-status`], data);
      
      // Invalidate finds list to update like counts
      queryClient.invalidateQueries({ queryKey: ["/api/finds"] });
      
      toast({
        title: data.isLiked ? "Find Liked!" : "Like Removed",
        description: data.isLiked ? "You've liked this find" : "You've removed your like",
      });
    },
    onError: (error) => {
      console.error("Error toggling find like:", error);
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={likeMutation.isPending}
      className={cn(
        "flex items-center gap-1 h-auto p-1 text-xs",
        likeStatus?.isLiked 
          ? "text-red-500 hover:text-red-600" 
          : "text-gray-500 hover:text-red-500",
        className
      )}
    >
      <Heart 
        className={cn(
          "h-3 w-3",
          likeStatus?.isLiked ? "fill-current" : ""
        )} 
      />
      <span>{likeStatus?.likes || 0}</span>
    </Button>
  );
};