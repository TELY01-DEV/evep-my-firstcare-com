#!/usr/bin/env python3
"""
Fix timestamp calls in patients API
"""

import re

# Read the file
with open('app/api/patients.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all instances of settings.get_current_timestamp() with datetime.utcnow().isoformat()
content = re.sub(
    r'settings\.get_current_timestamp\(\)',
    'datetime.utcnow().isoformat()',
    content
)

# Write back to file
with open('app/api/patients.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed all timestamp calls in patients.py")
