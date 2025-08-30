import { test, expect } from '@playwright/test';

test.describe('Authentication Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Enter invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Check for email validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Mock successful login response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          token_type: 'bearer',
          user: {
            id: '1',
            email: 'doctor@example.com',
            first_name: 'Dr. John',
            last_name: 'Doe',
            role: 'doctor'
          }
        })
      });
    });

    // Fill login form
    await page.fill('input[name="email"]', 'doctor@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Check if user info is displayed
    await expect(page.locator('text=Dr. John Doe')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Mock failed login response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Invalid credentials'
        })
      });
    });

    // Fill login form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    // Click on register link
    await page.click('text=Don\'t have an account?');
    
    // Should navigate to registration page
    await expect(page).toHaveURL('/register');
  });

  test('should successfully register new user', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    
    // Mock successful registration response
    await page.route('**/auth/register', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'User registered successfully',
          user_id: '123',
          user: {
            id: '123',
            email: 'newuser@example.com',
            first_name: 'New',
            last_name: 'User',
            role: 'doctor'
          }
        })
      });
    });

    // Fill registration form
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.fill('input[name="firstName"]', 'New');
    await page.fill('input[name="lastName"]', 'User');
    await page.selectOption('select[name="role"]', 'doctor');
    await page.fill('input[name="organization"]', 'Test Hospital');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=User registered successfully')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          token_type: 'bearer',
          user: {
            id: '1',
            email: 'doctor@example.com',
            first_name: 'Dr. John',
            last_name: 'Doe',
            role: 'doctor'
          }
        })
      });
    });

    await page.fill('input[name="email"]', 'doctor@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Click logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/auth/login', async route => {
      await route.abort('failed');
    });

    // Fill and submit form
    await page.fill('input[name="email"]', 'doctor@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show network error message
    await expect(page.locator('text=Network error')).toBeVisible();
  });

  test('should remember user session', async ({ page, context }) => {
    // Mock successful login
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          token_type: 'bearer',
          user: {
            id: '1',
            email: 'doctor@example.com',
            first_name: 'Dr. John',
            last_name: 'Doe',
            role: 'doctor'
          }
        })
      });
    });

    // Login
    await page.fill('input[name="email"]', 'doctor@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Refresh page
    await page.reload();
    
    // Should still be on dashboard (session remembered)
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dr. John Doe')).toBeVisible();
  });

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page
    await page.goto('/patients');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Mock successful login
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          token_type: 'bearer',
          user: {
            id: '1',
            email: 'doctor@example.com',
            first_name: 'Dr. John',
            last_name: 'Doe',
            role: 'doctor'
          }
        })
      });
    });

    // Login
    await page.fill('input[name="email"]', 'doctor@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to originally requested page
    await expect(page).toHaveURL('/patients');
  });
});

