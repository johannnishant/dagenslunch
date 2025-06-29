import { RestaurantScraper, ScraperResult, ScrapedMenu, MenuItem } from '../ScraperService';

/**
 * Scraper for Bistrot restaurant in Gothenburg, Sweden
 * Website: https://bistrot.se/
 * Serves daily lunch menus Monday-Friday 11-14
 */
export class BistrotScraper implements RestaurantScraper {
  id = 'bistrot';
  name = 'Bistrot';
  url = 'https://bistrot.se/';

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
    const corsProxy = 'https://corsproxy.io/?';
    const response = await fetch(corsProxy + encodeURIComponent(this.url));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    console.log('Successfully fetched HTML from Bistrot website');
    
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract menu items from the parsed HTML
    return this.parseMenuFromHTML(doc);
  }

  private parseMenuFromHTML(doc: Document): MenuItem[] {
    const menuItems: MenuItem[] = [];
    
    // Find all menu items in the food and drink menu structure
    const menuItemElements = doc.querySelectorAll('.fdm-item');
    console.log(`Found ${menuItemElements.length} .fdm-item elements`);
    
    // First, find the weekly menu items that are available all week
    let weeklyDishes: Array<{name: string, description: string, category: string}> = [];
    
    menuItemElements.forEach((itemElement, index) => {
      const titleElement = itemElement.querySelector('.fdm-item-title');
      const contentElement = itemElement.querySelector('.fdm-item-content');
      
      if (!titleElement || !contentElement) return;
      
      const title = titleElement.textContent?.trim();
      const content = contentElement.textContent?.trim();
      
      if (!title || !content) return;
      
      // Check if this is the weekly menu overview item
      if (title.toLowerCase().includes('vecka') || title.toLowerCase().includes('week')) {
        console.log(`Found weekly menu item: ${title}`);
        weeklyDishes = this.parseDishesFromContent(content);
        console.log(`Parsed ${weeklyDishes.length} weekly dishes:`, weeklyDishes);
      }
    });
    
    // Now process daily menu items
    menuItemElements.forEach((itemElement, index) => {
      const titleElement = itemElement.querySelector('.fdm-item-title');
      const contentElement = itemElement.querySelector('.fdm-item-content');
      
      console.log(`Item ${index}:`, {
        hasTitle: !!titleElement,
        hasContent: !!contentElement,
        title: titleElement?.textContent?.trim(),
        contentLength: contentElement?.textContent?.trim().length
      });
      
      if (!titleElement || !contentElement) return;
      
      const title = titleElement.textContent?.trim();
      const content = contentElement.textContent?.trim();
      
      if (!title || !content) return;
      
      // Skip the weekly menu overview item (we already processed it)
      if (title.toLowerCase().includes('vecka') || title.toLowerCase().includes('week')) {
        return;
      }
      
      // Check if this is a day of the week
      const dayNames = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];
      const isDayMenu = dayNames.some(day => title.includes(day));
      
      console.log(`Item "${title}" isDayMenu: ${isDayMenu}`);
      
      if (!isDayMenu) return;
      
      // Parse the content to extract individual dishes for this day
      const dailyDishes = this.parseDishesFromContent(content);
      console.log(`Parsed ${dailyDishes.length} daily dishes from "${title}":`, dailyDishes);
      
      // Add weekly dishes to this day's menu
      weeklyDishes.forEach(dish => {
        const menuItem: MenuItem = {
          name: `${dish.name} - ${title}`,
          description: dish.description,
          category: dish.category
        };
        
        menuItems.push(menuItem);
      });
      
      // Add daily dishes
      dailyDishes.forEach(dish => {
        const menuItem: MenuItem = {
          name: `${dish.name} - ${title}`,
          description: dish.description,
          category: dish.category
        };
        
        menuItems.push(menuItem);
      });
    });
    
    console.log(`Parsed ${menuItems.length} total menu items from HTML`);
    return menuItems;
  }

  private parseDishesFromContent(content: string): Array<{name: string, description: string, category: string}> {
    const dishes: Array<{name: string, description: string, category: string}> = [];
    
    console.log('Parsing content:', content.substring(0, 200) + '...');
    
    // Split content into lines and process each one
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log(`Found ${lines.length} non-empty lines`);
    
    let currentDishName = '';
    let currentDescription = '';
    let currentCategory = '';
    
    lines.forEach((line, index) => {
      console.log(`Line ${index}: "${line}"`);
      
      // Check if this line contains a dish name (bold text)
      // Look for lines that start with or contain bold text patterns
      const isBoldLine = line.includes('**') || 
                        line.includes('<strong>') || 
                        line.includes('</strong>') ||
                        (line.length > 0 && line.length < 50 && !line.includes('–') && !line.includes('—') && !line.includes('Serveras'));
      
      if (isBoldLine && line.length > 3 && line.length < 50) {
        console.log(`Found dish name on line ${index}: "${line}"`);
        
        // If we have a previous dish, save it
        if (currentDishName && currentDescription) {
          dishes.push({
            name: currentDishName,
            description: currentDescription,
            category: currentCategory
          });
          console.log(`Saved dish: ${currentDishName}`);
        }
        
        // Extract the dish name (remove HTML tags and bold markers)
        currentDishName = line.replace(/\*\*/g, '').replace(/<strong>/g, '').replace(/<\/strong>/g, '').trim();
        currentDescription = '';
        
        // Determine category based on dish name
        if (currentDishName.toLowerCase().includes('sallad') || currentDishName.toLowerCase().includes('caesar')) {
          currentCategory = 'Sallad';
        } else if (currentDishName.toLowerCase().includes('fångst') || currentDishName.toLowerCase().includes('fisk')) {
          currentCategory = 'Fisk';
        } else if (currentDishName.toLowerCase().includes('vegetarisk') || currentDishName.toLowerCase().includes('haloumi')) {
          currentCategory = 'Vegetarisk';
        } else {
          currentCategory = 'Kött';
        }
        
        console.log(`New dish: "${currentDishName}" (category: ${currentCategory})`);
      } else if (currentDishName && line.length > 10 && !line.includes('<!--')) {
        // This is likely a description line
        if (currentDescription) {
          currentDescription += ' ' + line;
        } else {
          currentDescription = line;
        }
        console.log(`Added description: "${line}"`);
      }
    });
    
    // Add the last dish if we have one
    if (currentDishName && currentDescription) {
      dishes.push({
        name: currentDishName,
        description: currentDescription,
        category: currentCategory
      });
      console.log(`Saved final dish: ${currentDishName}`);
    }
    
    console.log(`Total dishes parsed: ${dishes.length}`);
    return dishes;
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