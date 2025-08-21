
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
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, sendEmailVerification } from "firebase/auth";
import { Loader } from "lucide-react";
import { collection, writeBatch, doc } from "firebase/firestore";
import { initialInventory, pantryEssentials } from "@/lib/inventory";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
          Enter your information to create an account.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
             <svg className="mr-2" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" height="18" width="18"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.92 1.62-3.08 0-5.61-2.3-5.61-5.18s2.53-5.18 5.61-5.18c1.5 0 2.72.48 3.76 1.48l2.84-2.76C19.31 2.91 16.33 2 12.48 2 7.4 2 3.43 5.44 3.43 10.4s3.97 8.4 9.05 8.4c2.39 0 4.49-.79 6-2.16 1.62-1.45 2.4-3.66 2.4-6.24 0-.55-.05-1.05-.14-1.55H12.48z" fill="currentColor"></path></svg>
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
    </>
  )
}
