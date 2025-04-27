import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Use try-catch for importing AsyncStorage
let AsyncStorage: any;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  // Fallback implementation during development if AsyncStorage is not available
  console.warn('AsyncStorage not available, using in-memory storage fallback');
  AsyncStorage = {
    getItem: async () => null,
    setItem: async () => null,
    removeItem: async () => null,
  };
}

// Types
export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vehicleId: string | null;
  vehicleDisplay: string | null;
  image: any;
};

type CartState = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: { item: CartItem } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: CartState }
  | { type: 'SET_LOADING'; payload: boolean };

type CartContextType = {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

// Initial state
const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: true,
};

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const newItem = action.payload.item;
      // Check if item already exists with the same vehicle
      const existingItemIndex = state.items.findIndex(
        item => item.id === newItem.id && item.vehicleId === newItem.vehicleId
      );

      let updatedItems: CartItem[];

      if (existingItemIndex !== -1) {
        // Replace the existing item (for now - later we could implement quantity)
        updatedItems = [...state.items];
        updatedItems[existingItemIndex] = newItem;
      } else {
        // Add as new item
        updatedItems = [...state.items, newItem];
      }

      const newTotalItems = updatedItems.length;
      const newTotalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return {
        ...state,
        items: updatedItems,
        totalItems: newTotalItems,
        totalPrice: newTotalPrice,
      };
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload.id);
      const newTotalItems = updatedItems.length;
      const newTotalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return {
        ...state,
        items: updatedItems,
        totalItems: newTotalItems,
        totalPrice: newTotalPrice,
      };
    }

    case 'UPDATE_ITEM_QUANTITY': {
      // For future use - when we implement quantity logic
      return state;
    }

    case 'CLEAR_CART':
      console.log("[cartReducer] Clearing cart state.");
      return {
        ...initialState,
        isLoading: false,
      };

    case 'SET_CART':
      return action.payload;

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
}

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      // --- AsyncStorage Test Code ---
      const testKey = '@MyApp:storageTest';
      const testValue = { message: "AsyncStorage test successful!" };
      try {
        console.log(`[AsyncStorage Test] Attempting to write to key: ${testKey}`);
        await AsyncStorage.setItem(testKey, JSON.stringify(testValue));
        console.log(`[AsyncStorage Test] Write successful.`);
        
        console.log(`[AsyncStorage Test] Attempting to read from key: ${testKey}`);
        const readResult = await AsyncStorage.getItem(testKey);
        if (readResult !== null) {
          console.log(`[AsyncStorage Test] Read successful. Value:`, JSON.parse(readResult));
        } else {
          console.warn(`[AsyncStorage Test] Read failed. Value is null.`);
        }
      } catch (e) {
        console.error(`[AsyncStorage Test] Error during test:`, e);
      }
      // --- End AsyncStorage Test Code ---
      
      // --- TEMPORARY FORCE CLEAR (REMOVED) --- 
      // try {
      //   console.log("Attempting to force clear 'cart' from AsyncStorage...");
      //   await AsyncStorage.removeItem('cart');
      //   console.log("Forced clear successful.");
      // } catch (e) {
      //   console.error("Error during force clear:", e);
      // }
      // --- END TEMPORARY FORCE CLEAR ---
      
      let shouldClear = false; 
      try {
        const cartData = await AsyncStorage.getItem('cart');
        if (cartData) {
          const parsedCart = JSON.parse(cartData) as CartState;
          
          // Robust Check: Validate every item in the loaded cart
          if (parsedCart.items && Array.isArray(parsedCart.items)) {
            for (const item of parsedCart.items) {
              // Check if essential new properties are missing
              if (item.price === undefined || item.quantity === undefined || !item.hasOwnProperty('vehicleId')) {
                 console.log('Detected invalid or old cart item format. Clearing cart.', item);
                 shouldClear = true;
                 break; // Stop checking once one invalid item is found
              }
            }
          } else {
            // If items array is missing or not an array, treat as invalid
            console.log('Invalid cart structure loaded. Clearing cart.');
            shouldClear = true;
          }

          // Only set the cart if it passed the checks
          if (!shouldClear) {
             dispatch({ type: 'SET_CART', payload: parsedCart });
          }
        }
      } catch (error) {
        console.error('Error loading/parsing cart from storage:', error);
        shouldClear = true; // Clear cart on parsing error too
      } finally {
        if (shouldClear) {
          dispatch({ type: 'CLEAR_CART' }); // Dispatch clear cart outside try-catch
        } else {
          // Only set loading to false if we didn't clear the cart
          // (CLEAR_CART action already sets isLoading to false)
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        // Don't save if cart is still loading
        if (!state.isLoading) {
          await AsyncStorage.setItem('cart', JSON.stringify(state));
        }
      } catch (error) {
        console.error('Error saving cart to storage:', error);
      }
    };

    saveCart();
  }, [state]);

  // Helper functions for cart operations
  const addItem = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: { item } });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const value = {
    state,
    dispatch,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook for using the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext; 