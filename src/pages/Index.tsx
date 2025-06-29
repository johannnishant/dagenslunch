import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Utensils, MapPin, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScraperRegistry, ScrapedMenu, MenuItem } from '@/utils/ScraperService';

interface Restaurant {
  id: string;
  name: string;
  url: string;
  lastUpdated?: string;
  menu?: MenuItem[];
}

const Index = () => {
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize restaurants from available scrapers
  useEffect(() => {
    const availableScrapers = ScraperRegistry.getAllScrapers();
    const initialRestaurants: Restaurant[] = availableScrapers.map(scraper => ({
      id: scraper.id,
      name: scraper.name,
      url: scraper.url,
      menu: []
    }));
    setRestaurants(initialRestaurants);
    
    // Automatically scrape all menus on app load
    const loadMenus = async () => {
      setIsLoading(true);
      try {
        const results = await ScraperRegistry.scrapeAllRestaurants();
        
        setRestaurants(prev => prev.map(restaurant => {
          const result = results.get(restaurant.id);
          if (result?.success && result.data) {
            return {
              ...restaurant,
              menu: result.data.items,
              lastUpdated: new Date().toLocaleTimeString()
            };
          }
          return restaurant;
        }));

        toast({
          title: "Menus Loaded",
          description: "Today's menus have been loaded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load some menus",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMenus();
  }, []);

  const removeRestaurant = (id: string) => {
    setRestaurants(restaurants.filter(r => r.id !== id));
    toast({
      title: "Restaurant Removed",
      description: "Restaurant has been removed from your list",
    });
  };

  const scrapeMenu = async (restaurant: Restaurant) => {
    setIsLoading(true);
    try {
      const result = await ScraperRegistry.scrapeRestaurant(restaurant.id);
      
      if (result.success && result.data) {
        setRestaurants(prev => prev.map(r => 
          r.id === restaurant.id 
            ? { 
                ...r, 
                menu: result.data!.items, 
                lastUpdated: new Date().toLocaleTimeString() 
              }
            : r
        ));
        
        toast({
          title: "Menu Updated",
          description: `${restaurant.name} menu has been refreshed`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to scrape menu",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to scrape menu. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAllMenus = async () => {
    setIsLoading(true);
    toast({
      title: "Refreshing Menus",
      description: "Updating all restaurant menus...",
    });
    
    try {
      const results = await ScraperRegistry.scrapeAllRestaurants();
      
      setRestaurants(prev => prev.map(restaurant => {
        const result = results.get(restaurant.id);
        if (result?.success && result.data) {
          return {
            ...restaurant,
            menu: result.data.items,
            lastUpdated: new Date().toLocaleTimeString()
          };
        }
        return restaurant;
      }));

      toast({
        title: "Menus Updated",
        description: "All restaurant menus have been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh some menus",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dagens Lunch Train
          </h1>
          <p className="text-gray-600">
            a simple app to help you find a place to eat in Lindholmen
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Made with</span>
            <span className="text-red-500 animate-pulse">❤️</span>
            <span>by Johann</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {/* Removed Add Restaurant and Refresh All buttons */}
          </div>
          <Badge variant="secondary" className="text-sm">
            {restaurants.length} Restaurants
          </Badge>
        </div>

        {/* Restaurants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && restaurants.length === 0 ? (
            // Loading state when no restaurants are loaded yet
            <div className="col-span-full text-center py-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <RefreshCw className="h-6 w-6 animate-spin text-orange-600" />
                <span className="text-lg font-medium text-gray-700">Loading today's menus...</span>
              </div>
              <p className="text-gray-500">Fetching the latest menu items from District One</p>
            </div>
          ) : (
            restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="hover:shadow-lg transition-shadow duration-300 border-orange-100">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                      <div className="flex items-center gap-1 text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">{restaurant.url}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRestaurant(restaurant.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {restaurant.lastUpdated && (
                    <Badge variant="outline" className="text-xs">
                      Updated: {restaurant.lastUpdated}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent>
                  {restaurant.menu && restaurant.menu.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Today's Menu</h4>
                      <div className="space-y-2">
                        {restaurant.menu.map((item, index) => (
                          <div key={index} className="border-l-2 border-orange-200 pl-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                {item.description && (
                                  <p className="text-sm text-gray-600">{item.description}</p>
                                )}
                                {item.category && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {item.category}
                                  </Badge>
                                )}
                              </div>
                              {item.price && (
                                <span className="text-sm font-medium text-orange-600">
                                  {item.price}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-3" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => scrapeMenu(restaurant)}
                        disabled={isLoading}
                        className="w-full"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Update Menu
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Utensils className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 mb-4">
                        {isLoading ? 'Loading menu...' : 'No menu available'}
                      </p>
                      {!isLoading && (
                        <Button
                          size="sm"
                          onClick={() => scrapeMenu(restaurant)}
                          disabled={isLoading}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                          Scrape Menu
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
