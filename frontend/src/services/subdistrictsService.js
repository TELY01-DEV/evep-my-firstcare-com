/**
 * Subdistricts Service - Frontend workaround for subdistricts data
 * This service provides subdistricts data while the backend API is being fixed
 */

import subdistrictsData from '../data/subdistricts.json';

interface Subdistrict {
  id: string;
  name: string;
  district_id: string;
  province_id: string;
  zipcode: string;
}

interface SubdistrictsResponse {
  subdistricts: Subdistrict[];
  total_count: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

interface SubdistrictsOptions {
  limit?: number;
  skip?: number;
  search?: string;
}

class SubdistrictsService {
  constructor() {
    this.subdistricts = subdistrictsData;
  }

  /**
   * Get subdistricts by district ID
   * @param {string} districtId - District ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of subdistricts to return
   * @param {number} options.skip - Number of subdistricts to skip
   * @param {string} options.search - Search term for subdistrict names
   * @returns {Promise<Object>} Subdistricts data with pagination info
   */
  async getSubdistrictsByDistrict(districtId: string, options: SubdistrictsOptions = {}): Promise<SubdistrictsResponse> {
    const { limit = 1000, skip = 0, search = '' } = options;
    
    let filteredSubdistricts = this.subdistricts.filter(subdistrict => subdistrict.district_id === districtId);
    
    // Apply search filter if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredSubdistricts = filteredSubdistricts.filter(subdistrict => 
        subdistrict.name.toLowerCase().includes(searchTerm) ||
        subdistrict.zipcode.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply pagination
    const paginatedSubdistricts = filteredSubdistricts.slice(skip, skip + limit);
    
    return {
      subdistricts: paginatedSubdistricts,
      total_count: filteredSubdistricts.length,
      skip,
      limit,
      has_more: skip + limit < filteredSubdistricts.length
    };
  }

  /**
   * Get a specific subdistrict by ID
   * @param {string} id - Subdistrict ID
   * @returns {Promise<Object|null>} Subdistrict data or null if not found
   */
  async getSubdistrictById(id: string): Promise<Subdistrict | null> {
    return this.subdistricts.find(subdistrict => subdistrict.id === id) || null;
  }

  /**
   * Get subdistricts by zipcode
   * @param {string} zipcode - Zipcode
   * @returns {Promise<Array>} Array of subdistricts with the given zipcode
   */
  async getSubdistrictsByZipcode(zipcode: string): Promise<Subdistrict[]> {
    return this.subdistricts.filter(subdistrict => subdistrict.zipcode === zipcode);
  }

  /**
   * Search subdistricts by name
   * @param {string} name - Subdistrict name (partial match)
   * @returns {Promise<Array>} Array of matching subdistricts
   */
  async searchSubdistrictsByName(name: string): Promise<Subdistrict[]> {
    const searchTerm = name.toLowerCase();
    return this.subdistricts.filter(subdistrict => 
      subdistrict.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get subdistricts count for a district
   * @param {string} districtId - District ID
   * @returns {Promise<number>} Total number of subdistricts in the district
   */
  async getSubdistrictsCountByDistrict(districtId: string): Promise<number> {
    return this.subdistricts.filter(subdistrict => subdistrict.district_id === districtId).length;
  }

  /**
   * Get all subdistricts
   * @returns {Promise<Array>} Array of all subdistricts
   */
  async getAllSubdistricts(): Promise<Subdistrict[]> {
    return this.subdistricts;
  }

  /**
   * Get zipcode for a subdistrict
   * @param {string} subdistrictId - Subdistrict ID
   * @returns {Promise<string|null>} Zipcode or null if not found
   */
  async getZipcodeBySubdistrict(subdistrictId: string): Promise<string | null> {
    const subdistrict = await this.getSubdistrictById(subdistrictId);
    return subdistrict ? subdistrict.zipcode : null;
  }
}

// Create and export a singleton instance
const subdistrictsService = new SubdistrictsService();
export default subdistrictsService;
