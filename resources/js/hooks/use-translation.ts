import { useTranslation as useI18nTranslation } from 'react-i18next';

export function useTranslation() {
    const { t, i18n } = useI18nTranslation();

    const changeLanguage = (lang: 'en' | 'my') => {
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
    };

    const currentLanguage = i18n.language || 'en';

    return {
        t,
        changeLanguage,
        currentLanguage,
        isMyanmar: currentLanguage === 'my',
        isEnglish: currentLanguage === 'en',
    };
}

