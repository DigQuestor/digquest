import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X, Image, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-simple";
import { Category, insertPostSchema } from "@shared/schema";

// Post schema with optional image upload
const postFormSchema = insertPostSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  categoryId: z.number().min(1, "Please select a category"),
  imageUrl: z.string().optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

interface NewPostFormProps {
  onPostCreated?: () => void;
}

const NewPostForm = ({ onPostCreated }: NewPostFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    staleTime: 1000 * 60 * 5,
    refetchInterval: false
  });

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
      userId: user ? user.id : 1,
      categoryId: undefined,
      imageUrl: undefined,
    },
  });

  // Handle image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "⚠️ File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
          duration: 4000,
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "⚠️ Invalid File Type",
          description: "Please select an image file",
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    form.setValue('imageUrl', undefined);
  };

  // Upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const data = await response.json();
    return data.imageUrl;
  };

  const onSubmit = async (values: PostFormValues) => {
    if (!user) {
      toast({
        title: "⚠️ Authentication Required",
        description: "Please log in to create a post.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      
      // Upload image if one is selected
      if (selectedImage) {
        setIsUploadingImage(true);
        try {
          imageUrl = await uploadImage(selectedImage);
        } catch (error) {
          toast({
            title: "⚠️ Image Upload Failed",
            description: "Could not upload image. Post will be created without image.",
            variant: "destructive",
            duration: 4000,
          });
          console.error("Image upload error:", error);
        } finally {
          setIsUploadingImage(false);
        }
      }

      const postData = {
        title: values.title,
        content: values.content,
        categoryId: values.categoryId,
        ...(imageUrl && { imageUrl }), // Only include imageUrl if it has a value
      };

      console.log("Submitting post data:", postData);
      const response = await apiRequest("POST", "/api/posts", postData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          toast({
            title: "⚠️ Authentication Error",
            description: errorData.message || "Please log in to create a post.",
            variant: "destructive",
            duration: 4000,
          });
          // Trigger auth state refresh
          window.dispatchEvent(new Event('auth-changed'));
          return;
        }
        
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to create post`);
      }
      
      const newPost = await response.json();

      toast({
        title: "Success!",
        description: "Your post has been created successfully.",
      });

      // Reset form and image state
      form.reset({
        title: "",
        content: "",
        categoryId: undefined,
        imageUrl: undefined,
      });
      setSelectedImage(null);
      setImagePreview(null);

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/categories'] });

      // Call the callback if provided
      if (onPostCreated) {
        onPostCreated();
      }

    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "❌ Error Creating Post",
        description: error instanceof Error ? error.message : "Failed to create post. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCategories) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Create New Post</h3>
        <p className="text-sm text-gray-600">Share your thoughts with the community</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your post title..." 
                    {...field} 
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  defaultValue={field.value?.toString()}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" className="z-[100]">
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your thoughts, findings, or questions..."
                    className="min-h-[100px] resize-none"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload Section */}
          <div className="space-y-2">
            <FormLabel className="text-sm">Add Photo (Optional)</FormLabel>
            <div className="border border-dashed border-gray-300 rounded-md p-3 text-center">
              {imagePreview ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Selected image"
                      className="max-w-full max-h-32 rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    {selectedImage?.name} ({Math.round((selectedImage?.size || 0) / 1024)} KB)
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Image className="h-5 w-5 text-gray-400 mx-auto" />
                  <div>
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-xs font-medium text-blue-600 hover:text-blue-500">
                        Click to upload
                      </span>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Max 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
            >
              Clear
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploadingImage}>
              {(isSubmitting || isUploadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploadingImage ? "Uploading Image..." : isSubmitting ? "Creating Post..." : "Create Post"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewPostForm;
