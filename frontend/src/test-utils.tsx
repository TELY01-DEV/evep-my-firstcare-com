import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import evepTheme from './theme/medicalTheme';

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  initialEntries?: string[];
  queryClient?: QueryClient;
}

const AllTheProviders = ({ 
  children, 
  route = '/',
  initialEntries = ['/'],
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}: {
  children: React.ReactNode;
  route?: string;
  initialEntries?: string[];
  queryClient?: QueryClient;
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={evepTheme}>
        <BrowserRouter>
          <AuthProvider>
            {children}
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { route, initialEntries, queryClient, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders 
        route={route} 
        initialEntries={initialEntries}
        queryClient={queryClient}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock data for testing
export const mockUser = {
  user_id: 'test-user-123',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'doctor',
  organization: 'Test Hospital',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockAdminUser = {
  user_id: 'admin-user-123',
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  organization: 'EVEP Admin',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockPatient = {
  _id: 'patient-123',
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '2015-03-15',
  gender: 'male',
  parent_name: 'Jane Doe',
  parent_phone: '+66-81-234-5678',
  parent_email: 'jane.doe@email.com',
  emergency_contact: 'Emergency Contact',
  emergency_phone: '+66-82-345-6789',
  school: 'Bangkok International School',
  grade: 'Grade 3',
  medical_history: 'No significant medical history',
  allergies: ['Peanuts'],
  address: '123 Test Street',
  city: 'Bangkok',
  postal_code: '10110',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockScreening = {
  _id: 'screening-123',
  patient_id: 'patient-123',
  screening_type: 'vision',
  screening_date: '2024-01-01T00:00:00Z',
  results: {
    left_eye: '20/20',
    right_eye: '20/25',
    color_vision: 'normal',
    depth_perception: 'normal',
  },
  notes: 'Normal vision screening',
  recommendations: 'No follow-up required',
  status: 'completed',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockScreeningSession = {
  _id: 'session-123',
  session_name: 'Test Screening Session',
  screening_type: 'vision',
  location: 'Test School',
  scheduled_date: '2024-01-01T00:00:00Z',
  expected_participants: 50,
  status: 'scheduled',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockAIInsight = {
  _id: 'insight-123',
  patient_id: 'patient-123',
  insight_type: 'vision_analysis',
  insight: 'Patient shows normal vision development for age group',
  confidence: 0.95,
  recommendations: ['Continue regular screenings', 'Monitor for any changes'],
  context: 'Recent screening results analysis',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock API responses
export const mockApiResponses = {
  auth: {
    login: {
      access_token: 'mock-jwt-token',
      token_type: 'bearer',
      user: mockUser,
    },
    register: {
      message: 'User registered successfully',
      user_id: 'new-user-123',
      user: mockUser,
    },
  },
  patients: {
    list: [mockPatient],
    single: mockPatient,
    create: {
      ...mockPatient,
      patient_id: 'new-patient-123',
    },
    update: {
      ...mockPatient,
      first_name: 'Updated',
    },
  },
  screenings: {
    list: [mockScreening],
    single: mockScreening,
    sessions: [mockScreeningSession],
    create: {
      ...mockScreening,
      screening_id: 'new-screening-123',
    },
  },
  aiInsights: {
    list: [mockAIInsight],
    single: mockAIInsight,
    generate: {
      insight: 'Test AI insight',
      confidence: 0.95,
      recommendations: ['Test recommendation'],
    },
  },
  admin: {
    users: [mockUser, mockAdminUser],
    auditLogs: [
      {
        _id: 'log-123',
        action: 'patient_created',
        user_id: 'test-user-123',
        patient_id: 'patient-123',
        timestamp: '2024-01-01T00:00:00Z',
        audit_hash: 'mock-hash',
        details: {
          patient_name: 'John Doe',
          parent_email: 'jane.doe@email.com',
        },
      },
    ],
  },
};

// Mock localStorage
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock sessionStorage
export const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Setup localStorage and sessionStorage mocks
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock fetch
export const mockFetch = jest.fn();

// Setup fetch mock
global.fetch = mockFetch;

// Mock axios
export const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
};

// Mock react-router-dom
export const mockNavigate = jest.fn();
export const mockUseNavigate = () => mockNavigate;
export const mockUseLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
});

// Mock react-query
export const mockUseQuery = jest.fn();
export const mockUseMutation = jest.fn();

// Mock react-hook-form
export const mockUseForm = jest.fn();

// Mock react-hot-toast
export const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};

// Mock socket.io
export const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

// Test helpers
export const waitForElementToBeRemoved = (element: HTMLElement) => {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve(true);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
};

export const createMockEvent = (value: string) => ({
  target: { value },
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
});

export const createMockFormEvent = (data: Record<string, any>) => ({
  preventDefault: jest.fn(),
  target: {
    elements: Object.keys(data).reduce((acc, key) => {
      acc[key] = { value: data[key] };
      return acc;
    }, {} as Record<string, { value: any }>),
  },
});

// Custom matchers
export const expectElementToBeInDocument = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
};

export const expectElementToHaveTextContent = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text);
};

export const expectElementToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toHaveClass(className);
};

export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeVisible();
};

export const expectElementToBeDisabled = (element: HTMLElement) => {
  expect(element).toBeDisabled();
};

export const expectElementToBeEnabled = (element: HTMLElement) => {
  expect(element).toBeEnabled();
};

// Test data generators
export const generateMockPatients = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockPatient,
    _id: `patient-${index + 1}`,
    first_name: `Patient${index + 1}`,
    last_name: `Doe${index + 1}`,
  }));
};

export const generateMockScreenings = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockScreening,
    _id: `screening-${index + 1}`,
    patient_id: `patient-${index + 1}`,
  }));
};

export const generateMockUsers = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockUser,
    user_id: `user-${index + 1}`,
    email: `user${index + 1}@example.com`,
    first_name: `User${index + 1}`,
  }));
};
