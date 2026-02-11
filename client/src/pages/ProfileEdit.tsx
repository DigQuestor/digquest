import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth-simple";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Loader2, Camera, Save, UserCircle2, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";

const profileEditSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().optional(),
  // Make password truly optional by allowing empty string
  password: z.union([
    z.string().min(6, "Password must be at least 6 characters"),
    z.string().length(0)
  ]),
  // Make confirm password truly optional by allowing empty string
  confirmPassword: z.union([
    z.string().min(6, "Password must be at least 6 characters"),
    z.string().length(0)
  ]),
}).refine((data) => {
  // Only validate matching passwords if both fields have values
  if (data.password && data.password.length > 0 && data.confirmPassword && data.confirmPassword.length > 0) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileEditValues = z.infer<typeof profileEditSchema>;

export default function ProfileEdit() {
  const { user, updateUser, deleteUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  
  // Initialize form with empty values first
  const form = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      username: "",
      email: "",
      bio: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Update form values when user data is available or changes
  useEffect(() => {
    if (user) {
      // Reset the form with current user values
      form.reset({
        username: user.username,
        email: user.email,
        bio: user.bio || "",
        password: "",
        confirmPassword: "",
      });
      
      // Set profile preview if user has an avatar
      if (user.avatarUrl) {
        setProfilePreview(user.avatarUrl);
      }
    }
  }, [user, form]);
  
  // Handle profile picture selection
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setProfilePicture(file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const onSubmit = async (data: ProfileEditValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare user update data
      const userData: Partial<User> = {
        username: data.username,
        email: data.email,
      };
      
      if (data.bio) {
        userData.bio = data.bio;
      }
      
      // Only update password if both fields have values and they match
      if (data.password && data.password.length > 0 && 
          data.confirmPassword && data.confirmPassword.length > 0 &&
          data.password === data.confirmPassword) {
        userData.password = data.password;
      }
      
      // If we have a new profile picture, use the profile preview (which is a base64 string)
      if (profilePreview) {
        userData.avatarUrl = profilePreview;
      }
      
      console.log("Sending profile update to server:", { ...userData, password: userData.password ? '********' : undefined });
      
      // Update user in our auth context (now async)
      await updateUser(userData);
      
      // Show success message
      toast({
        title: "✅ Profile Updated Successfully!",
        description: "Your profile changes have been saved and are now visible to other users.",
        duration: 3000,
        className: "bg-green-600 text-white border-green-700 font-semibold text-lg"
      });
      
      // Instead of forcing a full page reload, just redirect to homepage
      // This preserves the state better between pages
      setLocation("/");
    } catch (error) {
      console.error("Profile update error:", error);
      
      toast({
        title: "⚠️ Profile Update Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete your account",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Use the deleteUser function from the auth hook
      await deleteUser();
      
      // Show success message
      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });
      
      // Redirect to home page
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      // Close the dialog if there's an error
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (!user) {
    return (
      <div className="container max-w-3xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Not Logged In</CardTitle>
            <CardDescription>
              You must be logged in to edit your profile.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-display text-earth-brown">Edit Your Profile</CardTitle>
          <CardDescription>
            Update your personal information and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center mb-6">
                <FormLabel className="text-center block mb-2">Profile Picture</FormLabel>
                <div className="relative inline-block">
                  <Avatar className="h-32 w-32 border-2 border-metallic-gold">
                    {profilePreview ? (
                      <AvatarImage src={profilePreview} alt="Profile preview" />
                    ) : (
                      <AvatarFallback className="bg-forest-green text-sand-beige">
                        <UserCircle2 className="h-16 w-16" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full bg-metallic-gold hover:bg-yellow-600 text-forest-green" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                />
                <p className="text-xs text-gray-500 mt-2">Click the camera icon to change your profile picture</p>
              </div>
              
              {/* User Details */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about yourself and your detecting interests" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Change Password (Optional)</h3>
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="border-t pt-6 mt-6">
                <h3 className="font-bold text-red-700 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Account Deactivation
                </h3>
                <p className="text-gray-600 mb-4">
                  Once you delete your account, there is no going back. This action is permanent and will remove all content you've created.
                </p>
                <Button 
                  type="button" 
                  variant="destructive"
                  className="flex items-center gap-1 mb-6"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={user?.username.toLowerCase() === "digquestor"}
                >
                  <Trash2 className="h-4 w-4" /> Delete Account
                </Button>
                {user?.username.toLowerCase() === "digquestor" && (
                  <p className="text-sm text-amber-600 italic mb-4">
                    Note: The DigQuestor account cannot be deleted as it's the default demo account.
                  </p>
                )}
              </div>
              
              <div className="flex justify-between pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button 
                  type="submit" 
                  className="bg-forest-green hover:bg-green-900 text-sand-beige font-semibold flex items-center gap-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {/* Account Deactivation Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle /> Account Deactivation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2 font-medium">You will lose:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Your profile information</li>
              <li>All forum posts and comments</li>
              <li>All treasure finds you've shared</li>
              <li>All detecting locations you've added</li>
              <li>All events and wellbeing stories</li>
            </ul>
          </div>
          <DialogFooter className="flex sm:justify-between">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}