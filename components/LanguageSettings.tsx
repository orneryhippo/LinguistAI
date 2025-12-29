
import React from 'react';
import { LANGUAGES, Language } from '../types';

interface LanguageSettingsProps {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  disabled?: boolean;
}

const LanguageSettings: React.FC<LanguageSettingsProps> = ({ 
  selectedLanguage, 
  onLanguageChange,
  disabled 
}) => {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-slate-400">Target Language:</label>
      <select
        value={selectedLanguage.code}
        onChange={(e) => {
          const lang = LANGUAGES.find(l => l.code === e.target.value);
          if (lang) onLanguageChange(lang);
        }}
        disabled={disabled}
        className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name} ({lang.nativeName})
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSettings;
