import { useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  price: string;
  quantity: number;
  unit: string;
  imageUrl?: string;
}

const CART_STORAGE_KEY = "farmkonnect_cart";
const CART_EXPIRY_KEY = "farmkonnect_cart_expiry";
const CART_EXPIRY_DAYS = 30;

/**
 * Hook for managing cart persistence with localStorage
 * Automatically syncs cart to localStorage and restores on app load
 */
export function useCartPersistence() {
  const [storedCart, setStoredCart] = useLocalStorage<CartItem[]>(
    CART_STORAGE_KEY,
    []
  );

  /**
   * Save cart to localStorage with expiry timestamp
   */
  const persistCart = useCallback((cart: CartItem[]) => {
    try {
      const expiryTime = new Date().getTime() + CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      setStoredCart(cart);
      localStorage.setItem(CART_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.error("Failed to persist cart:", error);
    }
  }, [setStoredCart]);

  /**
   * Retrieve cart from localStorage if not expired
   */
  const getPersistedCart = useCallback((): CartItem[] => {
    try {
      const expiryTimeStr = localStorage.getItem(CART_EXPIRY_KEY);
      if (!expiryTimeStr) return [];

      const expiryTime = parseInt(expiryTimeStr, 10);
      const currentTime = new Date().getTime();

      // Check if cart has expired
      if (currentTime > expiryTime) {
        // Clear expired cart
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(CART_EXPIRY_KEY);
        return [];
      }

      return storedCart || [];
    } catch (error) {
      console.error("Failed to retrieve persisted cart:", error);
      return [];
    }
  }, [storedCart]);

  /**
   * Clear cart from localStorage
   */
  const clearPersistedCart = useCallback(() => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_EXPIRY_KEY);
      setStoredCart([]);
    } catch (error) {
      console.error("Failed to clear persisted cart:", error);
    }
  }, [setStoredCart]);

  /**
   * Check if persisted cart exists and is valid
   */
  const hasValidPersistedCart = useCallback((): boolean => {
    try {
      const expiryTimeStr = localStorage.getItem(CART_EXPIRY_KEY);
      if (!expiryTimeStr) return false;

      const expiryTime = parseInt(expiryTimeStr, 10);
      const currentTime = new Date().getTime();

      return currentTime <= expiryTime && (storedCart?.length ?? 0) > 0;
    } catch (error) {
      console.error("Failed to check persisted cart validity:", error);
      return false;
    }
  }, [storedCart]);

  return {
    persistCart,
    getPersistedCart,
    clearPersistedCart,
    hasValidPersistedCart,
    storedCart,
  };
}
