# 🚀 Glasses Delivery Management - Developer Quick Reference

## ⚡ Quick Start

### **1. System Overview**
- **Purpose**: Manage glasses delivery workflow from screening to school delivery
- **Integration**: Works with Hospital Mobile Unit Workflow
- **Modes**: Dual-mode component (inventory + delivery)

### **2. Key URLs**
- **Frontend**: `http://localhost:3013/dashboard/glasses-management/delivery`
- **Backend API**: `http://localhost:8014/api/v1/glasses-delivery`
- **Component**: `frontend/src/components/GlassesInventoryManager.tsx`

### **3. Quick Test**
```bash
# Test API endpoint
curl -X GET "http://localhost:8014/api/v1/glasses-delivery" \
  -H "Content-Type: application/json"
# Expected: {"detail":"Not authenticated"}
```

## 🔧 Backend Implementation

### **API Endpoints**
```python
# backend/app/api/glasses_delivery.py

@router.get("/glasses-delivery")
async def get_glasses_deliveries(
    status: Optional[str] = Query(None),
    school: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    # Returns List[GlassesDeliveryResponse]

@router.put("/glasses-delivery/{delivery_id}/status")
async def update_delivery_status(
    delivery_id: str,
    status: str = Query(...),
    notes: Optional[str] = Query(None)
):
    # Updates delivery status

@router.get("/glasses-delivery/stats/overview")
async def get_delivery_stats():
    # Returns delivery statistics
```

### **Data Models**
```python
class GlassesDeliveryResponse(BaseModel):
    delivery_id: str
    patient_name: str
    patient_cid: str
    glasses_items: List[GlassesDeliveryItem]
    prescription_details: PrescriptionDetails
    delivery_date: str
    delivery_status: str
    school_name: str
    # ... other fields
```

### **Database Collection**
```javascript
// Collection: glasses_delivery
{
  "delivery_id": "DL001",
  "patient_name": "Somchai Jaidee",
  "glasses_items": [...],
  "delivery_status": "delivered",
  "school_name": "Wat Nong Bua School"
}
```

## 🎨 Frontend Implementation

### **Component Structure**
```typescript
// Dual-mode component
const GlassesInventoryManager: React.FC<GlassesInventoryManagerProps> = ({ 
  mode = 'inventory' 
}) => {
  const [items, setItems] = useState<GlassesItem[]>([]);
  const [deliveries, setDeliveries] = useState<GlassesDelivery[]>([]);
  
  useEffect(() => {
    if (mode === 'inventory') {
      fetchInventory();
    } else {
      fetchDeliveries();
    }
  }, [mode]);
}
```

### **Data Fetching**
```typescript
const fetchDeliveries = async () => {
  const token = localStorage.getItem('evep_token');
  const response = await fetch('/api/v1/glasses-delivery', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  setDeliveries(data || []);
};
```

### **Mode-Specific Rendering**
```typescript
{mode === 'inventory' ? (
  // Inventory mode UI
  <InventoryTable items={filteredItems} />
) : (
  // Delivery mode UI
  <DeliveryTable deliveries={filteredDeliveries} />
)}
```

## 📊 Data Flow

### **1. Data Creation**
```
Mobile Screening → Glasses Selection → Inventory Check → Delivery Record
```

### **2. Data Display**
```
API Call → Data Fetch → State Update → UI Render → User Interaction
```

### **3. Status Updates**
```
User Action → API Call → Database Update → State Refresh → UI Update
```

## 🗄️ Database Operations

### **Query Examples**
```python
# Get all active deliveries
query = {"is_active": True}
deliveries = await db.evep.glasses_delivery.find(query).to_list(None)

# Filter by status
query = {"is_active": True, "delivery_status": "pending"}

# Filter by school
query = {"is_active": True, "school_name": {"$regex": school, "$options": "i"}}

# Sort by date
deliveries = await db.evep.glasses_delivery.find(query).sort("delivery_date", -1).to_list(None)
```

### **Indexes**
```javascript
// Performance indexes
db.glasses_delivery.createIndex({ "delivery_id": 1 }, { unique: true })
db.glasses_delivery.createIndex({ "patient_id": 1 })
db.glasses_delivery.createIndex({ "school_name": 1 })
db.glasses_delivery.createIndex({ "delivery_status": 1 })
db.glasses_delivery.createIndex({ "delivery_date": -1 })
```

## 🔍 Debugging

### **Frontend Debug Logs**
```typescript
// Console logging for troubleshooting
console.log('🔍 Raw delivery API response:', data);
console.log('🔍 Deliveries state:', deliveries);
console.log('🔍 Filtered deliveries:', filteredDeliveries);
console.log('🔍 Search term:', searchTerm);
console.log('🔍 Filter category:', filterCategory);
console.log('🔍 Filter status:', filterStatus);
```

### **Backend Debug Logs**
```python
# Add logging to API endpoints
logger.info(f"Fetching deliveries with filters: {query}")
logger.info(f"Found {len(deliveries)} delivery records")
```

### **Common Issues**
1. **No Data**: Check API response, authentication, database
2. **Permission Errors**: Verify user role and JWT token
3. **Filter Issues**: Check filter logic and data types
4. **UI Not Updating**: Verify state updates and re-renders

## 🚀 Development Workflow

### **1. Adding New Features**
```bash
# 1. Update backend API
vim backend/app/api/glasses_delivery.py

# 2. Update frontend component
vim frontend/src/components/GlassesInventoryManager.tsx

# 3. Test changes
docker-compose restart backend
# Refresh frontend in browser
```

### **2. Testing API Changes**
```bash
# Test with authentication
curl -X GET "http://localhost:8014/api/v1/glasses-delivery" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Database Queries**
```bash
# Connect to MongoDB
docker-compose exec mongo-primary mongosh

# Query delivery data
use evep
db.glasses_delivery.find({}).pretty()
db.glasses_delivery.find({"delivery_status": "pending"}).pretty()
```

## 📋 Component Props & State

### **Props Interface**
```typescript
interface GlassesInventoryManagerProps {
  mode?: 'inventory' | 'delivery';
}
```

### **State Variables**
```typescript
// Inventory mode
const [items, setItems] = useState<GlassesItem[]>([]);

// Delivery mode
const [deliveries, setDeliveries] = useState<GlassesDelivery[]>([]);

// Common state
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [filterCategory, setFilterCategory] = useState('all');
const [filterStatus, setFilterStatus] = useState('all');
```

### **Filtered Data**
```typescript
const filteredItems = items.filter(item => {
  const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
  const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
  return matchesSearch && matchesCategory && matchesStatus;
});

const filteredDeliveries = deliveries.filter(delivery => {
  const matchesSearch = delivery.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesCategory = filterCategory === 'all' || delivery.school_name === filterCategory;
  const matchesStatus = filterStatus === 'all' || delivery.delivery_status === filterStatus;
  return matchesSearch && matchesCategory && matchesStatus;
});
```

## 🎯 Key Functions

### **Data Fetching**
- `fetchInventory()`: Gets inventory items from `/api/v1/inventory/glasses`
- `fetchDeliveries()`: Gets delivery records from `/api/v1/glasses-delivery`

### **Filtering & Search**
- `filteredItems`: Filtered inventory items based on search and filters
- `filteredDeliveries`: Filtered delivery records based on search and filters

### **UI Rendering**
- **Inventory Mode**: Shows glasses inventory with stock levels
- **Delivery Mode**: Shows patient delivery records with status

## 🔗 Integration Points

### **With Hospital Mobile Unit Workflow**
- Delivery records created during mobile screening
- Patient and prescription data flows from screening forms
- Glasses selection integrated with inventory system

### **With Inventory Management**
- Stock verification during glasses selection
- Automatic inventory updates when glasses are ordered
- Low stock alerts for reordering

### **With User Management**
- Role-based access control for delivery management
- User authentication and authorization
- Audit logging for delivery status changes

## 📚 Related Files

### **Backend**
- `backend/app/api/glasses_delivery.py` - Main API endpoints
- `backend/app/main.py` - Router registration
- `backend/app/core/database.py` - Database connection

### **Frontend**
- `frontend/src/components/GlassesInventoryManager.tsx` - Main component
- `frontend/src/App.tsx` - Routing configuration
- `frontend/src/contexts/AuthContext.tsx` - Authentication

### **Database**
- `glasses_delivery` collection - Delivery records
- `glasses_inventory` collection - Inventory items
- `users` collection - User authentication

## 🚨 Error Handling

### **API Errors**
```typescript
if (response.ok) {
  const data = await response.json();
  setDeliveries(data || []);
} else {
  console.error('❌ Failed to fetch deliveries from API');
  console.error('Response status:', response.status);
  console.error('Response text:', await response.text());
  setDeliveries([]);
}
```

### **Network Errors**
```typescript
try {
  // API call
} catch (error) {
  console.error('Error fetching deliveries:', error);
  setSnackbar({
    open: true,
    message: 'Error fetching delivery data',
    severity: 'error'
  });
}
```

## 🎉 Success Indicators

### **Working System**
- ✅ API endpoints return data (with authentication)
- ✅ Frontend displays delivery records
- ✅ Filters and search work correctly
- ✅ Statistics cards show correct counts
- ✅ Mode switching works properly

### **Common Success Patterns**
- **3 delivery records** displayed in table
- **Statistics cards** show correct counts
- **Search and filters** return expected results
- **Console logs** show successful API calls
- **No error messages** in browser console

---

**Quick Reference Version**: 1.0  
**Last Updated**: September 2025  
**For Developers**: EVEP Development Team

