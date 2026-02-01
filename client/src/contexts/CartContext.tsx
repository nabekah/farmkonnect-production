import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface CartItem {
  productId: number;
  productName: string;
  price: string;
  quantity: number;
  unit: string;
  imageUrl?: string;
  bulkDiscount?: {
    percentage: string;
    discountedPrice: string;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "farmkonnect_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const utils = trpc.useUtils();

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
      }
    }
  }, []);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Sync cart to database for logged-in users
  const syncCart = trpc.marketplace.syncCart.useMutation();

  useEffect(() => {
    if (user && items.length > 0) {
      syncCart.mutate({ items });
    }
  }, [user, items]);

  // Load cart from database when user logs in
  const { data: dbCart } = trpc.marketplace.getCart.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (dbCart && dbCart.length > 0) {
      // Merge database cart with local cart
      const merged = [...items];
      dbCart.forEach((dbItem: any) => {
        const existingIndex = merged.findIndex(i => i.productId === dbItem.productId);
        if (existingIndex >= 0) {
          // Keep the higher quantity
          merged[existingIndex].quantity = Math.max(
            merged[existingIndex].quantity,
            dbItem.quantity
          );
        } else {
          merged.push(dbItem);
        }
      });
      setItems(merged);
    }
  }, [dbCart]);

  // Fetch bulk pricing tiers for items
  const calculateBulkDiscount = async (productId: number, quantity: number) => {
    try {
      const tiers = await utils.marketplace.getBulkPricingTiers.fetch({ productId });
      if (tiers.length === 0) return undefined;

      // Find applicable tier
      const applicableTier = tiers
        .filter(t => {
          const minQty = parseFloat(t.minQuantity);
          const maxQty = t.maxQuantity ? parseFloat(t.maxQuantity) : Infinity;
          return quantity >= minQty && quantity <= maxQty;
        })
        .sort((a, b) => parseFloat(b.discountPercentage) - parseFloat(a.discountPercentage))[0];

      if (applicableTier) {
        return {
          percentage: applicableTier.discountPercentage,
          discountedPrice: applicableTier.discountedPrice,
        };
      }
    } catch (error) {
      console.error("Failed to fetch bulk pricing:", error);
    }
    return undefined;
  };

  const addItem = async (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const quantity = item.quantity || 1;
    const existingIndex = items.findIndex(i => i.productId === item.productId);

    if (existingIndex >= 0) {
      const newQuantity = items[existingIndex].quantity + quantity;
      const bulkDiscount = await calculateBulkDiscount(item.productId, newQuantity);
      
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQuantity,
        bulkDiscount,
      };
      setItems(updated);
      toast.success(`Updated ${item.productName} quantity to ${newQuantity}`);
    } else {
      const bulkDiscount = await calculateBulkDiscount(item.productId, quantity);
      setItems([...items, { ...item, quantity, bulkDiscount }]);
      toast.success(`Added ${item.productName} to cart`);
    }
  };

  const removeItem = (productId: number) => {
    const item = items.find(i => i.productId === productId);
    setItems(items.filter(i => i.productId !== productId));
    if (item) {
      toast.success(`Removed ${item.productName} from cart`);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    const bulkDiscount = await calculateBulkDiscount(productId, quantity);
    setItems(items.map(item => 
      item.productId === productId 
        ? { ...item, quantity, bulkDiscount }
        : item
    ));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    toast.success("Cart cleared");
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price);
    return sum + (price * item.quantity);
  }, 0);

  const totalDiscount = items.reduce((sum, item) => {
    if (!item.bulkDiscount) return sum;
    const originalPrice = parseFloat(item.price);
    const discountedPrice = parseFloat(item.bulkDiscount.discountedPrice);
    return sum + ((originalPrice - discountedPrice) * item.quantity);
  }, 0);

  const total = subtotal - totalDiscount;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        totalDiscount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
