#!/usr/bin/env python3
from pymongo import MongoClient

client = MongoClient('mongodb://mongo-primary:27017')
db = client.evep

collections = db.list_collection_names()
print('=== FINAL COLLECTIONS STATUS ===')
for coll in collections:
    count = db[coll].count_documents({})
    print(f'{coll}: {count} documents')

print(f'\nTotal collections: {len(collections)}')

# Check if evep.parents exists
if 'evep.parents' in collections:
    print('\n✓ evep.parents collection exists')
else:
    print('\n⚠ evep.parents collection missing - needs to be created')

client.close()
