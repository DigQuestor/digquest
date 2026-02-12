import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, findStorage } from "@/hooks/use-auth-simple";
import { useQueryClient } from "@tanstack/react-query";
import { FIND_TIME_PERIODS } from "@/lib/timePeriods";
import { optimizeImageForUpload } from "@/lib/imageUtils";

// Form schema for find upload
const findFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  period: z.string().optional(),
  // The file will be handled separately
});

type FindFormValues = z.infer<typeof findFormSchema>;

interface UploadFindFormProps {
  onFindUploaded?: () => void;
  onCancel?: () => void;
}

const UploadFindForm = ({ onFindUploaded, onCancel }: UploadFindFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<FindFormValues>({
    resolver: zodResolver(findFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      period: "",
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic validation for file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPG or PNG image.",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const optimizedFile = await optimizeImageForUpload(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.82,
          maxOutputBytes: 2.5 * 1024 * 1024,
        });

        if (optimizedFile.size > maxSize) {
          toast({
            title: "File Too Large",
            description: "Please upload an image smaller than 5MB.",
            variant: "destructive",
          });
          return;
        }

        setSelectedFile(optimizedFile);
        
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(optimizedFile);
      } catch (error) {
        toast({
          title: "Image Processing Failed",
          description: "Please try another image.",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = async (data: FindFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload a find.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Image Required",
        description: "Please upload an image of your find.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('location', data.location);
      formData.append('period', data.period || 'Unknown');
      formData.append('userId', user.id.toString());
      
      console.log("Submitting find data:", {
        title: data.title,
        description: data.description,
        location: data.location,
        period: data.period,
        userId: user.id
      });
      
      // Make the request with FormData
      const response = await fetch('/api/finds', {
        method: 'POST',
        body: formData,
        // Important: Do NOT set Content-Type header, let the browser set it with boundary
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error("❌ Upload error response:", errorData);
        console.error("   Status:", response.status);
        console.error("   Full error:", JSON.stringify(errorData, null, 2));
        
        // Show specific error message from server with more details
        const errorMsg = errorData.message || "Failed to upload find";
        
        toast({
          title: "❌ Upload Failed",
          description: errorMsg,
          variant: "destructive",
          duration: 15000,
          className: "bg-red-600 text-white border-red-700 font-bold text-sm max-w-md"
        });
        
        // Also show in alert for Chromebook users who can't see console
        alert(`Upload Error:\n\n${errorMsg}\n\nCheck browser console (F12) for more details.`);
        
        setIsSubmitting(false);
        return;
      }
      
      // Get the newly created find data from the response
      const newFind = await response.json();
      
      console.log("✅ Find uploaded successfully!");
      console.log("   - Find ID:", newFind.id);
      console.log("   - Image URL:", newFind.imageUrl);
      
      // Check if image URL was returned
      if (!newFind.imageUrl) {
        toast({
          title: "❌ Upload Problem",
          description: "Find created but no image URL returned. The image may not have uploaded to S3. Check your AWS credentials.",
          variant: "destructive",
          duration: 10000,
        });
        setIsSubmitting(false);
        return;
      }
      
      // Test if the image URL actually loads in the browser
      try {
        const testImage = new Image();
        let imageLoaded = false;
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Image load timed out after 5 seconds'));
          }, 5000);
          
          testImage.onload = () => {
            clearTimeout(timeout);
            imageLoaded = true;
            resolve(true);
          };
          
          testImage.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Browser blocked image - CORS issue'));
          };
          
          testImage.src = newFind.imageUrl;
        });
        
        // Image loaded successfully!
        toast({
          title: "✅ Success!",
          description: "Your find and image are now visible in the gallery!",
          duration: 4000,
          className: "bg-green-600 text-white border-green-700 font-bold text-lg"
        });
        
      } catch (imageError) {
        // Image URL exists but can't be loaded
        const shortUrl = newFind.imageUrl.length > 60 ? newFind.imageUrl.substring(0, 60) + '...' : newFind.imageUrl;
        toast({
          title: "⚠️ Find Saved - Image Won't Display",
          description: `Your find is saved but the image can't load. ${imageError.message}. URL: ${shortUrl}`,
          variant: "destructive",
          duration: 10000,
        });
      }
      
      // Reset form fields but keep the dialog open
      form.reset();
      setSelectedFile(null);
      setImagePreview(null);
      
      // Add a small delay to ensure the server has fully processed the image upload
      setTimeout(() => {
        // Make sure we invalidate all queries that use the finds data
        // This ensures both the finds gallery and homepage recent treasures are updated
        queryClient.invalidateQueries({ queryKey: ['/api/finds'] });
        
        // Force immediate refetch to update UI faster
        queryClient.refetchQueries({ queryKey: ['/api/finds'] });
        
        console.log("Refreshed finds cache after upload");
      }, 1000); // Wait 1 second for image processing
      
      // Only notify parent component if explicitly asked to do so
      if (onFindUploaded) {
        // Wait a moment for the UI to update, then show success screen
        setTimeout(() => {
          onFindUploaded();
        }, 800);
      }
    } catch (error) {
      console.error("Find upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error 
          ? error.message 
          : "There was a problem uploading your find. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-earth-brown transition-colors"
            onClick={() => document.getElementById('file-upload')?.click()}>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileChange}
            />
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Find preview" 
                  className="mx-auto max-h-48 rounded-md" 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="absolute top-2 right-2 bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setImagePreview(null);
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="py-4">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Click to upload an image of your find</p>
                <p className="text-xs text-gray-500 mt-1">(JPG or PNG, max 5MB)</p>
              </div>
            )}
          </div>
          
          {!selectedFile && form.formState.isSubmitted && (
            <div className="mt-2 flex items-center text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>Image is required</span>
            </div>
          )}
        </div>
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="What did you find?" {...field} />
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
                  placeholder="Tell us about your find... When did you find it? How deep was it? Any interesting details?" 
                  className="min-h-24" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Yorkshire, Cornwall" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Period</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" className="z-[100]">
                    {FIND_TIME_PERIODS.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end mt-6 space-x-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              if (onCancel) onCancel();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-metallic-gold hover:bg-yellow-600 text-forest-green font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              "Save & Share Find"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UploadFindForm;
