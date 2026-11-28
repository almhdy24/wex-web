import PropTypes from 'prop-types';

/**
 * Decorative ribbons were removed in the v2 design (no decorative shapes behind content).
 * Kept as a no-op so existing call sites stay valid.
 */
export default function BrandRibbons() {
  return null;
}

BrandRibbons.propTypes = { variant: PropTypes.string };
