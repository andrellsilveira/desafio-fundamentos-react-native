import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsStorage) {
        setProducts(JSON.parse(productsStorage));
      }
    }

    loadProducts();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const productCart = products.find(prod => prod.id === product.id);

      if (!productCart) {
        const addProduct = product;
        addProduct.quantity = 1;

        setProducts([...products, addProduct]);
      } else {
        productCart.quantity += 1;

        setProducts([
          ...products.filter(prod => prod.id !== productCart.id),
          productCart,
        ]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productCart = products.find(product => product.id === id);

      if (productCart) {
        productCart.quantity += 1;

        setProducts([
          ...products.filter(prod => prod.id !== productCart.id),
          productCart,
        ]);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productCart = products.find(product => product.id === id);

      if (productCart) {
        if (productCart.quantity > 1) {
          productCart.quantity -= 1;

          setProducts([
            ...products.filter(prod => prod.id !== productCart.id),
            productCart,
          ]);

          await AsyncStorage.setItem(
            '@GoMarketplace:products',
            JSON.stringify(products),
          );
        }
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
