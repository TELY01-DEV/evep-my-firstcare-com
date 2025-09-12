/**
 * Provinces Service - Frontend workaround for provinces data
 * This service provides provinces data while the backend API is being fixed
 */

import provincesData from '../data/provinces.json';

interface Province {
  id: string;
  name: string;
  code: string;
}

interface ProvincesResponse {
  provinces: Province[];
  total_count: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

interface ProvincesOptions {
  limit?: number;
  skip?: number;
  search?: string;
}

class ProvincesService {
  private provinces: Province[];

  constructor() {
    this.provinces = provincesData;
  }

  /**
   * Get all provinces
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of provinces to return
   * @param {number} options.skip - Number of provinces to skip
   * @param {string} options.search - Search term for province names
   * @returns {Promise<Object>} Provinces data with pagination info
   */
  async getProvinces(options: ProvincesOptions = {}): Promise<ProvincesResponse> {
    const { limit = 1000, skip = 0, search = '' } = options;
    
    let filteredProvinces = this.provinces;
    
    // Apply search filter if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredProvinces = this.provinces.filter(province => 
        province.name.toLowerCase().includes(searchTerm) ||
        province.code.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply pagination
    const paginatedProvinces = filteredProvinces.slice(skip, skip + limit);
    
    return {
      provinces: paginatedProvinces,
      total_count: filteredProvinces.length,
      skip,
      limit,
      has_more: skip + limit < filteredProvinces.length
    };
  }

  /**
   * Get a specific province by ID
   * @param {string} id - Province ID
   * @returns {Promise<Object|null>} Province data or null if not found
   */
  async getProvinceById(id: string): Promise<Province | null> {
    return this.provinces.find(province => province.id === id) || null;
  }

  /**
   * Get a specific province by code
   * @param {string} code - Province code
   * @returns {Promise<Object|null>} Province data or null if not found
   */
  async getProvinceByCode(code: string): Promise<Province | null> {
    return this.provinces.find(province => province.code === code) || null;
  }

  /**
   * Search provinces by name
   * @param {string} name - Province name (partial match)
   * @returns {Promise<Array>} Array of matching provinces
   */
  async searchProvincesByName(name: string): Promise<Province[]> {
    const searchTerm = name.toLowerCase();
    return this.provinces.filter(province => 
      province.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get provinces count
   * @returns {Promise<number>} Total number of provinces
   */
  async getProvincesCount(): Promise<number> {
    return this.provinces.length;
  }

  /**
   * Get all province names (for dropdowns, etc.)
   * @returns {Promise<Array>} Array of province names
   */
  async getProvinceNames(): Promise<string[]> {
    return this.provinces.map(province => province.name);
  }

  /**
   * Get provinces grouped by region (if needed)
   * @returns {Promise<Object>} Provinces grouped by region
   */
  async getProvincesByRegion(): Promise<{ [key: string]: Province[] }> {
    // This is a simple grouping - you can enhance this based on your needs
    const regions: { [key: string]: Province[] } = {
      'Central': [],
      'North': [],
      'Northeast': [],
      'South': [],
      'East': [],
      'West': []
    };

    // Simple region assignment based on province codes/names
    this.provinces.forEach(province => {
      if (province.code === 'BKK' || province.name.includes('กรุงเทพ')) {
        regions['Central'].push(province);
      } else if (province.code === 'CM' || province.code === 'CR' || province.name.includes('เชียง')) {
        regions['North'].push(province);
      } else if (province.code === 'KK' || province.code === 'UB' || province.name.includes('ขอนแก่น') || province.name.includes('อุบล')) {
        regions['Northeast'].push(province);
      } else if (province.code === 'SK' || province.code === 'PK' || province.name.includes('สงขลา') || province.name.includes('ภูเก็ต')) {
        regions['South'].push(province);
      } else {
        regions['Central'].push(province); // Default to Central
      }
    });

    return regions;
  }
}

// Create and export a singleton instance
const provincesService = new ProvincesService();
export default provincesService;
