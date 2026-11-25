/**
 * E2E Test Helpers for Playwright
 */

// 1x1 pixel valid JPEG buffer for receipt uploads
export const DUMMY_RECEIPT_BUFFER = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'
);

/**
 * Log into the application via the testing-only endpoint.
 * Sets the refresh cookie in the Playwright browser context, then reloads/navigates.
 */
export async function loginAs(page, email = 'customer@wex.sd') {
  const response = await page.request.post('/api/v1/auth/testing-login', {
    data: { email },
  });
  if (!response.ok()) {
    throw new Error(`Testing login failed for ${email}: ${response.status()} ${await response.text()}`);
  }
}
