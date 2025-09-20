
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Calendar as CalendarIcon } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import type { InventoryItem } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subDays, startOfMonth, endOfMonth, getYear, getMonth, parseISO } from "date-fns";

const chartConfig = {
  amount: {
    label: "Amount",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

type Period = 'last7' | 'last30' | 'last90' | 'month' | 'year';

export default function ExpensesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseHistory, setPurchaseHistory] = useState<InventoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Filter states
  const [period, setPeriod] = useState<Period>('last30');
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));

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
        const q = query(collection(db, "users", currentUser.uid, "inventory"), orderBy("purchaseDate", "desc"));
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const history = snapshot.docs
            .map(doc => doc.data() as InventoryItem)
            .filter(item => item.purchaseDate && item.price && item.price > 0);
          setPurchaseHistory(history);
          setIsLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        setIsLoading(false);
        setPurchaseHistory([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch(period) {
      case 'last7':
        startDate = subDays(now, 6);
        break;
      case 'last30':
        startDate = subDays(now, 29);
        break;
      case 'last90':
        startDate = subDays(now, 89);
        break;
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
    setFilteredData(filtered);

    // Aggregate data for the chart
    const dailySpending = new Map<string, number>();
    filtered.forEach(item => {
      const day = format(parseISO(item.purchaseDate!), 'MMM d');
      const currentAmount = dailySpending.get(day) || 0;
      dailySpending.set(day, currentAmount + (item.price || 0));
    });
    
    const chartEntries = Array.from(dailySpending.entries()).map(([date, amount]) => ({ date, amount }));
    setChartData(chartEntries.reverse());

  }, [period, selectedYear, selectedMonth, purchaseHistory]);
  
  const totalSpent = useMemo(() => {
    return filteredData.reduce((acc, item) => acc + (item.price || 0), 0);
  }, [filteredData]);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="Expenses" />

      <Card>
        <CardHeader>
          <CardTitle>Spending Dashboard</CardTitle>
          <CardDescription>Analyze your grocery spending over various periods.</CardDescription>
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
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                 <Select onValueChange={(value) => setSelectedYear(parseInt(value))} value={selectedYear.toString()}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {period === 'year' && (
              <Select onValueChange={(value) => setSelectedYear(parseInt(value))} value={selectedYear.toString()}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center text-lg"><Wallet className="mr-2"/>Total Spent</CardTitle>
                    <CardDescription>For the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-10 w-32" /> : (
                        <p className="text-4xl font-bold text-primary">₹{totalSpent.toFixed(2)}</p>
                    )}
                </CardContent>
            </Card>
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg">Daily Spending</CardTitle>
                    <CardDescription>A visual breakdown of your spending per day.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-48 w-full" /> : chartData.length > 0 ? (
                     <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 6)}
                          />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                        </BarChart>
                      </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      <p>No spending data for this period.</p>
                    </div>
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
                      {isLoading ? (
                        Array.from({length: 5}).map((_, i) => (
                           <TableRow key={i}>
                             <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                             <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                             <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto"/></TableCell>
                           </TableRow>
                        ))
                      ) : filteredData.length > 0 ? (
                        filteredData.map((item, index) => (
                          <TableRow key={`${item.id}-${index}`}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.purchaseDate ? format(parseISO(item.purchaseDate), 'PPP') : 'N/A'}</TableCell>
                            <TableCell className="text-right">₹{item.price?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                            No transactions in this period.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
