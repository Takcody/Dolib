import Dexie, { type Table } from 'dexie';

export interface Book {
  id?: number;
  title: string;
  translatedTitle?: string;
  author?: string;
  barcode?: string;
  parody?: string; // As requested, likely category/genre
  circle?: string;
  isAnthology?: boolean;
  coverImage?: string; // Base64 string
  addedAt: number;
  notes?: string;
  size?: string;
}

export interface AppSettings {
  id: string;
  passcode?: string;
  isLocked: boolean;
  lastExportAt?: number;
  isDarkMode?: boolean;
  language?: string;
  customBackground?: string;
  backgroundDim?: number;
  autoLockTime?: number; // 0 = never, -1 = immediate, otherwise ms
}

export class LibrisDatabase extends Dexie {
  books!: Table<Book>;
  settings!: Table<AppSettings>;

  constructor() {
    super('LibrisDB');
    this.version(1).stores({
      books: '++id, title, translatedTitle, author, barcode, parody, addedAt',
      settings: 'id'
    });
  }
}

export const db = new LibrisDatabase();

// Initialize settings if not exists
export async function initSettings() {
  const settings = await db.settings.get('main');
  if (!settings) {
    await db.settings.add({
      id: 'main',
      isLocked: false
    });
  }
}
