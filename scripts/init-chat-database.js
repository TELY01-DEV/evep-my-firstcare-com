// Initialize Chat Bot Database Collections
// This script sets up the chat bot database with initial data

print("=== Initializing Chat Bot Database ===");

// Switch to evep database
db = db.getSiblingDB('evep');

// Create collections with indexes
print("Creating collections and indexes...");

// Chat Conversations Collection
db.createCollection("chat_conversations");
db.chat_conversations.createIndex({ "conversation_id": 1 }, { unique: true });
db.chat_conversations.createIndex({ "user_id": 1 });
db.chat_conversations.createIndex({ "created_at": 1 });
db.chat_conversations.createIndex({ "updated_at": 1 });

// Chat Suggestions Collection
db.createCollection("chat_suggestions");
db.chat_suggestions.createIndex({ "target_roles": 1 });
db.chat_suggestions.createIndex({ "category": 1 });
db.chat_suggestions.createIndex({ "is_active": 1 });
db.chat_suggestions.createIndex({ "priority": 1 });

// Chat Intent Patterns Collection
db.createCollection("chat_intent_patterns");
db.chat_intent_patterns.createIndex({ "intent_name": 1 }, { unique: true });
db.chat_intent_patterns.createIndex({ "is_active": 1 });

// Chat Response Templates Collection
db.createCollection("chat_response_templates");
db.chat_response_templates.createIndex({ "intent_name": 1 }, { unique: true });
db.chat_response_templates.createIndex({ "is_active": 1 });

// Chat Learning Data Collection
db.createCollection("chat_learning_data");
db.chat_learning_data.createIndex({ "user_id": 1 });
db.chat_learning_data.createIndex({ "conversation_id": 1 });
db.chat_learning_data.createIndex({ "intent": 1 });
db.chat_learning_data.createIndex({ "timestamp": 1 });

print("Collections and indexes created successfully!");

// Insert initial intent patterns
print("Inserting initial intent patterns...");

const intentPatterns = [
    {
        intent_name: "screening_help",
        patterns: [
            // English patterns
            "how.*screen", "start.*screen", "screen.*process", "vision.*test",
            "eye.*exam", "screening.*procedure", "how.*test.*vision",
            // Thai patterns
            "ตรวจ.*สายตา", "เริ่ม.*ตรวจ", "กระบวนการ.*ตรวจ", "การตรวจ.*สายตา",
            "ตรวจ.*ตา", "วิธี.*ตรวจ", "ขั้นตอน.*ตรวจ", "การทดสอบ.*สายตา",
            "เริ่ม.*การตรวจ", "ทำ.*การตรวจ", "ตรวจ.*ความ.*ชัด"
        ],
        description: "Vision screening procedures and help",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        intent_name: "inventory_query",
        patterns: [
            // English patterns
            "inventory", "stock", "glasses", "equipment", "available",
            "how.*many.*glasses", "what.*equipment", "inventory.*status",
            // Thai patterns
            "คลัง.*สินค้า", "สต็อก", "แว่น.*ตา", "อุปกรณ์", "มี.*อยู่",
            "แว่น.*ตา.*มี.*กี่.*อัน", "อุปกรณ์.*อะไร", "สถานะ.*คลัง.*สินค้า",
            "จำนวน.*แว่น", "อุปกรณ์.*ตรวจ", "เครื่องมือ.*ตรวจ"
        ],
        description: "Inventory and equipment queries",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        intent_name: "student_info",
        patterns: [
            // English patterns
            "student", "find.*student", "student.*record", "patient.*info",
            "look.*up.*student", "student.*data", "patient.*data",
            // Thai patterns
            "นักเรียน", "หานักเรียน", "ข้อมูล.*นักเรียน", "ข้อมูล.*ผู้ป่วย",
            "ค้นหา.*นักเรียน", "ประวัติ.*นักเรียน", "ข้อมูล.*ผู้ป่วย",
            "รายชื่อ.*นักเรียน", "ข้อมูล.*เด็ก", "ประวัติ.*เด็ก"
        ],
        description: "Student and patient information queries",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        intent_name: "medical_team",
        patterns: [
            // English patterns
            "medical.*team", "doctor", "nurse", "staff", "schedule",
            "team.*member", "medical.*staff", "who.*is.*available",
            // Thai patterns
            "ทีม.*แพทย์", "แพทย์", "พยาบาล", "เจ้าหน้าที่", "ตาราง.*งาน",
            "สมาชิก.*ทีม", "บุคลากร.*แพทย์", "ใคร.*ว่าง",
            "หมอ", "พยาบาล", "เจ้าหน้าที่.*แพทย์", "ตาราง.*เวร"
        ],
        description: "Medical team and staff information",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        intent_name: "system_help",
        patterns: [
            // English patterns
            "how.*to", "help", "navigate", "where.*is", "how.*do.*i",
            "system.*help", "portal.*help", "how.*use",
            // Thai patterns
            "วิธี.*ใช้", "ช่วย", "นำทาง", "อยู่.*ที่.*ไหน", "ทำ.*ยังไง",
            "ช่วยเหลือ.*ระบบ", "ช่วยเหลือ.*พอร์ทัล", "ใช้.*ยังไง",
            "วิธี.*การ.*ใช้", "คู่มือ.*การ.*ใช้", "การ.*ใช้งาน"
        ],
        description: "System help and navigation",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        intent_name: "reports",
        patterns: [
            // English patterns
            "report", "analytics", "statistics", "data", "summary",
            "generate.*report", "view.*data", "dashboard",
            // Thai patterns
            "รายงาน", "การวิเคราะห์", "สถิติ", "ข้อมูล", "สรุป",
            "สร้าง.*รายงาน", "ดู.*ข้อมูล", "แดชบอร์ด",
            "รายงาน.*ผล", "ข้อมูล.*สถิติ", "สรุป.*ผล"
        ],
        description: "Reports and analytics",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    }
];

db.chat_intent_patterns.insertMany(intentPatterns);
print("Intent patterns inserted successfully!");

// Insert initial response templates
print("Inserting initial response templates...");

const responseTemplates = [
    {
        intent_name: "screening_help",
        response: "I can help you with vision screening procedures. Here's how to start a screening session:\n\nฉันสามารถช่วยคุณเกี่ยวกับขั้นตอนการตรวจสายตาได้ นี่คือวิธีเริ่มการตรวจ:",
        suggestions: [
            "Start a new screening session / เริ่มการตรวจใหม่",
            "View screening procedures / ดูขั้นตอนการตรวจ",
            "Check screening equipment / ตรวจสอบอุปกรณ์การตรวจ",
            "Review screening results / ตรวจสอบผลการตรวจ"
        ],
        quick_actions: [
            {"label": "Start Screening / เริ่มตรวจ", "action": "navigate", "path": "/dashboard/screenings"},
            {"label": "View Procedures / ดูขั้นตอน", "action": "help", "topic": "screening_procedures"}
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {}
    },
    {
        intent_name: "inventory_query",
        response: "I can help you check inventory status. Let me look up the current inventory information:\n\nฉันสามารถช่วยคุณตรวจสอบสถานะคลังสินค้าได้ ให้ฉันค้นหาข้อมูลคลังสินค้าปัจจุบัน:",
        suggestions: [
            "Check glasses inventory / ตรวจสอบคลังแว่นตา",
            "View equipment status / ดูสถานะอุปกรณ์",
            "Check screening kits / ตรวจสอบชุดตรวจ",
            "View delivery status / ดูสถานะการจัดส่ง"
        ],
        quick_actions: [
            {"label": "View Inventory / ดูคลังสินค้า", "action": "navigate", "path": "/dashboard/inventory"},
            {"label": "Check Glasses / ตรวจแว่นตา", "action": "navigate", "path": "/dashboard/glasses-management"}
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {}
    },
    {
        intent_name: "student_info",
        response: "I can help you find student information. Please provide the student's name or ID:\n\nฉันสามารถช่วยคุณหาข้อมูลนักเรียนได้ กรุณาระบุชื่อหรือรหัสนักเรียน:",
        suggestions: [
            "Search by student name / ค้นหาด้วยชื่อนักเรียน",
            "Search by student ID / ค้นหาด้วยรหัสนักเรียน",
            "View all students / ดูนักเรียนทั้งหมด",
            "Check student records / ตรวจสอบประวัตินักเรียน"
        ],
        quick_actions: [
            {"label": "Search Students / ค้นหานักเรียน", "action": "navigate", "path": "/dashboard/evep/students"},
            {"label": "View Patients / ดูผู้ป่วย", "action": "navigate", "path": "/dashboard/patients"}
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {}
    },
    {
        intent_name: "medical_team",
        response: "I can help you with medical team information. Here's what I can assist with:\n\nฉันสามารถช่วยคุณเกี่ยวกับข้อมูลทีมแพทย์ได้ นี่คือสิ่งที่ฉันสามารถช่วยได้:",
        suggestions: [
            "View medical staff / ดูบุคลากรแพทย์",
            "Check schedules / ตรวจสอบตารางงาน",
            "Find team members / หาสมาชิกทีม",
            "View staff roles / ดูบทบาทเจ้าหน้าที่"
        ],
        quick_actions: [
            {"label": "Medical Staff / บุคลากรแพทย์", "action": "navigate", "path": "/dashboard/medical-staff"},
            {"label": "Staff Management / จัดการเจ้าหน้าที่", "action": "navigate", "path": "/dashboard/medical-staff-management"}
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {}
    },
    {
        intent_name: "system_help",
        response: "I'm here to help you navigate the EVEP Medical Portal. What would you like to know?\n\nฉันอยู่ที่นี่เพื่อช่วยคุณนำทางใน EVEP Medical Portal คุณต้องการทราบอะไร?",
        suggestions: [
            "How to use the portal / วิธีใช้พอร์ทัล",
            "Navigation help / ช่วยเหลือการนำทาง",
            "Feature explanations / คำอธิบายฟีเจอร์",
            "System overview / ภาพรวมระบบ"
        ],
        quick_actions: [
            {"label": "Portal Guide / คู่มือพอร์ทัล", "action": "help", "topic": "portal_guide"},
            {"label": "Dashboard / แดชบอร์ด", "action": "navigate", "path": "/dashboard"}
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {}
    },
    {
        intent_name: "reports",
        response: "I can help you generate and view reports. Here are the available reporting options:\n\nฉันสามารถช่วยคุณสร้างและดูรายงานได้ นี่คือตัวเลือกรายงานที่มี:",
        suggestions: [
            "Generate screening reports / สร้างรายงานการตรวจ",
            "View analytics / ดูการวิเคราะห์",
            "Check statistics / ตรวจสอบสถิติ",
            "Export data / ส่งออกข้อมูล"
        ],
        quick_actions: [
            {"label": "View Reports / ดูรายงาน", "action": "navigate", "path": "/dashboard/reports"},
            {"label": "Analytics / การวิเคราะห์", "action": "navigate", "path": "/dashboard/analytics"}
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {}
    }
];

db.chat_response_templates.insertMany(responseTemplates);
print("Response templates inserted successfully!");

// Insert initial suggestions
print("Inserting initial suggestions...");

const suggestions = [
    // General suggestions
    {
        text: "How do I start a vision screening? / วิธีเริ่มการตรวจสายตา?",
        target_roles: ["all"],
        category: "screening",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    {
        text: "Where can I find student information? / หาข้อมูลนักเรียนได้ที่ไหน?",
        target_roles: ["all"],
        category: "student_info",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    {
        text: "How do I check inventory status? / ตรวจสอบสถานะคลังสินค้ายังไง?",
        target_roles: ["all"],
        category: "inventory",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    {
        text: "What reports are available? / มีรายงานอะไรบ้าง?",
        target_roles: ["all"],
        category: "reports",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    
    // Medical staff suggestions
    {
        text: "How do I interpret screening results? / ตีความผลการตรวจยังไง?",
        target_roles: ["doctor", "nurse", "medical_staff"],
        category: "screening",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    {
        text: "What are the screening procedures? / ขั้นตอนการตรวจมีอะไรบ้าง?",
        target_roles: ["doctor", "nurse", "medical_staff"],
        category: "screening",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    {
        text: "How do I access patient records? / เข้าถึงประวัติผู้ป่วยยังไง?",
        target_roles: ["doctor", "nurse", "medical_staff"],
        category: "patient_info",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    {
        text: "What equipment do I need for screening? / ต้องใช้อุปกรณ์อะไรในการตรวจ?",
        target_roles: ["doctor", "nurse", "medical_staff"],
        category: "equipment",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    
    // Teacher suggestions
    {
        text: "How do I view student screening results? / ดูผลการตรวจนักเรียนยังไง?",
        target_roles: ["teacher"],
        category: "student_info",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    {
        text: "How do I schedule screenings? / จัดตารางการตรวจยังไง?",
        target_roles: ["teacher"],
        category: "scheduling",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    {
        text: "What screening types are available? / มีการตรวจแบบไหนบ้าง?",
        target_roles: ["teacher"],
        category: "screening",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    
    // Admin suggestions
    {
        text: "How do I manage user permissions? / จัดการสิทธิ์ผู้ใช้ยังไง?",
        target_roles: ["admin", "super_admin"],
        category: "user_management",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    {
        text: "Where can I view system analytics? / ดูการวิเคราะห์ระบบได้ที่ไหน?",
        target_roles: ["admin", "super_admin"],
        category: "analytics",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    {
        text: "How do I generate reports? / สร้างรายงานยังไง?",
        target_roles: ["admin", "super_admin"],
        category: "reports",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    },
    {
        text: "What are the system settings? / การตั้งค่าระบบมีอะไรบ้าง?",
        target_roles: ["admin", "super_admin"],
        category: "system_settings",
        priority: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        metadata: {}
    }
];

db.chat_suggestions.insertMany(suggestions);
print("Suggestions inserted successfully!");

print("=== Chat Bot Database Initialization Complete! ===");
print("Collections created:");
print("- chat_conversations");
print("- chat_suggestions");
print("- chat_intent_patterns");
print("- chat_response_templates");
print("- chat_learning_data");
print("");
print("Initial data inserted:");
print("- " + intentPatterns.length + " intent patterns");
print("- " + responseTemplates.length + " response templates");
print("- " + suggestions.length + " suggestions");
print("");
print("Database is ready for chat bot operations!");
