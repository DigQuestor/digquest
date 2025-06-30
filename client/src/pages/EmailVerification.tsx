import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Mail, 
  Loader2,
  Home,
  RefreshCw
} from "lucide-react";

interface VerificationResult {
  success: boolean;
  message: string;
  user?: {
    id: number;
    username: string;
    email: string;
    isEmailVerified: boolean;
  };
}

const EmailVerification = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  // Extract token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/verify-email?token=${verificationToken}`);
      const data = await response.json();
      
      if (response.ok) {
        setVerificationResult({
          success: true,
          message: data.message,
          user: data.user
        });
        toast({
          title: "Email Verified!",
          description: "Welcome to DigQuest! You can now access all features.",
        });
      } else {
        setVerificationResult({
          success: false,
          message: data.message
        });
      }
    } catch (error) {
      setVerificationResult({
        success: false,
        message: "Unable to verify email. Please try again later."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Email Sent!",
          description: data.message,
        });
        setResendEmail("");
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Email Verification | DigQuest</title>
        <meta name="description" content="Verify your email address to complete your DigQuest registration." />
        <link rel="canonical" href="https://digquest.org/verify-email" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-sand-beige to-earth-brown/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Verification Status Card */}
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {isVerifying ? (
                  <Loader2 className="h-16 w-16 text-forest-green animate-spin" />
                ) : verificationResult?.success ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : verificationResult && !verificationResult.success ? (
                  <XCircle className="h-16 w-16 text-red-500" />
                ) : (
                  <Mail className="h-16 w-16 text-forest-green" />
                )}
              </div>
              
              <CardTitle className="text-2xl text-earth-brown">
                {isVerifying ? "Verifying Email..." : 
                 verificationResult?.success ? "Email Verified!" :
                 verificationResult && !verificationResult.success ? "Verification Failed" :
                 "Email Verification"}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              {isVerifying && (
                <p className="text-gray-600">
                  Please wait while we verify your email address...
                </p>
              )}

              {verificationResult && (
                <div className="space-y-4">
                  <p className={`text-sm ${verificationResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {verificationResult.message}
                  </p>

                  {verificationResult.success && verificationResult.user && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Welcome, {verificationResult.user.username}!</strong><br />
                        Your account is now fully activated. You can access all DigQuest features including:
                      </p>
                      <ul className="text-xs text-green-700 mt-2 space-y-1">
                        <li>• Share your finds with the community</li>
                        <li>• Join forum discussions</li>
                        <li>• Use AR route recommendations</li>
                        <li>• Earn achievements and badges</li>
                      </ul>
                    </div>
                  )}

                  {verificationResult.success ? (
                    <Button 
                      onClick={() => setLocation("/")}
                      className="w-full bg-forest-green hover:bg-green-900"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Go to Home Page
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Need a new verification email? Enter your email address below:
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!token && !verificationResult && (
                <p className="text-gray-600">
                  This page is used to verify email addresses. If you need to verify your email, 
                  please check your inbox for a verification link.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Resend Verification Card */}
          {(!verificationResult?.success || !token) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-earth-brown text-center">
                  Resend Verification Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="resend-email">Email Address</Label>
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full bg-forest-green hover:bg-green-900"
                >
                  {isResending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  Check your spam folder if you don't see the email within a few minutes.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default EmailVerification;