import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (fileData: any) => void;
  fileType: string;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({ open, onClose, onSelect, fileType }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>File Upload</DialogTitle>
      <DialogContent>
        <Typography>File upload dialog for {fileType}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadDialog;
