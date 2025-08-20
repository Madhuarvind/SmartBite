
"use client"

import { useState } from "react";
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
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import { Loader } from "lucide-react";


export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);


  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: `${firstName} ${lastName}`});
      
      toast({ title: "Account Created", description: "Welcome to SmartBite!" });
      router.push("/dashboard");
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
    provider.setCustomParameters({
        'login_hint': 'user@example.com',
        'hd': auth.tenantId || 'smartbite-rknzs.firebaseapp.com'
    });
    try {
        await signInWithPopup(auth, provider);
        toast({ title: "Account Created", description: "Welcome to SmartBite!"});
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
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" placeholder="Max" required value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading || isGoogleLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" placeholder="Robinson" required value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading || isGoogleLoading} />
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
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading || isGoogleLoading} />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader className="mr-2 animate-spin" />}
            Create an account
          </Button>
          <Button variant="outline" className="w-full" type="button" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading && <Loader className="mr-2 animate-spin" />}
            Sign up with Google
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
