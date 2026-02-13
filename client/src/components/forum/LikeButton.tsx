import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/apiError";

interface LikeButtonProps {
  postId: number;
  initialLikes?: number;
  initialIsLiked?: boolean;
  className?: string;
}

export function LikeButton({ postId, initialLikes = 0, initialIsLiked = false, className }: LikeButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current like status
  const { data: likeStatus } = useQuery({
    queryKey: [`/api/posts/${postId}/like-status`],
    initialData: { isLiked: initialIsLiked, likes: initialLikes },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (likeStatus?.isLiked) {
        const response = await apiRequest("DELETE", `/api/posts/${postId}/like`);
        return await response.json();
      } else {
        const response = await apiRequest("POST", `/api/posts/${postId}/like`);
        return await response.json();
      }
    },
    onSuccess: (data) => {
      // Update the like status cache
      queryClient.setQueryData([`/api/posts/${postId}/like-status`], data);
      
      // Invalidate posts list to update like counts
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });

      const isPromoted = !!data.isLiked;
      
      toast({
        title: (
          <div className="flex items-center gap-2 text-white">
            <span className="text-lg leading-none">{isPromoted ? "🚀" : "↩️"}</span>
            <span className="text-base font-bold leading-none">
              {isPromoted ? "Post Promoted!" : "Promotion Removed"}
            </span>
          </div>
        ),
        description: (
          <div className="mt-2 space-y-2 text-white">
            <p className="text-sm font-medium text-white/90">
              {isPromoted ? "You've promoted this post" : "You've removed your promotion"}
            </p>
            <div className="rounded border border-metallic-gold/70 bg-metallic-gold px-3 py-1.5">
              <p className="text-sm font-bold text-black">Community visibility updated</p>
            </div>
          </div>
        ),
        duration: 4000,
        className: isPromoted
          ? "border-forest-green bg-forest-green text-white shadow-xl"
          : "border-earth-brown bg-earth-brown text-white shadow-xl",
      });
    },
    onError: (error) => {
      console.error("Error toggling like:", error);

      toast({
        title: "Error",
        description: getApiErrorMessage(error, "Failed to update promotion status"),
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={likeMutation.isPending}
      className={`flex items-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 ${className}`}
    >
      <Heart
        className={`h-4 w-4 ${likeStatus?.isLiked ? "fill-amber-600 text-amber-600" : ""}`}
      />
      <span className="text-sm font-medium">
        {likeStatus?.isLiked ? "Promoted" : "Promote"}
      </span>
      {(likeStatus?.likes || 0) > 0 && (
        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
          {likeStatus.likes}
        </span>
      )}
    </Button>
  );
}