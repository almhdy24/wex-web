import { api } from './client';

export const shopApi = {
  /**
   * Fetch public shop information and settings (GET /shop)
   */
  getShop() {
    return api.get('/shop');
  },
};
