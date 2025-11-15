/**
 * RTL Utility Functions
 * Helper functions to make components RTL-aware
 */

export type Direction = 'ltr' | 'rtl';

/**
 * Get positioning classes based on direction
 */
export const rtlClass = {
  // Positioning
  left: (isRTL: boolean) => (isRTL ? 'right' : 'left'),
  right: (isRTL: boolean) => (isRTL ? 'left' : 'right'),

  // Padding
  pl: (isRTL: boolean, size: string) => (isRTL ? `pr-${size}` : `pl-${size}`),
  pr: (isRTL: boolean, size: string) => (isRTL ? `pl-${size}` : `pr-${size}`),

  // Margin
  ml: (isRTL: boolean, size: string) => (isRTL ? `mr-${size}` : `ml-${size}`),
  mr: (isRTL: boolean, size: string) => (isRTL ? `ml-${size}` : `mr-${size}`),

  // Borders
  borderL: (isRTL: boolean) => (isRTL ? 'border-r' : 'border-l'),
  borderR: (isRTL: boolean) => (isRTL ? 'border-l' : 'border-r'),

  // Rounded corners
  roundedL: (isRTL: boolean, size: string = '') =>
    isRTL ? `rounded-r${size ? `-${size}` : ''}` : `rounded-l${size ? `-${size}` : ''}`,
  roundedR: (isRTL: boolean, size: string = '') =>
    isRTL ? `rounded-l${size ? `-${size}` : ''}` : `rounded-r${size ? `-${size}` : ''}`,

  // Text alignment
  textLeft: (isRTL: boolean) => (isRTL ? 'text-right' : 'text-left'),
  textRight: (isRTL: boolean) => (isRTL ? 'text-left' : 'text-right'),
};

/**
 * Get style object for inline styles with RTL support
 */
export const rtlStyle = {
  left: (isRTL: boolean, value: string | number) => (isRTL ? { right: value } : { left: value }),

  right: (isRTL: boolean, value: string | number) => (isRTL ? { left: value } : { right: value }),

  paddingLeft: (isRTL: boolean, value: string | number) =>
    isRTL ? { paddingRight: value } : { paddingLeft: value },

  paddingRight: (isRTL: boolean, value: string | number) =>
    isRTL ? { paddingLeft: value } : { paddingRight: value },

  marginLeft: (isRTL: boolean, value: string | number) =>
    isRTL ? { marginRight: value } : { marginLeft: value },

  marginRight: (isRTL: boolean, value: string | number) =>
    isRTL ? { marginLeft: value } : { marginRight: value },
};

/**
 * Flip horizontal transforms for RTL
 */
export const flipTransform = (isRTL: boolean, transform: string) => {
  if (!isRTL) return transform;

  // Flip scaleX
  if (transform.includes('scaleX')) {
    return transform.replace(/scaleX\((-?\d+\.?\d*)\)/, (_, val) => `scaleX(${-parseFloat(val)})`);
  }

  // Flip translateX
  if (transform.includes('translateX')) {
    return transform.replace(
      /translateX\((-?\d+\.?\d*)(px|%|rem|em)?\)/,
      (_, val, unit = '') => `translateX(${-parseFloat(val)}${unit})`
    );
  }

  return transform;
};

/**
 * Get direction-aware icon rotation
 */
export const rtlRotate = (isRTL: boolean, icon: 'arrow' | 'chevron') => {
  if (!isRTL) return '';

  switch (icon) {
    case 'arrow':
    case 'chevron':
      return 'rotate-180';
    default:
      return '';
  }
};
