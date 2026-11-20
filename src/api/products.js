import { api } from './client';

export const productsApi = {
  /**
   * Fetch paginated and filtered public products
   */
  getProducts(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    return api.get(`/products${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Fetch single product detail by slug
   */
  getProductDetail(slug) {
    return api.get(`/products/${encodeURIComponent(slug)}`);
  },

  /**
   * Fetch active categories
   */
  getCategories() {
    return api.get('/categories');
  },

  /**
   * Fetch active brands
   */
  getBrands() {
    return api.get('/brands');
  },

  /**
   * Fetch public shop information and price update timestamp
   */
  getShopInfo() {
    return api.get('/shop');
  },

  /**
   * Fetch active shipping zones and fees in SDG
   */
  getShippingZones() {
    return api.get('/shipping-zones');
  },

  /**
   * Fetch active hero slides
   */
  getHeroSlides() {
    return api.get('/content/hero-slides');
  },

  /**
   * Fetch active home sections
   */
  getHomeSections() {
    return api.get('/content/home-sections');
  },

  /**
   * Fetch active FAQ items
   */
  getFaq() {
    return api.get('/content/faq');
  },

  /**
   * Fetch active pages list
   */
  getPages() {
    return api.get('/content/pages');
  },

  /**
   * Fetch single page by slug
   */
  getPage(slug) {
    return api.get(`/content/pages/${encodeURIComponent(slug)}`);
  },

  /**
   * Fetch active announcements
   */
  getAnnouncements() {
    return api.get('/announcements');
  },

  /**
   * Fetch recent purchases ticker
   */
  getRecentPurchases() {
    return api.get('/recent-purchases');
  },
};
