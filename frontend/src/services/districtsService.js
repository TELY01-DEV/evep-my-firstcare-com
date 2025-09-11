/**
 * Districts Service - Frontend workaround for districts data
 * This service provides districts data while the backend API is being fixed
 */

import districtsData from '../data/districts.json';

interface District {
  id: string;
  name: string;
  province_id: string;
  code: string;
}

interface DistrictsResponse {
  districts: District[];
  total_count: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

interface DistrictsOptions {
  limit?: number;
  skip?: number;
  search?: string;
}

class DistrictsService {
  constructor() {
    this.districts = districtsData;
  }

  /**
   * Get districts by province ID
   * @param {string} provinceId - Province ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of districts to return
   * @param {number} options.skip - Number of districts to skip
   * @param {string} options.search - Search term for district names
   * @returns {Promise<Object>} Districts data with pagination info
   */
  async getDistrictsByProvince(provinceId: string, options: DistrictsOptions = {}): Promise<DistrictsResponse> {
    const { limit = 1000, skip = 0, search = '' } = options;
    
    let filteredDistricts = this.districts.filter(district => district.province_id === provinceId);
    
    // Apply search filter if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredDistricts = filteredDistricts.filter(district => 
        district.name.toLowerCase().includes(searchTerm) ||
        district.code.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply pagination
    const paginatedDistricts = filteredDistricts.slice(skip, skip + limit);
    
    return {
      districts: paginatedDistricts,
      total_count: filteredDistricts.length,
      skip,
      limit,
      has_more: skip + limit < filteredDistricts.length
    };
  }

  /**
   * Get a specific district by ID
   * @param {string} id - District ID
   * @returns {Promise<Object|null>} District data or null if not found
   */
  async getDistrictById(id: string): Promise<District | null> {
    return this.districts.find(district => district.id === id) || null;
  }

  /**
   * Get a specific district by code
   * @param {string} code - District code
   * @returns {Promise<Object|null>} District data or null if not found
   */
  async getDistrictByCode(code: string): Promise<District | null> {
    return this.districts.find(district => district.code === code) || null;
  }

  /**
   * Search districts by name
   * @param {string} name - District name (partial match)
   * @returns {Promise<Array>} Array of matching districts
   */
  async searchDistrictsByName(name: string): Promise<District[]> {
    const searchTerm = name.toLowerCase();
    return this.districts.filter(district => 
      district.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get districts count for a province
   * @param {string} provinceId - Province ID
   * @returns {Promise<number>} Total number of districts in the province
   */
  async getDistrictsCountByProvince(provinceId: string): Promise<number> {
    return this.districts.filter(district => district.province_id === provinceId).length;
  }

  /**
   * Get all districts
   * @returns {Promise<Array>} Array of all districts
   */
  async getAllDistricts(): Promise<District[]> {
    return this.districts;
  }
}

// Create and export a singleton instance
const districtsService = new DistrictsService();
export default districtsService;
