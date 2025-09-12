import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Switch,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  MedicalServices as MedicalServicesIcon,
  Assignment as AssignmentIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Create as CreateIcon,
  CropSquare as CropSquareIcon,
  RadioButtonUnchecked as CircleIcon,
  TextFields as TextIcon,
  ArrowForward as ArrowIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface DoctorDiagnosisFormProps {
  patient: any;
  onComplete: (diagnosis: any) => void;
  onBack: () => void;
}

const DoctorDiagnosisForm: React.FC<DoctorDiagnosisFormProps> = ({
  patient,
  onComplete,
  onBack,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Drawing functionality state
  const [drawingTool, setDrawingTool] = useState<'pen' | 'rectangle' | 'circle' | 'text' | 'arrow'>('pen');
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [drawingData, setDrawingData] = useState<string>('');
  const [showBackground, setShowBackground] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  
  const [diagnosis, setDiagnosis] = useState({
    // Basic Information
    examinationDate: new Date().toISOString().split('T')[0],
    examinerName: '',
    examinerTitle: '',
    
    // Visual Acuity Results
    rightEyeVA: '',
    leftEyeVA: '',
    binocularVA: '',
    
    // Tonometry Results
    rightEyeTn: '',
    leftEyeTn: '',
    
    // Eye Conditions (Right Eye)
    rightEyeCat: false, // Cataract
    rightEyePtg: false, // Pterygium
    rightEyePgl: false, // Pinguecula
    rightEyeGlm: false, // Glaucoma
    rightEyeCom: false, // Conjunctivitis
    rightEyeAbs: false, // Abscess
    rightEyeRet: false, // Retina
    rightEyeCor: false, // Cornea
    rightEyeUvt: false, // Uveitis
    
    // Eye Conditions (Left Eye)
    leftEyeCat: false, // Cataract
    leftEyePtg: false, // Pterygium
    leftEyePgl: false, // Pinguecula
    leftEyeGlm: false, // Glaucoma
    leftEyeCom: false, // Conjunctivitis
    leftEyeAbs: false, // Abscess
    leftEyeRet: false, // Retina
    leftEyeCor: false, // Cornea
    leftEyeUvt: false, // Uveitis
    
    // Clinic Measurements
    rightEyeSph: '',
    rightEyeCyl: '',
    rightEyeAx: '',
    rightEyeKmax: '',
    rightEyeKmaxAx: '',
    rightEyeKdif: '',
    leftEyeSph: '',
    leftEyeCyl: '',
    leftEyeAx: '',
    leftEyeKmax: '',
    leftEyeKmaxAx: '',
    leftEyeKdif: '',
    
    // Doctor Prescription
    rightEyeGsph: '',
    rightEyeGCyl: '',
    rightEyeGAx: '',
    rightEyeAdd: '',
    rightEyeCorrectedVA: '',
    leftEyeGsph: '',
    leftEyeGCyl: '',
    leftEyeGAx: '',
    leftEyeAdd: '',
    leftEyeCorrectedVA: '',
    
    // ICD10 Diagnosis
    rightEyeICD10: '',
    leftEyeICD10: '',
    diagnosisNotes: '',
    
    // Drawing Data
    eyeDiagramDrawing: '',
    visualFieldDrawing: '',
    fundusDrawing: '',
    
    // Refraction Results
    rightEyeSphere: '',
    rightEyeCylinder: '',
    rightEyeAxis: '',
    leftEyeSphere: '',
    leftEyeCylinder: '',
    leftEyeAxis: '',
    
    // Diagnosis
    primaryDiagnosis: '',
    secondaryDiagnosis: '',
    
    // Treatment Plan
    treatmentPlan: '',
    medications: '',
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: '',
    
    // Risk Assessment
    riskLevel: 'low', // low, medium, high
    riskFactors: [] as string[],
    complications: '',
    
    // Referral Information
    referralRequired: false,
    referralTo: '',
    referralReason: '',
    referralUrgency: 'routine', // routine, urgent, emergency
    
    // Patient Education
    patientEducation: '',
    lifestyleRecommendations: '',
    activityRestrictions: '',
    
    // Additional Tests
    additionalTestsRequired: false,
    testList: '',
    testPriority: 'routine',
    
    // Prognosis
    prognosis: '',
    expectedOutcome: '',
    recoveryTime: '',
    
    // Insurance & Billing
    insuranceCode: '',
    billingNotes: '',
    priorAuthorization: false,
    
    // Quality Metrics
    qualityIndicators: '',
    performanceMetrics: '',
    
    // Additional Notes
    clinicalNotes: '',
    recommendations: '',
    
    // Differential Diagnosis
    differentialDiagnosis: '',
    
    // Glasses Prescription
    glassesPrescription: false,
    

  });

  const handleInputChange = (field: string, value: any) => {
    setDiagnosis(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRiskFactorToggle = (factor: string) => {
    setDiagnosis(prev => ({
      ...prev,
      riskFactors: prev.riskFactors.includes(factor)
        ? prev.riskFactors.filter(f => f !== factor)
        : [...prev.riskFactors, factor]
    }));
  };

  const handleNextPage = () => {
    setCurrentPage(2);
  };

  const handlePrevPage = () => {
    setCurrentPage(1);
  };

  // Drawing functionality
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = drawingColor;
    context.lineWidth = lineWidth;
    contextRef.current = context;
  }, [drawingColor, lineWidth]);

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width / 2);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height / 2);

    if (drawingTool === 'pen') {
      contextRef.current?.beginPath();
      contextRef.current?.moveTo(x, y);
    } else {
      startPointRef.current = { x, y };
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width / 2);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height / 2);

    if (drawingTool === 'pen') {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    }
  };

  const stopDrawing = (event?: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !startPointRef.current) {
      setIsDrawing(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    let endX = startPointRef.current.x;
    let endY = startPointRef.current.y;
    
    if (event) {
      const rect = canvas.getBoundingClientRect();
      endX = (event.clientX - rect.left) * (canvas.width / rect.width / 2);
      endY = (event.clientY - rect.top) * (canvas.height / rect.height / 2);
    }
    
    const startX = startPointRef.current.x;
    const startY = startPointRef.current.y;

    switch (drawingTool) {
      case 'rectangle':
        contextRef.current.strokeRect(startX, startY, endX - startX, endY - startY);
        break;
      case 'circle':
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        contextRef.current.beginPath();
        contextRef.current.arc(startX, startY, radius, 0, 2 * Math.PI);
        contextRef.current.stroke();
        break;
      case 'arrow':
        drawArrow(contextRef.current, startX, startY, endX, endY);
        break;
    }

    setIsDrawing(false);
    startPointRef.current = null;
    saveCanvasState();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const addText = (text: string) => {
    if (!contextRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const x = canvas.width / 4;
    const y = canvas.height / 4;

    contextRef.current.font = '16px Arial';
    contextRef.current.fillStyle = drawingColor;
    contextRef.current.fillText(text, x, y);
    saveCanvasState();
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    setDrawingData(imageData);
    
    // Add to history
    const newHistory = [...drawingHistory.slice(0, historyIndex + 1), imageData];
    setDrawingHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadCanvasState(drawingHistory[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < drawingHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadCanvasState(drawingHistory[newIndex]);
    }
  };

  const loadCanvasState = (imageData: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      }
    };
    img.src = imageData;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      saveCanvasState();
    }
  };

  const saveDrawingToDiagnosis = (drawingType: 'eyeDiagram' | 'visualField' | 'fundus') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    setDiagnosis(prev => ({
      ...prev,
      [`${drawingType}Drawing`]: imageData
    }));
  };

  const handleSubmit = () => {
    // Save current drawing data before submitting
    const canvas = canvasRef.current;
    if (canvas) {
      const imageData = canvas.toDataURL('image/png');
      setDiagnosis(prev => ({
        ...prev,
        eyeDiagramDrawing: imageData
      }));
    }
    
    onComplete(diagnosis);
  };

  const riskFactors = [
    'Family history of eye problems',
    'Previous eye injuries',
    'Chronic health conditions',
    'Medication use',
    'Behavioral issues',
    'Other medical conditions'
  ];

  const renderPage1 = () => (
    <>
      {/* Patient Information */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Patient Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Patient Name: {patient?.first_name} {patient?.last_name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Student ID: {patient?.student_code || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Date of Birth: {patient?.birth_date || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                School: {patient?.school_name || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Examination Details */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Examination Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Examination Date"
                type="date"
                value={diagnosis.examinationDate}
                onChange={(e) => handleInputChange('examinationDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Examiner Name"
                value={diagnosis.examinerName}
                onChange={(e) => handleInputChange('examinerName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Examiner Title"
                value={diagnosis.examinerTitle}
                onChange={(e) => handleInputChange('examinerTitle', e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Visual Acuity Results */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VisibilityIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Visual Acuity Results</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Right Eye VA"
                value={diagnosis.rightEyeVA}
                onChange={(e) => handleInputChange('rightEyeVA', e.target.value)}
                placeholder="e.g., 20/20, 6/6"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Left Eye VA"
                value={diagnosis.leftEyeVA}
                onChange={(e) => handleInputChange('leftEyeVA', e.target.value)}
                placeholder="e.g., 20/20, 6/6"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Binocular VA"
                value={diagnosis.binocularVA}
                onChange={(e) => handleInputChange('binocularVA', e.target.value)}
                placeholder="e.g., 20/20, 6/6"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Tonometry Results */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Tonometry Results</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Right Eye Tn"
                value={diagnosis.rightEyeTn}
                onChange={(e) => handleInputChange('rightEyeTn', e.target.value)}
                placeholder="e.g., 16 mmHg"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Left Eye Tn"
                value={diagnosis.leftEyeTn}
                onChange={(e) => handleInputChange('leftEyeTn', e.target.value)}
                placeholder="e.g., 16 mmHg"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Eye Conditions */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Eye Conditions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Right Eye</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.rightEyeCat}
                        onChange={(e) => handleInputChange('rightEyeCat', e.target.checked)}
                      />
                    }
                    label="Cataract (Cat)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.rightEyePtg}
                        onChange={(e) => handleInputChange('rightEyePtg', e.target.checked)}
                      />
                    }
                    label="Pterygium (Ptg)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.rightEyePgl}
                        onChange={(e) => handleInputChange('rightEyePgl', e.target.checked)}
                      />
                    }
                    label="Pinguecula (Pgl)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.rightEyeGlm}
                        onChange={(e) => handleInputChange('rightEyeGlm', e.target.checked)}
                      />
                    }
                    label="Glaucoma (Glm)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.rightEyeCom}
                        onChange={(e) => handleInputChange('rightEyeCom', e.target.checked)}
                      />
                    }
                    label="Conjunctivitis (Com)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.rightEyeAbs}
                        onChange={(e) => handleInputChange('rightEyeAbs', e.target.checked)}
                      />
                    }
                    label="Abscess (Abs)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.rightEyeRet}
                        onChange={(e) => handleInputChange('rightEyeRet', e.target.checked)}
                      />
                    }
                    label="Retina (Ret)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.rightEyeCor}
                        onChange={(e) => handleInputChange('rightEyeCor', e.target.checked)}
                      />
                    }
                    label="Cornea (Cor)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.rightEyeUvt}
                        onChange={(e) => handleInputChange('rightEyeUvt', e.target.checked)}
                      />
                    }
                    label="Uveitis (Uvt)"
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Left Eye</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.leftEyeCat}
                        onChange={(e) => handleInputChange('leftEyeCat', e.target.checked)}
                      />
                    }
                    label="Cataract (Cat)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.leftEyePtg}
                        onChange={(e) => handleInputChange('leftEyePtg', e.target.checked)}
                      />
                    }
                    label="Pterygium (Ptg)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.leftEyePgl}
                        onChange={(e) => handleInputChange('leftEyePgl', e.target.checked)}
                      />
                    }
                    label="Pinguecula (Pgl)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.leftEyeGlm}
                        onChange={(e) => handleInputChange('leftEyeGlm', e.target.checked)}
                      />
                    }
                    label="Glaucoma (Glm)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.leftEyeCom}
                        onChange={(e) => handleInputChange('leftEyeCom', e.target.checked)}
                      />
                    }
                    label="Conjunctivitis (Com)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.leftEyeAbs}
                        onChange={(e) => handleInputChange('leftEyeAbs', e.target.checked)}
                      />
                    }
                    label="Abscess (Abs)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.leftEyeRet}
                        onChange={(e) => handleInputChange('leftEyeRet', e.target.checked)}
                      />
                    }
                    label="Retina (Ret)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.leftEyeCor}
                        onChange={(e) => handleInputChange('leftEyeCor', e.target.checked)}
                      />
                    }
                    label="Cornea (Cor)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={diagnosis.leftEyeUvt}
                        onChange={(e) => handleInputChange('leftEyeUvt', e.target.checked)}
                      />
                    }
                    label="Uveitis (Uvt)"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Clinic Measurements */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Clinic Measurements</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Right Eye</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Sph"
                value={diagnosis.rightEyeSph}
                onChange={(e) => handleInputChange('rightEyeSph', e.target.value)}
                placeholder="Sphere"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Cyl"
                value={diagnosis.rightEyeCyl}
                onChange={(e) => handleInputChange('rightEyeCyl', e.target.value)}
                placeholder="Cylinder"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Ax"
                value={diagnosis.rightEyeAx}
                onChange={(e) => handleInputChange('rightEyeAx', e.target.value)}
                placeholder="Axis"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Kmax"
                value={diagnosis.rightEyeKmax}
                onChange={(e) => handleInputChange('rightEyeKmax', e.target.value)}
                placeholder="Kmax"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Kmax Ax"
                value={diagnosis.rightEyeKmaxAx}
                onChange={(e) => handleInputChange('rightEyeKmaxAx', e.target.value)}
                placeholder="Kmax Axis"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Kdif"
                value={diagnosis.rightEyeKdif}
                onChange={(e) => handleInputChange('rightEyeKdif', e.target.value)}
                placeholder="K Difference"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Left Eye</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Sph"
                value={diagnosis.leftEyeSph}
                onChange={(e) => handleInputChange('leftEyeSph', e.target.value)}
                placeholder="Sphere"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Cyl"
                value={diagnosis.leftEyeCyl}
                onChange={(e) => handleInputChange('leftEyeCyl', e.target.value)}
                placeholder="Cylinder"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Ax"
                value={diagnosis.leftEyeAx}
                onChange={(e) => handleInputChange('leftEyeAx', e.target.value)}
                placeholder="Axis"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Kmax"
                value={diagnosis.leftEyeKmax}
                onChange={(e) => handleInputChange('leftEyeKmax', e.target.value)}
                placeholder="Kmax"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Kmax Ax"
                value={diagnosis.leftEyeKmaxAx}
                onChange={(e) => handleInputChange('leftEyeKmaxAx', e.target.value)}
                placeholder="Kmax Axis"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Kdif"
                value={diagnosis.leftEyeKdif}
                onChange={(e) => handleInputChange('leftEyeKdif', e.target.value)}
                placeholder="K Difference"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Doctor Prescription */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Doctor Prescription</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Right Eye</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="G Sph"
                value={diagnosis.rightEyeGsph}
                onChange={(e) => handleInputChange('rightEyeGsph', e.target.value)}
                placeholder="Glasses Sphere"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="G Cyl"
                value={diagnosis.rightEyeGCyl}
                onChange={(e) => handleInputChange('rightEyeGCyl', e.target.value)}
                placeholder="Glasses Cylinder"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="G Ax"
                value={diagnosis.rightEyeGAx}
                onChange={(e) => handleInputChange('rightEyeGAx', e.target.value)}
                placeholder="Glasses Axis"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Add"
                value={diagnosis.rightEyeAdd}
                onChange={(e) => handleInputChange('rightEyeAdd', e.target.value)}
                placeholder="Add Power"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="VA"
                value={diagnosis.rightEyeCorrectedVA}
                onChange={(e) => handleInputChange('rightEyeCorrectedVA', e.target.value)}
                placeholder="Corrected VA"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Left Eye</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="G Sph"
                value={diagnosis.leftEyeGsph}
                onChange={(e) => handleInputChange('leftEyeGsph', e.target.value)}
                placeholder="Glasses Sphere"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="G Cyl"
                value={diagnosis.leftEyeGCyl}
                onChange={(e) => handleInputChange('leftEyeGCyl', e.target.value)}
                placeholder="Glasses Cylinder"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="G Ax"
                value={diagnosis.leftEyeGAx}
                onChange={(e) => handleInputChange('leftEyeGAx', e.target.value)}
                placeholder="Glasses Axis"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Add"
                value={diagnosis.leftEyeAdd}
                onChange={(e) => handleInputChange('leftEyeAdd', e.target.value)}
                placeholder="Add Power"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="VA"
                value={diagnosis.leftEyeCorrectedVA}
                onChange={(e) => handleInputChange('leftEyeCorrectedVA', e.target.value)}
                placeholder="Corrected VA"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* ICD10 Diagnosis */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">ICD10 Diagnosis</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Right Eye ICD10"
                value={diagnosis.rightEyeICD10}
                onChange={(e) => handleInputChange('rightEyeICD10', e.target.value)}
                placeholder="e.g., H25.1"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Left Eye ICD10"
                value={diagnosis.leftEyeICD10}
                onChange={(e) => handleInputChange('leftEyeICD10', e.target.value)}
                placeholder="e.g., H25.1"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Diagnosis Notes"
                value={diagnosis.diagnosisNotes}
                onChange={(e) => handleInputChange('diagnosisNotes', e.target.value)}
                placeholder="Additional diagnosis notes..."
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Drawing Canvas */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Eye Diagram Drawing</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Drawing Tools
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <ToggleButtonGroup
                  value={drawingTool}
                  exclusive
                  onChange={(e, newTool) => newTool && setDrawingTool(newTool)}
                  size="small"
                >
                  <ToggleButton value="pen">
                    <Tooltip title="Pen Tool">
                      <CreateIcon />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="rectangle">
                    <Tooltip title="Rectangle">
                      <CropSquareIcon />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="circle">
                    <Tooltip title="Circle">
                      <CircleIcon />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="arrow">
                    <Tooltip title="Arrow">
                      <ArrowIcon />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="text">
                    <Tooltip title="Text">
                      <TextIcon />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              
              <Grid item>
                <TextField
                  type="color"
                  value={drawingColor}
                  onChange={(e) => setDrawingColor(e.target.value)}
                  size="small"
                  sx={{ width: 60 }}
                />
              </Grid>
              
              <Grid item>
                <TextField
                  type="number"
                  label="Line Width"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  size="small"
                  sx={{ width: 80 }}
                />
              </Grid>
              
              {drawingTool === 'text' && (
                <Grid item>
                  <TextField
                    label="Text"
                    size="small"
                    placeholder="Enter text..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addText((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </Grid>
              )}
              
              <Grid item>
                                  <FormControlLabel
                    control={
                      <Switch
                        checked={showBackground}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowBackground(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Show Template"
                  />
              </Grid>
              
              <Grid item>
                <IconButton onClick={undo} disabled={historyIndex <= 0}>
                  <UndoIcon />
                </IconButton>
                <IconButton onClick={redo} disabled={historyIndex >= drawingHistory.length - 1}>
                  <RedoIcon />
                </IconButton>
                <IconButton onClick={clearCanvas}>
                  <ClearIcon />
                </IconButton>
                <IconButton onClick={() => saveDrawingToDiagnosis('eyeDiagram')}>
                  <SaveIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
          
          <Paper 
            elevation={3} 
            sx={{ 
              border: '2px dashed #ccc',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'relative' }}>
              {/* Background SVG */}
              {showBackground && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '400px',
                    zIndex: 1,
                    opacity: 0.3,
                    pointerEvents: 'none'
                  }}
                >
                <svg width="100%" height="100%" viewBox="0 0 177 189" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M39.32 15H38.438C38.186 13.068 37.6073 12.102 36.702 12.102H35.582V15H34.7V8.448C35.372 8.32667 35.974 8.266 36.506 8.266C37.2993 8.266 37.9293 8.434 38.396 8.77C38.8627 9.106 39.096 9.56333 39.096 10.142C39.096 10.9073 38.732 11.458 38.004 11.794C38.3493 12.0273 38.6153 12.368 38.802 12.816C38.998 13.264 39.1707 13.992 39.32 15ZM38.242 10.198C38.242 9.42333 37.6633 9.036 36.506 9.036C36.1327 9.036 35.8247 9.05 35.582 9.078V11.374H36.66C37.7147 11.374 38.242 10.982 38.242 10.198ZM44.1854 15H40.2234V8.336H44.1854V9.092H41.1054V11.108H43.8494V11.864H41.1054V14.244H44.1854V15Z" fill="#403F3F"/>
                  <path d="M129.844 15H125.7V8.336H126.582V14.244H129.844V15ZM134.693 15H130.731V8.336H134.693V9.092H131.613V11.108H134.357V11.864H131.613V14.244H134.693V15Z" fill="#403F3F"/>
                  <circle cx="39.5" cy="53.5" r="25.25" stroke="#403F3F" strokeWidth="0.5"/>
                  <circle cx="130.5" cy="53.5" r="25.25" stroke="#403F3F" strokeWidth="0.5"/>
                  <line x1="1.31134e-08" y1="88.85" x2="177" y2="88.85" stroke="#686868" strokeWidth="0.3"/>
                  <line x1="85.15" y1="6.55671e-09" x2="85.15" y2="189" stroke="#686868" strokeWidth="0.3"/>
                  <path d="M76 160C77.5 160.667 80.6 162.3 81 163.5" stroke="#403F3F"/>
                  <path d="M77.5 122.5C76.6667 121.333 73.9 119.7 69.5 122.5C64.5 126.5 62 133 61 136.5" stroke="#403F3F" strokeWidth="0.5"/>
                  <path d="M61 143C62.5 151.5 73.4 166.3 79 157.5C80 156 81 155.5 81 158.5" stroke="#403F3F" strokeWidth="0.5"/>
                  <path d="M74.5 121C75.6667 119.333 78.3 116 79.5 116" stroke="#403F3F" strokeWidth="0.5"/>
                  <path d="M58 133.25C58.9854 133.25 59.9168 133.9 60.6152 135.035C61.3111 136.166 61.75 137.744 61.75 139.5C61.75 141.256 61.3111 142.834 60.6152 143.965C59.9168 145.1 58.9854 145.75 58 145.75C57.0146 145.75 56.0832 145.1 55.3848 143.965C54.6889 142.834 54.25 141.256 54.25 139.5C54.25 137.744 54.6889 136.166 55.3848 135.035C56.0832 133.9 57.0146 133.25 58 133.25Z" stroke="#403F3F" strokeWidth="0.5"/>
                  <path d="M6.5 129.066C7.35615 128.21 8.46893 127.174 9.76257 126.066M6.5 151.066C6.5 151.066 12 157 18.5 160.066C31 165.066 41.1667 162.399 44.5 160.066C49 157.232 57.2 148.166 54 134.566C50 117.566 37.5 116 28.5 116.5C22.4709 116.835 14.7647 121.78 9.76257 126.066M4 126.066H9.76257" stroke="#403F3F" strokeWidth="0.5"/>
                  <path d="M5 154.5H10" stroke="#403F3F" strokeWidth="0.5"/>
                  <circle cx="34.5" cy="140.066" r="1.2" stroke="#403F3F" strokeWidth="0.6"/>
                  <path d="M107.5 143.5C106.167 148.167 100.6 157.6 93 158" stroke="#403F3F" strokeWidth="0.5"/>
                  <path d="M97 157C96.3333 158 95.1 160.5 95.5 162.5" stroke="#403F3F" strokeWidth="0.5"/>
                  <path d="M110 132.825C109.015 132.825 108.083 133.475 107.385 134.61C106.689 135.741 106.25 137.319 106.25 139.075C106.25 140.831 106.689 142.409 107.385 143.54C108.083 144.675 109.015 145.325 110 145.325C110.985 145.325 111.917 144.675 112.615 143.54C113.311 142.409 113.75 140.831 113.75 139.075C113.75 137.319 113.311 135.741 112.615 134.61C111.917 133.475 110.985 132.825 110 132.825Z" stroke="#403F3F" strokeWidth="0.5"/>
                  <path d="M161.5 129.575C160.644 128.719 158.794 126.749 157.5 125.641M161.5 150.641C161.5 150.641 156.824 155.686 151 158.876M156.334 124.66L157.5 125.641M157.5 125.641C152.498 121.355 145.529 116.41 139.5 116.075C130.5 115.575 118 117.141 114 134.141C110.8 147.741 119 156.808 123.5 159.641C126.833 161.974 137 164.641 149.5 159.641C150.007 159.402 150.508 159.145 151 158.876M151 158.876C153.5 158.486 158.8 158.093 160 159.641" stroke="#403F3F" strokeWidth="0.5"/>
                  <circle cx="1.5" cy="1.5" r="1.2" transform="matrix(-1 0 0 1 135 138.141)" stroke="#403F3F" strokeWidth="0.6"/>
                  <path d="M95.5 118C96.1667 119.667 97.7 123 98.5 123" stroke="#403F3F" strokeWidth="0.5"/>
                  <path d="M94.5 122C98.3333 122.167 106.2 126.1 107 136.5" stroke="#403F3F" strokeWidth="0.5"/>
                </svg>
              </Box>
              )}
              
              {/* Drawing Canvas */}
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{
                  cursor: 'crosshair',
                  width: '100%',
                  height: '400px',
                  display: 'block',
                  position: 'relative',
                  zIndex: 2
                }}
              />
            </Box>
          </Paper>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="textSecondary">
              Click and drag to draw. Use the tools above to select different drawing modes. 
              The background template shows a standard eye diagram with left and right eye circles for reference.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Refraction Results */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Refraction Results</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Right Eye</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sphere"
                value={diagnosis.rightEyeSphere}
                onChange={(e) => handleInputChange('rightEyeSphere', e.target.value)}
                placeholder="e.g., +2.50"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Cylinder"
                value={diagnosis.rightEyeCylinder}
                onChange={(e) => handleInputChange('rightEyeCylinder', e.target.value)}
                placeholder="e.g., -1.25"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Axis"
                value={diagnosis.rightEyeAxis}
                onChange={(e) => handleInputChange('rightEyeAxis', e.target.value)}
                placeholder="e.g., 90"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Left Eye</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sphere"
                value={diagnosis.leftEyeSphere}
                onChange={(e) => handleInputChange('leftEyeSphere', e.target.value)}
                placeholder="e.g., +2.50"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Cylinder"
                value={diagnosis.leftEyeCylinder}
                onChange={(e) => handleInputChange('leftEyeCylinder', e.target.value)}
                placeholder="e.g., -1.25"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Axis"
                value={diagnosis.leftEyeAxis}
                onChange={(e) => handleInputChange('leftEyeAxis', e.target.value)}
                placeholder="e.g., 90"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </>
  );

  const renderPage2 = () => (
    <>
      {/* Diagnosis */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Diagnosis</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Primary Diagnosis"
                value={diagnosis.primaryDiagnosis}
                onChange={(e) => handleInputChange('primaryDiagnosis', e.target.value)}
                placeholder="Primary diagnosis"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Secondary Diagnosis"
                value={diagnosis.secondaryDiagnosis}
                onChange={(e) => handleInputChange('secondaryDiagnosis', e.target.value)}
                placeholder="Secondary diagnosis (if any)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Differential Diagnosis"
                multiline
                rows={2}
                value={diagnosis.differentialDiagnosis}
                onChange={(e) => handleInputChange('differentialDiagnosis', e.target.value)}
                placeholder="Differential diagnosis"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Risk Assessment */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Risk Assessment</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Risk Level</FormLabel>
                <RadioGroup
                  value={diagnosis.riskLevel}
                  onChange={(e) => handleInputChange('riskLevel', e.target.value)}
                >
                  <FormControlLabel value="low" control={<Radio />} label="Low Risk" />
                  <FormControlLabel value="medium" control={<Radio />} label="Medium Risk" />
                  <FormControlLabel value="high" control={<Radio />} label="High Risk" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Risk Factors</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {riskFactors.map((factor) => (
                  <Chip
                    key={factor}
                    label={factor}
                    color={diagnosis.riskFactors.includes(factor) ? "primary" : "default"}
                    onClick={() => handleRiskFactorToggle(factor)}
                    clickable
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Treatment Plan */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Treatment Plan</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Treatment Plan"
                multiline
                rows={3}
                value={diagnosis.treatmentPlan}
                onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                placeholder="Describe the treatment plan"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={diagnosis.glassesPrescription}
                    onChange={(e) => handleInputChange('glassesPrescription', e.target.checked)}
                  />
                }
                label="Glasses Prescription Required"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={diagnosis.followUpRequired}
                    onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                  />
                }
                label="Follow-up Required"
              />
            </Grid>
            {diagnosis.followUpRequired && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Follow-up Date"
                    type="date"
                    value={diagnosis.followUpDate}
                    onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Follow-up Notes"
                    value={diagnosis.followUpNotes}
                    onChange={(e) => handleInputChange('followUpNotes', e.target.value)}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Referral Information */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Referral Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={diagnosis.referralRequired}
                    onChange={(e) => handleInputChange('referralRequired', e.target.checked)}
                  />
                }
                label="Referral Required"
              />
            </Grid>
            {diagnosis.referralRequired && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Refer to"
                    value={diagnosis.referralTo}
                    onChange={(e) => handleInputChange('referralTo', e.target.value)}
                    placeholder="e.g., Ophthalmologist, Pediatrician"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason for Referral"
                    multiline
                    rows={2}
                    value={diagnosis.referralReason}
                    onChange={(e) => handleInputChange('referralReason', e.target.value)}
                    placeholder="Explain reason for referral"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Additional Notes */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Additional Notes</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Clinical Notes"
                multiline
                rows={3}
                value={diagnosis.clinicalNotes}
                onChange={(e) => handleInputChange('clinicalNotes', e.target.value)}
                placeholder="Additional clinical observations"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recommendations"
                multiline
                rows={3}
                value={diagnosis.recommendations}
                onChange={(e) => handleInputChange('recommendations', e.target.value)}
                placeholder="Recommendations for parents/teachers"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <MedicalServicesIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" component="h2">
              Doctor Diagnosis Form - Page {currentPage} of 2
            </Typography>
          </Box>

          {/* Page Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Chip 
              label="Page 1" 
              color={currentPage === 1 ? "primary" : "default"}
              onClick={() => setCurrentPage(1)}
              sx={{ mr: 1 }}
            />
            <Chip 
              label="Page 2" 
              color={currentPage === 2 ? "primary" : "default"}
              onClick={() => setCurrentPage(2)}
            />
          </Box>

          {/* Page Content */}
          {currentPage === 1 ? renderPage1() : renderPage2()}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={onBack}
              startIcon={<AssignmentIcon />}
            >
              Back to VA Screening
            </Button>
            
            <Box>
              {currentPage === 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNextPage}
                  endIcon={<NavigateNextIcon />}
                >
                  Next Page
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={handlePrevPage}
                    startIcon={<NavigateBeforeIcon />}
                    sx={{ mr: 2 }}
                  >
                    Previous Page
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    startIcon={<MedicalServicesIcon />}
                    size="large"
                  >
                    Complete Diagnosis & Continue
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DoctorDiagnosisForm;
