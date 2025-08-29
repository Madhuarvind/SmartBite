
"use client";

import { useState, useEffect, FormEvent } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Loader, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, writeBatch, query } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { ShoppingListItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export default function ShoppingListPage() {
  const [user, setUser] = useState<User | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");

  const [isAddToInventoryDialogOpen, setIsAddToInventoryDialogOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<ShoppingListItem[]>([]);
  const [isAddingToInventory, setIsAddingToInventory] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoading(true);
        const shoppingListQuery = query(collection(db, "users", currentUser.uid, "shopping_list"));
        const unsubscribeShoppingList = onSnapshot(shoppingListQuery, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShoppingListItem[];
          setShoppingList(items);
          setIsLoading(false);
        });
        return () => unsubscribeShoppingList();
      } else {
        setUser(null);
        setShoppingList([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !newItemName.trim()) {
      toast({ variant: "destructive", title: "Item name cannot be empty." });
      return;
    }
    try {
      await addDoc(collection(db, "users", user.uid, "shopping_list"), {
        name: newItemName,
        quantity: newItemQuantity,
        checked: false,
      });
      setNewItemName("");
      setNewItemQuantity("1");
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
        // Add to inventory
        const newInventoryItemRef = doc(inventoryRef);
        inventoryBatch.set(newInventoryItemRef, {
            name: item.name,
            quantity: item.quantity,
            expiry: 'N/A', // Expiry can be predicted/edited later
            purchaseDate: today,
            price: 0
        });
        
        // Remove from shopping list
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
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="My Shopping List" />
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-fade-in-slide-up">
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
            <CardDescription>Quickly add items you need to buy.</CardDescription>
          </CardHeader>
          <form onSubmit={handleAddItem}>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Input
                className="sm:col-span-2"
                placeholder="e.g., Almond Milk"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
              />
              <Input
                placeholder="Quantity (e.g., 1L)"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                required
              />
            </CardContent>
            <CardFooter>
              <Button type="submit">
                <PlusCircle className="mr-2" /> Add Item
              </Button>
            </CardFooter>
          </form>
        </Card>
        <Card className="animate-fade-in-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle>Manage Your List</CardTitle>
            <CardDescription>Check off items as you shop. Move purchased items to your inventory.</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center">
            <Button size="lg" onClick={handleMoveCheckedToInventory} disabled={shoppingList.filter(i => i.checked).length === 0}>
                <ShoppingCart className="mr-2"/> Move Checked to Inventory
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-in-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle>Current Shopping List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Done</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : shoppingList.length > 0 ? (
                shoppingList.map((item) => (
                  <TableRow key={item.id} className={item.checked ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => handleToggleChecked(item)}
                      />
                    </TableCell>
                    <TableCell className={`font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}>{item.name}</TableCell>
                    <TableCell className={item.checked ? 'line-through text-muted-foreground' : ''}>{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Your shopping list is empty.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
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
    </div>
  );
}
