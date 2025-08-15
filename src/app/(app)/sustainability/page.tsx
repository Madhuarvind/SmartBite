"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "@/components/ui/chart";
import { Leaf, Award, Recycle } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";
import { Trophy, FirstBadge } from "@/components/icons";

const sustainabilityData = [
  { week: '1', saved: 5 },
  { week: '2', saved: 7 },
  { week: '3', saved: 6 },
  { week: '4', saved: 10 },
  { week: '5', saved: 9 },
];

const chartConfig = {
  saved: {
    label: "Items Saved",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const badges = [
  { name: 'First Meal', description: 'Cooked your first recipe!', icon: FirstBadge },
  { name: 'Waste Warrior', description: 'Saved 10 items from expiring.', icon: Award },
  { name: 'Eco-Planner', description: 'Planned a full week of meals.', icon: Recycle },
  { name: 'Top Chef', description: 'Cooked 25 recipes.', icon: Trophy },
];

export default function SustainabilityPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Your Sustainability Impact" />
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Food Waste Saved</CardTitle>
            <Leaf className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">37 Items</div>
            <p className="text-xs text-muted-foreground">+5 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">14 Days</div>
            <p className="text-xs text-muted-foreground">Of logging at least one meal.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">4 Badges</div>
            <p className="text-xs text-muted-foreground">Keep up the great work!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Number of items saved from waste each week.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <AreaChart data={sustainabilityData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `W${value}`} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <defs>
                        <linearGradient id="fillSaved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-saved)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--color-saved)" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <Area dataKey="saved" type="natural" fill="url(#fillSaved)" stroke="var(--color-saved)" stackId="a" />
                </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Badge Collection</CardTitle>
            <CardDescription>Milestones you've achieved on your journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {badges.map(badge => (
                <div key={badge.name} className="flex flex-col items-center text-center gap-2">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                    <badge.icon className="w-10 h-10 text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm">{badge.name}</h4>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
