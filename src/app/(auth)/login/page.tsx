
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { AlertTriangle, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SmartBiteLogo } from "@/components/icons";


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/internal-error') {
        setError("Firebase internal error: Please ensure your app's domain is authorized in your Firebase project's Authentication settings.");
      } else {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message || "An unexpected error occurred.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        toast({ title: "Login Successful", description: "Welcome!"});
        router.push("/dashboard");
    } catch (error: any) {
        console.error("Google login failed:", error);
        if (error.code === 'auth/internal-error') {
            setError("Firebase internal error: Please ensure your app's domain is authorized in your Firebase project's Authentication settings.");
        } else {
            toast({
                variant: "destructive",
                title: "Google Login Failed",
                description: "Please ensure your domain is authorized in the Firebase Console. " + (error.message || "Could not log in with Google."),
            });
        }
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox for a link to reset your password.",
      });
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Password reset failed:", error);
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };


  return (
    <>
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader className="items-center text-center">
        <SmartBiteLogo className="w-12 h-12 text-primary" />
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
            <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <form onSubmit={handleLogin} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              suppressHydrationWarning={true}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                   <Button suppressHydrationWarning variant="link" type="button" className="ml-auto inline-block text-sm underline">Forgot your password?</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Your Password</DialogTitle>
                        <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="reset-email" className="text-right">Email</Label>
                            <Input
                                id="reset-email"
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="col-span-3"
                                placeholder="m@example.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={handleForgotPassword}>Send Reset Link</Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              suppressHydrationWarning={true}
            />
          </div>
          <Button suppressHydrationWarning type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader className="mr-2 animate-spin" />}
            Login
          </Button>
          <Button suppressHydrationWarning variant="outline" className="w-full" type="button" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? <Loader className="mr-2 animate-spin" /> : <svg className="mr-2" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" height="18" width="18"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.92 1.62-3.08 0-5.61-2.3-5.61-5.18s2.53-5.18 5.61-5.18c1.5 0 2.72.48 3.76 1.48l2.84-2.76C19.31 2.91 16.33 2 12.48 2 7.4 2 3.43 5.44 3.43 10.4s3.97 8.4 9.05 8.4c2.39 0 4.49-.79 6-2.16 1.62-1.45 2.4-3.66 2.4-6.24 0-.55-.05-1.05-.14-1.55H12.48z" fill="currentColor"></path></svg>}
            Login with Google
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
