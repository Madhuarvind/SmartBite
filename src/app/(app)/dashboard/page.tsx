
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowRight, ScanLine, Lightbulb } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { initialInventory } from "@/lib/inventory";
import { differenceInDays, parseISO, format, subDays, startOfDay, endOfDay } from "date-fns";
import { auth, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  meals: { label: "Meals Cooked", color: "hsl(var(--primary))" },
  waste: { label: "Items Wasted", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

const getExpiringItems = () => {
  const today = new Date();
  return initialInventory
    .map(item => {
      const expiryDate = parseISO(item.expiry);
      const daysLeft = differenceInDays(expiryDate, today);
      return { ...item, daysLeft };
    })
    .filter(item => item.daysLeft >= 0 && item.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map(item => ({
      ...item,
      status: item.daysLeft <= 2 ? "Urgent" as const : "Soon" as const,
    }));
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expiringItems, setExpiringItems] = useState(getExpiringItems());
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      if (currentUser) {
        fetchWeeklyData(currentUser.uid);
      }
    });

    setExpiringItems(getExpiringItems());

    return () => unsubscribe();
  }, []);
  
  const fetchWeeklyData = async (userId: string) => {
      const today = new Date();
      const weeklyData: { day: string, meals: number, waste: number }[] = [];
      const activityRef = collection(db, "users", userId, "activity");

      for (let i = 6; i >= 0; i--) {
          const day = subDays(today, i);
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);

          const q = query(activityRef, where('timestamp', '>=', Timestamp.fromDate(dayStart)), where('timestamp', '<=', Timestamp.fromDate(dayEnd)));
          const querySnapshot = await getDocs(q);
          
          let meals = 0;
          let waste = 0;

          querySnapshot.forEach(doc => {
              const data = doc.data();
              if (data.type === 'mealCooked') {
                  meals++;
              } else if (data.type === 'itemWasted') {
                  waste++;
              }
          });

          weeklyData.push({
              day: format(day, "E"), // e.g., "Mon", "Tue"
              meals,
              waste
          });
      }
      setChartData(weeklyData);
  }

  const displayName = user?.displayName?.split(' ')[0] || user?.email || "User";

  return (
    <div className="flex flex-col gap-8">
      {isLoading ? (
         <Skeleton className="h-9 w-48" />
      ) : (
        <PageHeader title={`Hello, ${displayName}!`} />
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>A summary of your cooking and food waste habits for the past week, based on your activity.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="meals" fill="var(--color-meals)" radius={4} />
                    <Bar dataKey="waste" fill="var(--color-waste)" radius={4} />
                </BarChart>
                </ChartContainer>
            ) : (
                <div className="flex justify-center items-center h-[200px] text-muted-foreground">
                    <p>No activity recorded yet. Cook some meals or manage your inventory to see your progress!</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Expiring Soon</CardTitle>
            <CardDescription>Use these items before they go bad!</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Expires In</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringItems.length > 0 ? expiringItems.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.daysLeft} {item.daysLeft === 1 ? 'day' : 'days'}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Urgent' ? 'destructive' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No items expiring soon.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/inventory">View Full Inventory <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <ScanLine className="w-12 h-12 text-primary mb-4" />
            <CardTitle>Scan Your Fridge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Quickly add ingredients by taking a picture of your fridge or pantry.</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/inventory">Start Scanning <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <Lightbulb className="w-12 h-12 text-primary mb-4" />
            <CardTitle>Get Recipe Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Let our AI find the perfect meal for you based on what you have.</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/recipes">Find Recipes <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
