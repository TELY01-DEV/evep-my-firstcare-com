#!/usr/bin/env python3

import re

def fix_standard_vision_screening():
    file_path = '/www/dk_project/evep-my-firstcare-com/frontend/src/components/StandardVisionScreeningForm.tsx'
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the List component section and replace it with Grid card view
    list_pattern = r'(\s+)<List>\s+{patients\s+\.filter\(patient =>\s+patient\.first_name\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\|\s+patient\.last_name\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\|\s+patient\.school\?\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)\s+\)\s+\.map\(\(patient\) => \(\s+<ListItem[^>]*>\s+<ListItemAvatar>\s+<Avatar>\s+<Person />\s+</Avatar>\s+</ListItemAvatar>\s+<ListItemText[^>]*>\s+{[^}]+}\s+secondary=\{\s+<Box>\s+<Typography[^>]*>\s+Age: [^}]+}\s+</Typography>\s+<Typography[^>]*>\s+School: [^}]+}\s+</Typography>\s+</Box>\s+}\s+/>\s+<Chip[^>]*>\s+{[^}]+}\s+</Chip>\s+</ListItem>\s+\)\)\s+</List>'
    
    # Replace with Grid card view
    replacement = '''                <Grid container spacing={2}>
                  {patients
                    .filter(patient => 
                      patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      patient.school?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((patient) => (
                      <Grid item xs={12} sm={6} md={4} key={patient._id}>
                        {renderStudentCard(patient)}
                      </Grid>
                    ))}
                </Grid>
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <Pagination
                    count={Math.ceil(patients.filter(patient => 
                      patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      patient.school?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length / itemsPerPage)}
                    page={currentPage}
                    onChange={(e, value) => setCurrentPage(value)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>'''
    
    # Apply the replacement
    content = re.sub(list_pattern, replacement, content, flags=re.DOTALL)
    
    # Write the file back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Fixed Standard Vision Screening Form with card view and pagination")

if __name__ == "__main__":
    fix_standard_vision_screening()
