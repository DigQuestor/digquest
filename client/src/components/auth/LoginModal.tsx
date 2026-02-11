import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth-simple";
import { Loader2, ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const passwordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginValues = z.infer<typeof loginSchema>;
type PasswordResetValues = z.infer<typeof passwordResetSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const resetForm = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Make sure the site is marked as visited to allow auto-login on future visits
      localStorage.setItem('site_visited', 'true');
      
      // Call the login function from useAuth (now async)
      const user = await login(data.username, data.password);
      
      console.log("User logged in successfully:", user);
      
      // Show success message - handle both login and registration
      toast({
        title: "Success!",
        description: `Welcome, ${user.username}! Redirecting...`,
        duration: 3000,
      });
      
      // Close modal and reset form
      form.reset();
      onClose();
      
      // Wait for session to establish before redirect
      setTimeout(() => {
        console.log("Redirecting after login...");
        
        // Navigate to homepage or reload page to show authenticated state
        if (window.location.pathname === '/') {
          window.location.reload();
        } else {
          // Redirect to homepage after successful login
          window.location.href = '/';
        }
      }, 1500);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordReset = async (data: PasswordResetValues) => {
    setIsResetLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      toast({
        title: "Reset Email Sent",
        description: "If an account with that email exists, you'll receive password reset instructions.",
      });

      setShowPasswordReset(false);
      resetForm.reset();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send reset email");
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleBack = () => {
    setShowPasswordReset(false);
    setError(null);
    resetForm.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => { e.preventDefault(); onClose(); }}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          type="button"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-display text-earth-brown">
            {showPasswordReset ? "Reset Password" : "Sign In"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {showPasswordReset 
              ? "Enter your email address and we'll send you a link to reset your password."
              : "Sign in to your existing DigQuest account. New users should use the Sign Up button instead."
            }
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {showPasswordReset ? (
          // Password Reset Form
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onPasswordReset)} className="space-y-4">
              <FormField
                control={resetForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email address" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2 space-y-2">
                <Button 
                  type="submit" 
                  className="w-full bg-metallic-gold hover:bg-yellow-600 text-forest-green font-semibold"
                  disabled={isResetLoading}
                >
                  {isResetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    "Send Reset Email"
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleBack}
                  className="w-full"
                  disabled={isResetLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          // Login Form
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-metallic-gold hover:bg-yellow-600 text-forest-green font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
            
            <div className="text-center text-sm text-gray-500 space-y-2">
              <p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm text-forest-green hover:underline" 
                  onClick={() => setShowPasswordReset(true)}
                  type="button"
                >
                  Forgot your password?
                </Button>
              </p>
              <p>Don't have an account? Use the <strong>Sign Up</strong> button to create a new account.</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
