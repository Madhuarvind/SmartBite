
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, Lightbulb, TrendingUp, BrainCircuit, Wallet } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { collection, query, getDocs } from "firebase/firestore";
import { analyzeUserSpending } from "@/ai/flows/analyze-user-spending";
import type { AnalyzeUserSpendingOutput } from "@/ai/schemas";
import type { InventoryItem } from "@/lib/types";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, LabelList, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

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
  'Other': {
    label: "Other",
    color: "hsl(var(--muted-foreground))",
  }
} satisfies ChartConfig;


export default function FinancialAdvisorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalyzeUserSpendingOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [purchaseHistory, setPurchaseHistory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchDataAndAnalyze(currentUser.uid);
      } else {
        setIsLoading(false);
        setIsAnalyzing(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchDataAndAnalyze = async (userId: string) => {
    setIsLoading(true);
    setIsAnalyzing(true);
    
    const inventoryQuery = query(collection(db, "users", userId, "inventory"));
    const inventorySnapshot = await getDocs(inventoryQuery);
    const history = inventorySnapshot.docs.map(doc => doc.data() as InventoryItem);
    setPurchaseHistory(history);

    if (history.length > 0) {
        runAnalysis(history);
    } else {
        setIsAnalyzing(false);
    }

    setIsLoading(false);
  }
  
  const runAnalysis = async (history: InventoryItem[]) => {
      setIsAnalyzing(true);
      try {
          const purchaseDataForAnalysis = history
            .filter(item => item.price && item.price > 0)
            .map(item => ({
              name: item.name,
              price: item.price
          }));
          
          if (purchaseDataForAnalysis.length === 0) {
              setAnalysis(null);
              setIsAnalyzing(false);
              return;
          }

          const result = await analyzeUserSpending({ purchaseHistory: purchaseDataForAnalysis });
          setAnalysis(result);
      } catch (error) {
          console.error("Error analyzing spending patterns:", error);
      } finally {
          setIsAnalyzing(false);
      }
  }


  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="Pantry Financial Advisor" />
      
       <Card className="animate-fade-in-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center"><BrainCircuit className="mr-2 text-primary"/> AI Spending Analysis</CardTitle>
            <CardDescription>
                Personalized financial insights from your shopping habits. Our AI analyzes your grocery receipts to help you save money.
                 {!isLoading && user && (
                    <Button variant="link" className="p-0 h-auto ml-1" onClick={() => fetchDataAndAnalyze(user.uid)}>Refresh analysis.</Button>
                 )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
                <div className="space-y-4 p-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : analysis ? (
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h4 className="font-semibold text-lg mb-2">Spending Breakdown</h4>
                             <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                               <BarChart accessibilityLayer data={analysis.spendingBreakdown} layout="vertical" margin={{left: 20}}>
                                  <YAxis
                                    dataKey="category"
                                    type="category"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    width={150}
                                    className="text-sm"
                                    tick={{ dy: 10 }}
                                    tickFormatter={(value) =>
                                      chartConfig[value as keyof typeof chartConfig]?.label
                                    }
                                  />
                                  <XAxis dataKey="percentage" type="number" hide />
                                  <Bar dataKey="percentage" layout="vertical" radius={5}>
                                     {analysis.spendingBreakdown.map((entry) => (
                                        <Cell key={entry.category} fill={chartConfig[entry.category as keyof typeof chartConfig]?.color || 'hsl(var(--muted-foreground))'} />
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
                            <h4 className="font-semibold text-lg flex items-center mb-2"><TrendingUp className="w-5 h-5 mr-2"/>Key Spending Insight</h4>
                            <blockquote className="border-l-2 pl-6 italic text-muted-foreground">"{analysis.keyInsight}"</blockquote>
                        </div>
                    </div>
                    <div className="space-y-4">
                         <Card className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg"><Lightbulb className="w-5 h-5 mr-2 text-yellow-400"/>Smart Budget Suggestions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-5 text-muted-foreground space-y-2 mt-2">
                                {analysis.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                         <Card className="bg-secondary/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg"><Wallet className="w-5 h-5 mr-2"/>Total Analyzed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-primary">
                                    ₹{
                                      purchaseHistory
                                        .reduce((acc, item) => acc + (item.price || 0), 0)
                                        .toFixed(2)
                                    }
                                </p>
                                <p className="text-sm text-muted-foreground">Based on all scanned receipts with prices.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <Banknote className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50"/>
                    <h3 className="text-xl font-semibold">No Spending Data Found</h3>
                    <p>Scan some receipts with prices using the Bill Scanner to get your personalized financial analysis.</p>
                </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
