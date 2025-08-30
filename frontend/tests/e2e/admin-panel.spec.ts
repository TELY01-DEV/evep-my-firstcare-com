import { test, expect } from '@playwright/test';

test.describe('Admin Panel Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/login');
    
    // Mock successful admin login
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-admin-token',
          token_type: 'bearer',
          user: {
            id: '1',
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin'
          }
        })
      });
    });

    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
  });

  test('should access admin dashboard', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    
    // Mock admin dashboard data
    await page.route('**/admin/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_users: 150,
          total_patients: 500,
          total_screenings: 1200,
          recent_activity: [
            {
              id: '1',
              action: 'User created',
              user: 'Dr. John Doe',
              timestamp: '2024-01-15T10:00:00Z'
            },
            {
              id: '2',
              action: 'Screening completed',
              user: 'Patient Jane Smith',
              timestamp: '2024-01-15T09:30:00Z'
            }
          ]
        })
      });
    });
    
    // Wait for dashboard to load
    await page.waitForResponse('**/admin/dashboard');
    
    // Check if admin dashboard elements are displayed
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('text=Total Users: 150')).toBeVisible();
    await expect(page.locator('text=Total Patients: 500')).toBeVisible();
    await expect(page.locator('text=Total Screenings: 1200')).toBeVisible();
  });

  test('should manage users', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Mock users list
    await page.route('**/admin/users', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              id: '1',
              email: 'doctor@example.com',
              first_name: 'Dr. John',
              last_name: 'Doe',
              role: 'doctor',
              organization: 'Test Hospital',
              status: 'active',
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: '2',
              email: 'nurse@example.com',
              first_name: 'Nurse Jane',
              last_name: 'Smith',
              role: 'nurse',
              organization: 'Test Hospital',
              status: 'active',
              created_at: '2024-01-02T00:00:00Z'
            }
          ],
          total: 2,
          page: 1,
          limit: 10
        })
      });
    });
    
    // Wait for users list to load
    await page.waitForResponse('**/admin/users');
    
    // Check if users are displayed
    await expect(page.locator('text=Dr. John Doe')).toBeVisible();
    await expect(page.locator('text=Nurse Jane Smith')).toBeVisible();
  });

  test('should create new user', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Click add user button
    await page.click('text=Add User');
    
    // Should navigate to user creation form
    await expect(page).toHaveURL('/admin/users/new');
    
    // Mock successful user creation
    await page.route('**/admin/users', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '3',
            email: 'newuser@example.com',
            first_name: 'New',
            last_name: 'User',
            role: 'doctor',
            organization: 'Test Hospital',
            status: 'active'
          })
        });
      }
    });
    
    // Fill user form
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="firstName"]', 'New');
    await page.fill('input[name="lastName"]', 'User');
    await page.selectOption('select[name="role"]', 'doctor');
    await page.fill('input[name="organization"]', 'Test Hospital');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to user list with success message
    await expect(page).toHaveURL('/admin/users');
    await expect(page.locator('text=User created successfully')).toBeVisible();
  });

  test('should edit user', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Mock users list
    await page.route('**/admin/users', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              id: '1',
              email: 'doctor@example.com',
              first_name: 'Dr. John',
              last_name: 'Doe',
              role: 'doctor',
              organization: 'Test Hospital',
              status: 'active'
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        })
      });
    });
    
    // Wait for users list to load
    await page.waitForResponse('**/admin/users');
    
    // Click edit button for first user
    await page.click('[data-testid="edit-user-1"]');
    
    // Should navigate to edit form
    await expect(page).toHaveURL('/admin/users/1/edit');
    
    // Mock successful update
    await page.route('**/admin/users/1', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            email: 'doctor@example.com',
            first_name: 'Dr. John Updated',
            last_name: 'Doe',
            role: 'doctor',
            organization: 'Test Hospital',
            status: 'active'
          })
        });
      }
    });
    
    // Update user name
    await page.fill('input[name="firstName"]', 'Dr. John Updated');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to user list with success message
    await expect(page).toHaveURL('/admin/users');
    await expect(page.locator('text=User updated successfully')).toBeVisible();
  });

  test('should deactivate user', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Mock users list
    await page.route('**/admin/users', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              id: '1',
              email: 'doctor@example.com',
              first_name: 'Dr. John',
              last_name: 'Doe',
              role: 'doctor',
              organization: 'Test Hospital',
              status: 'active'
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        })
      });
    });
    
    // Wait for users list to load
    await page.waitForResponse('**/admin/users');
    
    // Click deactivate button
    await page.click('[data-testid="deactivate-user-1"]');
    
    // Confirm deactivation in modal
    await page.click('text=Confirm Deactivate');
    
    // Mock successful deactivation
    await page.route('**/admin/users/1/deactivate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'User deactivated successfully'
        })
      });
    });
    
    // Should show success message
    await expect(page.locator('text=User deactivated successfully')).toBeVisible();
  });

  test('should view audit logs', async ({ page }) => {
    // Navigate to audit logs
    await page.goto('/admin/audit-logs');
    
    // Mock audit logs
    await page.route('**/admin/audit-logs', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: [
            {
              id: '1',
              action: 'User created',
              user: 'admin@example.com',
              target: 'doctor@example.com',
              timestamp: '2024-01-15T10:00:00Z',
              ip_address: '192.168.1.1',
              user_agent: 'Mozilla/5.0...'
            },
            {
              id: '2',
              action: 'Patient updated',
              user: 'doctor@example.com',
              target: 'Patient ID: 123',
              timestamp: '2024-01-15T09:30:00Z',
              ip_address: '192.168.1.2',
              user_agent: 'Mozilla/5.0...'
            }
          ],
          total: 2,
          page: 1,
          limit: 10
        })
      });
    });
    
    // Wait for audit logs to load
    await page.waitForResponse('**/admin/audit-logs');
    
    // Check if audit logs are displayed
    await expect(page.locator('text=User created')).toBeVisible();
    await expect(page.locator('text=Patient updated')).toBeVisible();
    await expect(page.locator('text=admin@example.com')).toBeVisible();
    await expect(page.locator('text=doctor@example.com')).toBeVisible();
  });

  test('should view system statistics', async ({ page }) => {
    // Navigate to system statistics
    await page.goto('/admin/statistics');
    
    // Mock system statistics
    await page.route('**/admin/statistics', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user_statistics: {
            total_users: 150,
            active_users: 120,
            new_users_this_month: 25,
            users_by_role: {
              admin: 5,
              doctor: 50,
              nurse: 30,
              teacher: 40,
              parent: 25
            }
          },
          patient_statistics: {
            total_patients: 500,
            new_patients_this_month: 75,
            patients_by_age_group: {
              '6-8': 150,
              '9-10': 200,
              '11-12': 150
            }
          },
          screening_statistics: {
            total_screenings: 1200,
            screenings_this_month: 200,
            screenings_by_type: {
              vision: 800,
              color_vision: 300,
              depth_perception: 100
            }
          },
          system_health: {
            uptime: '99.9%',
            response_time: '150ms',
            error_rate: '0.1%',
            active_sessions: 45
          }
        })
      });
    });
    
    // Wait for statistics to load
    await page.waitForResponse('**/admin/statistics');
    
    // Check if statistics are displayed
    await expect(page.locator('text=System Statistics')).toBeVisible();
    await expect(page.locator('text=Total Users: 150')).toBeVisible();
    await expect(page.locator('text=Total Patients: 500')).toBeVisible();
    await expect(page.locator('text=Total Screenings: 1200')).toBeVisible();
    await expect(page.locator('text=Uptime: 99.9%')).toBeVisible();
  });

  test('should manage system settings', async ({ page }) => {
    // Navigate to system settings
    await page.goto('/admin/settings');
    
    // Mock system settings
    await page.route('**/admin/settings', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          general: {
            site_name: 'EVEP Platform',
            site_description: 'Eye Vision Evaluation Platform',
            maintenance_mode: false,
            registration_enabled: true
          },
          email: {
            smtp_host: 'smtp.example.com',
            smtp_port: 587,
            smtp_username: 'noreply@example.com',
            email_from: 'noreply@example.com'
          },
          security: {
            session_timeout: 3600,
            max_login_attempts: 5,
            password_min_length: 8,
            require_2fa: false
          }
        })
      });
    });
    
    // Wait for settings to load
    await page.waitForResponse('**/admin/settings');
    
    // Check if settings are displayed
    await expect(page.locator('text=System Settings')).toBeVisible();
    await expect(page.locator('text=General Settings')).toBeVisible();
    await expect(page.locator('text=Email Settings')).toBeVisible();
    await expect(page.locator('text=Security Settings')).toBeVisible();
  });

  test('should update system settings', async ({ page }) => {
    // Navigate to system settings
    await page.goto('/admin/settings');
    
    // Mock system settings
    await page.route('**/admin/settings', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          general: {
            site_name: 'EVEP Platform',
            site_description: 'Eye Vision Evaluation Platform',
            maintenance_mode: false,
            registration_enabled: true
          }
        })
      });
    });
    
    // Wait for settings to load
    await page.waitForResponse('**/admin/settings');
    
    // Mock successful update
    await page.route('**/admin/settings', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Settings updated successfully'
          })
        });
      }
    });
    
    // Update site name
    await page.fill('input[name="siteName"]', 'EVEP Platform Updated');
    
    // Save settings
    await page.click('text=Save Settings');
    
    // Should show success message
    await expect(page.locator('text=Settings updated successfully')).toBeVisible();
  });

  test('should view database management', async ({ page }) => {
    // Navigate to database management
    await page.goto('/admin/database');
    
    // Mock database statistics
    await page.route('**/admin/database', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collections: {
            users: {
              count: 150,
              size: '2.5 MB',
              indexes: 3
            },
            patients: {
              count: 500,
              size: '15.2 MB',
              indexes: 5
            },
            screenings: {
              count: 1200,
              size: '45.8 MB',
              indexes: 4
            }
          },
          performance: {
            avg_query_time: '25ms',
            slow_queries: 5,
            connection_pool: {
              active: 12,
              idle: 8,
              max: 20
            }
          }
        })
      });
    });
    
    // Wait for database info to load
    await page.waitForResponse('**/admin/database');
    
    // Check if database info is displayed
    await expect(page.locator('text=Database Management')).toBeVisible();
    await expect(page.locator('text=Users: 150')).toBeVisible();
    await expect(page.locator('text=Patients: 500')).toBeVisible();
    await expect(page.locator('text=Screenings: 1200')).toBeVisible();
  });

  test('should create database backup', async ({ page }) => {
    // Navigate to database management
    await page.goto('/admin/database');
    
    // Mock backup creation
    await page.route('**/admin/database/backup', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Backup created successfully',
          backup_id: 'backup_20240115_100000',
          size: '65.2 MB',
          timestamp: '2024-01-15T10:00:00Z'
        })
      });
    });
    
    // Click create backup button
    await page.click('text=Create Backup');
    
    // Should show success message
    await expect(page.locator('text=Backup created successfully')).toBeVisible();
    await expect(page.locator('text=backup_20240115_100000')).toBeVisible();
  });

  test('should view security audit', async ({ page }) => {
    // Navigate to security audit
    await page.goto('/admin/security');
    
    // Mock security audit data
    await page.route('**/admin/security', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          security_events: [
            {
              id: '1',
              event_type: 'Failed login attempt',
              user: 'unknown@example.com',
              ip_address: '192.168.1.100',
              timestamp: '2024-01-15T10:00:00Z',
              severity: 'medium'
            },
            {
              id: '2',
              event_type: 'Suspicious activity',
              user: 'doctor@example.com',
              ip_address: '192.168.1.101',
              timestamp: '2024-01-15T09:30:00Z',
              severity: 'low'
            }
          ],
          security_stats: {
            total_events: 25,
            events_by_type: {
              'Failed login': 15,
              'Suspicious activity': 5,
              'Unauthorized access': 3,
              'Data export': 2
            },
            events_by_severity: {
              high: 2,
              medium: 8,
              low: 15
            }
          }
        })
      });
    });
    
    // Wait for security data to load
    await page.waitForResponse('**/admin/security');
    
    // Check if security audit is displayed
    await expect(page.locator('text=Security Audit')).toBeVisible();
    await expect(page.locator('text=Failed login attempt')).toBeVisible();
    await expect(page.locator('text=Suspicious activity')).toBeVisible();
    await expect(page.locator('text=Total Events: 25')).toBeVisible();
  });

  test('should export admin reports', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    
    // Mock dashboard data
    await page.route('**/admin/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_users: 150,
          total_patients: 500,
          total_screenings: 1200
        })
      });
    });
    
    // Wait for dashboard to load
    await page.waitForResponse('**/admin/dashboard');
    
    // Mock report export
    await page.route('**/admin/reports/export', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('mock-report-content')
      });
    });
    
    // Click export report button
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Export Report');
    const download = await downloadPromise;
    
    // Check download filename
    expect(download.suggestedFilename()).toContain('admin-report');
  });

  test('should handle admin permissions', async ({ page }) => {
    // Try to access admin page as non-admin user
    await page.goto('/admin/dashboard');
    
    // Mock unauthorized response
    await page.route('**/admin/dashboard', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Access denied. Admin privileges required.'
        })
      });
    });
    
    // Should show access denied message
    await expect(page.locator('text=Access denied')).toBeVisible();
    await expect(page.locator('text=Admin privileges required')).toBeVisible();
  });
});

