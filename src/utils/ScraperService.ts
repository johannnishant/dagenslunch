export interface MenuItem {
  name: string;
  description?: string;
  price?: string;
  category?: string;
}

export interface ScrapedMenu {
  restaurantId: string;
  items: MenuItem[];
  lastUpdated: string;
  source: string;
}

export interface ScraperResult {
  success: boolean;
  data?: ScrapedMenu;
  error?: string;
}

// Base scraper interface
export interface RestaurantScraper {
  id: string;
  name: string;
  url: string;
  scrape: () => Promise<ScraperResult>;
}

// Registry of all available scrapers
export class ScraperRegistry {
  private static scrapers: Map<string, RestaurantScraper> = new Map();

  static register(scraper: RestaurantScraper): void {
    this.scrapers.set(scraper.id, scraper);
  }

  static getScraper(id: string): RestaurantScraper | undefined {
    return this.scrapers.get(id);
  }

  static getAllScrapers(): RestaurantScraper[] {
    return Array.from(this.scrapers.values());
  }

  static async scrapeRestaurant(id: string): Promise<ScraperResult> {
    const scraper = this.getScraper(id);
    if (!scraper) {
      return {
        success: false,
        error: `No scraper found for restaurant ID: ${id}`
      };
    }

    return await scraper.scrape();
  }

  static async scrapeAllRestaurants(): Promise<Map<string, ScraperResult>> {
    const results = new Map<string, ScraperResult>();
    
    for (const scraper of this.getAllScrapers()) {
      const result = await scraper.scrape();
      results.set(scraper.id, result);
    }

    return results;
  }
}

// Initialize with sample scrapers
// ScraperRegistry.register(new SampleRestaurantScraper());

// Import and register scrapers
// import { ExampleRestaurantScraper } from './scrapers/ExampleRestaurantScraper';
// import { RealRestaurantExample } from './scrapers/RealRestaurantExample';
import { DistrictOneScraper } from './scrapers/DistrictOneScraper';
import { KooperativetScraper } from './scrapers/KooperativetScraper';
import { BistrotScraper } from './scrapers/BistrotScraper';
// ScraperRegistry.register(new ExampleRestaurantScraper());
// ScraperRegistry.register(new RealRestaurantExample());
ScraperRegistry.register(new DistrictOneScraper());
ScraperRegistry.register(new KooperativetScraper());
ScraperRegistry.register(new BistrotScraper()); 