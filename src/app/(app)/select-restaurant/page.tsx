"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getUserRestaurants,
  createRestaurant,
  selectRestaurant,
} from "@/lib/actions/restaurant.actions";
import { Building2, Plus, ChevronRight } from "lucide-react";

type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  role: string;
};

export default function SelectRestaurantPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    try {
      const data = await getUserRestaurants();
      setRestaurants(data);
      setLoading(false);

      // If no restaurants, show create form
      if (data.length === 0) {
        setShowCreateForm(true);
      }
    } catch (error) {
      console.error("Failed to load restaurants:", error);
      setLoading(false);
    }
  }

  async function handleSelectRestaurant(restaurantId: string) {
    const result = await selectRestaurant(restaurantId);
    if (result.success) {
      router.push("/today");
      router.refresh();
    }
  }

  async function handleCreateRestaurant(formData: FormData) {
    setCreateError(null);
    setCreating(true);

    console.log('Creating restaurant...');
    const result = await createRestaurant(formData);
    console.log('Create restaurant result:', result);

    if (result.error) {
      console.error('Error creating restaurant:', result.error);
      setCreateError(result.error);
      setCreating(false);
    } else if (result.success) {
      console.log('Restaurant created successfully, redirecting...');
      router.push("/today");
      router.refresh();
    } else {
      console.error('Unexpected result:', result);
      setCreateError('Unexpected error occurred');
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-2xl space-y-6">
        {!showCreateForm ? (
          <>
            {/* Restaurant Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  Select a Restaurant
                </CardTitle>
                <CardDescription>
                  Choose which restaurant you want to manage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {restaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    onClick={() => handleSelectRestaurant(restaurant.id)}
                    className="w-full flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left group"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {restaurant.name}
                      </div>
                      {restaurant.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {restaurant.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        Role: {restaurant.role}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Create New Restaurant Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Restaurant
            </Button>
          </>
        ) : (
          /* Create Restaurant Form */
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Create Your Restaurant
              </CardTitle>
              <CardDescription>
                Set up a new restaurant to start managing inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleCreateRestaurant} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="My Restaurant"
                    required
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    type="text"
                    placeholder="A brief description of your restaurant"
                    disabled={creating}
                  />
                </div>
                {createError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {createError}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={creating}>
                    {creating ? "Creating..." : "Create Restaurant"}
                  </Button>
                  {restaurants.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
