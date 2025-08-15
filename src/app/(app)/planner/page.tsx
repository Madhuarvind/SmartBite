import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import Image from "next/image";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const mealPlan = {
  Monday: {
    Breakfast: { name: "Spinach Omelette", imageUrl: "https://placehold.co/100x100.png", dataAiHint: "omelette spinach" },
    Lunch: { name: "Chicken Salad", imageUrl: "https://placehold.co/100x100.png", dataAiHint: "chicken salad" },
    Dinner: null,
  },
  Tuesday: {
    Breakfast: null,
    Lunch: { name: "Leftover Chicken", imageUrl: "https://placehold.co/100x100.png", dataAiHint: "chicken dish" },
    Dinner: { name: "Tomato Pasta", imageUrl: "https://placehold.co/100x100.png", dataAiHint: "pasta dish" },
  },
  Wednesday: { Breakfast: null, Lunch: null, Dinner: null },
  Thursday: {
    Breakfast: { name: "Oatmeal", imageUrl: "https://placehold.co/100x100.png", dataAiHint: "oatmeal bowl" },
    Lunch: null,
    Dinner: { name: "Steak and Veggies", imageUrl: "https://placehold.co/100x100.png", dataAiHint: "steak vegetables" },
  },
  Friday: { Breakfast: null, Lunch: null, Dinner: null },
  Saturday: { Breakfast: null, Lunch: null, Dinner: null },
  Sunday: { Breakfast: null, Lunch: null, Dinner: null },
};

export default function PlannerPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="This Week's Meal Plan" action={<Button variant="outline">Generate Shopping List</Button>} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-start">
        {days.map(day => (
          <Card key={day} className="w-full">
            <CardHeader>
              <CardTitle className="text-center text-lg">{day}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['Breakfast', 'Lunch', 'Dinner'] as const).map(mealType => {
                const meal = mealPlan[day as keyof typeof mealPlan][mealType];
                return (
                  <div key={mealType}>
                    <h4 className="font-semibold mb-2 text-primary">{mealType}</h4>
                    {meal ? (
                       <Card className="p-2 bg-secondary">
                        <div className="flex items-center gap-2">
                           <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0">
                               <Image src={meal.imageUrl} alt={meal.name} layout="fill" objectFit="cover" data-ai-hint={meal.dataAiHint} />
                           </div>
                           <p className="text-sm font-medium text-secondary-foreground flex-grow">{meal.name}</p>
                        </div>
                       </Card>
                    ) : (
                      <button className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:border-primary/50 transition-colors">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Add Meal
                      </button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
