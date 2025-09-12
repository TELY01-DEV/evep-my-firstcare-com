import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
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
    
    // Clean up test data
    console.log('Cleaning up test environment...');
    
    // You can add any global cleanup here, such as:
    // - Removing test users
    // - Cleaning up test data
    // - Resetting test environment
    
    console.log('Test environment cleanup complete');
    
  } catch (error) {
    console.error('Error during global teardown:', error);
    // Don't throw error during teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

export default globalTeardown;

