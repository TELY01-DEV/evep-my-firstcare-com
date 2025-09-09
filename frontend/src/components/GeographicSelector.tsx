import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import unifiedApi from '../services/unifiedApi';

interface GeographicSelectorProps {
  provinceId?: string;
  districtId?: string;
  subdistrictId?: string;
  onProvinceChange: (provinceId: string) => void;
  onDistrictChange: (districtId: string) => void;
  onSubdistrictChange: (subdistrictId: string) => void;
  onZipcodeChange?: (zipcode: string) => void;
  disabled?: boolean;
  required?: boolean;
  gridSize?: {
    province: number;
    district: number;
    subdistrict: number;
  };
}

interface Province {
  _id: string;
  name: string | { en: string; th: string };
  active: boolean;
}

interface District {
  _id: string;
  name: string | { en: string; th: string };
  active: boolean;
  provinceId: string;
}

interface Subdistrict {
  _id: string;
  name: string | { en: string; th: string };
  active: boolean;
  districtId: string;
  provinceId: string;
  zipcode?: string;
}

const GeographicSelector: React.FC<GeographicSelectorProps> = ({
  provinceId = '',
  districtId = '',
  subdistrictId = '',
  onProvinceChange,
  onDistrictChange,
  onSubdistrictChange,
  onZipcodeChange,
  disabled = false,
  required = false,
  gridSize = { province: 4, district: 4, subdistrict: 4 }
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);

  // Load provinces on component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (provinceId) {
      loadDistricts(provinceId);
    } else {
      setDistricts([]);
      setSubdistricts([]);
    }
  }, [provinceId]);

  // Load subdistricts when district changes
  useEffect(() => {
    if (districtId) {
      loadSubdistricts(districtId);
    } else {
      setSubdistricts([]);
    }
  }, [districtId]);

  const loadProvinces = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await unifiedApi.get('/api/v1/master-data/provinces?limit=1000');
      setProvinces(response.data.provinces || []);
    } catch (err: any) {
      setError('Failed to load provinces');
      console.error('Error loading provinces:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (provinceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await unifiedApi.get(`/api/v1/master-data/districts?province_id=${provinceId}&limit=1000`);
      setDistricts(response.data.districts || []);
    } catch (err: any) {
      setError('Failed to load districts');
      console.error('Error loading districts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubdistricts = async (districtId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await unifiedApi.get(`/api/v1/master-data/subdistricts?district_id=${districtId}&limit=1000`);
      setSubdistricts(response.data.subdistricts || []);
    } catch (err: any) {
      setError('Failed to load subdistricts');
      console.error('Error loading subdistricts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceChange = (event: any) => {
    const newProvinceId = event.target.value;
    onProvinceChange(newProvinceId);
    onDistrictChange(''); // Reset district
    onSubdistrictChange(''); // Reset subdistrict
  };

  const handleDistrictChange = (event: any) => {
    const newDistrictId = event.target.value;
    onDistrictChange(newDistrictId);
    onSubdistrictChange(''); // Reset subdistrict
  };

  const handleSubdistrictChange = (event: any) => {
    const newSubdistrictId = event.target.value;
    onSubdistrictChange(newSubdistrictId);
    
    // Auto-fill zipcode if subdistrict is selected
    if (newSubdistrictId && onZipcodeChange) {
      const selectedSubdistrict = subdistricts.find(s => s._id === newSubdistrictId);
      if (selectedSubdistrict && selectedSubdistrict.zipcode) {
        onZipcodeChange(selectedSubdistrict.zipcode);
      }
    }
  };

  if (error) {
    return (
      <Grid item xs={12}>
        <Alert severity="error">{error}</Alert>
      </Grid>
    );
  }

  return (
    <>
      {/* Province Selector */}
      <Grid item xs={12} sm={gridSize.province}>
        <FormControl fullWidth required={required} disabled={disabled || loading}>
          <InputLabel>Province</InputLabel>
          <Select
            value={provinceId}
            onChange={handleProvinceChange}
            label="Province"
          >
            {provinces.map((province) => (
              <MenuItem key={province._id} value={province._id}>
                {typeof province.name === 'object' ? province.name.en : province.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* District Selector */}
      <Grid item xs={12} sm={gridSize.district}>
        <FormControl fullWidth required={required} disabled={disabled || loading || !provinceId}>
          <InputLabel>District</InputLabel>
          <Select
            value={districtId}
            onChange={handleDistrictChange}
            label="District"
          >
            {districts.map((district) => (
              <MenuItem key={district._id} value={district._id}>
                {typeof district.name === 'object' ? district.name.en : district.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Subdistrict Selector */}
      <Grid item xs={12} sm={gridSize.subdistrict}>
        <FormControl fullWidth required={required} disabled={disabled || loading || !districtId}>
          <InputLabel>Subdistrict</InputLabel>
          <Select
            value={subdistrictId}
            onChange={handleSubdistrictChange}
            label="Subdistrict"
          >
            {subdistricts.map((subdistrict) => (
              <MenuItem key={subdistrict._id} value={subdistrict._id}>
                {typeof subdistrict.name === 'object' ? subdistrict.name.en : subdistrict.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Loading indicator */}
      {loading && (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        </Grid>
      )}
    </>
  );
};

export default GeographicSelector;
