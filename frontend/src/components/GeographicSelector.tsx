import React, { useState, useEffect, useCallback } from 'react';
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
import provincesService from '../services/provincesService';
import districtsService from '../services/districtsService';
import subdistrictsService from '../services/subdistrictsService';

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
  id: string;
  name: string;
  code: string;
}

interface District {
  id: string;
  name: string;
  province_id: string;
  code: string;
}

interface Subdistrict {
  id: string;
  name: string;
  district_id: string;
  province_id: string;
  zipcode: string;
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

  const loadProvinces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use local provinces service instead of API
      const response = await provincesService.getProvinces({ limit: 1000, skip: 0, search: '' });
      setProvinces(response.provinces || []);
    } catch (err: any) {
      setError('Failed to load provinces');
      console.error('Error loading provinces:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDistricts = useCallback(async (provinceId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Use local districts service instead of API
      const response = await districtsService.getDistrictsByProvince(provinceId, { limit: 1000, skip: 0, search: '' });
      setDistricts(response.districts || []);
    } catch (err: any) {
      setError('Failed to load districts');
      console.error('Error loading districts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubdistricts = useCallback(async (districtId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Use local subdistricts service instead of API
      const response = await subdistrictsService.getSubdistrictsByDistrict(districtId, { limit: 1000, skip: 0, search: '' });
      setSubdistricts(response.subdistricts || []);
    } catch (err: any) {
      setError('Failed to load subdistricts');
      console.error('Error loading subdistricts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load provinces on component mount
  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

  // Load districts when province changes
  useEffect(() => {
    if (provinceId) {
      loadDistricts(provinceId);
    } else {
      setDistricts([]);
      setSubdistricts([]);
    }
  }, [provinceId, loadDistricts]);

  // Load subdistricts when district changes
  useEffect(() => {
    if (districtId) {
      loadSubdistricts(districtId);
    } else {
      setSubdistricts([]);
    }
  }, [districtId, loadSubdistricts]);

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
      const selectedSubdistrict = subdistricts.find(s => s.id === newSubdistrictId);
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
              <MenuItem key={province.id} value={province.id}>
                {province.name}
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
              <MenuItem key={district.id} value={district.id}>
                {district.name}
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
              <MenuItem key={subdistrict.id} value={subdistrict.id}>
                {subdistrict.name} ({subdistrict.zipcode})
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
