'use client';

import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  const languages = [
    { code: 'zh' as const, name: '中文', flag: '🇨🇳' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
  ];

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] justify-center">
          <Globe className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">
            {currentLanguage?.flag} {currentLanguage?.name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLocale(language.code)}
            className={`flex items-center space-x-2 cursor-pointer ${
              locale === language.code ? 'bg-[#61d0de]/10 text-[#61d0de]' : ''
            }`}
          >
            <span className="text-base">{language.flag}</span>
            <span className="text-sm">{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}