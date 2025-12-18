export const CONTENT = {
  ABOUT_US: 'about-us',
  PRIVACY_POLICY: 'privacy-policy',
  TERMS_AND_CONDITIONS: 'terms-and-conditions',
  REFUND_POLICY: 'refund-policy'
} as const;

  export type TContent = typeof CONTENT[keyof typeof CONTENT];