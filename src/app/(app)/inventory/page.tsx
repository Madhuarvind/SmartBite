
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PlusCircle, Upload, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { scanIngredients } from "@/ai/flows/scan-ingredients";
import { useToast } from "@/hooks/use-toast";

const initialInventory = [
  { id: '1', name: 'Tomatoes', quantity: '500g', expiry: '2024-08-15' },
  { id: '2', name: 'Chicken Breast', quantity: '2 pcs', expiry: '2024-08-16' },
  { id: '3', name: 'Milk', quantity: '1L', expiry: '2024-08-18' },
  { id: '4', name: 'Spinach', quantity: '200g', expiry: '2024-08-19' },
  { id: '5', name: 'Eggs', quantity: '12 pcs', expiry: '2024-09-01' },
];

const pantryEssentials = [
  { id: 'p1', name: 'Olive Oil', quantity: '1 bottle' },
  { id: 'p2', name: 'Salt', quantity: '1 box' },
  { id: 'p3', name: 'Black Pepper', quantity: '1 shaker' },
  { id: 'p4', name: 'Garlic Powder', quantity: '1 jar' },
];

export default function InventoryPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scannedIngredients, setScannedIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setScannedIngredients([]);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleScan = async () => {
    if (!imagePreview) return;
    setIsLoading(true);
    try {
      const result = await scanIngredients({ photoDataUri: imagePreview });
      setScannedIngredients(result.ingredients);
    } catch (error) {
      console.error("Error scanning ingredients:", error);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Could not detect ingredients from the image. Please try another one.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setImagePreview(null);
    setScannedIngredients([]);
    const fileInput = document.getElementById('picture') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="My Inventory" action={<Button><PlusCircle className="mr-2"/> Add Item</Button>} />
      
      <Tabs defaultValue="inventory">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">My Items</TabsTrigger>
          <TabsTrigger value="pantry">Pantry Essentials</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          <div className="grid gap-6 mt-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ingredient Scanner</CardTitle>
                <CardDescription>Upload a photo to automatically detect ingredients.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video w-full border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center">
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Ingredients preview" layout="fill" objectFit="cover" className="rounded-lg" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                        <Upload className="mx-auto h-10 w-10 mb-2"/>
                        <p>Click to upload an image</p>
                    </div>
                  )}
                   <Input id="picture" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange}/>
                </div>
                {scannedIngredients.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2">Detected Ingredients:</h4>
                        <div className="flex flex-wrap gap-2">
                            {scannedIngredients.map(ing => <span key={ing} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">{ing}</span>)}
                        </div>
                    </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleClear}>Clear</Button>
                <Button onClick={handleScan} disabled={!imagePreview || isLoading}>
                    {isLoading ? "Scanning..." : "Scan Ingredients"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Inventory</CardTitle>
                <CardDescription>All items currently in your fridge and pantry.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.expiry}</TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="pantry">
          <Card className="mt-6">
            <CardHeader>
                <CardTitle>Pantry Essentials</CardTitle>
                <CardDescription>Items you usually have on hand. These are always considered available for recipes.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Typical Quantity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pantryEssentials.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm">Remove</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                <Button variant="outline">Add Essential Item</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
