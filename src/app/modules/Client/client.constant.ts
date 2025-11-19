export const lookingForTypes = {
  TATTOOS: 'Tattoos',
  PIERCINGS: 'Piercings',
  CUSTOM_DESIGNS: 'Custom Designs',
  COVER_UPS: 'Cover-ups',
  TOUCH_UPS: 'Touch-ups',
  GUEST_SPOTS: 'Guest Spots',
} as const;

export const favoriteTattoos = {
  //A
  AMERICAN_TRADITIONAL: 'American Traditional',
  ABSTRACT: 'Abstract',
  AFRICAN: 'African',
  ANIME: 'Anime',

  // B
  BLACK_AND_GREY: 'Black & Grey',
  BLACKWORK: 'Blackwork',
  BRUTAL_BLACKWORK: 'Brutal Blackwork',
  BLACKOUT: 'Blackout',
  BLACK_TRASH: 'Black Trash',
  BIOMECH: 'Biomech',
  BOTANICAL: 'Botanical',

  // C
  CALLIGRAPHY: 'Calligraphy',
  CHICANO: 'Chicano',
  COMIC: 'Comic',
  COVERUPS: 'Coverups',

  // D
  DOTWORK: 'Dotwork',

  // F
  FINE_LINE: 'Fine Line',
  FRECKLES: 'Freckles',

  // G
  GEOMETRIC: 'Geometric',
  GRAPHIC: 'Graphic',

  // H
  HEAVY_BLACKWORK: 'Heavy Blackwork',

  // I
  ILLUSTRATIVE: 'Illustrative',
  IGNORANT: 'Ignorant',
  IREZUMI: 'Irezumi',

  // J
  JAPANESE_STYLE: 'Japanese Style',

  // L
  LETTERING: 'Lettering',
  LINEART: 'Lineart',

  // M
  MAORI: 'Maori',
  MICROBLADING: 'Microblading',
  MICROREALISM: 'Microrealism',
  MINIMALIST: 'Minimalist',

  // N
  NATIVE_AMERICAN: 'Native American',
  NEO_TRADITIONAL: 'Neo Traditional',
  NEO_TRIBAL: 'Neo Tribal',
  NEW_SCHOOL: 'New School',

  // O
  OLD_SCHOOL: 'Old School',
  ORNAMENTAL: 'Ornamental',

  // P
  PACIFIC_ISLANDER: 'Pacific Islander / Polynesian',
  PORTRAIT: 'Portrait',

  // R
  REALISM: 'Realism',
  REALISTIC_COLOR: 'Realistic Color',
  REALISTIC_BLACK_AND_GREY: 'Realistic Black & Grey',

  // S
  SCAR_COVERUP: 'Scar Coverup',
  SCRIPT: 'Script',
  STICK_AND_POKE: 'Stick and Poke',

  // T
  TATAU: 'Tatau',
  TATTOO_REMOVAL: 'Tattoo Removal',
  TEBORI: 'Tebori',
  THAI: 'Thai',
  TRADITIONAL: 'Traditional',
  TRASH_POLKA: 'Trash Polka',
  TRIBAL: 'Tribal',

  // W
  WATERCOLOR: 'Watercolor',
  WHITE_ON_BLACK: 'White on Black',
  WHITE_TATTOOS: 'White Tattoos',

  // T
  TOOTH_GEMS: 'Tooth Gems',
} as const;

export const favoritePiercings = {
  EAR_LOBE: 'Ear Lobe',
  LIP: 'Lip (Labret, Monroe)',
  TRIPLE_HELIX: 'Triple Helix',
  INDUSTRIAL: 'Industrial',
  SEPTUM: 'Septum',
  NOSE_NOSTRIL: 'Nose Nostril',
  TONGUE: 'Tongue',
  NASALLANG: 'Nasallang',
  BLACKWORK: 'Blackwork',
  TRAGUSS: 'Traguss',
  CONCH: 'Conch',
} as const;

export const homeViews = {
  GRID: 'Grid View',
  MAP: 'Map View',
  BOTH: 'Both',
} as const;

export const artistTypes = {
  TATTOO: 'Tattoo Artist',
  PIERCER: 'Piercer',
  BOTH: 'Both',
} as const;

export const dateFormats = {
  DDMMYYYY: 'DD/MM/YYYY',
  MMDDYYYY: 'MM/DD/YYYY',
  YYYYMMDD: 'YYYY-MM-DD',
} as const;

export const notificationChannel = {
  APP: 'app',
  EMAIL: 'email',
  SMS: 'sms',
} as const;

export type HomeView = (typeof homeViews)[keyof typeof homeViews];
export type TFavoriteTattoo =
  (typeof favoriteTattoos)[keyof typeof favoriteTattoos];
export type TFavoritePiercing =
  (typeof favoritePiercings)[keyof typeof favoritePiercings];
export type TLookingFor =
  (typeof lookingForTypes)[keyof typeof lookingForTypes];
export type DateFormat = (typeof dateFormats)[keyof typeof dateFormats];
export type ArtistType = (typeof artistTypes)[keyof typeof artistTypes];
export type TNotificationChannel =
  (typeof notificationChannel)[keyof typeof notificationChannel];
