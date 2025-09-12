#!/usr/bin/env python3
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient('mongodb://mongo-primary:27017')
db = client.evep

print("=== ALL DATABASE COLLECTIONS ===")
collections = db.list_collection_names()
for i, coll in enumerate(collections):
    print(f"{i+1}. {coll}")

print(f"\nTotal collections: {len(collections)}")

# Check collection sizes
print("\n=== COLLECTION SIZES ===")
for coll_name in collections:
    count = db[coll_name].count_documents({})
    print(f"{coll_name}: {count} documents")

client.close()
