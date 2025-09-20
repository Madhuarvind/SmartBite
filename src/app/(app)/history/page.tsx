
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RecipeHistoryItem } from "@/lib/types";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import type { User } from "firebase/auth";
import { format } from "date-fns";

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [recipeHistory, setRecipeHistory] = useState<RecipeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoading(true);
        const historyQuery = query(collection(db, "users", currentUser.uid, "recipeHistory"), orderBy("cookedAt", "desc"));
        const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
          const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RecipeHistoryItem[];
          setRecipeHistory(history);
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching recipe history:", error);
          toast({ variant: "destructive", title: "Could not fetch history."});
          setIsLoading(false);
        });
        return () => unsubscribeHistory();
      } else {
        setUser(null);
        setRecipeHistory([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [toast]);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="Your Recipe History" />
      
      <Card>
        <CardHeader>
          <CardTitle>My Digital Cookbook</CardTitle>
          <CardDescription>
            A history of all the delicious meals you've cooked using SmartBite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden flex flex-col">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4 flex-grow">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
            {!isLoading && recipeHistory.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-16">
                <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50"/>
                <h3 className="text-xl font-semibold">No Recipes Cooked Yet</h3>
                <p>When you cook a recipe, it will appear here in your personal cookbook.</p>
              </div>
            )}
            {!isLoading && recipeHistory.map((recipe, index) => (
              <Card key={`${recipe.id}-${index}`} className="overflow-hidden flex flex-col bg-card hover:bg-secondary/50 transition-colors duration-300">
                <CardHeader className="p-0">
                  <div className="relative aspect-video">
                    {recipe.coverImage?.imageDataUri ? (
                      <Image src={recipe.coverImage.imageDataUri} alt={recipe.name} layout="fill" objectFit="cover" className="bg-secondary"/>
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <ChefHat className="w-16 h-16 text-muted-foreground/50"/>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <CardTitle className="text-lg mb-1">{recipe.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cooked on {format(new Date(recipe.cookedAt.seconds * 1000), 'PPP')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
