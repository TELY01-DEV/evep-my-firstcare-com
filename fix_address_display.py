#!/usr/bin/env python3

import re

# Read the file
with open('frontend/src/components/StandardVisionScreeningForm.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the address formatting function after the calculateAge function
address_function = '''    const formatAddressForDisplay = (address?: any) => {
      if (!address) return "Address not available";
      if (typeof address === "string") return address;
      if (typeof address === "object") {
        const parts = [];
        if (address.house_no) parts.push(`บ้านเลขที่ ${address.house_no}`);
        if (address.village_no) parts.push(`หมู่ ${address.village_no}`);
        if (address.soi) parts.push(`ซอย ${address.soi}`);
        if (address.road) parts.push(`ถนน ${address.road}`);
        if (address.subdistrict) parts.push(`ตำบล/แขวง ${address.subdistrict}`);
        if (address.district) parts.push(`อำเภอ/เขต ${address.district}`);
        if (address.province) parts.push(`จังหวัด ${address.province}`);
        if (address.postal_code) parts.push(`รหัสไปรษณีย์ ${address.postal_code}`);
        return parts.join("\\n");
      }
      return String(address) || "Address not available";
    };'''

# Add the formatGender function
gender_function = '''    const formatGender = (gender: string | number) => {
      if (typeof gender === "number") {
        switch (gender) {
          case 0: return "Female";
          case 1: return "Male";
          case 2: return "Other";
          default: return "Not specified";
        }
      }
      return gender || "Not specified";
    };'''

# Find the calculateAge function and add the new functions after it
calculate_age_pattern = r'(const calculateAge = \(birthDate: string\) => \{[^}]+\};)'
match = re.search(calculate_age_pattern, content, re.DOTALL)
if match:
    # Insert the new functions after calculateAge
    insert_point = match.end()
    content = content[:insert_point] + '\n' + address_function + '\n' + gender_function + '\n' + content[insert_point:]

# Update the address display
content = re.sub(
    r'\{typeof selectedPatient\.address === "object" \? JSON\.stringify\(selectedPatient\.address\) : selectedPatient\.address \|\| "Not specified"\}',
    '{formatAddressForDisplay(selectedPatient.address)}',
    content
)

# Update the gender display
content = re.sub(
    r'\{selectedPatient\.gender \|\| "Not specified"\}',
    '{formatGender(selectedPatient.gender)}',
    content
)

# Improve the calculateAge function to handle invalid dates
content = re.sub(
    r'const calculateAge = \(birthDate: string\) => \{',
    '''const calculateAge = (birthDate: string) => {
      if (!birthDate) return "Not specified";
      const today = new Date();
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return "Invalid Date";''',
    content
)

# Add styling to the address display
content = re.sub(
    r'<Typography variant="body1" fontWeight="medium">\s*\{formatAddressForDisplay\(selectedPatient\.address\)\}',
    '<Typography variant="body1" fontWeight="medium" sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>\n                      {formatAddressForDisplay(selectedPatient.address)}',
    content
)

# Write the updated content back to the file
with open('frontend/src/components/StandardVisionScreeningForm.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Address formatting and gender display fixes applied successfully!")
