// design-tokens.ts
// Auto-generated from design-tokens.css for use in Figma plugin code
// Only include tokens relevant for Figma node output (colors, radii, spacing, font sizes, etc.)

export const TOKENS = {
  // ================================================================
  // BASE COLORS (from design-tokens.css)
  // ================================================================
  
  // Azure (Neutral Gray-Blue)
  azure50: '#f6f7f9',
  azure100: '#eceff2',
  azure200: '#d4dae3',
  azure300: '#afbbca',
  azure400: '#8496ac',
  azure500: '#647993',
  azure600: '#506179',
  azure700: '#3f4c5f',
  azure800: '#394453',
  azure900: '#333b47',
  azure950: '#22272f',

  // Pale Sky (Neutral Gray)
  paleSky50: '#f7f8f8',
  paleSky100: '#edeef1',
  paleSky200: '#d8dbdf',
  paleSky300: '#b6bac3',
  paleSky400: '#8e95a2',
  paleSky500: '#6b7280',
  paleSky600: '#5b616e',
  paleSky700: '#4a4e5a',
  paleSky800: '#40444c',
  paleSky900: '#383a42',
  paleSky950: '#383a42',


  // Electric Violet (Brand Purple)
  electricViolet50: '#f4f2ff',
  electricViolet100: '#e9e8ff',
  electricViolet200: '#d6d4ff',
  electricViolet300: '#b9b1ff',
  electricViolet400: '#9785ff',
  electricViolet500: '#6f4cff',
  electricViolet600: '#6330f7',
  electricViolet700: '#551ee3',
  electricViolet800: '#4718bf',
  electricViolet900: '#3b169c',
  electricViolet950: '#230b6a',

  // Royal Blue (Info/Link)
  royalBlue50: '#eff7ff',
  royalBlue100: '#dbecfe',
  royalBlue200: '#bfdffe',
  royalBlue300: '#93ccfd',
  royalBlue400: '#60b0fa',
  royalBlue500: '#3b8ff6',
  royalBlue600: '#2563eb',
  royalBlue700: '#1d5bd8',
  royalBlue800: '#1e4aaf',
  royalBlue900: '#1e418a',
  royalBlue950: '#172954',

  // Malachite (Success Green)
  malachite50: '#effef4',
  malachite100: '#dafee5',
  malachite200: '#b8facd',
  malachite300: '#80f5a6',
  malachite400: '#42e679',
  malachite500: '#1fe461',
  malachite600: '#0eab43',
  malachite700: '#0f8637',
  malachite800: '#126930',
  malachite900: '#10572a',
  malachite950: '#033015',

  // Yellow (Warning)
  yellow50: '#fffbea',
  yellow100: '#fff4c6',
  yellow200: '#ffe270',
  yellow300: '#ffd44a',
  yellow400: '#ffc020',
  yellow500: '#f99e07',
  yellow600: '#dd7602',
  yellow700: '#b75306',
  yellow800: '#943f0c',
  yellow900: '#7a340d',
  yellow950: '#461a02',

  // Coral Red (Error/Danger)
  coralRed50: '#fff1f1',
  coralRed100: '#ffdfdf',
  coralRed200: '#ffc5c5',
  coralRed300: '#ff9d9d',
  coralRed400: '#ff6464',
  coralRed500: '#ff3838',
  coralRed600: '#ed1515',
  coralRed700: '#c80d0d',
  coralRed800: '#a50f0f',
  coralRed900: '#881414',
  coralRed950: '#4b0404',

  // Lochinvar (Teal)
  lochinvar50: '#eefffb',
  lochinvar100: '#c6fff4',
  lochinvar200: '#8effec',
  lochinvar300: '#4efae0',
  lochinvar400: '#19e8d0',
  lochinvar500: '#01cbb7',
  lochinvar600: '#00a496',
  lochinvar700: '#03857c',
  lochinvar800: '#086762',
  lochinvar900: '#0c5551',
  lochinvar950: '#003433',

  // Pompadour (Pink/Magenta)
  pompadour50: '#fef1fb',
  pompadour100: '#fee5f9',
  pompadour200: '#feccf5',
  pompadour300: '#ffa2ed',
  pompadour400: '#fe68dd',
  pompadour500: '#f93bca',
  pompadour600: '#e919ab',
  pompadour700: '#cb0b8d',
  pompadour800: '#a70d73',
  pompadour900: '#740d51',
  pompadour950: '#560139',

  // White
  white: '#ffffff',

  // ================================================================
  // SEMANTIC TOKENS (mapped from design-tokens.css)
  // ================================================================

  // Fills
  fillsBackground: '#f6f7f9', // --fills-background (azure-50)
  fillsSurface: '#ffffff',    // --fills-surface
  fillsBrand: '#6f4cff',     // --fills-brand (electric-violet-500)
  fillsSuccess: '#0eab4319', // --fills-success (malachite-alpha-100)
  fillsLinkDefault: '#2563eb', // --fills-link-default (royal-blue-600)

  // Text
  textPrimary: '#333b47',    // --text-primary-default (azure-900)
  textPrimaryInverted: '#ffffff', // --text-primary-inverted
  textSecondary: '#7F7F7F',  // --text-secondary-default
  textSecondaryInverted: '#afbbca', // --text-secondary-inverted (azure-300)
  textTertiary: '#647993',   // --text-tertiary-default (azure-500)
  textTertiaryInverted: '#d4dae3', // --text-tertiary-inverted (azure-200)
  textLink: '#2563eb',        // --text-link-default (royal-blue-600)
  textLabel: '#d8dbdf',      // --text-label-default (pale-sky-200)
  textStatesSuccess: '#126930', // --text-states-success (malachite-800)
  textMuted: '#3f4c5f',      // --text-muted (azure-700)

  // Border
  border: '#edeef1',         // --border-border (pale-sky-100)
  borderInput: '#22272f19',  // --border-input-border (azure-dark-alpha-100)
  borderDark: '#d8dbdf',     // --border-dark (pale-sky-200)
  borderStrong: '#b6bac3',   // --border-strong (pale-sky-300)

  // Accent/Status
  accentBrand: '#8F4BFF',  // similar to --accent-brand (electric-violet-400)
  accentSuccess: '#126930',  // --accent-success (malachite-800)
  accentSuccessLight: '#42e679', // --accent-success-light (malachite-400)
  accentSuccessBg: '#0eab4319',  // --accent-success-bg (malachite-alpha-100)
  accentError: '#ff3838',    // --accent-error (coral-red-500)
  accentWarning: '#dd7602',  // --accent-warning (yellow-600)
  accentInfo: '#2563eb',     // --accent-info (royal-blue-600)
  accentHighlight: '#01cbb7', // --accent-highlight (lochinvar-500)
  accentPrimary: '#7F7F7F',  
  accentPrimaryDark: '#22272f', // --accent-primary-dark (azure-950)

  // Status Variant Colors (from indicators)
  statusVariantA: '#3b8ff6',  // --status-variant-a (indicator-blue-1, royal-blue-500)
  statusVariantB: '#6f4cff',  // --status-variant-b (indicator-violet-1, electric-violet-500)
  statusVariantC: '#ff3838',  // --status-variant-c (indicator-coral-1, coral-red-500)

  // Buttons
  buttonBlackDefault: '#22272f', // --buttons-black-default (azure-950)
  buttonBlackHover: '#333b47',  // --buttons-black-hover (azure-900)
  buttonBlackSelected: '#394453', // --buttons-black-selected (azure-800)
  buttonPurpleDefault: '#6f4cff', // --buttons-purple-default (electric-violet-500)
  buttonPurpleHover: '#6330f7',  // --buttons-purple-hover (electric-violet-600)
  buttonGreenDefault: '#42e679', // --buttons-button-green-default (malachite-400)
  buttonGreenHover: '#1fe461',  // --buttons-button-green-hover (malachite-500)

  // Shadow & Effects
  shadowColor: { r: 0, g: 0, b: 0, a: 0.05 }, // Standard drop shadow
  shadowCard: { r: 40, g: 60, b: 90, a: 0.06 }, // Card shadow (rgba(40,60,90,0.06))
  
  // Checker pattern (for placeholders)
  checkerLight: { r: 0.96, g: 0.96, b: 0.96 }, // Light checker square
  checkerDark: { r: 0.89, g: 0.89, b: 0.89 },  // Dark checker square

  // ================================================================
  // SPACING (from design-tokens.css)
  // ================================================================
  space0: 0,
  space4: 4,
  space8: 8,
  space12: 12,
  space16: 16,
  space24: 24,
  space32: 32,
  space40: 40,

  // ================================================================
  // BORDER RADIUS (from design-tokens.css)
  // ================================================================
  radiusXS: 4,   // Buttons, inputs
  radiusSM: 8,   // Small cards
  radiusMD: 12,  // Medium cards
  radiusLG: 16,  // Plugin container, large cards
  radiusXL: 18,  // Large containers

  // ================================================================
  // TYPOGRAPHY (from design-tokens.css)
  // ================================================================
  fontFamily: 'Figtree',
  
  // Font Sizes
  fontSizeH1: 12,
  fontSizeH2: 11,
  fontSizeBodyMd: 11,
  fontSizeBodyLg: 12,
  fontSizeBodySm: 10,
  fontSizeLabel: 9,
  fontSizeInput: 11,
  
  // Font Weights
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 600,
  fontWeightBold: 700,
  
  // Line Heights
  lineHeightH1: 1.0,      // 100%
  lineHeightH2: 0.91,     // 91%
  lineHeightBodyMd: 1.3,   // 130%
  lineHeightBodyLg: 1.2,   // 120%
  lineHeightBodySm: 1.3,   // 130%
  lineHeightLabel: 1.0,    // 100%
  lineHeightInput: 0.91,   // 91%
};
