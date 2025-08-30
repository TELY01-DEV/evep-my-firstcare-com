import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface TemplateMessageEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (templateData: any) => void;
}

const TemplateMessageEditor: React.FC<TemplateMessageEditorProps> = ({ open, onClose, onSave }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Template Message Editor</DialogTitle>
      <DialogContent>
        <Typography>Template message editor component</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave({})}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateMessageEditor;
