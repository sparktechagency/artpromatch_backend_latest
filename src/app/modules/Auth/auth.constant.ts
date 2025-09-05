export const ROLE = {
  CLIENT: 'CLIENT',
  ARTIST: 'ARTIST',
  BUSINESS: 'BUSINESS',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type TRole = keyof typeof ROLE;

export type ValueOf<T> = T[keyof T];

export const defaultUserImage: string =
  'https://res.cloudinary.com/dweesppci/image/upload/v1746204369/wtmpcphfvexcq2ubcss0.png';
