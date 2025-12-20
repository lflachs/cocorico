"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentRestaurant } from "@/lib/actions/restaurant.actions";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type RestaurantContextType = {
  restaurant: Restaurant | null;
  loading: boolean;
  refreshRestaurant: () => Promise<void>;
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRestaurant = async () => {
    try {
      const data = await getCurrentRestaurant();
      setRestaurant(data);
    } catch (error) {
      console.error("Failed to load restaurant:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurant();
  }, []);

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        loading,
        refreshRestaurant: loadRestaurant,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}
