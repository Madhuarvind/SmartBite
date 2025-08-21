
"use client"

import { useState, useEffect } from "react";
import Link from "next/link"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, sendEmailVerification, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { Loader } from "lucide-react";
import { collection, writeBatch, doc } from "firebase/firestore";
import { initialInventory, pantryEssentials } from "@/lib/inventory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Add a useEffect to initialize RecaptchaVerifier
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  }, []);

  const populateInitialData = async (userId: string) => {
      const batch = writeBatch(db);
      
      const inventoryRef = collection(db, "users", userId, "inventory");
      initialInventory.forEach(item => {
          const docRef = doc(inventoryRef);
          batch.set(docRef, { name: item.name, quantity: item.quantity, expiry: item.expiry, purchaseDate: new Date().toISOString().split('T')[0] });
      });

      const pantryRef = collection(db, "users", userId, "pantry_essentials");
      pantryEssentials.forEach(item => {
          const docRef = doc(pantryRef);
          batch.set(docRef, { name: item.name, quantity: item.quantity });
      });

      await batch.commit();
  }


  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: `${firstName} ${lastName}`.trim() });
      await sendEmailVerification(userCredential.user);

      await populateInitialData(userCredential.user.uid);
      
      toast({ title: "Verification Email Sent", description: "Please check your inbox to verify your email address before logging in." });
      router.push("/login");
    } catch (error: any) {
       console.error("Registration failed:", error);
       toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
        const appVerifier = window.recaptchaVerifier;
        const formattedPhoneNumber = `+1${phone.replace(/\D/g, '')}`; // Prepend country code and strip non-digits
        const result = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
        setConfirmationResult(result);
        setIsOtpSent(true);
        toast({ title: "OTP Sent", description: "Please enter the verification code sent to your phone." });
    } catch (error: any) {
        console.error("Phone sign up failed:", error);
        toast({ variant: "destructive", title: "Failed to Send OTP", description: error.message });
    } finally {
        setIsLoading(false);
    }
  }

  const handleOtpVerify = async () => {
      if (!confirmationResult) return;
      setIsOtpLoading(true);
      try {
          const userCredential = await confirmationResult.confirm(otp);
          await updateProfile(userCredential.user, { displayName: `${firstName} ${lastName}`.trim() });
          await populateInitialData(userCredential.user.uid);
          toast({ title: "Account Created!", description: "You have successfully registered with your phone number." });
          router.push("/dashboard");
      } catch (error: any) {
          console.error("OTP verification failed:", error);
          toast({ variant: "destructive", title: "Invalid Code", description: "The OTP you entered is incorrect. Please try again." });
      } finally {
          setIsOtpLoading(false);
      }
  }


  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        // This is a simplistic check; in a real app, you'd check if the user is truly new.
        await populateInitialData(userCredential.user.uid);

        toast({ title: "Account Created", description: "Welcome to SmartBite! We've added some items to your inventory to get you started."});
        router.push("/dashboard");
    } catch (error: any) {
        console.error("Google sign up failed:", error);
        toast({
            variant: "destructive",
            title: "Google Sign-Up Failed",
            description: error.message || "Could not sign up with Google. Please try again.",
        });
    } finally {
        setIsGoogleLoading(false);
    }
  }


  return (
    <>
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email" className="pt-4">
                <form onSubmit={handleRegister} className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                        <Label htmlFor="first-name-email">First name</Label>
                        <Input id="first-name-email" placeholder="Max" required value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading || isGoogleLoading} suppressHydrationWarning />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="last-name-email">Last name</Label>
                        <Input id="last-name-email" placeholder="Robinson" required value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading || isGoogleLoading} suppressHydrationWarning />
                        </div>
                    </div>
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
                        suppressHydrationWarning
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading || isGoogleLoading} suppressHydrationWarning />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                        {isLoading ? <Loader className="mr-2 animate-spin" /> : null}
                        Create an account
                    </Button>
                </form>
            </TabsContent>
            <TabsContent value="phone" className="pt-4">
                <form onSubmit={handlePhoneSignUp} className="grid gap-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                        <Label htmlFor="first-name-phone">First name</Label>
                        <Input id="first-name-phone" placeholder="Max" required value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading || isGoogleLoading} suppressHydrationWarning />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="last-name-phone">Last name</Label>
                        <Input id="last-name-phone" placeholder="Robinson" required value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading || isGoogleLoading} suppressHydrationWarning />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="1234567890"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={isLoading || isGoogleLoading}
                            suppressHydrationWarning
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                        {isLoading ? <Loader className="mr-2 animate-spin" /> : null}
                        Send Verification Code
                    </Button>
                </form>
            </TabsContent>
        </Tabs>

        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
        </div>

        <Button variant="outline" className="w-full" type="button" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading && <Loader className="mr-2 animate-spin" />}
            Sign up with Google
        </Button>

        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
    <div id="recaptcha-container"></div>
    
     <Dialog open={isOtpSent} onOpenChange={setIsOtpSent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Verification Code</DialogTitle>
            <DialogDescription>
              We've sent a 6-digit code to your phone number. Please enter it below to complete your registration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="otp" className="text-right">
                OTP
              </Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="col-span-3"
                placeholder="123456"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleOtpVerify} disabled={isOtpLoading}>
                {isOtpLoading && <Loader className="mr-2 animate-spin" />}
                Verify and Sign Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
