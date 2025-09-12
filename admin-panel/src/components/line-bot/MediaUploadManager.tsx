import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { CloudUpload, Image, VideoLibrary } from '@mui/icons-material';

interface MediaUploadManagerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (fileData: { url: string; previewUrl?: string; filename: string }) => void;
  fileType: 'image' | 'video';
}

const MediaUploadManager: React.FC<MediaUploadManagerProps> = ({
  open,
  onClose,
  onSelect,
  fileType,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Placeholder implementation - in real app, this would upload to CDN
      const mockUrl = `https://example.com/uploads/${file.name}`;
      const mockPreviewUrl = file.type.startsWith('image/') ? mockUrl : undefined;

      onSelect({
        url: mockUrl,
        previewUrl: mockPreviewUrl,
        filename: file.name,
      });

      onClose();
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {fileType === 'image' ? <Image /> : <VideoLibrary />}
          <Typography variant="h6">
            Upload {fileType === 'image' ? 'Image' : 'Video'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box textAlign="center" py={3}>
          <input
            accept={fileType === 'image' ? 'image/*' : 'video/*'}
            style={{ display: 'none' }}
            id="media-upload-input"
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label htmlFor="media-upload-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              disabled={uploading}
              sx={{ mb: 2 }}
            >
              {uploading ? 'Uploading...' : `Select ${fileType === 'image' ? 'Image' : 'Video'} File`}
            </Button>
          </label>
          
          <Typography variant="body2" color="text.secondary">
            Supported formats: {fileType === 'image' ? 'JPG, PNG, GIF, WebP' : 'MP4, WebM, OGG'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Maximum size: 10MB
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaUploadManager;
