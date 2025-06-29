# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b643ee39-ac93-4a45-aae6-d868ba365f48

## Custom Restaurant Scraper System

This application uses a custom scraper system to fetch daily lunch menus from restaurants. Each restaurant has its own dedicated scraper that can be customized to work with the specific website structure.

### How the Scraper System Works

1. **Individual Scrapers**: Each restaurant has its own scraper class that implements the `RestaurantScraper` interface
2. **Scraper Registry**: All scrapers are registered in the `ScraperRegistry` for easy management
3. **Customizable**: Each scraper can be tailored to the specific HTML structure of the restaurant's website

### Adding a New Restaurant Scraper

To add a new restaurant, create a new scraper class:

```typescript
import { RestaurantScraper, ScraperResult, ScrapedMenu, MenuItem } from '@/utils/ScraperService';

export class MyRestaurantScraper implements RestaurantScraper {
  id = 'my-restaurant';
  name = 'My Restaurant';
  url = 'https://myrestaurant.com';

  async scrape(): Promise<ScraperResult> {
    try {
      // Implement your scraping logic here
      // 1. Fetch the website HTML
      // 2. Parse the HTML to extract menu items
      // 3. Return structured menu data
      
      const menuItems: MenuItem[] = [
        {
          name: 'Daily Special',
          description: 'Description of the dish',
          price: '$15.99',
          category: 'Main Course'
        }
      ];

      const result: ScrapedMenu = {
        restaurantId: this.id,
        items: menuItems,
        lastUpdated: new Date().toISOString(),
        source: this.url
      };

      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to scrape menu' 
      };
    }
  }
}
```

Then register it in `src/utils/ScraperService.ts`:

```typescript
import { MyRestaurantScraper } from './scrapers/MyRestaurantScraper';
ScraperRegistry.register(new MyRestaurantScraper());
```

### Important Notes

- **CORS Limitations**: Due to browser security restrictions, direct web scraping from the frontend may not work for all websites
- **Backend Required**: For production use, you'll need a backend service (Node.js, serverless function, etc.) to handle the actual web scraping
- **Rate Limiting**: Be respectful of restaurant websites and implement appropriate rate limiting

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b643ee39-ac93-4a45-aae6-d868ba365f48) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b643ee39-ac93-4a45-aae6-d868ba365f48) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
