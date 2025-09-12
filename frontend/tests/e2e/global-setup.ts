import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  // Start browser and create a new context
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    await page.goto(baseURL!);
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Check if we need to set up test data
    console.log('Setting up test environment...');
    
    // You can add any global setup here, such as:
    // - Creating test users
    // - Setting up test data
    // - Configuring test environment
    
    console.log('Test environment setup complete');
    
  } catch (error) {
    console.error('Error during global setup:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

