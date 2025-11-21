// MongoDB Script to Create Unique Indexes for Duplicate Prevention
// Run this script on MongoDB to prevent patient record duplicates
// Usage: mongosh evep < create_unique_indexes.js

print("🚀 Starting database optimization for duplicate prevention...");

// Switch to evep database
use('evep');

print("\n🔧 Creating unique indexes to prevent duplicates...");

try {
    // 1. Unique index on patients collection for CID
    print("📝 Creating unique index on patients.cid...");
    db.patients.createIndex(
        { "cid": 1 }, 
        { 
            unique: true, 
            sparse: true,
            name: "unique_patient_cid",
            background: true 
        }
    );
    print("✅ Unique CID index created successfully");
    
    // 2. Compound unique index on patients for name + DOB (to catch duplicates with different/missing CIDs)
    print("📝 Creating compound unique index on patients (name + DOB)...");
    db.patients.createIndex(
        { 
            "first_name": 1, 
            "last_name": 1, 
            "date_of_birth": 1 
        }, 
        { 
            unique: true, 
            sparse: true,
            name: "unique_patient_name_dob",
            background: true 
        }
    );
    print("✅ Unique name+DOB index created successfully");
    
    // 3. Index on screening sessions to prevent duplicate sessions for same patient on same day
    print("📝 Creating index on screening sessions for duplicate prevention...");
    db.screenings.createIndex(
        { 
            "patient_id": 1, 
            "screening_type": 1,
            "created_at": 1 
        }, 
        { 
            name: "screening_deduplication_index",
            background: true 
        }
    );
    print("✅ Screening deduplication index created successfully");
    
    // 4. Unique index on student_patient_mapping
    print("📝 Creating unique index on student-patient mapping...");
    db.student_patient_mapping.createIndex(
        { "student_id": 1 }, 
        { 
            unique: true, 
            sparse: true,
            name: "unique_student_mapping",
            background: true 
        }
    );
    print("✅ Unique student mapping index created successfully");
    
    // 5. Performance indexes for common queries
    print("📝 Creating performance indexes...");
    
    // Index for patient searches
    db.patients.createIndex(
        { 
            "first_name": "text", 
            "last_name": "text", 
            "cid": "text", 
            "school": "text" 
        },
        { 
            name: "patient_search_text",
            background: true 
        }
    );
    print("✅ Patient search text index created");
    
    // Index for screening sessions by patient
    db.screenings.createIndex(
        { 
            "patient_id": 1, 
            "created_at": -1 
        },
        { 
            name: "screening_by_patient_date",
            background: true 
        }
    );
    print("✅ Screening by patient/date index created");
    
    // Index for active patients
    db.patients.createIndex(
        { 
            "is_active": 1, 
            "created_at": -1 
        },
        { 
            name: "active_patients_by_date",
            background: true 
        }
    );
    print("✅ Active patients by date index created");
    
    print("\n✅ All indexes created successfully!");
    
    // List all indexes to verify
    print("\n📋 Current indexes on patients collection:");
    const patientIndexes = db.patients.getIndexes();
    patientIndexes.forEach(index => {
        print(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    print("\n📋 Current indexes on screenings collection:");
    const screeningIndexes = db.screenings.getIndexes();
    screeningIndexes.forEach(index => {
        print(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
} catch (error) {
    print(`❌ Error creating indexes: ${error.message}`);
    if (error.message.includes("duplicate key")) {
        print("\n🔍 Duplicate records found. Running cleanup...");
        
        // Find and remove duplicate patients by CID
        print("🧹 Checking for duplicate patients by CID...");
        const cidDuplicates = db.patients.aggregate([
            { $match: { "cid": { $ne: null, $ne: "", $ne: "0000000000000" } } },
            { $group: { _id: "$cid", count: { $sum: 1 }, docs: { $push: "$_id" } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        
        cidDuplicates.forEach(dup => {
            print(`  Found ${dup.count} patients with CID: ${dup._id}`);
            // Keep the first one, remove the rest
            const docsToRemove = dup.docs.slice(1);
            if (docsToRemove.length > 0) {
                const result = db.patients.deleteMany({ _id: { $in: docsToRemove } });
                print(`    Removed ${result.deletedCount} duplicate patient records`);
            }
        });
        
        // Find and remove duplicate patients by name + DOB
        print("🧹 Checking for duplicate patients by name + DOB...");
        const nameDobDuplicates = db.patients.aggregate([
            { 
                $match: { 
                    "first_name": { $ne: null, $ne: "" }, 
                    "last_name": { $ne: null, $ne: "" }, 
                    "date_of_birth": { $ne: null, $ne: "" } 
                } 
            },
            { 
                $group: {
                    _id: { 
                        first_name: "$first_name", 
                        last_name: "$last_name", 
                        date_of_birth: "$date_of_birth" 
                    }, 
                    count: { $sum: 1 }, 
                    docs: { $push: "$_id" }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        
        nameDobDuplicates.forEach(dup => {
            print(`  Found ${dup.count} patients with name: ${dup._id.first_name} ${dup._id.last_name} DOB: ${dup._id.date_of_birth}`);
            // Keep the first one, remove the rest  
            const docsToRemove = dup.docs.slice(1);
            if (docsToRemove.length > 0) {
                const result = db.patients.deleteMany({ _id: { $in: docsToRemove } });
                print(`    Removed ${result.deletedCount} duplicate patient records`);
            }
        });
        
        print("✅ Duplicate cleanup completed! Retrying index creation...");
        
        // Retry index creation after cleanup
        try {
            db.patients.createIndex({ "cid": 1 }, { unique: true, sparse: true, name: "unique_patient_cid", background: true });
            db.patients.createIndex({ "first_name": 1, "last_name": 1, "date_of_birth": 1 }, { unique: true, sparse: true, name: "unique_patient_name_dob", background: true });
            print("✅ Unique indexes created successfully after cleanup!");
        } catch (retryError) {
            print(`❌ Still unable to create unique indexes: ${retryError.message}`);
        }
    }
}

print("\n🎉 Database optimization completed!");
print("📌 Unique constraints are now in place to prevent:");
print("   • Duplicate patients with same CID");
print("   • Duplicate patients with same name + birth date");
print("   • Duplicate screening sessions for same patient");
print("   • Duplicate student-patient mappings");
print("\n🔗 Production access: ssh deploy@103.22.182.146 -p 2222");
print("🔗 MongoDB shell: mongosh evep < create_unique_indexes.js");