export const FOLDER_FOR = {
  PORTFOLIO: 'portfolio',
  FLASH: 'flash',
} as const;

export type TFolderFor = (typeof FOLDER_FOR)[keyof typeof FOLDER_FOR];
