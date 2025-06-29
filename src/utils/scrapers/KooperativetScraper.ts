import { RestaurantScraper, ScraperResult, ScrapedMenu, MenuItem } from '../ScraperService';

/**
 * Scraper for Kooperativet restaurant in Gothenburg, Sweden
 * Website: https://www.kooperativet.se/
 * Serves daily lunch menus Monday-Friday 11-13:30
 */
export class KooperativetScraper implements RestaurantScraper {
  id = 'kooperativet';
  name = 'Kooperativet';
  url = 'https://www.kooperativet.se/';

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
    console.log('Successfully fetched HTML from Kooperativet website');
    
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract menu items from the parsed HTML
    return this.parseMenuFromHTML(doc);
  }

  private parseMenuFromHTML(doc: Document): MenuItem[] {
    const menuItems: MenuItem[] = [];
    
    // Define day sections to look for
    const daySections = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    daySections.forEach(dayId => {
      const daySection = doc.getElementById(dayId);
      if (!daySection) return;
      
      // Get the day name in Swedish
      const dayNames: { [key: string]: string } = {
        'monday': 'Måndag',
        'tuesday': 'Tisdag', 
        'wednesday': 'Onsdag',
        'thursday': 'Torsdag',
        'friday': 'Fredag'
      };
      
      const dayName = dayNames[dayId];
      
      // Find all text blocks within this day's section
      const textBlocks = daySection.querySelectorAll('.avia_textblock');
      
      textBlocks.forEach(block => {
        const text = block.textContent?.trim();
        if (!text) return;
        
        // Split the text into paragraphs and process each one
        const paragraphs = text.split('\n').map(p => p.trim()).filter(p => p.length > 0);
        
        let currentCategory = '';
        
        paragraphs.forEach(paragraph => {
          // Check if this is a category header (bold text)
          if (paragraph.startsWith('SALLADER') || 
              paragraph.startsWith('VECKANS SOMMARSPECIAL') ||
              paragraph.startsWith('KÖTT') ||
              paragraph.startsWith('FISK') ||
              paragraph.startsWith('THAI') ||
              paragraph.startsWith('INDISK') ||
              paragraph.startsWith('VÄRLDEN') ||
              paragraph.startsWith('VEGETARISK') ||
              paragraph.startsWith('VEGETARISKT')) {
            currentCategory = paragraph;
            return;
          }
          
          // If we have a category and this looks like a menu item description
          if (currentCategory && paragraph.length > 20 && !paragraph.includes('–') && !paragraph.includes('—')) {
            // Skip if it's just formatting or separators
            if (paragraph.includes('....................................') || 
                paragraph.includes('Vecka') ||
                paragraph.includes('Serveras') ||
                paragraph.includes('Priset')) {
              return;
            }
            
            // Create menu item
            const menuItem: MenuItem = {
              name: `${currentCategory} - ${dayName}`,
              description: paragraph,
              category: currentCategory
            };
            
            menuItems.push(menuItem);
          }
        });
      });
    });
    
    console.log(`Parsed ${menuItems.length} menu items from HTML`);
    return menuItems;
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