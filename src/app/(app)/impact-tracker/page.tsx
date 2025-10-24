
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingDown, ReceiptText, ChefHat, Sparkles } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { collection, query, onSnapshot, orderBy, Timestamp, where, getDocs } from "firebase/firestore";
import type { InventoryItem, ScannedBill } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subDays, startOfMonth, endOfMonth, getYear, getMonth, parseISO } from "date-fns";
import Image from "next/image";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

const spendingChartConfig = {
  amount: { label: "Amount", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const carbonChartConfig = {
  debt: { label: "Carbon Debt", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

type Period = 'last7' | 'last30' | 'last90' | 'month' | 'year';

export default function ImpactTrackerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseHistory, setPurchaseHistory] = useState<InventoryItem[]>([]);
  const [scannedBills, setScannedBills] = useState<ScannedBill[]>([]);
  const [activityHistory, setActivityHistory] = useState<any[]>([]);
  
  // Filter states
  const [period, setPeriod] = useState<Period>('last30');
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));

  // State for image viewer
  const [selectedReceipt, setSelectedReceipt] = useState<ScannedBill | null>(null);

  const uniqueYears = useMemo(() => {
    const years = new Set(purchaseHistory.map(item => getYear(parseISO(item.purchaseDate!))));
    return Array.from(years).sort((a, b) => b - a);
  }, [purchaseHistory]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), 'MMMM'),
  })), []);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const invQuery = query(collection(db, "users", currentUser.uid, "inventory"), orderBy("purchaseDate", "desc"));
        const unsubscribeInv = onSnapshot(invQuery, (snapshot) => {
          const history = snapshot.docs
            .map(doc => doc.data() as InventoryItem)
            .filter(item => item.purchaseDate && item.price && item.price > 0);
          setPurchaseHistory(history);
        });
        
        const billsQuery = query(collection(db, "users", currentUser.uid, "scanned_bills"), orderBy("scannedAt", "desc"));
        const unsubscribeBills = onSnapshot(billsQuery, (snapshot) => {
            const bills = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as ScannedBill);
            setScannedBills(bills);
        });
        
        const activityQuery = query(collection(db, "users", currentUser.uid, "activity"), orderBy("timestamp", "desc"));
        const unsubscribeActivity = onSnapshot(activityQuery, (snapshot) => {
            const activities = snapshot.docs.map(doc => doc.data());
            setActivityHistory(activities);
        });

        setIsLoading(false);
        return () => {
            unsubscribeInv();
            unsubscribeBills();
            unsubscribeActivity();
        };
      } else {
        setIsLoading(false);
        setPurchaseHistory([]);
        setScannedBills([]);
        setActivityHistory([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const { filteredData, spendingChartData, totalSpent, carbonChartData, totalCarbonDebt, totalMealsCooked, debtRepaid } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch(period) {
      case 'last7': startDate = subDays(now, 6); break;
      case 'last30': startDate = subDays(now, 29); break;
      case 'last90': startDate = subDays(now, 89); break;
      case 'month':
        startDate = startOfMonth(new Date(selectedYear, selectedMonth));
        endDate = endOfMonth(new Date(selectedYear, selectedMonth));
        break;
      case 'year':
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31);
        break;
    }

    const filtered = purchaseHistory.filter(item => {
      const itemDate = parseISO(item.purchaseDate!);
      return itemDate >= startDate && itemDate <= endDate;
    });

    const dailySpending = new Map<string, number>();
    filtered.forEach(item => {
      const day = format(parseISO(item.purchaseDate!), 'MMM d');
      dailySpending.set(day, (dailySpending.get(day) || 0) + (item.price || 0));
    });
    
    const spendingChart = Array.from(dailySpending.entries()).map(([date, amount]) => ({ date, amount })).reverse();
    const total = filtered.reduce((acc, item) => acc + (item.price || 0), 0);
    
    // Carbon Debt Calculation
    let cumulativeDebt = 0;
    const debtMap = new Map<string, number>();
    const filteredActivity = activityHistory.filter(act => {
        const actDate = act.timestamp.toDate();
        return actDate >= startDate && actDate <= endDate;
    });

    let totalMeals = 0;
    let totalDebtIncurred = 0;
    let totalDebtRepaid = 0;

    // Sort activities chronologically to calculate cumulative debt correctly
    const sortedActivities = filteredActivity.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
    
    sortedActivities.forEach(act => {
        const day = format(act.timestamp.toDate(), 'MMM d');
        if (act.type === 'carbonIncurred') {
            cumulativeDebt += act.amount;
            totalDebtIncurred += act.amount;
        } else if (act.type === 'mealCooked') {
            cumulativeDebt -= 0.5; // Repay 0.5kg for a meal
            totalMeals++;
            totalDebtRepaid += 0.5;
        }
        debtMap.set(day, Math.max(0, cumulativeDebt));
    });

    const carbonChart = Array.from(debtMap.entries()).map(([date, debt]) => ({ date, debt })).reverse();

    return { 
        filteredData: filtered, 
        spendingChartData: spendingChart, 
        totalSpent: total,
        carbonChartData: carbonChart,
        totalCarbonDebt: Math.max(0, cumulativeDebt),
        totalMealsCooked: totalMeals,
        debtRepaid: totalDebtRepaid,
    };
  }, [period, selectedYear, selectedMonth, purchaseHistory, activityHistory]);


  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="Impact Tracker" />

      <Card>
        <CardHeader>
          <CardTitle>Your Sustainability Dashboard</CardTitle>
          <CardDescription>Analyze your spending and carbon footprint. See how your actions make a difference.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Select onValueChange={(value) => setPeriod(value as Period)} value={period}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
                <SelectItem value="month">By Month</SelectItem>
                <SelectItem value="year">By Year</SelectItem>
              </SelectContent>
            </Select>

            {period === 'month' && (
              <div className="flex gap-2">
                <Select onValueChange={(value) => setSelectedMonth(parseInt(value))} value={selectedMonth.toString()}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Select month" /></SelectTrigger>
                  <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
                 <Select onValueChange={(value) => setSelectedYear(parseInt(value))} value={selectedYear.toString()}>
                  <SelectTrigger className="w-[100px]"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{uniqueYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            
            {period === 'year' && (
              <Select onValueChange={(value) => setSelectedYear(parseInt(value))} value={selectedYear.toString()}>
                  <SelectTrigger className="w-[120px]"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{uniqueYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-secondary/50">
                <CardHeader>
                    <CardTitle className="flex items-center text-lg"><Wallet className="mr-2"/>Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-4xl font-bold text-primary">₹{totalSpent.toFixed(2)}</p>}
                </CardContent>
            </Card>
             <Card className="bg-secondary/50">
                <CardHeader>
                    <CardTitle className="flex items-center text-lg"><TrendingDown className="mr-2"/>Carbon Debt</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-4xl font-bold text-destructive">{totalCarbonDebt.toFixed(2)} <span className="text-lg">kg CO₂e</span></p>}
                </CardContent>
            </Card>
             <Card className="bg-secondary/50">
                <CardHeader>
                    <CardTitle className="flex items-center text-lg"><ChefHat className="mr-2"/>Debt Repaid</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-4xl font-bold text-green-500">{debtRepaid.toFixed(2)} <span className="text-lg">kg CO₂e</span></p>}
                     <p className="text-xs text-muted-foreground">by cooking {totalMealsCooked} meals at home!</p>
                </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Daily Spending</CardTitle>
                    <CardDescription>Breakdown of your spending per day for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-48 w-full" /> : spendingChartData.length > 0 ? (
                     <ChartContainer config={spendingChartConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={spendingChartData}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 6)} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                        </BarChart>
                      </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground"><p>No spending data for this period.</p></div>
                  )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Carbon Debt Over Time</CardTitle>
                    <CardDescription>How your carbon debt has changed. Cooking meals helps reduce it!</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-48 w-full" /> : carbonChartData.length > 0 ? (
                     <ChartContainer config={carbonChartConfig} className="min-h-[200px] w-full">
                        <LineChart accessibilityLayer data={carbonChartData}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 6)} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="debt" stroke="var(--color-debt)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground"><p>No carbon data for this period.</p></div>
                  )}
                </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Transactions</h3>
            <Card>
              <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Purchase Date</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? Array.from({length: 5}).map((_, i) => (
                           <TableRow key={i}>
                             <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                             <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                             <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto"/></TableCell>
                           </TableRow>
                      )) : filteredData.length > 0 ? (
                        filteredData.map((item, index) => (
                          <TableRow key={`${item.id}-${index}`}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.purchaseDate ? format(parseISO(item.purchaseDate), 'PPP') : 'N/A'}</TableCell>
                            <TableCell className="text-right">₹{item.price?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No transactions in this period.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </div>

           <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ReceiptText className="mr-2" /> Scanned Receipts Gallery
                </h3>
                <Card>
                    <CardContent className="p-4">
                        {isLoading ? (
                            <div className="flex gap-4"><Skeleton className="h-40 w-32" /><Skeleton className="h-40 w-32" /></div>
                        ) : scannedBills.length > 0 ? (
                            <ScrollArea className="no-scrollbar">
                                <div className="flex space-x-4 pb-4">
                                    {scannedBills.map((bill) => (
                                        bill.receiptImage && (
                                            <Dialog key={bill.id}>
                                              <DialogTrigger asChild>
                                                <div className="w-40 flex-shrink-0 cursor-pointer">
                                                    <Image
                                                        src={bill.receiptImage}
                                                        alt={`Receipt ${bill.billNo}`}
                                                        width={160}
                                                        height={240}
                                                        className="rounded-md object-contain border"
                                                    />
                                                     <div className="text-xs text-center mt-1 text-muted-foreground">
                                                        <p>Bill: {bill.billNo}</p>
                                                        <p>Amount: ₹{bill.totalAmount.toFixed(2)}</p>
                                                        <p>{format(bill.scannedAt.toDate(), 'PPP')}</p>
                                                     </div>
                                                </div>
                                              </DialogTrigger>
                                              <DialogContent className="max-w-3xl">
                                                  <DialogHeader>
                                                    <DialogTitle>Receipt Details</DialogTitle>
                                                    <DialogDescription>
                                                      Bill No: {bill.billNo} - Total: ₹{bill.totalAmount.toFixed(2)}
                                                    </DialogDescription>
                                                  </DialogHeader>
                                                  <Image
                                                    src={bill.receiptImage}
                                                    alt={`Receipt ${bill.billNo}`}
                                                    width={800}
                                                    height={1200}
                                                    className="rounded-md object-contain w-full h-auto"
                                                  />
                                              </DialogContent>
                                            </Dialog>
                                        )
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>No scanned receipt images found.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
