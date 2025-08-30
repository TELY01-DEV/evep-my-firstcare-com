import { test, expect } from '@playwright/test';

test.describe('Patient Management Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    
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

    await page.fill('input[name="email"]', 'doctor@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to patient management page', async ({ page }) => {
    // Click on patients menu item
    await page.click('text=Patients');
    
    // Should navigate to patients page
    await expect(page).toHaveURL('/patients');
    
    // Check if patient list is displayed
    await expect(page.locator('text=Patient Management')).toBeVisible();
  });

  test('should display patient list', async ({ page }) => {
    // Navigate to patients page
    await page.goto('/patients');
    
    // Mock patient list response
    await page.route('**/patients', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          patients: [
            {
              id: '1',
              first_name: 'John',
              last_name: 'Doe',
              date_of_birth: '2015-03-15',
              gender: 'male',
              parent_name: 'Jane Doe',
              parent_phone: '+66-81-234-5678'
            },
            {
              id: '2',
              first_name: 'Jane',
              last_name: 'Smith',
              date_of_birth: '2016-07-22',
              gender: 'female',
              parent_name: 'John Smith',
              parent_phone: '+66-82-345-6789'
            }
          ],
          total: 2,
          page: 1,
          limit: 10
        })
      });
    });
    
    // Wait for patient list to load
    await page.waitForResponse('**/patients');
    
    // Check if patients are displayed
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
  });

  test('should create new patient', async ({ page }) => {
    // Navigate to patients page
    await page.goto('/patients');
    
    // Click add patient button
    await page.click('text=Add Patient');
    
    // Should navigate to patient creation form
    await expect(page).toHaveURL('/patients/new');
    
    // Mock successful patient creation
    await page.route('**/patients', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '3',
            first_name: 'New',
            last_name: 'Patient',
            date_of_birth: '2017-01-01',
            gender: 'male',
            parent_name: 'Parent Name',
            parent_phone: '+66-83-456-7890'
          })
        });
      }
    });
    
    // Fill patient form
    await page.fill('input[name="firstName"]', 'New');
    await page.fill('input[name="lastName"]', 'Patient');
    await page.fill('input[name="dateOfBirth"]', '2017-01-01');
    await page.selectOption('select[name="gender"]', 'male');
    await page.fill('input[name="parentName"]', 'Parent Name');
    await page.fill('input[name="parentPhone"]', '+66-83-456-7890');
    await page.fill('input[name="parentEmail"]', 'parent@example.com');
    await page.fill('input[name="school"]', 'Test School');
    await page.fill('input[name="grade"]', 'Grade 2');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to patient list with success message
    await expect(page).toHaveURL('/patients');
    await expect(page.locator('text=Patient created successfully')).toBeVisible();
  });

  test('should edit existing patient', async ({ page }) => {
    // Navigate to patients page
    await page.goto('/patients');
    
    // Mock patient list
    await page.route('**/patients', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          patients: [
            {
              id: '1',
              first_name: 'John',
              last_name: 'Doe',
              date_of_birth: '2015-03-15',
              gender: 'male',
              parent_name: 'Jane Doe',
              parent_phone: '+66-81-234-5678'
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        })
      });
    });
    
    // Wait for patient list to load
    await page.waitForResponse('**/patients');
    
    // Click edit button for first patient
    await page.click('[data-testid="edit-patient-1"]');
    
    // Should navigate to edit form
    await expect(page).toHaveURL('/patients/1/edit');
    
    // Mock successful update
    await page.route('**/patients/1', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            first_name: 'John Updated',
            last_name: 'Doe',
            date_of_birth: '2015-03-15',
            gender: 'male',
            parent_name: 'Jane Doe',
            parent_phone: '+66-81-234-5678'
          })
        });
      }
    });
    
    // Update patient name
    await page.fill('input[name="firstName"]', 'John Updated');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to patient list with success message
    await expect(page).toHaveURL('/patients');
    await expect(page.locator('text=Patient updated successfully')).toBeVisible();
  });

  test('should delete patient', async ({ page }) => {
    // Navigate to patients page
    await page.goto('/patients');
    
    // Mock patient list
    await page.route('**/patients', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          patients: [
            {
              id: '1',
              first_name: 'John',
              last_name: 'Doe',
              date_of_birth: '2015-03-15',
              gender: 'male',
              parent_name: 'Jane Doe',
              parent_phone: '+66-81-234-5678'
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        })
      });
    });
    
    // Wait for patient list to load
    await page.waitForResponse('**/patients');
    
    // Click delete button
    await page.click('[data-testid="delete-patient-1"]');
    
    // Confirm deletion in modal
    await page.click('text=Confirm Delete');
    
    // Mock successful deletion
    await page.route('**/patients/1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Patient deleted successfully'
          })
        });
      }
    });
    
    // Should show success message
    await expect(page.locator('text=Patient deleted successfully')).toBeVisible();
  });

  test('should search patients', async ({ page }) => {
    // Navigate to patients page
    await page.goto('/patients');
    
    // Mock search response
    await page.route('**/patients/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          patients: [
            {
              id: '1',
              first_name: 'John',
              last_name: 'Doe',
              date_of_birth: '2015-03-15',
              gender: 'male',
              parent_name: 'Jane Doe',
              parent_phone: '+66-81-234-5678'
            }
          ],
          total: 1
        })
      });
    });
    
    // Enter search term
    await page.fill('input[placeholder="Search patients..."]', 'John');
    
    // Wait for search results
    await page.waitForResponse('**/patients/search');
    
    // Check if search results are displayed
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should filter patients by criteria', async ({ page }) => {
    // Navigate to patients page
    await page.goto('/patients');
    
    // Click filter button
    await page.click('text=Filter');
    
    // Select gender filter
    await page.selectOption('select[name="genderFilter"]', 'male');
    
    // Apply filter
    await page.click('text=Apply Filter');
    
    // Mock filtered response
    await page.route('**/patients', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          patients: [
            {
              id: '1',
              first_name: 'John',
              last_name: 'Doe',
              date_of_birth: '2015-03-15',
              gender: 'male',
              parent_name: 'Jane Doe',
              parent_phone: '+66-81-234-5678'
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        })
      });
    });
    
    // Wait for filtered results
    await page.waitForResponse('**/patients');
    
    // Check if only male patients are shown
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should view patient details', async ({ page }) => {
    // Navigate to patients page
    await page.goto('/patients');
    
    // Mock patient list
    await page.route('**/patients', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          patients: [
            {
              id: '1',
              first_name: 'John',
              last_name: 'Doe',
              date_of_birth: '2015-03-15',
              gender: 'male',
              parent_name: 'Jane Doe',
              parent_phone: '+66-81-234-5678'
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        })
      });
    });
    
    // Wait for patient list to load
    await page.waitForResponse('**/patients');
    
    // Click on patient name to view details
    await page.click('text=John Doe');
    
    // Should navigate to patient details page
    await expect(page).toHaveURL('/patients/1');
    
    // Check if patient details are displayed
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Date of Birth: 2015-03-15')).toBeVisible();
    await expect(page.locator('text=Gender: Male')).toBeVisible();
    await expect(page.locator('text=Parent: Jane Doe')).toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    // Navigate to patient creation form
    await page.goto('/patients/new');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('text=Last name is required')).toBeVisible();
    await expect(page.locator('text=Date of birth is required')).toBeVisible();
  });

  test('should paginate patient list', async ({ page }) => {
    // Navigate to patients page
    await page.goto('/patients');
    
    // Mock paginated response
    await page.route('**/patients', async route => {
      const url = new URL(route.request().url());
      const page = url.searchParams.get('page') || '1';
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          patients: [
            {
              id: page,
              first_name: `Patient ${page}`,
              last_name: 'Doe',
              date_of_birth: '2015-03-15',
              gender: 'male',
              parent_name: 'Jane Doe',
              parent_phone: '+66-81-234-5678'
            }
          ],
          total: 25,
          page: parseInt(page),
          limit: 10
        })
      });
    });
    
    // Wait for initial page to load
    await page.waitForResponse('**/patients');
    
    // Click next page button
    await page.click('[data-testid="next-page"]');
    
    // Wait for next page to load
    await page.waitForResponse('**/patients');
    
    // Check if page 2 is displayed
    await expect(page.locator('text=Patient 2')).toBeVisible();
  });

  test('should export patient data', async ({ page }) => {
    // Navigate to patients page
    await page.goto('/patients');
    
    // Mock export response
    await page.route('**/patients/export', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'id,first_name,last_name,date_of_birth,gender\n1,John,Doe,2015-03-15,male'
      });
    });
    
    // Click export button
    await page.click('text=Export');
    
    // Should trigger download
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Export CSV');
    const download = await downloadPromise;
    
    // Check download filename
    expect(download.suggestedFilename()).toContain('patients');
  });
});

