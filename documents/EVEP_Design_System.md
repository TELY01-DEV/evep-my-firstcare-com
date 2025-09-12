# EVEP Design System

## 🎨 **Color Palette**

### **Primary Colors (From EVEP Logo)**
```css
/* Main Purple - Primary Brand Color */
--primary-purple: #9B7DCF;      /* Main accent purple from logo */
--primary-purple-light: #A070D0; /* Iris purple */
--primary-purple-dark: #7B5DBF;  /* Darker purple */

/* Secondary Pink - Supporting Brand Color */
--secondary-pink: #E8BEE8;       /* Secondary accent pink */
--secondary-pink-light: #F8EBF8; /* Background pink */
--secondary-pink-dark: #D8A8D8;  /* Darker pink */

/* Accent Blue - Highlight Color */
--accent-blue: #D0E0F0;          /* Light blue accent from logo */
```

### **Semantic Colors**
```css
/* Success, Warning, Error */
--success: #059669;              /* Green for success states */
--warning: #d97706;              /* Orange for warnings */
--error: #dc2626;                /* Red for errors */
--info: #9B7DCF;                 /* Purple for info (matches brand) */

/* Background Colors */
--bg-primary: #ffffff;           /* White for cards and content */
--bg-secondary: #F8EBF8;         /* Very light pink/lavender */
--bg-tertiary: #E8BEE8;          /* Soft light pink */
--bg-dark: #7B5DBF;              /* Darker purple for dark themes */
```

## 🎯 **Usage Guidelines**

### **Primary Purple (#9B7DCF)**
- **Use for**: Primary buttons, links, headings, navigation
- **Purpose**: Main brand color, primary actions
- **Accessibility**: High contrast with white text

### **Secondary Pink (#E8BEE8)**
- **Use for**: Secondary buttons, backgrounds, highlights
- **Purpose**: Supporting brand color, subtle accents
- **Accessibility**: Medium contrast, use with dark text

### **Background Pink (#F8EBF8)**
- **Use for**: Page backgrounds, subtle sections
- **Purpose**: Creates soft, welcoming atmosphere
- **Accessibility**: Very light, use with dark text

### **Accent Blue (#D0E0F0)**
- **Use for**: Highlights, special elements, eye-related features
- **Purpose**: Represents vision/eye theme
- **Accessibility**: Light color, use with dark text

## 🎨 **Component Examples**

### **Buttons**
```jsx
// Primary Button
<Button variant="contained" sx={{ backgroundColor: '#9B7DCF' }}>
  Primary Action
</Button>

// Secondary Button
<Button variant="outlined" sx={{ borderColor: '#9B7DCF', color: '#9B7DCF' }}>
  Secondary Action
</Button>
```

### **Cards**
```jsx
<Card sx={{ 
  backgroundColor: '#ffffff',
  border: '1px solid rgba(155, 125, 207, 0.1)',
  boxShadow: '0 4px 12px rgba(155, 125, 207, 0.1)'
}}>
  <CardContent>
    <Typography variant="h6" sx={{ color: '#9B7DCF' }}>
      Card Title
    </Typography>
  </CardContent>
</Card>
```

### **Typography**
```jsx
// Headings
<Typography variant="h4" sx={{ color: '#9B7DCF', fontWeight: 600 }}>
  Main Heading
</Typography>

// Body Text
<Typography variant="body1" sx={{ color: '#374151' }}>
  Regular text content
</Typography>
```

## 🎨 **Logo Implementation**

### **Logo Component**
```jsx
import Logo from '../components/Logo/Logo';

// Different sizes
<Logo size="small" />
<Logo size="medium" />
<Logo size="large" />

// Without text
<Logo size="medium" showText={false} />
```

### **Logo Colors in Code**
```css
/* Eye Icon Colors */
.eye-outer-circle {
  background: linear-gradient(135deg, #E8BEE8 0%, #F8EBF8 100%);
  border: 2px solid #9B7DCF;
}

.eye-sclera {
  background: #D0E0F0;
  border: 2px solid #9B7DCF;
}

.eye-iris {
  background: #A070D0;
}

.eye-pupil {
  background: #FFFFFF;
}
```

## 📱 **Responsive Design**

### **Breakpoints**
```css
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

### **Mobile Considerations**
- Use larger touch targets (minimum 44px)
- Ensure sufficient contrast ratios
- Test color combinations on mobile devices

## ♿ **Accessibility**

### **Color Contrast**
- **Primary Purple (#9B7DCF)**: Use with white text for high contrast
- **Secondary Pink (#E8BEE8)**: Use with dark text for readability
- **Background Pink (#F8EBF8)**: Use with dark text for content

### **Focus States**
```css
*:focus-visible {
  outline: 2px solid #9B7DCF;
  outline-offset: 2px;
}
```

### **Color Blind Considerations**
- Don't rely solely on color to convey information
- Use icons, text, and patterns as additional indicators
- Test with color blindness simulators

## 🎨 **Design Tokens**

### **Spacing**
```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
```

### **Typography**
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-secondary: 'Noto Sans Thai', 'Inter', sans-serif;
--font-display: 'Poppins', sans-serif;

--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### **Transitions**
```css
--transition-fast: 150ms ease-in-out;
--transition-normal: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
```

## 🎯 **Brand Guidelines**

### **Logo Usage**
- Maintain minimum size of 32px for digital use
- Keep clear space around logo equal to the height of the "E" in EVEP
- Use only the approved color combinations
- Don't modify the logo proportions

### **Color Usage**
- Primary purple should be the dominant brand color
- Use secondary pink for supporting elements
- Background pink creates the signature EVEP atmosphere
- Accent blue should be used sparingly for special highlights

### **Typography**
- Use Inter for body text and UI elements
- Use Poppins for headings and display text
- Use Noto Sans Thai for Thai language support
- Maintain consistent font weights and sizes

This design system ensures consistency across all EVEP platform interfaces while maintaining the brand identity established by the logo.
