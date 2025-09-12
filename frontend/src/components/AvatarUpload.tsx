import React, { useState, useRef } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import {
  PhotoCamera,
  Upload as UploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import unifiedApi from '../services/unifiedApi';

interface AvatarUploadProps {
  currentAvatar?: string;
  userId?: string;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
  onAvatarUpdate?: (avatarUrl: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  userId,
  size = 'medium',
  editable = true,
  onAvatarUpdate,
}) => {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAvatarSize = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40 };
      case 'large':
        return { width: 120, height: 120 };
      default:
        return { width: 80, height: 80 };
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !token) return;

    setUploading(true);
    setError(null);

    try {
      // Upload file to CDN
      const uploadResponse = await unifiedApi.uploadFile('/api/v1/cdn/upload', selectedFile);
      const uploadResult = uploadResponse.data;
      const avatarUrl = `https://cdn.evep.my-firstcare.com${uploadResult.download_url}`;

      // Update user avatar
      await unifiedApi.put('/api/v1/auth/profile/avatar', { avatar_url: avatarUrl });

      // Notify parent component
      if (onAvatarUpdate) {
        onAvatarUpdate(avatarUrl);
      }

      setOpen(false);
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!token) return;

    setUploading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://stardust.evep.my-firstcare.com';
      const response = await fetch(`${baseUrl}/api/v1/auth/profile/avatar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar_url: '' }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove avatar');
      }

      if (onAvatarUpdate) {
        onAvatarUpdate('');
      }

      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
  };

  return (
    <>
      <Box position="relative" display="inline-block">
        <Avatar
          src={currentAvatar}
          sx={getAvatarSize()}
          alt="User Avatar"
        >
          {!currentAvatar && userId && userId.slice(0, 2).toUpperCase()}
        </Avatar>
        
        {editable && (
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
            onClick={() => setOpen(true)}
          >
            <PhotoCamera fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Update Avatar</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            {previewUrl ? (
              <Avatar
                src={previewUrl}
                sx={{ width: 120, height: 120 }}
                alt="Preview"
              />
            ) : currentAvatar ? (
              <Avatar
                src={currentAvatar}
                sx={{ width: 120, height: 120 }}
                alt="Current Avatar"
              />
            ) : (
              <Avatar sx={{ width: 120, height: 120 }}>
                {userId && userId.slice(0, 2).toUpperCase()}
              </Avatar>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />

            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Choose Image
            </Button>

            {selectedFile && (
              <Typography variant="body2" color="text.secondary">
                Selected: {selectedFile.name}
              </Typography>
            )}

            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          {currentAvatar && (
            <Button
              onClick={handleRemoveAvatar}
              color="error"
              startIcon={<DeleteIcon />}
              disabled={uploading}
            >
              Remove
            </Button>
          )}
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AvatarUpload;

