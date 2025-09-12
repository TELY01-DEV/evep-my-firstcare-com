#!/usr/bin/env python3

import re

def improve_standard_vision_screening():
    # Read the file
    with open('frontend/src/components/StandardVisionScreeningForm.tsx', 'r') as f:
        content = f.read()
    
    # 1. Add new imports
    new_imports = '''import {
  Breadcrumbs,
  Link,
  Pagination,
  CardActionArea,
  CardMedia,
  Stack,
  Badge,'''
    
    # Find the import section and add new imports
    pattern = r'(import {\n  Box,)'
    replacement = new_imports + r'\n  \1'
    content = re.sub(pattern, replacement, content)
    
    # 2. Add pagination state variables
    pattern = r'(const \[filterStatus, setFilterStatus\] = useState\(\'all\'\);\n)'
    replacement = r'\1  const [currentPage, setCurrentPage] = useState(1);\n  const [itemsPerPage] = useState(6);\n  const [showStudentProfile, setShowStudentProfile] = useState(false);\n'
    content = re.sub(pattern, replacement, content)
    
    # 3. Add breadcrumb navigation
    breadcrumb = '''      {/* Breadcrumb Navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={(e) => { e.preventDefault(); setActiveStep(0); }}
        >
          Patient Selection
        </Link>
        {activeStep > 0 && (
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveStep(1); }}
          >
            Screening Setup
          </Link>
        )}
        {activeStep > 1 && (
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveStep(2); }}
          >
            Vision Assessment
          </Link>
        )}
        {activeStep > 2 && (
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveStep(3); }}
          >
            Results & Recommendations
          </Link>
        )}
        {activeStep > 3 && (
          <Typography color="text.primary">Complete Screening</Typography>
        )}
      </Breadcrumbs>

'''
    
    # Find the workflow stepper section and add breadcrumb before it
    pattern = r'(      {/* Workflow Stepper */})'
    replacement = breadcrumb + r'\1'
    content = re.sub(pattern, replacement, content)
    
    # 4. Add the renderStudentCard function
    renderStudentCard_function = '''  const renderStudentCard = (patient: Patient) => (
    <Card
      key={patient._id}
      sx={{
        border: selectedPatient?._id === patient._id ? '2px solid' : '1px solid',
        borderColor: selectedPatient?._id === patient._id ? 'primary.main' : 'divider',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 2
        }
      }}
      onClick={() => {
        setSelectedPatient(patient);
        setShowStudentProfile(true);
      }}
    >
      <CardActionArea>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ mr: 2, width: 56, height: 56 }}>
              {patient.photos && patient.photos.length > 0 ? (
                <CardMedia
                  component="img"
                  height="56"
                  image={patient.photos[0]}
                  alt={`${patient.first_name} ${patient.last_name}`}
                  sx={{ objectFit: 'cover' }}
                />
              ) : (
                <Person sx={{ fontSize: 28 }} />
              )}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div">
                {patient.first_name} {patient.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Age: {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years
              </Typography>
            </Box>
            <Chip
              label={selectedPatient?._id === patient._id ? 'Selected' : 'Select'}
              color={selectedPatient?._id === patient._id ? 'primary' : 'default'}
              variant={selectedPatient?._id === patient._id ? 'filled' : 'outlined'}
            />
          </Box>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip icon={<School />} label={patient.school || 'N/A'} size="small" variant="outlined" />
            <Chip label={`Grade ${patient.grade || 'N/A'}`} size="small" variant="outlined" />
            <Chip label={patient.gender} size="small" variant="outlined" />
          </Stack>
          {patient.parent_name && (
            <Typography variant="body2" color="text.secondary">
              Parent: {patient.parent_name}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );

'''
    
    # Find the renderWorkflowStep function and add the new function before it
    pattern = r'(  const renderWorkflowStep = \(\) => \{)'
    replacement = renderStudentCard_function + r'\1'
    content = re.sub(pattern, replacement, content)
    
    # 5. Add the renderStudentProfile function
    renderStudentProfile_function = '''  const renderStudentProfile = () => (
    <Dialog
      open={showStudentProfile}
      onClose={() => setShowStudentProfile(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Student Profile</Typography>
          <IconButton onClick={() => setShowStudentProfile(false)}>
            <Cancel />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedPatient && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ mr: 3, width: 80, height: 80 }}>
                {selectedPatient.photos && selectedPatient.photos.length > 0 ? (
                  <CardMedia
                    component="img"
                    height="80"
                    image={selectedPatient.photos[0]}
                    alt={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Person sx={{ fontSize: 40 }} />
                )}
              </Avatar>
              <Box>
                <Typography variant="h5" component="div">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {selectedPatient.gender} • Age: {new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()} years
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>School Information</Typography>
                    <Typography variant="body2">School: {selectedPatient.school || 'N/A'}</Typography>
                    <Typography variant="body2">Grade: {selectedPatient.grade || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Contact Information</Typography>
                    <Typography variant="body2">Parent: {selectedPatient.parent_name || 'N/A'}</Typography>
                    <Typography variant="body2">Phone: {selectedPatient.parent_phone || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setShowStudentProfile(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setShowStudentProfile(false);
                  setActiveStep(1);
                }}
              >
                Continue to Screening Setup
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

'''
    
    # Find the renderWorkflowStep function and add the new function before it
    pattern = r'(  const renderWorkflowStep = \(\) => \{)'
    replacement = renderStudentProfile_function + r'\1'
    content = re.sub(pattern, replacement, content)
    
    # 6. Replace the List component with Card Grid layout
    # Find the List component and replace it
    list_pattern = r'<List>\s*{patients\s*\.filter\(patient => \s*patient\.first_name\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\|\s*patient\.last_name\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\|\s*patient\.school\?\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)\s*\)\s*\.map\(\(patient\) => \(\s*<ListItem[^>]*>\s*<ListItemAvatar>\s*<Avatar>\s*<Person />\s*</Avatar>\s*</ListItemAvatar>\s*<ListItemText[^>]*>\s*{[^}]*}\s*</ListItemText>\s*<Chip[^>]*>\s*{[^}]*}\s*</Chip>\s*</ListItem>\s*\)\)}\s*</List>'
    
    new_card_grid = '''<Grid container spacing={2} sx={{ mb: 3 }}>
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
                
                {/* Pagination */}
                {Math.ceil(patients.filter(patient => 
                  patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  patient.school?.toLowerCase().includes(searchTerm.toLowerCase())
                ).length / itemsPerPage) > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={Math.ceil(patients.filter(patient => 
                        patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        patient.school?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length / itemsPerPage)}
                      page={currentPage}
                      onChange={(event, page) => setCurrentPage(page)}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}'''
    
    # Replace the old list with new card grid
    content = re.sub(list_pattern, new_card_grid, content, flags=re.DOTALL)
    
    # 7. Add the student profile dialog to the main return statement
    pattern = r'(      <Snackbar)'
    replacement = r'      {renderStudentProfile()}\n\n      \1'
    content = re.sub(pattern, replacement, content)
    
    # Write the file back
    with open('frontend/src/components/StandardVisionScreeningForm.tsx', 'w') as f:
        f.write(content)
    
    print('Successfully improved Standard Vision Screening Workflow with:')
    print('✅ Breadcrumb navigation')
    print('✅ Card View layout for student lists')
    print('✅ Pagination')
    print('✅ Enhanced UX with full student profile display')
    print('✅ Student profile dialog')

if __name__ == "__main__":
    improve_standard_vision_screening()
