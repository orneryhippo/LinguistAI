
export enum SessionStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'English', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'Spanish', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'French', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'German', name: 'German', nativeName: 'Deutsch', flag: 'DE' },
  { code: 'Japanese', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'Chinese', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'Korean', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'Italian', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
];
