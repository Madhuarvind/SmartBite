
"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
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
                <Input id="first-name" defaultValue="John" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" defaultValue="Doe" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="john.doe@example.com" disabled />
          </div>
        </CardContent>
        <CardFooter>
            <Button>Save Profile</Button>
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
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
        </CardContent>
        <CardFooter>
            <Button>Update Password</Button>
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
