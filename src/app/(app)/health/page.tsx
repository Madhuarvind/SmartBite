
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaf, Award, Recycle, Lightbulb, TrendingUp, Heart, BrainCircuit } from "lucide-react";
import { Trophy, FirstBadge } from "@/components/icons";
import { auth, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { collection, query, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { analyzeWastePatterns } from "@/ai/flows/analyze-waste-patterns";
import { analyzeHealthHabits } from "@/ai/flows/analyze-health-habits";
import type { AnalyzeWastePatternsOutput, AnalyzeHealthHabitsOutput } from "@/ai/schemas";
import type { InventoryItem } from "@/lib/types";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

const badges = [
  { name: 'First Meal', description: 'Cooked your first recipe!', icon: FirstBadge },
  { name: 'Waste Warrior', description: 'Saved 10 items from expiring.', icon: Award },
  { name: 'Eco-Planner', description: 'Planned a full week of meals.', icon: Recycle },
  { name: 'Top Chef', description: 'Cooked 25 recipes.', icon: Trophy },
];

export default function HealthAndImpactPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalMealsCooked, setTotalMealsCooked] = useState(0);
  const [totalWasteSaved, setTotalWasteSaved] = useState(0);
  
  const [wasteAnalysis, setWasteAnalysis] = useState<AnalyzeWastePatternsOutput | null>(null);
  const [isAnalyzingWaste, setIsAnalyzingWaste] = useState(true);

  const [healthAnalysis, setHealthAnalysis] = useState<AnalyzeHealthHabitsOutput | null>(null);
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setupListeners(currentUser.uid);
      } else {
        setIsLoading(false);
        setIsAnalyzingWaste(false);
        setIsAnalyzingHealth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const setupListeners = async (userId: string) => {
    // Listener for activity log (waste, meals)
    const activityQuery = query(collection(db, "users", userId, "activity"), orderBy("timestamp", "desc"));
    onSnapshot(activityQuery, (snapshot) => {
      let meals = 0;
      let wasted = 0;
      const wastedItemsForAnalysis: { itemName: string }[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.type === 'mealCooked') meals++;
        else if (data.type === 'itemWasted') {
          wasted++;
          wastedItemsForAnalysis.push({ itemName: data.itemName });
        }
      });
      
      setTotalMealsCooked(meals);
      setTotalWasteSaved(meals); // Placeholder logic

      if (wastedItemsForAnalysis.length > 0) {
        runWasteAnalysis(wastedItemsForAnalysis);
      } else {
        setIsAnalyzingWaste(false);
      }
    });

    // One-time fetch for purchase history for health analysis
    const inventoryQuery = query(collection(db, "users", userId, "inventory"));
    const inventorySnapshot = await getDocs(inventoryQuery);
    const purchaseHistory = inventorySnapshot.docs.map(doc => doc.data() as InventoryItem);

    if (purchaseHistory.length > 0) {
        runHealthAnalysis(purchaseHistory);
    } else {
        setIsAnalyzingHealth(false);
    }

    setIsLoading(false);
  }
  
  const runWasteAnalysis = async (wasteHistory: { itemName: string }[]) => {
      setIsAnalyzingWaste(true);
      try {
          const result = await analyzeWastePatterns({ wasteHistory });
          setWasteAnalysis(result);
      } catch (error) {
          console.error("Error analyzing waste patterns:", error);
      } finally {
          setIsAnalyzingWaste(false);
      }
  }

  const runHealthAnalysis = async (purchaseHistory: InventoryItem[]) => {
      setIsAnalyzingHealth(true);
      try {
          const purchaseDataForAnalysis = purchaseHistory.map(item => ({
              name: item.name,
              price: item.price
          }));
          const result = await analyzeHealthHabits({ purchaseHistory: purchaseDataForAnalysis });
          setHealthAnalysis(result);
      } catch (error) {
          console.error("Error analyzing health habits:", error);
      } finally {
          setIsAnalyzingHealth(false);
      }
  }


  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Your Health & Impact" />
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Food Waste Saved</CardTitle>
            <Leaf className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-primary">{totalWasteSaved} Items</div>}
            <p className="text-xs text-muted-foreground">Based on meals cooked vs expired items.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Meals Cooked</CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-primary">{totalMealsCooked} Meals</div>}
            <p className="text-xs text-muted-foreground">You're making a difference!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-primary">1 Badge</div>}
            <p className="text-xs text-muted-foreground">Keep up the great work!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BrainCircuit className="mr-2 text-primary"/> AI Health Coach</CardTitle>
            <CardDescription>Personalized health insights from your shopping habits.</CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzingHealth ? (
                <div className="space-y-4 p-4"><Skeleton className="h-40 w-full" /></div>
            ) : healthAnalysis ? (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Spending Breakdown</h4>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={healthAnalysis.spendingBreakdown} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="category" hide />
                                <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                         <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            {healthAnalysis.spendingBreakdown.map(item => (
                                <div key={item.category} className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                    <span>{item.category} ({item.percentage.toFixed(0)}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold">Key Insight</h4>
                        <p className="text-muted-foreground italic">"{healthAnalysis.keyInsight}"</p>
                    </div>
                     <div>
                        <h4 className="font-semibold">Smart Suggestions</h4>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                           {healthAnalysis.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>No purchase history found. Scan some receipts to get your personalized health analysis.</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Lightbulb className="mr-2 text-primary"/> AI Waste Coach</CardTitle>
            <CardDescription>Personalized insights from your pantry habits to help you save more.</CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzingWaste ? (
                <div className="space-y-4"><Skeleton className="h-40 w-full" /></div>
            ) : wasteAnalysis ? (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold flex items-center"><TrendingUp className="mr-2"/> Most Wasted Item</h4>
                        <p className="text-primary font-bold text-lg">{wasteAnalysis.mostWastedItem}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Key Insight</h4>
                        <p className="text-muted-foreground italic">"{wasteAnalysis.keyInsight}"</p>
                    </div>
                     <div>
                        <h4 className="font-semibold">Smart Suggestions</h4>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                           {wasteAnalysis.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p>No wasted items have been logged yet. Your personalized analysis will appear here once you start tracking your pantry.</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Badge Collection</CardTitle>
            <CardDescription>Milestones you've achieved on your journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map(badge => (
                <div key={badge.name} className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-secondary/50">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center border">
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
