export const expertiseTypes = {
  // Tattoos
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

  // Piercings
  EAR_LOBE: 'Ear Lobe',
  LIP: 'Lip (Labret, Monroe)',
  TRIPLE_HELIX: 'Triple Helix',
  INDUSTRIAL: 'Industrial',
  SEPTUM: 'Septum',
  NOSE_NOSTRIL: 'Nose Nostril',
  TONGUE: 'Tongue',
  NASALLANG: 'Nasallang',
  TRAGUSS: 'Traguss',
  CONCH: 'Conch',
} as const;

export type ExpertiseType =
  (typeof expertiseTypes)[keyof typeof expertiseTypes];

export const ARTIST_TYPE = {
  TATTOO_ARTIST: 'Tattoo Artist',
  PIERCER: 'Piercer',
  BOTH: 'Both',
} as const;

export type ValueOf<T> = T[keyof T];
export type TArtistType = ValueOf<typeof ARTIST_TYPE>;

export type TService = {
  name: string;
  duration: string;
  bufferTime?: string;
};

export type TContact = {
  email: string;
  phone: string;
  address: string;
};

export type TBoost = {
  lastBoostAt: Date | null;
  endTime: Date | null;
  isActive: boolean;
};

export const cancellationPolicy = {
  ONE_DAY: '24-hour',
  TWO_DAY: '48-hour',
  THREE_DAY: '72-hour',
} as const;

export const WEEK_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type TWeekDay = (typeof WEEK_DAYS)[number];

export type TCancellationPolicy =
  (typeof cancellationPolicy)[keyof typeof cancellationPolicy];
