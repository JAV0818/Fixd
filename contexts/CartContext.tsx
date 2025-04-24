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
  serviceId: string;
  serviceName: string;
  serviceImage: any;
  basePrice: number;
  selectedAddons: {
    id: string;
    name: string;
    price: number;
  }[];
  totalPrice: number;
  timestamp: number;
};

type CartState = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: CartState }
  | { type: 'SET_LOADING'; payload: boolean };

type CartContextType = {
  state: CartState;
  addItem: (item: Omit<CartItem, 'id' | 'timestamp'>) => void;
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
      const newItem = action.payload;
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(
        item => item.serviceId === newItem.serviceId
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
      const newTotalPrice = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

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
      const newTotalPrice = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

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
      try {
        const cartData = await AsyncStorage.getItem('cart');
        if (cartData) {
          dispatch({ type: 'SET_CART', payload: JSON.parse(cartData) });
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
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
  const addItem = (item: Omit<CartItem, 'id' | 'timestamp'>) => {
    const newItem: CartItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 15), // Generate unique ID
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_ITEM', payload: newItem });
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