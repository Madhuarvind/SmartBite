
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { ArrowRight, Lightbulb, TrendingUp } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO, format, subDays, startOfDay, endOfDay } from "date-fns";
import { auth, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { collection, query, where, getDocs, Timestamp, onSnapshot } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventoryItem } from "@/lib/types";


const weeklyChartConfig = {
  meals: { label: "Meals Cooked", color: "hsl(var(--primary))" },
  waste: { label: "Items Wasted", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

const spendingChartConfig = {
  spending: { label: "Spending", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const [weeklyChartData, setWeeklyChartData] = useState<any[]>([]);
  const [spendingChartData, setSpendingChartData] = useState<any[]>([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchWeeklyData(currentUser.uid);
        
        // Set up real-time listener for inventory
        const inventoryRef = collection(db, "users", currentUser.uid, "inventory");
        const unsubscribeInventory = onSnapshot(inventoryRef, (snapshot) => {
          const today = new Date();
          const items = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as InventoryItem))
            .map(item => {
              if (!item.expiry || item.expiry === 'N/A') return { ...item, daysLeft: Infinity };
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
          setExpiringItems(items);
          
          // Fetch spending data when inventory changes
          fetchSpendingData(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as InventoryItem));
        });

        setIsLoading(false);
        return () => unsubscribeInventory();
      } else {
        setIsLoading(false);
        setExpiringItems([]);
        setSpendingChartData([]);
        setWeeklyChartData([]);
        setUser(null);
      }
    });

    return () => unsubscribeAuth();
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
      setWeeklyChartData(weeklyData);
  }

  const fetchSpendingData = (inventoryItems: InventoryItem[]) => {
      const today = new Date();
      const spendingData: { day: string; spending: number }[] = [];
      let total = 0;
      
      for (let i = 6; i >= 0; i--) {
          const day = subDays(today, i);
          const dayString = format(day, "yyyy-MM-dd");
          
          const dailySpending = inventoryItems
              .filter(item => item.purchaseDate === dayString && item.price)
              .reduce((sum, item) => sum + (item.price || 0), 0);
          
          total += dailySpending;
          spendingData.push({ day: format(day, "E"), spending: dailySpending });
      }
      
      setSpendingChartData(spendingData);
      setWeeklyTotal(total);
  }


  const displayName = user?.displayName?.split(' ')[0] || user?.email || "User";

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {isLoading ? (
         <Skeleton className="h-9 w-48" />
      ) : (
        <PageHeader title={`Hello, ${displayName}!`} />
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 animate-fade-in-slide-up" style={{animationDelay: '0.1s'}}>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>A summary of your cooking and food waste habits for the past week, based on your activity.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || weeklyChartData.length === 0 ? (
                <div className="flex justify-center items-center h-[200px] text-muted-foreground">
                    <p>No activity recorded yet. Cook some meals or manage your inventory to see your progress!</p>
                </div>
            ) : (
                <ChartContainer config={weeklyChartConfig} className="min-h-[200px] w-full">
                <BarChart accessibilityLayer data={weeklyChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="meals" fill="var(--color-meals)" radius={4} />
                    <Bar dataKey="waste" fill="var(--color-waste)" radius={4} />
                </BarChart>
                </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col animate-fade-in-slide-up" style={{animationDelay: '0.2s'}}>
          <CardHeader>
            <CardTitle>Expiring Soon</CardTitle>
            <CardDescription>Use these items before they go bad!</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            {isLoading ? <Skeleton className="h-40 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Expires In</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringItems.length > 0 ? expiringItems.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
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
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No items expiring soon. Well done!</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/inventory">View Full Inventory <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.3s'}}>
          <CardHeader>
            <CardTitle className="flex items-center"><TrendingUp className="mr-2" /> Weekly Spending</CardTitle>
            <CardDescription>Here's a look at your grocery spending over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-28 w-full" /> : (
                <>
                    <div className="text-2xl font-bold text-primary">${weeklyTotal.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total for the last 7 days</p>
                    <div className="h-[120px] mt-4">
                      <ChartContainer config={spendingChartConfig} className="h-full w-full">
                        <LineChart accessibilityLayer data={spendingChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} hide />
                             <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent indicator="line" />}
                            />
                            <Line dataKey="spending" type="monotone" stroke="var(--color-spending)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ChartContainer>
                    </div>
                </>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between animate-fade-in-slide-up" style={{animationDelay: '0.4s'}}>
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
