"use client";

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

const chartData = [
  { day: "Mon", meals: 2, waste: 0 },
  { day: "Tue", meals: 3, waste: 1 },
  { day: "Wed", meals: 2, waste: 0 },
  { day: "Thu", meals: 2, waste: 0 },
  { day: "Fri", meals: 3, waste: 0 },
  { day: "Sat", meals: 1, waste: 2 },
  { day: "Sun", meals: 2, waste: 0 },
];

const chartConfig = {
  meals: { label: "Meals Cooked", color: "hsl(var(--primary))" },
  waste: { label: "Items Wasted", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

const expiringItems = [
  { name: "Tomatoes", daysLeft: 1, status: "Urgent" as const },
  { name: "Chicken Breast", daysLeft: 2, status: "Urgent" as const },
  { name: "Milk", daysLeft: 3, status: "Soon" as const },
  { name: "Spinach", daysLeft: 4, status: "Soon" as const },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Hello, John!" />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>Your cooking and waste habits from the last week.</CardDescription>
          </CardHeader>
          <CardContent>
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
                {expiringItems.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.daysLeft} days</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Urgent' ? 'destructive' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
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
