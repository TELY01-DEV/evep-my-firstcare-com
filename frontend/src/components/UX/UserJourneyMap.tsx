import React from 'react';
import { Box, Typography, Paper, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import { styled } from '@mui/material/styles';

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  actions: string[];
  touchpoints: string[];
  duration?: string;
  critical?: boolean;
}

interface UserJourneyMapProps {
  title: string;
  userType: 'doctor' | 'teacher' | 'parent' | 'student' | 'admin';
  steps: JourneyStep[];
  currentStep?: string;
  onStepClick?: (stepId: string) => void;
}

const JourneyContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2, 0),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
}));

const StepCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1, 0),
  border: `2px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[4],
  },
  '&.active': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '10',
  },
  '&.critical': {
    borderColor: theme.palette.error.main,
    backgroundColor: theme.palette.error.light + '10',
  },
}));

const TouchpointList = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1),
}));

const ActionList = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  '& .action-item': {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(0.5),
    '& .action-icon': {
      marginRight: theme.spacing(1),
      color: theme.palette.primary.main,
    },
  },
}));

const UserJourneyMap: React.FC<UserJourneyMapProps> = ({
  title,
  userType,
  steps,
  currentStep,
  onStepClick,
}) => {
  const getStepClass = (stepId: string, critical?: boolean) => {
    let className = '';
    if (stepId === currentStep) className += ' active';
    if (critical) className += ' critical';
    return className;
  };

  const getStepIcon = (stepId: string) => {
    const icons: Record<string, string> = {
      login: '🔐',
      dashboard: '📊',
      patients: '👥',
      screening: '👁️',
      results: '📋',
      reports: '📈',
      communication: '💬',
      settings: '⚙️',
    };
    return icons[stepId] || '📝';
  };

  return (
    <JourneyContainer elevation={2}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          User Type: {userType.charAt(0).toUpperCase() + userType.slice(1)}
        </Typography>
      </Box>

      <Stepper orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.id} active={step.id === currentStep}>
            <StepLabel
              icon={
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: step.id === currentStep 
                      ? 'primary.main' 
                      : step.critical 
                        ? 'error.main' 
                        : 'grey.300',
                    color: 'white',
                    fontSize: '1.2rem',
                  }}
                >
                  {getStepIcon(step.id)}
                </Box>
              }
            >
              <Typography variant="h6" component="h3">
                {step.title}
              </Typography>
            </StepLabel>
            <StepContent>
              <StepCard
                className={getStepClass(step.id, step.critical)}
                onClick={() => onStepClick?.(step.id)}
              >
                <Typography variant="body1" paragraph>
                  {step.description}
                </Typography>

                {step.duration && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ⏱️ Estimated Duration: {step.duration}
                  </Typography>
                )}

                {step.touchpoints.length > 0 && (
                  <TouchpointList>
                    <Typography variant="subtitle2" gutterBottom>
                      🎯 Key Touchpoints:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {step.touchpoints.map((touchpoint, idx) => (
                        <li key={idx}>
                          <Typography variant="body2">
                            {touchpoint}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  </TouchpointList>
                )}

                {step.actions.length > 0 && (
                  <ActionList>
                    <Typography variant="subtitle2" gutterBottom>
                      🔧 Actions:
                    </Typography>
                    {step.actions.map((action, idx) => (
                      <div key={idx} className="action-item">
                        <span className="action-icon">•</span>
                        <Typography variant="body2">
                          {action}
                        </Typography>
                      </div>
                    ))}
                  </ActionList>
                )}
              </StepCard>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </JourneyContainer>
  );
};

export default UserJourneyMap;

