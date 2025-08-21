
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaf, Award, Recycle, Lightbulb, TrendingUp } from "lucide-react";
import { Trophy, FirstBadge } from "@/components/icons";
import { auth, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { analyzeWastePatterns } from "@/ai/flows/analyze-waste-patterns";
import type { AnalyzeWastePatternsOutput } from "@/ai/schemas";

const badges = [
  { name: 'First Meal', description: 'Cooked your first recipe!', icon: FirstBadge },
  { name: 'Waste Warrior', description: 'Saved 10 items from expiring.', icon: Award },
  { name: 'Eco-Planner', description: 'Planned a full week of meals.', icon: Recycle },
  { name: 'Top Chef', description: 'Cooked 25 recipes.', icon: Trophy },
];

export default function SustainabilityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalMealsCooked, setTotalMealsCooked] = useState(0);
  const [totalWasteSaved, setTotalWasteSaved] = useState(0);
  const [wasteAnalysis, setWasteAnalysis] = useState<AnalyzeWastePatternsOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const activityQuery = query(collection(db, "users", currentUser.uid, "activity"), orderBy("timestamp", "desc"));
        
        const unsubscribeActivity = onSnapshot(activityQuery, (snapshot) => {
          let meals = 0;
          let wasted = 0;
          const wastedItemsForAnalysis: { itemName: string }[] = [];

          snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.type === 'mealCooked') {
              meals++;
            } else if (data.type === 'itemWasted') {
              wasted++;
              wastedItemsForAnalysis.push({ itemName: data.itemName });
            }
          });
          
          setTotalMealsCooked(meals);
          // For now, let's assume saved waste is the inverse of meals cooked. This can be improved.
          setTotalWasteSaved(meals);
          setIsLoading(false);

          if (wastedItemsForAnalysis.length > 0) {
            runWasteAnalysis(wastedItemsForAnalysis);
          } else {
            setIsAnalyzing(false);
          }
        });

        return () => unsubscribeActivity();
      } else {
        setIsLoading(false);
        setIsAnalyzing(false);
      }
    });

    return () => unsubscribe();
  }, []);
  
  const runWasteAnalysis = async (wasteHistory: { itemName: string }[]) => {
      setIsAnalyzing(true);
      try {
          const result = await analyzeWastePatterns({ wasteHistory });
          setWasteAnalysis(result);
      } catch (error) {
          console.error("Error analyzing waste patterns:", error);
      } finally {
          setIsAnalyzing(false);
      }
  }

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Lightbulb className="mr-2 text-primary"/> AI Waste Coach</CardTitle>
            <CardDescription>Personalized insights from your pantry habits to help you save more.</CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
                <div className="space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
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
