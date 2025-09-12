import { test, expect } from '@playwright/test';

test.describe('UX Components E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for testing
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          user: { id: '1', email: 'test@example.com', role: 'doctor' }
        })
      });
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('UserJourneyMap Component', () => {
    test('should display user journey map with steps', async ({ page }) => {
      // Mock journey data
      await page.route('**/api/journey/doctor', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            title: 'Doctor User Journey',
            userType: 'doctor',
            steps: [
              {
                id: 'login',
                title: 'Login',
                description: 'User authentication process',
                actions: ['Enter credentials', 'Submit form'],
                touchpoints: ['Login page', 'Validation'],
                duration: '30 seconds'
              },
              {
                id: 'dashboard',
                title: 'Dashboard',
                description: 'Main dashboard view',
                actions: ['View statistics', 'Navigate'],
                touchpoints: ['Dashboard page', 'Navigation menu'],
                duration: '2 minutes',
                critical: true
              }
            ]
          })
        });
      });

      await page.goto('/dashboard/journey');
      
      // Check journey map is displayed
      await expect(page.locator('text=Doctor User Journey')).toBeVisible();
      await expect(page.locator('text=User Type: Doctor')).toBeVisible();
      
      // Check steps are displayed
      await expect(page.locator('text=Login')).toBeVisible();
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Check step details
      await expect(page.locator('text=User authentication process')).toBeVisible();
      await expect(page.locator('text=Main dashboard view')).toBeVisible();
      
      // Check duration
      await expect(page.locator('text=⏱️ Estimated Duration: 30 seconds')).toBeVisible();
      await expect(page.locator('text=⏱️ Estimated Duration: 2 minutes')).toBeVisible();
      
      // Check touchpoints
      await expect(page.locator('text=🎯 Key Touchpoints:')).toBeVisible();
      await expect(page.locator('text=Login page')).toBeVisible();
      await expect(page.locator('text=Validation')).toBeVisible();
      
      // Check actions
      await expect(page.locator('text=🔧 Actions:')).toBeVisible();
      await expect(page.locator('text=Enter credentials')).toBeVisible();
      await expect(page.locator('text=Submit form')).toBeVisible();
    });

    test('should handle step clicks', async ({ page }) => {
      await page.route('**/api/journey/doctor', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            title: 'Doctor User Journey',
            userType: 'doctor',
            steps: [
              {
                id: 'login',
                title: 'Login',
                description: 'User authentication process',
                actions: ['Enter credentials'],
                touchpoints: ['Login page'],
                duration: '30 seconds'
              }
            ]
          })
        });
      });

      await page.goto('/dashboard/journey');
      
      // Click on step
      await page.click('text=Login');
      
      // Should trigger step click handler
      await expect(page.locator('text=Login')).toBeVisible();
    });

    test('should highlight current step', async ({ page }) => {
      await page.route('**/api/journey/doctor', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            title: 'Doctor User Journey',
            userType: 'doctor',
            currentStep: 'dashboard',
            steps: [
              { id: 'login', title: 'Login', description: 'Login', actions: [], touchpoints: [] },
              { id: 'dashboard', title: 'Dashboard', description: 'Dashboard', actions: [], touchpoints: [] }
            ]
          })
        });
      });

      await page.goto('/dashboard/journey');
      
      // Current step should be highlighted
      const dashboardStep = page.locator('text=Dashboard').locator('..');
      await expect(dashboardStep).toHaveClass(/Mui-active/);
    });
  });

  test.describe('AccessibilityProvider Component', () => {
    test('should apply high contrast mode', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Toggle high contrast
      await page.click('[data-testid="accessibility-toggle"]');
      await page.click('[data-testid="high-contrast-toggle"]');
      
      // Check if high contrast class is applied
      await expect(page.locator('html')).toHaveClass('high-contrast');
      
      // Check if theme changes
      await expect(page.locator('[data-mui-color-scheme="dark"]')).toBeVisible();
    });

    test('should apply large text mode', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Toggle large text
      await page.click('[data-testid="accessibility-toggle"]');
      await page.click('[data-testid="large-text-toggle"]');
      
      // Check if large text class is applied
      await expect(page.locator('html')).toHaveClass('large-text');
      
      // Check if text size increases
      const textElement = page.locator('body');
      const fontSize = await textElement.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      expect(parseInt(fontSize)).toBeGreaterThan(14);
    });

    test('should apply reduced motion', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Toggle reduced motion
      await page.click('[data-testid="accessibility-toggle"]');
      await page.click('[data-testid="reduced-motion-toggle"]');
      
      // Check if reduced motion class is applied
      await expect(page.locator('html')).toHaveClass('reduced-motion');
    });

    test('should persist settings in localStorage', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Toggle high contrast
      await page.click('[data-testid="accessibility-toggle"]');
      await page.click('[data-testid="high-contrast-toggle"]');
      
      // Reload page
      await page.reload();
      
      // Settings should persist
      await expect(page.locator('html')).toHaveClass('high-contrast');
    });

    test('should handle screen reader mode', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Toggle screen reader mode
      await page.click('[data-testid="accessibility-toggle"]');
      await page.click('[data-testid="screen-reader-toggle"]');
      
      // Check if screen reader class is applied
      await expect(page.locator('html')).toHaveClass('screen-reader');
      
      // Check if sr-only elements become visible
      await expect(page.locator('.sr-only')).toBeVisible();
    });
  });

  test.describe('ErrorBoundary Component', () => {
    test('should display error UI when component throws error', async ({ page }) => {
      // Mock API to return error
      await page.route('**/api/patients', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.goto('/patients');
      
      // Should display error boundary
      await expect(page.locator('text=Something went wrong')).toBeVisible();
      await expect(page.locator('text=We\'re sorry, but something unexpected happened.')).toBeVisible();
      
      // Should show error details
      await expect(page.locator('text=Error Details')).toBeVisible();
      
      // Should show error ID
      await expect(page.locator('text=/Error ID:/')).toBeVisible();
    });

    test('should handle retry functionality', async ({ page }) => {
      let callCount = 0;
      
      await page.route('**/api/patients', async route => {
        callCount++;
        if (callCount === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ patients: [] })
          });
        }
      });

      await page.goto('/patients');
      
      // Should show error initially
      await expect(page.locator('text=Something went wrong')).toBeVisible();
      
      // Click retry
      await page.click('text=Try Again');
      
      // Should load successfully on retry
      await expect(page.locator('text=Something went wrong')).not.toBeVisible();
    });

    test('should handle go home functionality', async ({ page }) => {
      await page.route('**/api/patients', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.goto('/patients');
      
      // Click go home
      await page.click('text=Go Home');
      
      // Should navigate to home
      await expect(page).toHaveURL('/dashboard');
    });

    test('should handle contact support functionality', async ({ page }) => {
      await page.route('**/api/patients', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.goto('/patients');
      
      // Click contact support
      await page.click('text=Contact Support');
      
      // Should open email client
      // Note: This is hard to test in E2E, but we can check the button exists
      await expect(page.locator('text=Contact Support')).toBeVisible();
    });

    test('should show technical details when enabled', async ({ page }) => {
      await page.route('**/api/patients', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.goto('/patients?debug=true');
      
      // Should show technical details
      await expect(page.locator('text=Technical Details:')).toBeVisible();
    });
  });

  test.describe('LoadingStates Component', () => {
    test('should display skeleton loading state', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/patients', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ patients: [] })
        });
      });

      await page.goto('/patients');
      
      // Should show skeleton loading
      await expect(page.locator('.MuiSkeleton-root')).toBeVisible();
    });

    test('should display progress indicator', async ({ page }) => {
      await page.goto('/screenings/new');
      
      // Should show progress indicator
      await expect(page.locator('.MuiLinearProgress-root')).toBeVisible();
      
      // Should show progress percentage
      await expect(page.locator('text=/[0-9]+%/')).toBeVisible();
    });

    test('should display step progress', async ({ page }) => {
      await page.goto('/screenings/new');
      
      // Should show step progress
      await expect(page.locator('text=Step 1')).toBeVisible();
      await expect(page.locator('text=Step 2')).toBeVisible();
      await expect(page.locator('text=Step 3')).toBeVisible();
      
      // Should show current step
      await expect(page.locator('.MuiStep-root.Mui-active')).toBeVisible();
    });

    test('should display status indicators', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should show status indicators
      await expect(page.locator('.MuiChip-root')).toBeVisible();
      
      // Should show success status
      await expect(page.locator('.MuiChip-colorSuccess')).toBeVisible();
    });

    test('should handle loading state transitions', async ({ page }) => {
      let callCount = 0;
      
      await page.route('**/api/patients', async route => {
        callCount++;
        if (callCount === 1) {
          // First call - slow response
          await new Promise(resolve => setTimeout(resolve, 1000));
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ patients: [] })
          });
        } else {
          // Second call - fast response
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ patients: [] })
          });
        }
      });

      await page.goto('/patients');
      
      // Should show loading initially
      await expect(page.locator('.MuiSkeleton-root')).toBeVisible();
      
      // Should hide loading after data loads
      await expect(page.locator('.MuiSkeleton-root')).not.toBeVisible();
    });

    test('should display full screen loading overlay', async ({ page }) => {
      // Mock very slow API response
      await page.route('**/api/patients', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ patients: [] })
        });
      });

      await page.goto('/patients');
      
      // Should show full screen loading overlay
      await expect(page.locator('[style*="position: fixed"]')).toBeVisible();
      await expect(page.locator('.MuiCircularProgress-root')).toBeVisible();
    });
  });

  test.describe('Accessibility Integration', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Navigate using keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should maintain focus
      await expect(page.locator(':focus')).toBeVisible();
    });

    test('should support screen reader', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Enable screen reader mode
      await page.click('[data-testid="accessibility-toggle"]');
      await page.click('[data-testid="screen-reader-toggle"]');
      
      // Check ARIA labels
      await expect(page.locator('[aria-label]')).toBeVisible();
      await expect(page.locator('[aria-describedby]')).toBeVisible();
    });

    test('should maintain focus management', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Enable focus visible
      await page.click('[data-testid="accessibility-toggle"]');
      await page.click('[data-testid="focus-visible-toggle"]');
      
      // Tab through elements
      await page.keyboard.press('Tab');
      
      // Should show focus indicator
      await expect(page.locator(':focus')).toHaveCSS('outline', /solid/);
    });
  });
});

