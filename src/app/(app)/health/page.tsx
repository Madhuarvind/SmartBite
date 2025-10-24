
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaf, Award, Recycle, Lightbulb, TrendingUp, Heart, BrainCircuit, AlertTriangle, Activity } from "lucide-react";
import { Trophy, FirstBadge } from "@/components/icons";
import { auth, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { collection, query, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { analyzeWastePatterns } from "@/ai/flows/analyze-waste-patterns";
import { analyzeHealthHabits } from "@/ai/flows/analyze-health-habits";
import { forecastWaste } from "@/ai/flows/forecast-waste";
import type { AnalyzeWastePatternsOutput, AnalyzeHealthHabitsOutput, ForecastWasteOutput, CookingHistoryItem } from "@/ai/schemas";
import type { InventoryItem } from "@/lib/types";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, LabelList, Cell } from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { format } from "date-fns";


const badges = [
  { name: 'First Meal', description: 'Cooked your first recipe!', icon: FirstBadge, key: 'meals_1' },
  { name: 'Compost Beginner', description: 'Composted 10 items.', icon: Recycle, key: 'composted_10' },
  { name: 'Eco-Planner', description: 'Planned a full week of meals.', icon: Recycle, key: 'planner_1' },
  { name: 'Top Chef', description: 'Cooked 25 recipes.', icon: Trophy, key: 'meals_25' },
];

const chartConfig = {
  percentage: {
    label: "Percentage",
  },
  'Fresh Produce': {
    label: "Fresh Produce",
    color: "hsl(var(--chart-1))",
  },
  'Protein': {
    label: "Protein",
    color: "hsl(var(--chart-2))",
  },
  'Dairy': {
    label: "Dairy",
    color: "hsl(var(--chart-3))",
  },
  'Grains': {
    label: "Grains",
    color: "hsl(var(--chart-4))",
  },
  'Snacks/Processed Foods': {
    label: "Snacks/Processed",
    color: "hsl(var(--chart-5))",
  },
   'Beverages': {
    label: "Beverages",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export default function HealthAndImpactPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalMealsCooked, setTotalMealsCooked] = useState(0);
  const [totalItemsComposted, setTotalItemsComposted] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  
  const [wasteAnalysis, setWasteAnalysis] = useState<AnalyzeWastePatternsOutput | null>(null);
  const [isAnalyzingWaste, setIsAnalyzingWaste] = useState(true);

  const [healthAnalysis, setHealthAnalysis] = useState<AnalyzeHealthHabitsOutput | null>(null);
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(true);
  
  const [wasteForecast, setWasteForecast] = useState<ForecastWasteOutput | null>(null);
  const [isForecasting, setIsForecasting] = useState(true);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setupListeners(currentUser.uid);
      } else {
        setIsLoading(false);
        setIsAnalyzingWaste(false);
        setIsAnalyzingHealth(false);
        setIsForecasting(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const setupListeners = async (userId: string) => {
    // One-time fetch for full inventory for health analysis and forecast
    const inventoryQuery = query(collection(db, "users", userId, "inventory"));
    const inventorySnapshot = await getDocs(inventoryQuery);
    const purchaseHistory = inventorySnapshot.docs.map(doc => doc.data() as InventoryItem);

    if (purchaseHistory.length > 0) {
        runHealthAnalysis(purchaseHistory);
    } else {
        setIsAnalyzingHealth(false);
    }

    // Listener for activity log (waste, meals) to derive history for analysis
    const activityQuery = query(collection(db, "users", userId, "activity"), orderBy("timestamp", "desc"));
    onSnapshot(activityQuery, (snapshot) => {
      let meals = 0;
      let composted = 0;
      const wastedItemsForAnalysis: { itemName: string }[] = [];
      const cookingHistoryForForecast: CookingHistoryItem[] = [];
      const newUnlockedBadges: string[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.type === 'mealCooked') {
            meals++;
            if (data.recipeName && data.timestamp) {
              cookingHistoryForForecast.push({ recipeName: data.recipeName, date: format(data.timestamp.toDate(), 'yyyy-MM-dd') });
            }
        }
        else if (data.type === 'itemWasted') {
          composted++;
          wastedItemsForAnalysis.push({ itemName: data.itemName });
        }
      });
      
      setTotalMealsCooked(meals);
      setTotalItemsComposted(composted);

      // Badge logic
      if (meals >= 1) newUnlockedBadges.push('meals_1');
      if (meals >= 25) newUnlockedBadges.push('meals_25');
      if (composted >= 10) newUnlockedBadges.push('composted_10');
      // In a real app, planner badges would be unlocked from the planner page
      // For demo purposes, we can unlock it here if they've cooked a few meals
      if (meals > 5) newUnlockedBadges.push('planner_1');
      setUnlockedBadges(newUnlockedBadges);


      if (wastedItemsForAnalysis.length > 0) {
        runWasteAnalysis(wastedItemsForAnalysis);
      } else {
        setIsAnalyzingWaste(false);
      }
      
      // Run forecast with the latest data
      if (purchaseHistory.length > 0) {
        runWasteForecast(purchaseHistory, cookingHistoryForForecast);
      } else {
        setIsForecasting(false);
      }
    });

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
          const purchaseDataForAnalysis = purchaseHistory
            .filter(item => item.price && item.price > 0)
            .map(item => ({
              name: item.name,
              price: item.price
          }));
          
          if (purchaseDataForAnalysis.length === 0) {
              setHealthAnalysis(null);
              setIsAnalyzingHealth(false);
              return;
          }

          const result = await analyzeHealthHabits({ purchaseHistory: purchaseDataForAnalysis });
          setHealthAnalysis(result);
      } catch (error) {
          console.error("Error analyzing health habits:", error);
      } finally {
          setIsAnalyzingHealth(false);
      }
  }
  
  const runWasteForecast = async (inventory: InventoryItem[], cookingHistory: CookingHistoryItem[]) => {
    setIsForecasting(true);
    try {
        const inventoryForForecast = inventory.map(item => ({
            name: item.name,
            quantity: item.quantity,
            expiry: item.expiry,
        }));
        const result = await forecastWaste({ inventory: inventoryForForecast, cookingHistory });
        setWasteForecast(result);
    } catch(e) {
        console.error("Error forecasting waste:", e);
    } finally {
        setIsForecasting(false);
    }
  }


  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Your Health & Impact" />
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items Composted</CardTitle>
            <Recycle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-primary">{totalItemsComposted} Items</div>}
            <p className="text-xs text-muted-foreground">Based on expired items from your pantry.</p>
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
             {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-primary">{unlockedBadges.length} / {badges.length}</div>}
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
                <div className="space-y-4 p-4"><Skeleton className="h-48 w-full" /></div>
            ) : healthAnalysis ? (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg mb-2">Spending Breakdown</h4>
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                           <BarChart accessibilityLayer data={healthAnalysis.spendingBreakdown} layout="vertical" margin={{left: 20}}>
                              <YAxis
                                dataKey="category"
                                type="category"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                width={110}
                                className="text-xs"
                                tickFormatter={(value) =>
                                  chartConfig[value as keyof typeof chartConfig]?.label
                                }
                              />
                              <XAxis dataKey="percentage" type="number" hide />
                              <Bar dataKey="percentage" layout="vertical" radius={5}>
                                 {healthAnalysis.spendingBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartConfig[entry.category as keyof typeof chartConfig]?.color} />
                                 ))}
                                <LabelList
                                  dataKey="percentage"
                                  position="right"
                                  offset={8}
                                  className="fill-foreground font-semibold"
                                  fontSize={12}
                                  formatter={(value: number) => `${value.toFixed(0)}%`}
                                />
                              </Bar>
                           </BarChart>
                        </ChartContainer>
                    </div>
                    <div>
                        <h4 className="font-semibold text-lg flex items-center mb-2"><Heart className="w-5 h-5 mr-2" />Key Health Insight</h4>
                        <blockquote className="border-l-2 pl-6 italic text-muted-foreground">"{healthAnalysis.keyInsight}"</blockquote>
                    </div>
                     <div>
                        <h4 className="font-semibold text-lg flex items-center mb-2"><Lightbulb className="w-5 h-5 mr-2" />Smart Suggestions</h4>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-2 mt-2">
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

        <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Activity className="mr-2 text-primary"/> AI Waste Forecast</CardTitle>
                <CardDescription>A predictive look at what might go to waste this week, and how to prevent it.</CardDescription>
              </CardHeader>
              <CardContent>
                {isForecasting ? (
                    <div className="space-y-4 p-4"><Skeleton className="h-32 w-full" /></div>
                ) : wasteForecast && wasteForecast.predictedWaste.length > 0 ? (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold flex items-center mb-2"><AlertTriangle className="w-5 h-5 mr-2 text-destructive"/>At-Risk Items</h4>
                            <div className="flex flex-wrap gap-2">
                                {wasteForecast.predictedWaste.map((item, index) => (
                                    <span key={index} className="px-3 py-1 bg-destructive/10 text-destructive-foreground border border-destructive/20 rounded-full text-sm">{item}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg flex items-center mb-2"><Lightbulb className="w-5 h-5 mr-2"/>Waste Prevention Tips</h4>
                            <ul className="list-disc pl-5 text-muted-foreground space-y-2 mt-2 text-sm">
                               {wasteForecast.preventativeSuggestions.map((suggestion, index) => (
                                   <li key={index}>
                                      <span className="font-semibold text-foreground">{suggestion.item}:</span> {suggestion.suggestion}
                                   </li>
                               ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No potential waste detected. Your inventory looks great!</p>
                    </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Recycle className="mr-2 text-primary"/> AI Waste Coach</CardTitle>
                <CardDescription>Personalized insights from your past habits to help you save more.</CardDescription>
              </CardHeader>
              <CardContent>
                {isAnalyzingWaste ? (
                    <div className="space-y-4 p-4"><Skeleton className="h-32 w-full" /></div>
                ) : wasteAnalysis ? (
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-lg flex items-center"><TrendingUp className="mr-2"/> Most Wasted Item</h4>
                            <p className="text-primary font-bold text-2xl">{wasteAnalysis.mostWastedItem}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg">Key Insight</h4>
                            <blockquote className="border-l-2 pl-6 italic text-muted-foreground">"{wasteAnalysis.keyInsight}"</blockquote>
                        </div>
                         <div>
                            <h4 className="font-semibold text-lg flex items-center"><Lightbulb className="mr-2"/>Smart Suggestions</h4>
                            <ul className="list-disc pl-5 text-muted-foreground space-y-2 mt-2">
                               {wasteAnalysis.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No wasted items have been logged yet. Your analysis will appear here.</p>
                    </div>
                )}
              </CardContent>
            </Card>
        </div>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Badge Collection</CardTitle>
            <CardDescription>Milestones you've achieved on your journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map(badge => (
                <div key={badge.name} className={`flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-secondary/50 transition-opacity ${unlockedBadges.includes(badge.key) ? 'opacity-100' : 'opacity-30'}`}>
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
