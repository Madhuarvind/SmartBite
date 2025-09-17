
"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Camera, Loader, Sparkles, X, Bot, SendHorizonal, PlusCircle, Trash2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, writeBatch, doc, deleteDoc, updateDoc } from "firebase/firestore";
import type { User as FirebaseUser } from 'firebase/auth';
import { identifyAndCheckItem } from '@/ai/flows/identify-and-check-item';
import { askPantryAssistant } from '@/ai/flows/ask-pantry-assistant';
import type { ShoppingListItem } from "@/lib/types";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

export default function ShoppingHelperPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatQuery, setChatQuery] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  
  // Shopping list state
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [isShoppingListLoading, setIsShoppingListLoading] = useState(true);
  const [newShoppingItemName, setNewShoppingItemName] = useState("");
  const [isAddToInventoryDialogOpen, setIsAddToInventoryDialogOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<ShoppingListItem[]>([]);
  const [isAddingToInventory, setIsAddingToInventory] = useState(false);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
       if (currentUser) {
        // --- Shopping List Listener ---
        const shoppingListQuery = query(collection(db, "users", currentUser.uid, "shopping_list"));
        const unsubscribeShoppingList = onSnapshot(shoppingListQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShoppingListItem[];
          setShoppingList(items);
          setIsShoppingListLoading(false);
        });

        return () => {
          unsubscribeShoppingList();
        };

      } else {
        setUser(null);
        setShoppingList([]);
        setIsShoppingListLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(cameraStream);
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use the Smart Shopping Lens.',
        });
      }
    };
    getCameraPermission();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [toast]);
  
  const processImage = async (photoDataUri: string) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in.' });
        return;
    }
    
    setIsLoading(true);
    setScannedImage(photoDataUri);
    setAnalysisResult(null);

    try {
        const result = await identifyAndCheckItem({ photoDataUri, userId: user.uid });
        setAnalysisResult(result.response);
    } catch(error) {
        console.error("Error identifying item:", error);
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Could not identify the item from the image. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handleScanFromCamera = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const photoDataUri = canvas.toDataURL('image/jpeg');
      processImage(photoDataUri);
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
    } else {
      toast({
        variant: "destructive",
        title: "Scan Error",
        description: "Could not capture an image from the video stream.",
      });
    }
  };
  
  const handleChatSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!chatQuery.trim() || !user) return;

      const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: chatQuery }];
      setChatHistory(newHistory);
      setChatQuery("");
      setIsAnswering(true);
      
      try {
          const result = await askPantryAssistant({ query: chatQuery, userId: user.uid });
          setChatHistory([...newHistory, { role: 'assistant', content: result.answer }]);
      } catch (error) {
          console.error("Error with pantry assistant:", error);
          setChatHistory([...newHistory, { role: 'assistant', content: "Sorry, I ran into an error. Please try again." }]);
          toast({
              variant: 'destructive',
              title: 'Assistant Error',
              description: 'Could not get a response from the AI assistant.'
          });
      } finally {
          setIsAnswering(false);
      }
  }

  const handleResetLens = async () => {
    setScannedImage(null);
    setAnalysisResult(null);
    try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(cameraStream);
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
        }
    } catch(e) {
        console.error("Error re-activating camera", e);
    }
  };

  const handleAddShoppingItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !newShoppingItemName.trim()) {
      toast({ variant: "destructive", title: "Item name cannot be empty." });
      return;
    }
    try {
      await addDoc(collection(db, "users", user.uid, "shopping_list"), {
        name: newShoppingItemName,
        quantity: "1",
        checked: false,
      });
      setNewShoppingItemName("");
    } catch (error) {
      console.error("Error adding shopping list item:", error);
      toast({ variant: "destructive", title: "Failed to add item." });
    }
  };

  const handleToggleChecked = async (item: ShoppingListItem) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "shopping_list", item.id), {
        checked: !item.checked,
      });
    } catch (error) {
      console.error("Error updating item:", error);
      toast({ variant: "destructive", title: "Failed to update item." });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "shopping_list", itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ variant: "destructive", title: "Failed to delete item." });
    }
  };

  const handleMoveCheckedToInventory = () => {
      const itemsToMove = shoppingList.filter(item => item.checked);
      if (itemsToMove.length === 0) {
          toast({ variant: "destructive", title: "No items selected", description: "Check some items to move them to your inventory."});
          return;
      }
      setCheckedItems(itemsToMove);
      setIsAddToInventoryDialogOpen(true);
  }

  const confirmMoveToInventory = async () => {
    if (!user || checkedItems.length === 0) return;
    setIsAddingToInventory(true);
    
    const inventoryBatch = writeBatch(db);
    const shoppingListBatch = writeBatch(db);
    const inventoryRef = collection(db, "users", user.uid, "inventory");
    const today = new Date().toISOString().split('T')[0];

    checkedItems.forEach(item => {
        const newInventoryItemRef = doc(inventoryRef);
        inventoryBatch.set(newInventoryItemRef, {
            name: item.name,
            quantity: item.quantity,
            expiry: 'N/A',
            purchaseDate: today,
            price: 0
        });
        
        const shoppingListItemRef = doc(db, "users", user.uid, "shopping_list", item.id);
        shoppingListBatch.delete(shoppingListItemRef);
    });
    
    try {
        await inventoryBatch.commit();
        await shoppingListBatch.commit();
        toast({
            title: "Inventory Updated!",
            description: `${checkedItems.length} items moved from your shopping list to your inventory.`
        });
    } catch (error) {
        console.error("Error moving items to inventory:", error);
        toast({ variant: "destructive", title: "Action Failed", description: "Could not move items to inventory." });
    } finally {
        setIsAddingToInventory(false);
        setIsAddToInventoryDialogOpen(false);
        setCheckedItems([]);
    }
  };

  return (
    <>
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="Shopping Helper" />
      <Card className="animate-fade-in-slide-up">
        <CardHeader>
          <CardTitle>Check Before You Buy</CardTitle>
          <CardDescription>
            Use our AI tools to check your pantry on the go. Scan items with the Smart Lens, manage your shopping list, or ask the Pantry Chat assistant a question.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="list">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="list">Shopping List</TabsTrigger>
                    <TabsTrigger value="lens">Smart Lens</TabsTrigger>
                    <TabsTrigger value="chat">Pantry Chat</TabsTrigger>
                </TabsList>
                 <TabsContent value="list" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Your Shopping List</CardTitle>
                            <CardDescription>Items from your meal plan and anything you've added manually.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={handleAddShoppingItem} className="flex gap-2">
                                <Input 
                                    placeholder="Add item manually..."
                                    value={newShoppingItemName}
                                    onChange={(e) => setNewShoppingItemName(e.target.value)}
                                    suppressHydrationWarning
                                />
                                <Button type="submit" size="icon" variant="outline" suppressHydrationWarning><PlusCircle /></Button>
                            </form>

                            <div className="h-64 overflow-y-auto space-y-2 pr-2">
                              {isShoppingListLoading ? (
                                 <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>
                              ) : shoppingList.length > 0 ? (
                                shoppingList.map((item) => (
                                  <div key={item.id} className={`flex items-center gap-2 p-2 rounded-md ${item.checked ? 'bg-muted/50' : ''}`}>
                                      <Checkbox
                                        id={`item-${item.id}`}
                                        checked={item.checked}
                                        onCheckedChange={() => handleToggleChecked(item)}
                                      />
                                      <Label htmlFor={`item-${item.id}`} className={`flex-1 ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                                        {item.name} <span className="text-xs text-muted-foreground">({item.quantity})</span>
                                      </Label>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteItem(item.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center text-muted-foreground py-10">Your shopping list is empty.</div>
                              )}
                            </div>
                        </CardContent>
                        <CardFooter>
                             <Button className="w-full" onClick={handleMoveCheckedToInventory} disabled={shoppingList.filter(i => i.checked).length === 0}>
                                <ShoppingCart className="mr-2"/> Add Purchased to Pantry
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="lens" className="mt-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-full max-w-lg aspect-[4/3] border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center bg-secondary overflow-hidden">
                            {scannedImage && !isLoading ? (
                                <Image src={scannedImage} alt="Scanned item" layout="fill" objectFit="contain" />
                            ) : (
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                            )}

                            {hasCameraPermission === false && !scannedImage && (
                                <Alert variant="destructive" className="absolute m-4">
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                    To use the Smart Shopping Lens, please allow camera access in your browser settings.
                                </AlertDescription>
                                </Alert>
                            )}
                            
                            {isLoading && (
                                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center text-primary gap-4">
                                    <Loader className="w-16 h-16 animate-spin" />
                                    <p className="font-semibold text-lg">Analyzing...</p>
                                </div>
                            )}

                            {analysisResult && (
                                <div className="absolute inset-x-4 bottom-4 bg-background/90 p-4 rounded-lg border-2 border-primary shadow-2xl animate-fade-in-slide-up">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                                        <p className="text-foreground font-medium">{analysisResult}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-4">
                            {!analysisResult ? (
                                <Button onClick={handleScanFromCamera} disabled={isLoading || hasCameraPermission === false} size="lg">
                                    <Camera className="mr-2" /> Scan Item
                                </Button>
                            ) : (
                                <Button onClick={handleResetLens} size="lg" variant="outline">
                                    <X className="mr-2" /> Scan Another Item
                                </Button>
                            )}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="chat" className="mt-4">
                    <div className="w-full max-w-lg mx-auto">
                        <div className="h-[400px] bg-secondary rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
                           {chatHistory.length === 0 && (
                               <div className="m-auto text-center text-muted-foreground">
                                   <Bot className="w-12 h-12 mx-auto mb-2"/>
                                   <p>Ask me anything about your pantry!</p>
                                   <p className="text-xs">e.g., "Do I have any eggs?" or "How much milk is left?"</p>
                               </div>
                           )}
                           {chatHistory.map((chat, index) => (
                               <div key={index} className={`flex items-start gap-3 ${chat.role === 'user' ? 'justify-end' : ''}`}>
                                   {chat.role === 'assistant' && <Bot className="w-6 h-6 flex-shrink-0 text-primary"/>}
                                   <div className={`rounded-lg p-3 text-sm ${chat.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                       {chat.content}
                                   </div>
                               </div>
                           ))}
                           {isAnswering && (
                                <div className="flex items-start gap-3">
                                    <Bot className="w-6 h-6 flex-shrink-0 text-primary"/>
                                    <div className="rounded-lg p-3 bg-background">
                                        <Loader className="w-5 h-5 animate-spin" />
                                    </div>
                                </div>
                           )}
                        </div>
                        <form onSubmit={handleChatSubmit} className="flex gap-2 mt-4">
                            <Input 
                                value={chatQuery}
                                onChange={(e) => setChatQuery(e.target.value)}
                                placeholder="Ask your pantry assistant..."
                                disabled={isAnswering}
                            />
                            <Button type="submit" disabled={isAnswering || !chatQuery.trim()}>
                                <SendHorizonal className="w-5 h-5"/>
                                <span className="sr-only">Send</span>
                            </Button>
                        </form>
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
    
    <Dialog open={isAddToInventoryDialogOpen} onOpenChange={setIsAddToInventoryDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Move Items to Inventory?</DialogTitle>
                <DialogDescription>
                    You are about to move {checkedItems.length} item(s) to your main inventory. This will remove them from the shopping list.
                </DialogDescription>
            </DialogHeader>
            <ul className="list-disc pl-5 space-y-1 max-h-48 overflow-y-auto">
                {checkedItems.map(item => <li key={item.id}>{item.name} ({item.quantity})</li>)}
            </ul>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddToInventoryDialogOpen(false)} disabled={isAddingToInventory}>Cancel</Button>
                <Button onClick={confirmMoveToInventory} disabled={isAddingToInventory}>
                    {isAddingToInventory ? <Loader className="animate-spin mr-2"/> : null}
                    Confirm & Move
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
