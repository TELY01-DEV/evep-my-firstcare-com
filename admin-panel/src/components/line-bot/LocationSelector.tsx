import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface LocationSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (location: any) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ open, onClose, onSelect }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Location Selector</DialogTitle>
      <DialogContent>
        <Typography>Location selector component</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationSelector;
