# 🏥 EVEP Medical Portal - Glasses Delivery Management Workflow

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Workflow Process](#workflow-process)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Frontend Implementation](#frontend-implementation)
7. [Database Schema](#database-schema)
8. [User Guide](#user-guide)
9. [Technical Implementation](#technical-implementation)
10. [Troubleshooting](#troubleshooting)
11. [Future Enhancements](#future-enhancements)

## 🎯 Overview

The **Glasses Delivery Management Workflow** is a comprehensive system that manages the complete lifecycle of glasses delivery from initial screening to final delivery at schools. This system integrates with the **Hospital Mobile Unit Workflow** to provide seamless tracking and management of patient glasses deliveries.

### **Key Features**
- **Integrated Workflow**: Seamlessly connects mobile screening to delivery management
- **Real-time Tracking**: Monitor delivery status from pending to completed
- **School-based Delivery**: Organized delivery system for educational institutions
- **Patient Management**: Complete patient and glasses selection tracking
- **Inventory Integration**: Automatic stock verification during selection process

## 🏗️ System Architecture

### **Component Overview**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Mobile Screening│    │ Glasses Selection│    │ Inventory Check │
│   Workflow      │───▶│   & Prescription │───▶│   & Stock       │
└─────────────────┘    └──────────────────┘    │   Verification  │
                                               └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Delivery Status │    │ School Delivery  │    │ Patient         │
│   Tracking      │◀───│   Management     │◀───│   Notification  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Technology Stack**
- **Backend**: FastAPI (Python)
- **Frontend**: React with Material-UI
- **Database**: MongoDB
- **Authentication**: JWT-based security
- **API**: RESTful endpoints with proper permissions

## 🔄 Workflow Process

### **1. Glasses Selection**
- Patient completes vision screening during mobile unit visit
- Healthcare provider selects appropriate glasses based on prescription
- System automatically checks inventory availability
- Prescription details are recorded with patient information

### **2. Inventory Check**
- System verifies stock levels for selected glasses
- Automatic stock reservation for patient order
- Low stock alerts for inventory management
- Cost calculation and billing preparation

### **3. School Delivery Status**
- Delivery record creation with patient and school details
- Delivery method selection (school delivery, home delivery)
- Scheduling and route planning
- Status tracking throughout delivery process

### **Complete Workflow Diagram**
```
Patient Screening → Glasses Selection → Inventory Check → School Delivery Status
     ↓                    ↓                ↓                ↓
Mobile Vision      Patient chooses    System verifies   Track delivery
Screening Form     glasses items      stock levels      to schools
     ↓                    ↓                ↓                ↓
Vision Assessment  Prescription       Stock Reservation  Delivery
Results            Recording          & Alerts          Confirmation
```

## 🌐 API Endpoints

### **Base URL**: `/api/v1/glasses-delivery`

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/glasses-delivery` | Get all delivery records | Required |
| `GET` | `/glasses-delivery/{id}` | Get specific delivery | Required |
| `PUT` | `/glasses-delivery/{id}/status` | Update delivery status | Required |
| `GET` | `/glasses-delivery/stats/overview` | Get delivery statistics | Required |

### **Authentication Requirements**
- **JWT Token**: Required in Authorization header
- **User Roles**: `admin`, `medical_staff`, `doctor`
- **Permissions**: View, update delivery status

### **Query Parameters**
- `status`: Filter by delivery status (pending, delivered, cancelled)
- `school`: Filter by school name
- `page`: Pagination support
- `limit`: Results per page

## 📊 Data Models

### **GlassesDeliveryItem**
```typescript
interface GlassesDeliveryItem {
  item_id: string;           // Inventory item ID
  item_name: string;         // Glasses name/description
  quantity: number;          // Quantity ordered
  unit_price: number;        // Price per unit
}
```

### **PrescriptionDetails**
```typescript
interface PrescriptionDetails {
  sphere_right: number;      // Right eye sphere
  sphere_left: number;       // Left eye sphere
  cylinder_right: number;    // Right eye cylinder
  cylinder_left: number;     // Left eye cylinder
  axis_right: number;        // Right eye axis
  axis_left: number;         // Left eye axis
}
```

### **GlassesDeliveryResponse**
```typescript
interface GlassesDeliveryResponse {
  delivery_id: string;       // Unique delivery identifier
  patient_id: string;        // Patient reference ID
  patient_name: string;      // Patient full name
  patient_cid: string;       // Patient citizen ID
  glasses_items: GlassesDeliveryItem[];  // Ordered items
  prescription_details: PrescriptionDetails;  // Vision prescription
  delivery_date: string;     // Scheduled delivery date
  delivery_status: string;   // Current status
  delivery_method: string;   // Delivery method
  delivered_by: string;      // Delivery personnel
  school_name: string;       // Target school
  notes: string;             // Additional notes
  created_at: string;        // Record creation date
  updated_at: string;        // Last update date
}
```

## 🎨 Frontend Implementation

### **Component Structure**
```typescript
// Main component with dual mode support
const GlassesInventoryManager: React.FC<GlassesInventoryManagerProps> = ({ 
  mode = 'inventory' 
}) => {
  // State management for both modes
  const [items, setItems] = useState<GlassesItem[]>([]);
  const [deliveries, setDeliveries] = useState<GlassesDelivery[]>([]);
  
  // Mode-specific data fetching
  useEffect(() => {
    if (mode === 'inventory') {
      fetchInventory();
    } else {
      fetchDeliveries();
    }
  }, [mode]);
}
```

### **Mode-Specific Features**

#### **Inventory Mode** (`mode="inventory"`)
- **Data Source**: `/api/v1/inventory/glasses`
- **Display**: Glasses inventory items with stock levels
- **Actions**: Add, edit, delete inventory items
- **Filters**: Category, brand, stock status

#### **Delivery Mode** (`mode="delivery"`)
- **Data Source**: `/api/v1/glasses-delivery`
- **Display**: Patient delivery records and status
- **Actions**: View details, update delivery status
- **Filters**: Delivery status, school, patient search

### **Dynamic UI Components**
- **Header**: Changes icon and title based on mode
- **Statistics Cards**: Mode-specific metrics and counts
- **Search & Filters**: Context-aware filtering options
- **Data Table**: Different columns and data for each mode

## 🗄️ Database Schema

### **Collection**: `glasses_delivery`

```javascript
{
  "_id": ObjectId,                    // MongoDB document ID
  "delivery_id": "DL001",            // Unique delivery identifier
  "patient_id": "P001",              // Patient reference
  "patient_name": "Somchai Jaidee",  // Patient full name
  "patient_cid": "1234567890123",    // Citizen ID
  "glasses_items": [                 // Array of ordered items
    {
      "item_id": "GL001",
      "item_name": "Ray-Ban RB3025 Aviator - Gold",
      "quantity": 1,
      "unit_price": 2500.0
    }
  ],
  "prescription_details": {           // Vision prescription
    "sphere_right": -2.5,
    "sphere_left": -2.0,
    "cylinder_right": -0.5,
    "cylinder_left": -0.25,
    "axis_right": 90,
    "axis_left": 85
  },
  "delivery_date": ISODate,          // Scheduled delivery date
  "delivery_status": "delivered",    // Current status
  "delivery_method": "school_delivery", // Delivery method
  "delivered_by": "Nurse Somjai",   // Delivery personnel
  "school_name": "Wat Nong Bua School", // Target school
  "notes": "Delivered to school, parent signed receipt",
  "is_active": true,                 // Record status
  "created_at": ISODate,             // Creation timestamp
  "updated_at": ISODate              // Last update timestamp
}
```

### **Indexes**
```javascript
// Primary indexes for performance
db.glasses_delivery.createIndex({ "delivery_id": 1 }, { unique: true })
db.glasses_delivery.createIndex({ "patient_id": 1 })
db.glasses_delivery.createIndex({ "school_name": 1 })
db.glasses_delivery.createIndex({ "delivery_status": 1 })
db.glasses_delivery.createIndex({ "delivery_date": -1 })
```

## 📖 User Guide

### **Accessing Delivery Management**

#### **1. Navigation**
- Login to Medical Portal
- Navigate to: `Dashboard → Glasses Management → Delivery`
- URL: `http://localhost:3013/dashboard/glasses-management/delivery`

#### **2. Dashboard Overview**
- **Total Deliveries**: Count of all delivery records
- **Pending**: Deliveries awaiting completion
- **Delivered**: Successfully completed deliveries
- **Schools**: Number of schools with deliveries

#### **3. Data Table Features**
- **Search**: Find patients by name, delivery ID, or school
- **Filter by Status**: Pending, delivered, cancelled
- **Filter by School**: Specific school selection
- **Sort**: Click column headers to sort data

#### **4. Delivery Record Details**
- **Patient Information**: Name, CID, contact details
- **Glasses Items**: Selected frames and lenses
- **Prescription**: Detailed vision correction data
- **Delivery Details**: Date, method, status, notes

### **Managing Deliveries**

#### **View Delivery Details**
1. Click the **View** button (👁️) in the Actions column
2. Review patient information and prescription details
3. Check delivery status and notes

#### **Update Delivery Status**
1. Click the **Edit** button (✏️) in the Actions column
2. Select new status: pending, delivered, cancelled
3. Add notes or comments
4. Save changes

#### **Filter and Search**
1. **Search Box**: Enter patient name, delivery ID, or school
2. **Status Filter**: Select delivery status from dropdown
3. **School Filter**: Choose specific school from list
4. **Refresh**: Click refresh button to update data

## 🔧 Technical Implementation

### **Backend Implementation**

#### **API Router Setup**
```python
# backend/app/api/glasses_delivery.py
from fastapi import APIRouter, HTTPException, Depends, Query, status
from app.core.database import get_database
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/glasses-delivery", response_model=List[GlassesDeliveryResponse])
async def get_glasses_deliveries(
    status: Optional[str] = Query(None),
    school: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    # Implementation details...
```

#### **Database Operations**
```python
# Query building with filters
query = {"is_active": True}

if status:
    query["delivery_status"] = status

if school:
    query["school_name"] = {"$regex": school, "$options": "i"}

# Fetch and transform data
deliveries = await db.evep.glasses_delivery.find(query).sort("delivery_date", -1).to_list(None)
```

### **Frontend Implementation**

#### **State Management**
```typescript
// Dual state management for inventory and delivery modes
const [items, setItems] = useState<GlassesItem[]>([]);
const [deliveries, setDeliveries] = useState<GlassesDelivery[]>([]);

// Mode-specific data fetching
const fetchDeliveries = async () => {
  const response = await fetch('/api/v1/glasses-delivery', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  setDeliveries(data || []);
};
```

#### **Conditional Rendering**
```typescript
// Mode-aware UI rendering
{mode === 'inventory' ? (
  // Inventory-specific components
  <InventoryTable items={filteredItems} />
) : (
  // Delivery-specific components
  <DeliveryTable deliveries={filteredDeliveries} />
)}
```

### **Data Transformation**
```typescript
// Transform backend data to frontend interface
const transformedItems = (data || []).map((item: any) => ({
  _id: item.item_id,
  name: item.item_name,
  quantity: item.current_stock,
  // ... other transformations
}));
```

## 🚨 Troubleshooting

### **Common Issues**

#### **1. No Data Displayed**
- **Check**: Browser console for API errors
- **Verify**: Authentication token is valid
- **Confirm**: Backend API is running and accessible
- **Solution**: Refresh page or re-login

#### **2. API Connection Errors**
- **Error**: `Failed to fetch deliveries from API`
- **Check**: Backend service status
- **Verify**: API endpoint URL is correct
- **Solution**: Restart backend service

#### **3. Permission Denied**
- **Error**: `Insufficient permissions to view delivery records`
- **Check**: User role and permissions
- **Verify**: JWT token contains correct role
- **Solution**: Contact administrator for role assignment

#### **4. Data Not Updating**
- **Issue**: Changes not reflected in UI
- **Check**: Refresh button functionality
- **Verify**: API response contains updated data
- **Solution**: Manual refresh or check API logs

### **Debug Information**
```typescript
// Console logging for troubleshooting
console.log('🔍 Raw delivery API response:', data);
console.log('🔍 Deliveries state:', deliveries);
console.log('🔍 Filtered deliveries:', filteredDeliveries);
```

### **Log Locations**
- **Frontend**: Browser console (F12 → Console)
- **Backend**: Docker logs (`docker-compose logs backend`)
- **Database**: MongoDB logs and queries

## 🚀 Future Enhancements

### **Planned Features**

#### **1. Advanced Delivery Tracking**
- **GPS Tracking**: Real-time delivery vehicle location
- **SMS Notifications**: Automated delivery status updates
- **Photo Confirmation**: Delivery completion verification
- **Digital Signatures**: Electronic delivery confirmation

#### **2. Enhanced Reporting**
- **Delivery Analytics**: Performance metrics and trends
- **School Performance**: Delivery efficiency by institution
- **Route Optimization**: Automated delivery route planning
- **Cost Analysis**: Delivery cost tracking and optimization

#### **3. Mobile App Integration**
- **Driver App**: Mobile delivery management for drivers
- **School App**: Delivery notification for school staff
- **Parent App**: Delivery status updates for parents
- **Offline Support**: Work without internet connection

#### **4. Automation Features**
- **Auto-scheduling**: Intelligent delivery date selection
- **Stock Alerts**: Automatic low inventory notifications
- **Delivery Reminders**: Automated follow-up notifications
- **Integration APIs**: Connect with external delivery services

### **Technical Improvements**
- **Real-time Updates**: WebSocket integration for live status
- **Caching**: Redis-based data caching for performance
- **Microservices**: Break down into smaller, focused services
- **API Versioning**: Proper API version management
- **Rate Limiting**: API usage throttling and protection

## 📚 Additional Resources

### **Related Documentation**
- [Hospital Mobile Unit Workflow](./HOSPITAL_MOBILE_UNIT_WORKFLOW.md)
- [Inventory Management System](./INVENTORY_POPULATION_GUIDE.md)
- [API Reference Documentation](./API_REFERENCE.md)
- [User Management System](./USER_MANAGEMENT_GUIDE.md)

### **Development Resources**
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Material-UI Components](https://mui.com/material-ui/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/)
- [React Hooks Guide](https://reactjs.org/docs/hooks-intro.html)

### **Support and Contact**
- **Technical Issues**: Check troubleshooting section above
- **Feature Requests**: Submit through project management system
- **Documentation Updates**: Create pull request with improvements
- **Training**: Contact system administrator for user training

---

**Document Version**: 1.0  
**Last Updated**: September 2025  
**Maintained By**: EVEP Development Team  
**Review Cycle**: Quarterly updates and improvements

