export const expertiseTypes = {
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

export type ExpertiseType =
  (typeof expertiseTypes)[keyof typeof expertiseTypes];

export const ARTIST_TYPE = {
  TATTOO_ARTIST: 'Tattoo Artist',
  PIERCER: 'Piercer',
} as const;

export type ValueOf<T> = T[keyof T];
export type TArtistType = ValueOf<typeof ARTIST_TYPE>;
export type TServices = {
  hourlyRate: number;
  dayRate: number;
  consultationsFee: number;
};

export type TContact = {
  email: string;
  phone: string;
  address: string;
};

export const cancellationPolicy = {
  ONE_DAY: '24-hour',
  TWO_DAY: '48-hour',
  THREE_DAY: '72-hour',
} as const;

export const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type TWeekDay = (typeof WEEK_DAYS)[number];

export type TCancellationPolicy =
  (typeof cancellationPolicy)[keyof typeof cancellationPolicy];
