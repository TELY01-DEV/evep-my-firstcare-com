# 📖 Glasses Delivery Management - User Manual

## 🎯 Who This Manual Is For

This manual is designed for:
- **Medical Staff**: Nurses, doctors, and healthcare providers
- **Administrators**: System managers and coordinators
- **School Coordinators**: Staff responsible for receiving glasses deliveries
- **Delivery Personnel**: Staff involved in glasses distribution

## 🚀 Getting Started

### **Accessing the System**

#### **1. Login**
- Open your web browser
- Navigate to: `http://localhost:3013`
- Enter your username and password
- Select "Medical Portal" if prompted

#### **2. Navigate to Delivery Management**
- From the dashboard, click on **"Glasses Management"**
- Select **"Delivery"** from the submenu
- Or directly visit: `http://localhost:3013/dashboard/glasses-management/delivery`

#### **3. Verify Access**
- You should see the **"Glasses Delivery Management"** header
- The page should display delivery statistics and a data table
- If you see an error, contact your system administrator

## 📊 Understanding the Dashboard

### **Statistics Cards**

The top of the page shows four key metrics:

#### **Total Deliveries**
- **What it shows**: Total number of delivery records in the system
- **What it means**: All glasses deliveries, regardless of status
- **Example**: "15" means there are 15 total delivery records

#### **Pending**
- **What it shows**: Deliveries awaiting completion
- **What it means**: Glasses that have been ordered but not yet delivered
- **Color**: Orange/warning color to indicate action needed
- **Example**: "3" means 3 deliveries are pending

#### **Delivered**
- **What it shows**: Successfully completed deliveries
- **What it means**: Glasses that have reached their destination
- **Color**: Green/success color to indicate completion
- **Example**: "12" means 12 deliveries have been completed

#### **Schools**
- **What it shows**: Number of schools with delivery records
- **What it means**: How many educational institutions are involved
- **Example**: "8" means deliveries are going to 8 different schools

### **Data Table**

Below the statistics, you'll see a table with delivery records:

| Column | Description | Example |
|--------|-------------|---------|
| **Delivery ID** | Unique identifier for each delivery | DL001, DL002 |
| **Patient** | Patient name and citizen ID | Somchai Jaidee<br>CID: 1234567890123 |
| **Glasses** | Selected glasses items and quantities | Ray-Ban RB3025 Aviator (x1) |
| **School** | Target school for delivery | Wat Nong Bua School |
| **Delivery Date** | When delivery was scheduled | 31/08/2025 |
| **Status** | Current delivery status | Pending, Delivered, Cancelled |
| **Method** | How delivery will be made | School delivery, Home delivery |
| **Notes** | Additional information | "Delivered to school, parent signed" |
| **Actions** | Available operations | View details, Update status |

## 🔍 Using Search and Filters

### **Search Function**

#### **How to Search**
1. **Find the search box** at the top of the table
2. **Enter your search term**:
   - Patient name (e.g., "Somchai")
   - Delivery ID (e.g., "DL001")
   - School name (e.g., "Wat Nong Bua")
3. **Press Enter** or wait for automatic search
4. **Results update** automatically as you type

#### **Search Tips**
- **Partial names work**: "Som" will find "Somchai"
- **Case insensitive**: "somchai" and "Somchai" give same results
- **Multiple terms**: Search works across different fields

### **Filtering Options**

#### **Delivery Status Filter**
1. **Click the "Delivery Status" dropdown**
2. **Select your desired status**:
   - **All Status**: Shows all deliveries
   - **Pending**: Only pending deliveries
   - **Delivered**: Only completed deliveries
   - **Cancelled**: Only cancelled deliveries

#### **School Filter**
1. **Click the "School" dropdown**
2. **Choose a specific school**:
   - **All Schools**: Shows deliveries to all schools
   - **Specific School**: Shows only deliveries to that school
3. **Schools are populated** based on existing delivery records

#### **Combining Filters**
- **Use multiple filters together** for precise results
- **Example**: Status = "Pending" + School = "Wat Nong Bua"
- **Results show**: Only pending deliveries to Wat Nong Bua School

## 📋 Working with Delivery Records

### **Viewing Delivery Details**

#### **Step 1: Find the Record**
1. **Use search or filters** to locate the delivery record
2. **Identify the row** containing the delivery you want to view

#### **Step 2: View Details**
1. **Click the "View" button** (👁️) in the Actions column
2. **Review the information** displayed in the popup
3. **Note important details** like patient information and prescription

#### **What You'll See**
- **Patient Information**: Name, citizen ID, contact details
- **Glasses Details**: Selected frames, lenses, quantities
- **Prescription**: Vision correction specifications
- **Delivery Information**: Date, method, status, notes

### **Updating Delivery Status**

#### **When to Update Status**
- **Pending → Delivered**: When glasses reach the school
- **Pending → Cancelled**: If delivery cannot be completed
- **Delivered → Cancelled**: If there was an error (rare)

#### **How to Update**
1. **Click the "Edit" button** (✏️) in the Actions column
2. **Select new status** from the dropdown
3. **Add notes** explaining the change (optional but recommended)
4. **Click "Save"** to confirm the update

#### **Status Update Examples**
```
Status: Pending → Delivered
Notes: "Delivered to school office at 2:30 PM. Received by Mrs. Somsri"

Status: Pending → Cancelled  
Notes: "Patient requested cancellation. Will reschedule for next week"
```

## 📱 Understanding Delivery Statuses

### **Status Definitions**

#### **Pending**
- **What it means**: Delivery is scheduled but not yet completed
- **What you should do**: Monitor progress, prepare for delivery
- **Color**: Orange/warning
- **Example**: Glasses ordered, scheduled for school delivery

#### **Delivered**
- **What it means**: Glasses have reached their destination
- **What you should do**: Confirm receipt, update records
- **Color**: Green/success
- **Example**: Glasses received at school, parent signed receipt

#### **Cancelled**
- **What it means**: Delivery was cancelled and will not proceed
- **What you should do**: Note reason, consider rescheduling
- **Color**: Red/error
- **Example**: Patient unavailable, delivery postponed

### **Status Workflow**

```
Order Created → Pending → In Transit → Delivered
     ↓           ↓         ↓          ↓
  Glasses    Scheduled  On the way  Completed
  Selected   for delivery           & Confirmed
```

## 🏫 School Delivery Process

### **Before Delivery**

#### **1. Preparation**
- **Check delivery schedule** for your school
- **Prepare receiving area** for glasses
- **Notify relevant staff** about incoming delivery
- **Have receipt forms ready** for parent signatures

#### **2. Verification**
- **Review delivery list** for your school
- **Check patient names** against school records
- **Verify glasses specifications** match patient needs
- **Confirm delivery date and time**

### **During Delivery**

#### **1. Receiving**
- **Greet delivery personnel** professionally
- **Check delivery ID** matches your records
- **Verify package contents** against delivery list
- **Inspect glasses** for any damage

#### **2. Documentation**
- **Sign delivery receipt** as school representative
- **Record delivery time** and personnel name
- **Note any issues** or special instructions
- **Update school records** with delivery confirmation

### **After Delivery**

#### **1. Distribution**
- **Contact parents** to arrange pickup
- **Schedule distribution** during school hours
- **Verify parent identity** before handing over glasses
- **Get parent signature** on receipt form

#### **2. Follow-up**
- **Update delivery status** in the system
- **Record parent signature** and pickup time
- **Note any feedback** from parents
- **Report any issues** to medical staff

## 🔄 Refreshing Data

### **When to Refresh**
- **After status updates** to see changes
- **When expecting new deliveries** to appear
- **If data seems outdated** or incorrect
- **After system maintenance** or updates

### **How to Refresh**
1. **Click the "Refresh" button** in the top-right of the filters section
2. **Wait for data to reload** (may take a few seconds)
3. **Verify updates** are reflected in the table
4. **Check statistics cards** for updated counts

### **Automatic Updates**
- **Data refreshes automatically** when you make changes
- **Status updates** appear immediately
- **New deliveries** may take a few minutes to appear
- **Real-time updates** are planned for future versions

## 🚨 Troubleshooting

### **Common Issues**

#### **1. No Data Displayed**
**Problem**: Table shows "No delivery records found"
**Possible Causes**:
- No deliveries exist in the system
- Your user account lacks permissions
- System is experiencing technical issues

**Solutions**:
1. **Check with administrator** about your permissions
2. **Verify system status** with IT support
3. **Try refreshing** the page
4. **Contact medical staff** to confirm deliveries exist

#### **2. Can't Update Status**
**Problem**: Edit button doesn't work or changes don't save
**Possible Causes**:
- Insufficient permissions
- System error
- Network connectivity issues

**Solutions**:
1. **Check your user role** and permissions
2. **Try refreshing** the page
3. **Contact administrator** for permission issues
4. **Report technical problems** to IT support

#### **3. Search Not Working**
**Problem**: Search returns no results or incorrect results
**Possible Causes**:
- Typing errors
- Data format issues
- Filter conflicts

**Solutions**:
1. **Check spelling** of search terms
2. **Clear all filters** and try again
3. **Use partial names** instead of full names
4. **Verify search term** exists in the system

### **Getting Help**

#### **Contact Information**
- **Technical Support**: IT department or system administrator
- **Medical Staff**: Healthcare providers managing the system
- **Administrators**: System managers and coordinators

#### **What to Report**
When reporting issues, include:
- **Your user ID** and role
- **Specific error message** (if any)
- **Steps to reproduce** the problem
- **What you expected** vs. what happened
- **Screenshots** if possible

## 💡 Best Practices

### **Data Management**

#### **1. Regular Updates**
- **Update delivery status** promptly when changes occur
- **Add detailed notes** for important changes
- **Verify information** before making updates
- **Report discrepancies** immediately

#### **2. Communication**
- **Coordinate with delivery personnel** about schedules
- **Notify parents** about delivery arrangements
- **Keep medical staff informed** of any issues
- **Document all communications** in notes

#### **3. Quality Control**
- **Verify patient information** before delivery
- **Check glasses specifications** match prescriptions
- **Confirm delivery location** and timing
- **Validate receipt signatures** and documentation

### **Efficiency Tips**

#### **1. Use Filters Effectively**
- **Start with broad filters** and narrow down
- **Save common filter combinations** for regular use
- **Use search for specific items** rather than scrolling
- **Refresh data regularly** to stay current

#### **2. Organize Your Work**
- **Group deliveries by school** for efficient processing
- **Prioritize pending deliveries** that need attention
- **Batch similar operations** together
- **Keep notes organized** and searchable

#### **3. Stay Informed**
- **Monitor statistics** for trends and patterns
- **Review delivery schedules** regularly
- **Check for system updates** and new features
- **Participate in training** sessions when available

## 🔮 Future Features

### **Planned Enhancements**

#### **1. Real-time Updates**
- **Live status updates** without manual refresh
- **Push notifications** for important changes
- **Instant messaging** between staff members
- **Real-time delivery tracking** with GPS

#### **2. Mobile Access**
- **Mobile app** for delivery personnel
- **Offline capability** for remote locations
- **Photo confirmation** of deliveries
- **Digital signatures** for receipts

#### **3. Advanced Reporting**
- **Delivery analytics** and performance metrics
- **School performance** comparisons
- **Trend analysis** and forecasting
- **Custom report** generation

#### **4. Automation**
- **Automatic scheduling** of deliveries
- **Smart routing** for delivery personnel
- **Automated notifications** to parents
- **Integration** with external delivery services

### **User Feedback**
- **Submit feature requests** through the system
- **Report bugs** and technical issues
- **Suggest improvements** to workflows
- **Participate in user testing** for new features

## 📚 Additional Resources

### **Related Documentation**
- **Hospital Mobile Unit Workflow**: Complete screening process guide
- **Inventory Management**: Glasses stock management
- **User Management**: System user administration
- **API Reference**: Technical documentation for developers

### **Training Materials**
- **Video Tutorials**: Step-by-step system walkthroughs
- **User Guides**: Detailed feature explanations
- **Best Practices**: Tips and recommendations
- **FAQ**: Common questions and answers

### **Support Channels**
- **Help Desk**: Technical support and troubleshooting
- **User Forums**: Community support and discussions
- **Training Sessions**: Regular user education programs
- **Documentation Updates**: Latest system information

---

**User Manual Version**: 1.0  
**Last Updated**: September 2025  
**For Users**: Medical Staff, Administrators, School Coordinators  
**Maintained By**: EVEP Development Team

