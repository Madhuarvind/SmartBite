
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { verifyOtp } from "@/ai/flows/verify-otp";

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const uid = searchParams.get('userId');
    if (uid) {
      setUserId(uid);
    } else {
      // Handle case where userId is missing
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: "User ID is missing. Please try registering again.",
      });
      router.push('/register');
    }
  }, [searchParams, router, toast]);

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User information is not available.",
      });
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter a 6-digit code.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyOtp({ userId, otp });
      if (result.success) {
        toast({
          title: "Verification Successful!",
          description: "You can now log in.",
        });
        router.push("/login");
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.message || "The OTP is incorrect or has expired. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Check Your Email</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to your email address. Please enter it below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerifyOtp} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={isLoading}
              suppressHydrationWarning
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !userId}>
            {isLoading && <Loader className="mr-2 animate-spin" />}
            Verify Email
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

