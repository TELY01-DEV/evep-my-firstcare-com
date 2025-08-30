import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  Paper,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning,
  Info,
  PlayArrow,
  Stop,
  Save,
  Refresh,
  Assessment,
  LocalHospital,
  School,
  Person,
  Timer,
  TrendingUp,
  TrendingDown,
  RemoveRedEye,
  VisibilityOutlined,
} from '@mui/icons-material';

interface EnhancedScreeningInterfaceProps {
  patientId: string;
  patientName: string;
  onScreeningCompleted?: (results: any) => void;
  onCancel?: () => void;
}

interface EyeChartData {
  type: 'snellen' | 'tumbling_e' | 'lea_symbols';
  size: number;
  distance: number;
  letters: string[];
  currentRow: number;
  currentLetter: number;
}

interface ScreeningResults {
  left_eye_distance: string;
  right_eye_distance: string;
  left_eye_near: string;
  right_eye_near: string;
  color_vision: 'normal' | 'deficient' | 'failed';
  depth_perception: 'normal' | 'impaired' | 'failed';
  notes: string;
  recommendations: string;
  follow_up_required: boolean;
  follow_up_date?: string;
}

const EnhancedScreeningInterface: React.FC<EnhancedScreeningInterfaceProps> = ({
  patientId,
  patientName,
  onScreeningCompleted,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [currentTest, setCurrentTest] = useState<'distance' | 'near' | 'color' | 'depth'>('distance');
  const [currentEye, setCurrentEye] = useState<'left' | 'right'>('left');
  const [testInProgress, setTestInProgress] = useState(false);
  const [timer, setTimer] = useState(0);
  const [results, setResults] = useState<ScreeningResults>({
    left_eye_distance: '',
    right_eye_distance: '',
    left_eye_near: '',
    right_eye_near: '',
    color_vision: 'normal',
    depth_perception: 'normal',
    notes: '',
    recommendations: '',
    follow_up_required: false,
  });

  const [eyeChart, setEyeChart] = useState<EyeChartData>({
    type: 'snellen',
    size: 20,
    distance: 20,
    letters: ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D'],
    currentRow: 0,
    currentLetter: 0,
  });

  const steps = [
    'Setup & Calibration',
    'Distance Vision Test',
    'Near Vision Test',
    'Color Vision Test',
    'Depth Perception Test',
    'Results & Recommendations'
  ];

  const snellenChart = [
    { size: 200, letters: ['E'] },
    { size: 100, letters: ['E', 'F', 'P'] },
    { size: 70, letters: ['E', 'F', 'P', 'T', 'O', 'Z'] },
    { size: 50, letters: ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D'] },
    { size: 40, letters: ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D', 'P', 'E', 'C', 'F', 'D'] },
    { size: 30, letters: ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D', 'P', 'E', 'C', 'F', 'D', 'E', 'F', 'P', 'T', 'O'] },
    { size: 20, letters: ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D', 'P', 'E', 'C', 'F', 'D', 'E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D'] },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testInProgress) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testInProgress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    setTestInProgress(true);
    setTimer(0);
  };

  const handleStopTest = () => {
    setTestInProgress(false);
  };

  const handleLetterResponse = (correct: boolean) => {
    if (correct) {
      // Move to next letter
      if (eyeChart.currentLetter < eyeChart.letters.length - 1) {
        setEyeChart(prev => ({ ...prev, currentLetter: prev.currentLetter + 1 }));
      } else {
        // Move to next row
        if (eyeChart.currentRow < snellenChart.length - 1) {
          setEyeChart(prev => ({ 
            ...prev, 
            currentRow: prev.currentRow + 1, 
            currentLetter: 0,
            size: snellenChart[prev.currentRow + 1].size,
            letters: snellenChart[prev.currentRow + 1].letters
          }));
        } else {
          // Test complete
          handleTestComplete();
        }
      }
    } else {
      // Test complete - record results
      handleTestComplete();
    }
  };

  const handleTestComplete = () => {
    setTestInProgress(false);
    const visualAcuity = `${eyeChart.distance}/${snellenChart[eyeChart.currentRow].size}`;
    
    setResults(prev => ({
      ...prev,
      [`${currentEye}_eye_${currentTest}`]: visualAcuity
    }));

    // Move to next test
    if (currentEye === 'left') {
      setCurrentEye('right');
    } else {
      if (currentTest === 'distance') {
        setCurrentTest('near');
        setCurrentEye('left');
      } else if (currentTest === 'near') {
        setCurrentTest('color');
      } else if (currentTest === 'color') {
        setCurrentTest('depth');
      } else {
        setActiveStep(5); // Results step
      }
    }
  };

  const renderEyeChart = () => {
    const currentRowData = snellenChart[eyeChart.currentRow];
    const currentLetter = currentRowData.letters[eyeChart.currentLetter];

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {currentLetter}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Row {eyeChart.currentRow + 1} of {snellenChart.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Letter {eyeChart.currentLetter + 1} of {currentRowData.letters.length}
        </Typography>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleLetterResponse(true)}
            disabled={!testInProgress}
          >
            I can see it
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleLetterResponse(false)}
            disabled={!testInProgress}
          >
            I cannot see it
          </Button>
        </Box>
      </Box>
    );
  };

  const renderColorVisionTest = () => {
    const colorTests = [
      { number: 8, expected: '8' },
      { number: 29, expected: '29' },
      { number: 5, expected: '5' },
      { number: 3, expected: '3' },
      { number: 15, expected: '15' },
    ];

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Color Vision Test
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          What number do you see in the circle?
        </Typography>
        
        <Box sx={{ 
          width: 200, 
          height: 200, 
          borderRadius: '50%', 
          bgcolor: 'grey.300',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3
        }}>
          <Typography variant="h3" color="primary">
            {colorTests[0].number}
          </Typography>
        </Box>
        
        <TextField
          label="Enter the number you see"
          variant="outlined"
          sx={{ width: 200 }}
        />
      </Box>
    );
  };

  const renderDepthPerceptionTest = () => {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Depth Perception Test
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Which circle appears closest to you?
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', mb: 3 }}>
          {[1, 2, 3].map((num) => (
            <Box
              key={num}
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              <Typography variant="h5" color="white">
                {num}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderProgressTracking = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Test Progress</Typography>
          <Chip 
            icon={<Timer />} 
            label={formatTime(timer)} 
            color={testInProgress ? 'primary' : 'default'}
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={(activeStep / (steps.length - 1)) * 100} 
          sx={{ mb: 2 }}
        />
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Current Test: {currentTest.replace('_', ' ').toUpperCase()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Current Eye: {currentEye.toUpperCase()}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderResultsVisualization = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Screening Results
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Distance Vision
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Left Eye:</Typography>
              <Typography variant="h6" color="primary">
                {results.left_eye_distance || 'Not tested'}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography>Right Eye:</Typography>
              <Typography variant="h6" color="primary">
                {results.right_eye_distance || 'Not tested'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Near Vision
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Left Eye:</Typography>
              <Typography variant="h6" color="primary">
                {results.left_eye_near || 'Not tested'}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography>Right Eye:</Typography>
              <Typography variant="h6" color="primary">
                {results.right_eye_near || 'Not tested'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Color Vision
            </Typography>
            <Chip 
              label={results.color_vision} 
              color={results.color_vision === 'normal' ? 'success' : 'warning'}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Depth Perception
            </Typography>
            <Chip 
              label={results.depth_perception} 
              color={results.depth_perception === 'normal' ? 'success' : 'warning'}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Setup & Calibration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ensure proper lighting and patient positioning for accurate screening.
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Patient positioned at 20 feet from chart"
                  secondary="Standard distance for Snellen chart"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Proper lighting conditions"
                  secondary="Well-lit room with no glare"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Chart at eye level"
                  secondary="Chart positioned at patient's eye level"
                />
              </ListItem>
            </List>
          </Box>
        );

      case 1:
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {currentTest === 'distance' ? 'Distance Vision Test' : 'Near Vision Test'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Testing {currentEye} eye - {currentTest} vision
            </Typography>
            
            {renderEyeChart()}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Color Vision Test
            </Typography>
            {renderColorVisionTest()}
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Depth Perception Test
            </Typography>
            {renderDepthPerceptionTest()}
          </Box>
        );

      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Results & Recommendations
            </Typography>
            {renderResultsVisualization()}
            
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={results.notes}
              onChange={(e) => setResults(prev => ({ ...prev, notes: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Recommendations"
              multiline
              rows={2}
              value={results.recommendations}
              onChange={(e) => setResults(prev => ({ ...prev, recommendations: e.target.value }))}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Enhanced Vision Screening
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Patient: {patientName}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          {testInProgress ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<Stop />}
              onClick={handleStopTest}
            >
              Stop Test
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleStartTest}
            >
              Start Test
            </Button>
          )}
        </Box>
      </Box>

      {/* Progress Tracking */}
      {renderProgressTracking()}

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box display="flex" justifyContent="space-between">
        <Button
          onClick={onCancel}
          variant="outlined"
        >
          Cancel
        </Button>
        
        <Box display="flex" gap={2}>
          {activeStep > 0 && (
            <Button
              onClick={() => setActiveStep(prev => prev - 1)}
              variant="outlined"
            >
              Previous
            </Button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep(prev => prev + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => onScreeningCompleted?.(results)}
            >
              Complete Screening
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default EnhancedScreeningInterface;
