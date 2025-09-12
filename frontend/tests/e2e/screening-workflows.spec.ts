import { test, expect } from '@playwright/test';

test.describe('Screening Workflows', () => {
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

  test('should navigate to screening page', async ({ page }) => {
    // Click on screening menu item
    await page.click('text=Screenings');
    
    // Should navigate to screenings page
    await expect(page).toHaveURL('/screenings');
    
    // Check if screening interface is displayed
    await expect(page.locator('text=Vision Screening')).toBeVisible();
  });

  test('should create new screening session', async ({ page }) => {
    // Navigate to screenings page
    await page.goto('/screenings');
    
    // Click create session button
    await page.click('text=Create Session');
    
    // Should navigate to session creation form
    await expect(page).toHaveURL('/screenings/sessions/new');
    
    // Mock successful session creation
    await page.route('**/screenings/sessions', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            session_name: 'Test Screening Session',
            screening_type: 'vision',
            location: 'Test School',
            scheduled_date: '2024-01-15T10:00:00Z',
            expected_participants: 50,
            status: 'scheduled'
          })
        });
      }
    });
    
    // Fill session form
    await page.fill('input[name="sessionName"]', 'Test Screening Session');
    await page.selectOption('select[name="screeningType"]', 'vision');
    await page.fill('input[name="location"]', 'Test School');
    await page.fill('input[name="scheduledDate"]', '2024-01-15T10:00:00');
    await page.fill('input[name="expectedParticipants"]', '50');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to session list with success message
    await expect(page).toHaveURL('/screenings/sessions');
    await expect(page.locator('text=Session created successfully')).toBeVisible();
  });

  test('should start vision screening for patient', async ({ page }) => {
    // Navigate to screenings page
    await page.goto('/screenings');
    
    // Mock patient list for selection
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
              gender: 'male'
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        })
      });
    });
    
    // Click start screening button
    await page.click('text=Start Screening');
    
    // Select patient
    await page.click('text=John Doe');
    await page.click('text=Select Patient');
    
    // Should navigate to screening interface
    await expect(page).toHaveURL(/\/screenings\/\d+\/patient\/\d+/);
    
    // Check if screening interface is displayed
    await expect(page.locator('text=Vision Screening')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should conduct vision screening test', async ({ page }) => {
    // Navigate to screening interface
    await page.goto('/screenings/1/patient/1');
    
    // Mock screening interface
    await page.route('**/screenings/1/patient/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          patient: {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            date_of_birth: '2015-03-15',
            gender: 'male'
          },
          screening: {
            id: '1',
            screening_type: 'vision',
            status: 'in_progress'
          }
        })
      });
    });
    
    // Wait for screening interface to load
    await page.waitForResponse('**/screenings/1/patient/1');
    
    // Start left eye test
    await page.click('text=Left Eye');
    
    // Mock eye chart display
    await expect(page.locator('[data-testid="eye-chart"]')).toBeVisible();
    
    // Simulate patient response (20/20)
    await page.click('[data-testid="optotype-20-20"]');
    
    // Move to right eye
    await page.click('text=Right Eye');
    
    // Simulate patient response (20/25)
    await page.click('[data-testid="optotype-20-25"]');
    
    // Complete screening
    await page.click('text=Complete Screening');
    
    // Mock successful screening completion
    await page.route('**/screenings/1/results', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            patient_id: '1',
            screening_type: 'vision',
            results: {
              left_eye: '20/20',
              right_eye: '20/25',
              color_vision: 'normal',
              depth_perception: 'normal'
            },
            status: 'completed',
            recommendations: 'Follow up in 6 months'
          })
        });
      }
    });
    
    // Should show completion message
    await expect(page.locator('text=Screening completed successfully')).toBeVisible();
  });

  test('should view screening results', async ({ page }) => {
    // Navigate to screening results
    await page.goto('/screenings/1/results');
    
    // Mock screening results
    await page.route('**/screenings/1/results', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          patient_id: '1',
          patient: {
            first_name: 'John',
            last_name: 'Doe',
            date_of_birth: '2015-03-15'
          },
          screening_type: 'vision',
          screening_date: '2024-01-15T10:00:00Z',
          results: {
            left_eye: '20/20',
            right_eye: '20/25',
            color_vision: 'normal',
            depth_perception: 'normal'
          },
          status: 'completed',
          recommendations: 'Follow up in 6 months',
          notes: 'Patient performed well during screening'
        })
      });
    });
    
    // Wait for results to load
    await page.waitForResponse('**/screenings/1/results');
    
    // Check if results are displayed
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Left Eye: 20/20')).toBeVisible();
    await expect(page.locator('text=Right Eye: 20/25')).toBeVisible();
    await expect(page.locator('text=Color Vision: Normal')).toBeVisible();
    await expect(page.locator('text=Follow up in 6 months')).toBeVisible();
  });

  test('should generate screening report', async ({ page }) => {
    // Navigate to screening results
    await page.goto('/screenings/1/results');
    
    // Mock screening results
    await page.route('**/screenings/1/results', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          patient_id: '1',
          patient: {
            first_name: 'John',
            last_name: 'Doe',
            date_of_birth: '2015-03-15'
          },
          screening_type: 'vision',
          screening_date: '2024-01-15T10:00:00Z',
          results: {
            left_eye: '20/20',
            right_eye: '20/25',
            color_vision: 'normal',
            depth_perception: 'normal'
          },
          status: 'completed'
        })
      });
    });
    
    // Wait for results to load
    await page.waitForResponse('**/screenings/1/results');
    
    // Mock PDF generation
    await page.route('**/screenings/1/report', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('mock-pdf-content')
      });
    });
    
    // Click generate report button
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Generate Report');
    const download = await downloadPromise;
    
    // Check download filename
    expect(download.suggestedFilename()).toContain('screening-report');
  });

  test('should schedule follow-up appointment', async ({ page }) => {
    // Navigate to screening results
    await page.goto('/screenings/1/results');
    
    // Mock screening results
    await page.route('**/screenings/1/results', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          patient_id: '1',
          patient: {
            first_name: 'John',
            last_name: 'Doe',
            date_of_birth: '2015-03-15'
          },
          screening_type: 'vision',
          results: {
            left_eye: '20/20',
            right_eye: '20/25',
            color_vision: 'normal',
            depth_perception: 'normal'
          },
          status: 'completed'
        })
      });
    });
    
    // Wait for results to load
    await page.waitForResponse('**/screenings/1/results');
    
    // Click schedule follow-up button
    await page.click('text=Schedule Follow-up');
    
    // Should navigate to appointment scheduling
    await expect(page).toHaveURL(/\/appointments\/new/);
    
    // Mock successful appointment creation
    await page.route('**/appointments', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            patient_id: '1',
            appointment_date: '2024-07-15T10:00:00Z',
            type: 'follow_up',
            status: 'scheduled'
          })
        });
      }
    });
    
    // Fill appointment form
    await page.fill('input[name="appointmentDate"]', '2024-07-15T10:00:00');
    await page.selectOption('select[name="appointmentType"]', 'follow_up');
    await page.fill('textarea[name="notes"]', 'Follow-up from vision screening');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=Appointment scheduled successfully')).toBeVisible();
  });

  test('should view screening history', async ({ page }) => {
    // Navigate to patient details
    await page.goto('/patients/1');
    
    // Mock patient details with screening history
    await page.route('**/patients/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '2015-03-15',
          gender: 'male',
          screenings: [
            {
              id: '1',
              screening_type: 'vision',
              screening_date: '2024-01-15T10:00:00Z',
              results: {
                left_eye: '20/20',
                right_eye: '20/25'
              },
              status: 'completed'
            },
            {
              id: '2',
              screening_type: 'vision',
              screening_date: '2023-07-15T10:00:00Z',
              results: {
                left_eye: '20/20',
                right_eye: '20/20'
              },
              status: 'completed'
            }
          ]
        })
      });
    });
    
    // Wait for patient details to load
    await page.waitForResponse('**/patients/1');
    
    // Click on screening history tab
    await page.click('text=Screening History');
    
    // Check if screening history is displayed
    await expect(page.locator('text=Vision Screening - 2024-01-15')).toBeVisible();
    await expect(page.locator('text=Vision Screening - 2023-07-15')).toBeVisible();
    await expect(page.locator('text=Left Eye: 20/20')).toBeVisible();
    await expect(page.locator('text=Right Eye: 20/25')).toBeVisible();
  });

  test('should handle screening errors gracefully', async ({ page }) => {
    // Navigate to screening interface
    await page.goto('/screenings/1/patient/1');
    
    // Mock network error
    await page.route('**/screenings/1/patient/1', async route => {
      await route.abort('failed');
    });
    
    // Should show error message
    await expect(page.locator('text=Failed to load screening')).toBeVisible();
    
    // Should show retry button
    await expect(page.locator('text=Retry')).toBeVisible();
  });

  test('should validate screening form inputs', async ({ page }) => {
    // Navigate to session creation form
    await page.goto('/screenings/sessions/new');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Session name is required')).toBeVisible();
    await expect(page.locator('text=Screening type is required')).toBeVisible();
    await expect(page.locator('text=Location is required')).toBeVisible();
    await expect(page.locator('text=Scheduled date is required')).toBeVisible();
  });

  test('should filter screening sessions', async ({ page }) => {
    // Navigate to screening sessions
    await page.goto('/screenings/sessions');
    
    // Mock sessions list
    await page.route('**/screenings/sessions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              id: '1',
              session_name: 'Vision Screening Session',
              screening_type: 'vision',
              location: 'Test School',
              scheduled_date: '2024-01-15T10:00:00Z',
              status: 'scheduled'
            },
            {
              id: '2',
              session_name: 'Color Vision Screening',
              screening_type: 'color_vision',
              location: 'Another School',
              scheduled_date: '2024-01-16T10:00:00Z',
              status: 'completed'
            }
          ],
          total: 2
        })
      });
    });
    
    // Wait for sessions to load
    await page.waitForResponse('**/screenings/sessions');
    
    // Click filter button
    await page.click('text=Filter');
    
    // Select vision screening type
    await page.selectOption('select[name="screeningTypeFilter"]', 'vision');
    
    // Apply filter
    await page.click('text=Apply Filter');
    
    // Mock filtered response
    await page.route('**/screenings/sessions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              id: '1',
              session_name: 'Vision Screening Session',
              screening_type: 'vision',
              location: 'Test School',
              scheduled_date: '2024-01-15T10:00:00Z',
              status: 'scheduled'
            }
          ],
          total: 1
        })
      });
    });
    
    // Wait for filtered results
    await page.waitForResponse('**/screenings/sessions');
    
    // Check if only vision screenings are shown
    await expect(page.locator('text=Vision Screening Session')).toBeVisible();
    await expect(page.locator('text=Color Vision Screening')).not.toBeVisible();
  });

  test('should export screening data', async ({ page }) => {
    // Navigate to screening sessions
    await page.goto('/screenings/sessions');
    
    // Mock sessions list
    await page.route('**/screenings/sessions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              id: '1',
              session_name: 'Vision Screening Session',
              screening_type: 'vision',
              location: 'Test School',
              scheduled_date: '2024-01-15T10:00:00Z',
              status: 'scheduled'
            }
          ],
          total: 1
        })
      });
    });
    
    // Wait for sessions to load
    await page.waitForResponse('**/screenings/sessions');
    
    // Mock export response
    await page.route('**/screenings/export', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'id,session_name,screening_type,location,status\n1,Vision Screening Session,vision,Test School,scheduled'
      });
    });
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Export');
    await page.click('text=Export CSV');
    const download = await downloadPromise;
    
    // Check download filename
    expect(download.suggestedFilename()).toContain('screenings');
  });
});

