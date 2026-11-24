/**
 * Canonical product URL generator.
 * Enforces canonical pattern /products/:slug across the application.
 * Accepts a product object, slug string, or numeric ID.
 */
export function getProductUrl(product) {
  if (!product) return '/products';

  if (typeof product === 'string') {
    const clean = product.trim();
    return clean ? `/products/${encodeURIComponent(clean)}` : '/products';
  }

  if (typeof product === 'number') {
    return `/products/${product}`;
  }

  if (typeof product === 'object') {
    const slug = (product.slug && String(product.slug).trim()) || product.id;
    return slug ? `/products/${encodeURIComponent(String(slug))}` : '/products';
  }

  return '/products';
}
