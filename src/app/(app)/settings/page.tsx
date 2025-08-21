
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/firebase";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import type { User } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const [first = "", last = ""] = (currentUser.displayName || "").split(" ");
        setFirstName(first);
        setLastName(last);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleProfileUpdate = async () => {
    if (!user) return;
    try {
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`.trim()
      });
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully."});
    } catch(error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user || !user.email) {
      toast({ variant: "destructive", title: "Error", description: "No user is signed in."});
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords Mismatch", description: "The new passwords do not match."});
      return;
    }
    if (!currentPassword || !newPassword) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all password fields."});
        return;
    }
    
    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        toast({ title: "Password Updated", description: "Your password has been changed successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    } catch(error: any) {
        toast({ variant: "destructive", title: "Password Update Failed", description: error.message });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Settings" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" />
      
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your account details and personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email || ""} disabled />
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleProfileUpdate}>Save Profile</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handlePasswordUpdate}>Update Password</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all of your data. This action cannot be undone.</CardDescription>
        </CardHeader>
        <CardFooter>
            <Button variant="destructive">Delete My Account</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
