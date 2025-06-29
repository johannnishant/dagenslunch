import { RestaurantScraper, ScraperResult, ScrapedMenu, MenuItem } from '../ScraperService';

/**
 * Scraper for District One restaurant in Gothenburg, Sweden
 * Website: https://districtone.se/lunch.html
 * Serves daily lunch menus Monday-Friday 11-14
 */
export class DistrictOneScraper implements RestaurantScraper {
  id = 'district-one';
  name = 'District One';
  url = 'https://districtone.se/lunch.html';

  async scrape(): Promise<ScraperResult> {
    try {
      console.log(`Scraping menu from ${this.name} at ${this.url}`);
      
      // Fetch the real HTML from the website and filter for today's menu
      const menuItems = await this.getTodaysMenu();
      
      const result: ScrapedMenu = {
        restaurantId: this.id,
        items: menuItems,
        lastUpdated: new Date().toISOString(),
        source: this.url
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`Error scraping ${this.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape menu'
      };
    }
  }

  private async fetchAndParseRealMenu(): Promise<MenuItem[]> {
    // Use a CORS proxy to fetch the website
    // Note: In production, you'd want to use your own backend proxy
    const corsProxy = 'https://corsproxy.io/?';
    const response = await fetch(corsProxy + encodeURIComponent(this.url));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    console.log('Successfully fetched HTML from District One website');
    
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract menu items from the parsed HTML
    return this.parseMenuFromHTML(doc);
  }

  private parseMenuFromHTML(doc: Document): MenuItem[] {
    const menuItems: MenuItem[] = [];
    
    // Find all paragraph elements that contain menu content
    const paragraphs = doc.querySelectorAll('p');
    
    let currentDay = '';
    let currentCategory = '';
    
    paragraphs.forEach(p => {
      const text = p.textContent?.trim();
      if (!text) return;
      
      // Check if this is a day header
      const dayMatch = text.match(/^(Måndag|Tisdag|Onsdag|Torsdag|Fredag)$/i);
      if (dayMatch) {
        currentDay = dayMatch[1];
        return;
      }
      
      // Check if this is a category header (underlined text)
      const categoryMatch = text.match(/^([A-ZÅÄÖa-zåäö\s]+)$/);
      if (categoryMatch && this.isMenuCategory(categoryMatch[1])) {
        currentCategory = categoryMatch[1].trim();
        return;
      }
      
      // If we have a category and this looks like a menu item description
      if (currentCategory && currentDay && text.length > 20 && !text.includes('Serveras')) {
        // Skip if it's just formatting or separators
        if (text.includes('....................................') || text.includes('Vecka')) {
          return;
        }
        
        // Create menu item
        const menuItem: MenuItem = {
          name: `${currentCategory} - ${currentDay}`,
          description: text,
          category: currentCategory
        };
        
        menuItems.push(menuItem);
      }
    });
    
    console.log(`Parsed ${menuItems.length} menu items from HTML`);
    return menuItems;
  }

  // Helper methods for parsing the HTML structure
  private isMenuCategory(text: string): boolean {
    const categories = ['Fisk', 'Kött', 'Sallad', 'Asiatisk', 'Vegetarisk', 'Poke bowl', 'Pho'];
    return categories.some(category => text.includes(category));
  }

  private extractCategory(text: string): string | null {
    const categories = ['Fisk', 'Kött', 'Sallad', 'Asiatisk', 'Vegetarisk', 'Poke bowl', 'Pho'];
    for (const category of categories) {
      if (text.includes(category)) {
        return category;
      }
    }
    return null;
  }

  private extractDescription(text: string): string {
    // Remove the category name and clean up the description
    const categories = ['Fisk', 'Kött', 'Sallad', 'Asiatisk', 'Vegetarisk', 'Poke bowl', 'Pho'];
    let description = text;
    
    for (const category of categories) {
      if (description.includes(category)) {
        description = description.replace(category, '').trim();
        break;
      }
    }
    
    // Remove common formatting and clean up
    description = description.replace(/^[:\s]+/, '').trim();
    return description;
  }

  // Method to get today's menu based on current day
  async getTodaysMenu(): Promise<MenuItem[]> {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', '', ''];
    const currentDay = dayNames[today];
    
    // Get all menu items from the real website
    const allItems = await this.fetchAndParseRealMenu();
    
    if (!currentDay) {
      // Weekend - restaurant is closed, show Monday's menu as fallback
      console.log('Weekend detected, showing Monday\'s menu as fallback');
      const mondayItems = allItems.filter(item => item.name.includes('Måndag'));
      console.log(`Found ${mondayItems.length} Monday menu items`);
      return mondayItems;
    }
    
    // Filter menu items for today
    const todaysItems = allItems.filter(item => item.name.includes(currentDay));
    console.log(`Showing ${todaysItems.length} menu items for ${currentDay}`);
    return todaysItems;
  }
} 