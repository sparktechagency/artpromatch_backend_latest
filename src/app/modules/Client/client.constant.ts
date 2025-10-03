export const serviceTypes = {
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
  //B
  BLACK_AND_GREY: 'Black & Grey',
  BLACKWORK: 'Blackwork',
  BRUTAL_BLACKWORK: 'Brutal Blackwork',
  BLACKOUT: 'Blackout',
  BLACK_TRASH: 'Black Trash',
  BIOMECH: 'Biomech',
  BOTANICAL: 'Botanical',
  //C
  CHICANO: 'Chicano',
  COVERUPS: 'Coverups',
  COMIC: 'Comic',
  CALLIGRAPHY: 'Calligraphy',
  //D
  DOTWORK: 'Dotwork',
  //F
  FINE_LINE: 'Fine Line',
  FRECKLES: 'Freckles',
  //G
  GEOMETRIC: 'Geometric',
  GRAPHIC: 'Graphic',
  //H
  HEAVY_BLACKWORK: 'Heavy Blackwork',
  //I
  ILLUSTRATIVE: 'Illustrative',
  IREZUMI: 'Irezumi',
  IGNORANT: 'Ignorant',
  //J
  JAPANESE_STYLE: 'Japanese Style',
  //L
  LETTERING: 'Lettering',
  LINEART: 'Lineart',
  //M
  MINIMALIST: 'Minimalist',
  MICROBLADING: 'Microblading',
  MICROREALISM: 'Microrealism',
  MAORI: 'Maori',
  //N
  NEO_TRADITIONAL: 'Neo Traditional',
  NEW_SCHOOL: 'New School',
  NATIVE_AMERICAN: 'Native American',
  NEO_TRIBAL: 'Neo Tribal',
  //0
  ORNAMENTAL: 'Ornamental',
  OLD_SCHOOL: 'Old School',
  //P
  PACIFIC_ISLANDER: 'Pacific Islander/Polynesian',
  PORTRAIT: 'Portrait',
  //R
  REALISM: 'Realism',
  REALISTIC_COLOR: 'Realistic Color',
  REALISTIC_BLACK_AND_GREY: 'Black & Grey',
  //S
  STICK_AND_POKE: 'Stick and Poke',
  SCAR_COVERUP: 'Scar Coverup',
  SCRIPT: 'Script',
  //T
  TRIBAL: 'Tribal',
  TRADITIONAL: 'Traditional',
  TATAU: 'Tatau',
  THAI: 'Thai',
  TATTOO_REMOVAL: 'Tattoo Removal',
  TOOTH_GEMS: 'Tooth Gems',
  TEBORI: 'Tebori',
  TRASH_POLKA: 'Trash Polka',
  //W
  WHITE_ON_BLACK: 'White On Black',
  WHITE_TATTOOS: 'White Tattoos',
  WATERCOLOR: 'Watercolor',
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
export type FavoriteTattoo =
  (typeof favoriteTattoos)[keyof typeof favoriteTattoos];
export type FavoritePiercing =
  (typeof favoritePiercings)[keyof typeof favoritePiercings];
export type ServiceType = (typeof serviceTypes)[keyof typeof serviceTypes];
export type DateFormat = (typeof dateFormats)[keyof typeof dateFormats];
export type ArtistType = (typeof artistTypes)[keyof typeof artistTypes];
export type TNotificationChannel =
  (typeof notificationChannel)[keyof typeof notificationChannel];
