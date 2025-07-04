import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// Import auth hook
import { useAuth } from "@/hooks/use-auth-simple";
import { Loader2, Heart, Camera, UserCircle2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Make sure to call loadStripe outside of a component's render to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Component to handle Stripe payment
interface PaymentFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  onBack: () => void;
}

const PaymentForm = ({ onSuccess, onError, onBack }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error("Stripe not initialized");
      onError("Stripe is not initialized. Please try again.");
      return;
    }

    setIsProcessing(true);

    try {
      console.log("Confirming payment...");
      
      // Make sure the payment element is ready
      const element = elements.getElement(PaymentElement);
      if (!element) {
        console.error("Payment element not found");
        throw new Error("Payment element not found");
      }
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required'
      });

      console.log("Payment confirmation result:", { error, paymentIntent });
      
      if (error) {
        console.error("Payment confirmation error:", error);
        onError(error.message || "An error occurred with your payment");
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log("Payment succeeded");
        onSuccess();
      } else if (paymentIntent) {
        console.log("Payment status:", paymentIntent.status);
        if (paymentIntent.status === 'requires_action') {
          // Let Stripe handle the redirect
          console.log("Payment requires additional action");
        } else {
          // Consider other statuses as success for now
          onSuccess();
        }
      } else {
        // Fall back to success if we don't get a clear error
        console.log("No payment intent returned, assuming success");
        onSuccess();
      }
    } catch (err) {
      console.error("Payment form error:", err);
      if (err instanceof Error) {
        onError(err.message);
      } else {
        onError("An unknown error occurred");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-6" />
      <div className="flex justify-between pt-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button 
          type="submit"
          className="bg-metallic-gold hover:bg-yellow-600 text-forest-green font-semibold"
          disabled={!stripe || !elements || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            "Complete Payment"
          )}
        </Button>
      </div>
    </form>
  );
};

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  // Add profile picture field
  profilePicture: z.instanceof(File).optional(),
  // Optional donation field
  donationOption: z.enum(["skip", "5", "10", "15", "25", "custom"]).optional().default("5"),
  customAmount: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // If custom donation is selected, make sure a valid amount is entered
  if (data.donationOption === "custom") {
    const amount = parseFloat(data.customAmount || "0");
    return !isNaN(amount) && amount > 0;
  }
  return true;
}, {
  message: "Please enter a valid donation amount",
  path: ["customAmount"],
});

type SignupValues = z.infer<typeof signupSchema>;

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin?: () => void;
}

const SignupModal = ({ isOpen, onClose, onOpenLogin }: SignupModalProps) => {
  // Registration function with profile picture upload and auth integration
  const { toast } = useToast();
  const { login } = useAuth();
  
  const register = async (username: string, email: string, password: string, profilePicture?: File) => {
    try {
      // Make sure this username isn't "digquestor" in any case variant
      if (username.toLowerCase() === "digquestor") {
        throw new Error("'DigQuestor' is a reserved username. Please choose a different username.");
      }
      
      // Make sure the site is marked as visited to allow auto-login on future visits, but not this first time
      localStorage.setItem('site_visited', 'true');
      
      let avatarUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${username}`; // Default fallback
      
      if (profilePicture) {
        // If we have a profile picture, we need to upload it first
        const formData = new FormData();
        formData.append('file', profilePicture);
        
        try {
          // Upload profile picture
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            avatarUrl = uploadData.url; // Get the URL of the uploaded image
            console.log("Profile picture uploaded:", avatarUrl);
          } else {
            console.error("Failed to upload profile picture");
            // Continue with default avatar URL
          }
        } catch (uploadError) {
          console.error("Error uploading profile picture:", uploadError);
          // Continue with default avatar URL
        }
      }
      
      // Check if the user already exists first by attempting to fetch them
      console.log(`Checking if user ${username} already exists...`);
      try {
        const checkResponse = await fetch(`/api/users/by-username/${username}`);
        if (checkResponse.ok) {
          // User exists, throw error
          throw new Error(`Username '${username}' is already taken. Please choose a different username.`);
        }
      } catch (checkError) {
        // If we get a 404, that's good - it means the username is available
        // Any other error should be re-thrown
        if (checkError instanceof Error && 
            checkError.message.includes("already taken")) {
          throw checkError;
        }
      }
      
      // User doesn't exist yet, we can register them
      // Prepare user data for registration
      const userData = {
        username,
        email,
        password,
        avatarUrl,
        bio: `I'm a metal detecting enthusiast!`
      };
      
      console.log("Registering new user with data:", { ...userData, password: '***' });
      
      // Register with email verification endpoint
      const registerResponse = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!registerResponse.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await registerResponse.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const errorText = await registerResponse.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const registerData = await registerResponse.json();
      
      // Show success message and auto-login
      toast({
        title: "Account Created Successfully!",
        description: "You can now log in to DigQuest immediately!",
        duration: 5000,
      });
      
      return registerData;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<'account' | 'donation' | 'payment'>('account');
  const [donationIntent, setDonationIntent] = useState<string | null>(null);
  
  // Add state for profile picture preview
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      donationOption: "5",
      customAmount: "",
    },
  });
  
  // Handle profile picture selection
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Set the file in the form
    form.setValue("profilePicture", file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Watch the donation option to show/hide custom amount input
  const watchDonationOption = form.watch("donationOption");
  
  const handleDonation = async (data: SignupValues) => {
    // If user chose to skip donation, register directly
    if (data.donationOption === "skip") {
      try {
        await register(data.username, data.email, data.password, data.profilePicture);
        form.reset();
        setProfilePreview(null);
        onClose();
        setIsLoading(false);
        return;
      } catch (registerErr: any) {
        setIsLoading(false);
        
        if (registerErr.message) {
          setError(registerErr.message);
        } else {
          setError("Failed to create account. Please try again.");
        }
        return;
      }
    }
    
    // For other donation options, calculate amount
    const amount = data.donationOption === "custom" 
      ? parseFloat(data.customAmount || "0") 
      : parseInt(data.donationOption, 10);
    
    if (amount <= 0) {
      setError("Please select a valid donation amount");
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("Creating payment intent for amount:", amount);
      
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          amount,
          email: data.email,
          name: data.username
        }),
      });
      
      console.log("Response status:", response.status);
      const contentType = response.headers.get('content-type');
      console.log("Content type:", contentType);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to create payment intent: ${errorText}`);
      }
      
      // Handle case where response is not JSON
      if (!contentType || !contentType.includes('application/json')) {
        console.error("Response is not JSON:", await response.text());
        throw new Error('Server did not return JSON response');
      }
      
      const responseData = await response.json();
      console.log("Response data:", responseData);
      
      if (!responseData.clientSecret) {
        throw new Error('No client secret returned from server');
      }
      
      setDonationIntent(responseData.clientSecret);
      
      // Move to payment step
      setCurrentStep('payment');
    } catch (err) {
      console.error("Error in donation processing:", err);
      setIsLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to process donation. Please try again.");
      }
      // Skip donation and just create account on error
      try {
        await register(data.username, data.email, data.password, data.profilePicture);
        form.reset();
        setProfilePreview(null);
        onClose();
        setIsLoading(false);
      } catch (registerErr) {
        setIsLoading(false);
        if (registerErr instanceof Error) {
          setError(registerErr.message);
        } else {
          setError("Failed to create account. Please try again.");
        }
      }
    }
  };
  
  const onSubmit = async (data: SignupValues) => {
    setIsLoading(true);
    setError(null);
    
    if (currentStep === 'account') {
      // Move to donation step
      setCurrentStep('donation');
      setIsLoading(false);
      
      // Scroll to top of dialog when moving to donation step
      setTimeout(() => {
        const dialogContent = document.querySelector('[data-radix-dialog-content]');
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
      }, 100);
      
      return;
    }
    
    if (currentStep === 'donation') {
      await handleDonation(data);
      return;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-display text-earth-brown">
            {currentStep === 'account' && "Join Our Community"}
            {currentStep === 'donation' && "Support Our Community"}
            {currentStep === 'payment' && "Complete Your Donation"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {currentStep === 'account' && (
              <div className="space-y-2">
                <p>Fill out your details below to join the DigQuest community!</p>
                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
                  <p className="text-green-800 font-medium">🎉 Quick Setup!</p>
                  <p className="text-green-700">Create your account in seconds - no email verification required. You can log in immediately after signing up!</p>
                </div>
              </div>
            )}
            {currentStep === 'donation' && (
              <div className="space-y-3">
                <p>Your donations will help keep DigQuest financially stable and help us build new features that will make your metal detecting experiences even better, easier and more fulfilling.</p>
                <p>We are so grateful for all the support from our community and are committed to ensuring that DigQuest continues to provide life-enhancing experiences for many years to come.</p>
              </div>
            )}
            {currentStep === 'payment' && "Complete your payment to finalize your donation."}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pb-safe">
            {/* Account Creation Step */}
            {currentStep === 'account' && (
              <>
                {/* Profile Picture Upload */}
                <div className="mb-4 flex flex-col items-center">
                  <div className="mb-2 text-center">
                    <FormLabel className="text-center block mb-2">Profile Picture</FormLabel>
                    <div className="relative inline-block">
                      <Avatar className="h-24 w-24 border-2 border-metallic-gold">
                        {profilePreview ? (
                          <AvatarImage src={profilePreview} alt="Profile preview" />
                        ) : (
                          <AvatarFallback className="bg-forest-green text-sand-beige">
                            <UserCircle2 className="h-12 w-12" />
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
                    <p className="text-xs text-gray-500 mt-2">Click the camera icon to upload a profile picture</p>
                  </div>
                </div>
                
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} />
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
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-forest-green hover:bg-green-900 text-sand-beige font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Donation Step */}
            {currentStep === 'donation' && (
              <>
                <div className="bg-sand-beige/30 p-3 rounded-lg mb-3">
                  <h3 className="font-semibold text-earth-brown mb-2 flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-metallic-gold" /> Support Our Community
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Your contribution helps us maintain our platform and organize community events. Any amount is appreciated!
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="donationOption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Support Our Community (Optional)</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-2"
                          >
                            {/* First row - Skip and amounts */}
                            <div className="grid grid-cols-4 gap-2">
                              <div className="flex items-center">
                                <RadioGroupItem value="skip" id="skip" className="peer sr-only" />
                                <Label
                                  htmlFor="skip"
                                  className="flex items-center justify-center rounded-md border-2 border-muted bg-white p-2 h-12 w-full hover:bg-gray-50 hover:border-gray-200 peer-data-[state=checked]:border-metallic-gold peer-data-[state=checked]:bg-sand-beige/20 [&:has([data-state=checked])]:border-metallic-gold [&:has([data-state=checked])]:bg-sand-beige/20"
                                >
                                  <span className="text-xs font-medium text-center">Skip</span>
                                </Label>
                              </div>
                              <div className="flex items-center">
                                <RadioGroupItem value="5" id="amount-5" className="peer sr-only" />
                                <Label
                                  htmlFor="amount-5"
                                  className="flex items-center justify-center rounded-md border-2 border-muted bg-white p-2 h-12 w-full hover:bg-gray-50 hover:border-gray-200 peer-data-[state=checked]:border-metallic-gold peer-data-[state=checked]:bg-sand-beige/20 [&:has([data-state=checked])]:border-metallic-gold [&:has([data-state=checked])]:bg-sand-beige/20"
                                >
                                  <span className="text-lg font-bold text-earth-brown">$5</span>
                                </Label>
                              </div>
                              <div className="flex items-center">
                                <RadioGroupItem value="10" id="amount-10" className="peer sr-only" />
                                <Label
                                  htmlFor="amount-10"
                                  className="flex items-center justify-center rounded-md border-2 border-muted bg-white p-2 h-12 w-full hover:bg-gray-50 hover:border-gray-200 peer-data-[state=checked]:border-metallic-gold peer-data-[state=checked]:bg-sand-beige/20 [&:has([data-state=checked])]:border-metallic-gold [&:has([data-state=checked])]:bg-sand-beige/20"
                                >
                                  <span className="text-lg font-bold text-earth-brown">$10</span>
                                </Label>
                              </div>
                              <div className="flex items-center">
                                <RadioGroupItem value="15" id="amount-15" className="peer sr-only" />
                                <Label
                                  htmlFor="amount-15"
                                  className="flex items-center justify-center rounded-md border-2 border-muted bg-white p-2 h-12 w-full hover:bg-gray-50 hover:border-gray-200 peer-data-[state=checked]:border-metallic-gold peer-data-[state=checked]:bg-sand-beige/20 [&:has([data-state=checked])]:border-metallic-gold [&:has([data-state=checked])]:bg-sand-beige/20"
                                >
                                  <span className="text-lg font-bold text-earth-brown">$15</span>
                                </Label>
                              </div>
                            </div>
                            
                            {/* Second row - $25 and Custom */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center">
                                <RadioGroupItem value="25" id="amount-25" className="peer sr-only" />
                                <Label
                                  htmlFor="amount-25"
                                  className="flex items-center justify-center rounded-md border-2 border-muted bg-white p-2 h-12 w-full hover:bg-gray-50 hover:border-gray-200 peer-data-[state=checked]:border-metallic-gold peer-data-[state=checked]:bg-sand-beige/20 [&:has([data-state=checked])]:border-metallic-gold [&:has([data-state=checked])]:bg-sand-beige/20"
                                >
                                  <span className="text-lg font-bold text-earth-brown">$25</span>
                                </Label>
                              </div>
                              <div className="flex items-center">
                                <RadioGroupItem value="custom" id="amount-custom" className="peer sr-only" />
                                <Label
                                  htmlFor="amount-custom"
                                  className="flex items-center justify-center rounded-md border-2 border-muted bg-white p-2 h-12 w-full hover:bg-gray-50 hover:border-gray-200 peer-data-[state=checked]:border-metallic-gold peer-data-[state=checked]:bg-sand-beige/20 [&:has([data-state=checked])]:border-metallic-gold [&:has([data-state=checked])]:bg-sand-beige/20"
                                >
                                  <span className="text-sm font-medium">Custom Amount</span>
                                </Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {watchDonationOption === "custom" && (
                    <FormField
                      control={form.control}
                      name="customAmount"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel className="text-sm">Enter Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                              <Input
                                type="number"
                                placeholder="Enter amount"
                                min="1"
                                step="0.01"
                                className="pl-7"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Buttons at bottom - always visible */}
                <div className="flex flex-col space-y-2 mt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-metallic-gold hover:bg-yellow-600 text-forest-green font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                      </>
                    ) : (
                      <>
                        {watchDonationOption === "skip" ? "Create Account" : "Continue to Payment"}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full"
                    onClick={() => setCurrentStep('account')}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </div>
              </>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && donationIntent && (
              <div className="py-2">
                <Elements stripe={stripePromise} options={{ clientSecret: donationIntent }}>
                  <PaymentForm 
                    onSuccess={() => {
                      console.log("Payment success callback triggered");
                      toast({
                        title: "Thank You!",
                        description: `Your donation was successful. Your account has been created.`,
                      });
                      
                      try {
                        // Register user after successful payment
                        const username = form.getValues("username");
                        const email = form.getValues("email");
                        const password = form.getValues("password");
                        console.log(`Creating account for ${username} with email ${email}`);
                        
                        register(username, email, password)
                          .then(() => {
                            console.log("Account created successfully after payment");
                            form.reset();
                            onClose();
                          })
                          .catch((err) => {
                            console.error("Error creating account after payment:", err);
                            // Even if account creation fails, payment was successful
                            toast({
                              title: "Donation Processed",
                              description: "Your donation was processed, but there was an issue creating your account. Please try again.",
                              variant: "destructive"
                            });
                            setCurrentStep('account');
                          });
                      } catch (e) {
                        console.error("Exception during account creation:", e);
                        toast({
                          title: "Error Creating Account",
                          description: "There was a problem creating your account after payment.",
                          variant: "destructive"
                        });
                        setCurrentStep('account');
                      }
                    }}
                    onError={(message) => {
                      console.error("Payment error:", message);
                      setError(message);
                      
                      // On payment error, we can still create the account without donation
                      toast({
                        title: "Payment Error",
                        description: "There was an issue processing your payment. Would you like to create an account without donation?",
                        variant: "destructive",
                      });
                      
                      // Go back to donation step
                      setCurrentStep('donation');
                    }}
                    onBack={() => setCurrentStep('donation')}
                  />
                </Elements>
              </div>
            )}
          </form>
        </Form>
        
        <div className="text-center text-sm text-gray-500">
          <p>Already have an account? <Button variant="link" className="p-0 h-auto text-sm text-forest-green" onClick={() => {
            onClose();
            onOpenLogin?.();
          }}>Sign in</Button></p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupModal;
