// Placeholder API functions for LINE Bot components
// These are imported from DiaCare Buddy project but not yet implemented

export const api = {
  // Bot Settings
  getBotSettings: async () => ({ data: {} }),
  updateBotSettings: async (data: any) => ({ data }),
  
  // Rich Menu
  getRichMenus: async () => ({ data: [] }),
  createRichMenu: async (data: any) => ({ data }),
  updateRichMenu: async (id: string, data: any) => ({ data }),
  deleteRichMenu: async (id: string) => ({ success: true }),
  
  // Keywords
  getBotKeywords: async () => ({ data: [] }),
  createBotKeyword: async (data: any) => ({ data }),
  updateBotKeyword: async (id: string, data: any) => ({ data }),
  deleteBotKeyword: async (id: string) => ({ success: true }),
  
  // Flex Messages
  getFlexMessages: async () => ({ data: [] }),
  createFlexMessage: async (data: any) => ({ data }),
  updateFlexMessage: async (id: string, data: any) => ({ data }),
  deleteFlexMessage: async (id: string) => ({ success: true }),
  getFlexMessagesByPurpose: async (purpose: string) => ({ data: [] }),
  
  // Followers
  getLineFollowers: async () => ({ data: [] }),
  getFollowerProfile: async (userId: string) => ({ data: {} }),
  
  // Analytics
  getMessageQuota: async () => ({ data: { type: 'unlimited', value: 1000 } }),
  getAnalytics: async () => ({ data: {} }),
};

export const getBotKeywords = api.getBotKeywords;
export const createBotKeyword = api.createBotKeyword;
export const updateBotKeyword = api.updateBotKeyword;
export const deleteBotKeyword = api.deleteBotKeyword;
export const getFlexMessagesByPurpose = api.getFlexMessagesByPurpose;
export const getMessageQuota = api.getMessageQuota;
