
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowRight,
  ChevronRight,
  CircleDotDashed,
  CookingPot,
  Lightbulb,
  Recycle,
  ShoppingBasket,
  Trash2,
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { collection, query, onSnapshot, where, getDocs, Timestamp } from 'firebase/firestore';
import type { ActivityLog } from '@/lib/types';
import { getCircularKitchenSuggestions } from '@/ai/flows/get-circular-kitchen-suggestions';
import type { GetCircularKitchenSuggestionsOutput } from '@/ai/schemas';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

type FlowData = {
  name: string;
  value: number;
};

export default function CircularKitchenPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] =
    useState<GetCircularKitchenSuggestionsOutput['suggestions']>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);

  // State for flow chart data
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [usedCount, setUsedCount] = useState(0);
  const [wastedCount, setWastedCount] = useState(0);
  const [compostedCount, setCompostedCount] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchData(currentUser.uid);
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    setIsSuggestionsLoading(true);

    const activityQuery = query(collection(db, 'users', userId, 'activity'));
    const inventoryQuery = query(collection(db, 'users', userId, 'inventory'));

    const [activitySnap, inventorySnap] = await Promise.all([
      getDocs(activityQuery),
      getDocs(inventoryQuery)
    ]);

    let used = 0;
    let wasted = 0;
    let composted = 0;
    const wastedForSuggestions: { name: string }[] = [];

    activitySnap.docs.forEach((doc) => {
      const data = doc.data() as ActivityLog;
      if (data.type === 'mealCooked') {
        used++;
      } else if (data.type === 'itemWasted') {
        wasted++;
        wastedForSuggestions.push({ name: data.itemName });
        if (data.isCompostable === true) {
            composted++;
        }
      }
    });
    
    setPurchasedCount(inventorySnap.size + used + wasted);
    setUsedCount(used);
    setWastedCount(wasted);
    setCompostedCount(composted);


    if (wastedForSuggestions.length > 0) {
      try {
        const aiSuggestions = await getCircularKitchenSuggestions({
          wastedItems: wastedForSuggestions.slice(0, 10), // Limit to last 10 wasted items
        });
        setSuggestions(aiSuggestions.suggestions);
      } catch (error) {
        console.error('Error fetching circular kitchen suggestions:', error);
      }
    }

    setIsLoading(false);
    setIsSuggestionsLoading(false);
  };
  
  const landfillCount = wastedCount - compostedCount;

  const flowData: FlowData[] = [
    { name: 'Purchased', value: purchasedCount },
    { name: 'In Pantry', value: purchasedCount - usedCount - wastedCount },
    { name: 'Used in Meals', value: usedCount },
    { name: 'Waste Stream', value: wastedCount },
  ];

  const wasteData: FlowData[] = [
    { name: 'Composted', value: compostedCount },
    { name: 'Landfill', value: landfillCount },
  ]

  const stageIcons: { [key: string]: JSX.Element } = {
    Purchased: <ShoppingBasket className="w-5 h-5" />,
    'In Pantry': <CircleDotDashed className="w-5 h-5" />,
    'Used in Meals': <CookingPot className="w-5 h-5" />,
    'Waste Stream': <Trash2 className="w-5 h-5" />,
  };

  const renderCustomAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill="#888888"
          transform="rotate(-35)"
          className="text-xs"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="Circular Kitchen Simulator" />

      <Card className="animate-fade-in-slide-up">
        <CardHeader>
          <CardTitle>Your Kitchen's Lifecycle</CardTitle>
          <CardDescription>
            Visualize how ingredients flow through your kitchen, from purchase
            to plate to disposal. The goal is to maximize what you use and
            minimize what goes to landfill, creating a more sustainable,
            circular system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-80" />
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 items-end gap-4 text-center">
                  {flowData.map((stage, index) => (
                    <div key={stage.name} className="flex flex-col items-center gap-2">
                        <div className="text-primary">{stageIcons[stage.name]}</div>
                        <p className="font-semibold text-sm">{stage.name}</p>
                        <p className="text-3xl font-bold">{stage.value}</p>
                    </div>
                  ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                      <h3 className="font-semibold text-lg mb-2">The Waste Stream</h3>
                      <p className="text-sm text-muted-foreground mb-4">This shows where your discarded items ended up. The goal is to have the compost bar be much larger than the landfill bar.</p>
                       <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={wasteData} layout="vertical" margin={{ left: 10, right: 40}}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} />
                          <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{backgroundColor: 'hsl(var(--background))'}}/>
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                             <LabelList dataKey="value" position="right" className="fill-foreground font-semibold" />
                             {wasteData.map((entry, index) => (
                                <cell key={`cell-${index}`} fill={entry.name === 'Composted' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                             ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                  </div>
                  <div>
                     <Card className="bg-secondary/50">
                        <CardHeader>
                           <CardTitle className="flex items-center text-base"><Recycle className="mr-2"/> Your Circularity Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {purchasedCount > 0 ? (
                                <>
                                 <p className="text-4xl font-bold text-primary">
                                    {((usedCount / purchasedCount) * 100).toFixed(0)}%
                                </p>
                                <p className="text-sm text-muted-foreground">You are using {((usedCount / purchasedCount) * 100).toFixed(0)}% of the food you buy. Great job!</p>
                                </>
                            ) : (
                                <p className="text-muted-foreground">Start using the app to calculate your score.</p>
                            )}
                        </CardContent>
                     </Card>
                  </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="animate-fade-in-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-6 h-6 mr-2 text-primary" />
            AI Suggestions: Close the Loop
          </CardTitle>
          <CardDescription>
            Here are some AI-powered ideas for reusing common food scraps,
            turning waste into value.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuggestionsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <Alert key={index}>
                  <Recycle className="h-4 w-4" />
                  <AlertTitle className="flex items-center">
                    {suggestion.from} <ArrowRight className="mx-2 h-4 w-4" />{' '}
                    {suggestion.to}
                  </AlertTitle>
                  <AlertDescription>{suggestion.suggestion}</AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>No reuse suggestions available right now.</p>
              <p className="text-sm">
                As you log more wasted items, the AI will learn and provide tips here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
