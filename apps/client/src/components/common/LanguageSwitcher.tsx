import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, MenuItem, IconButton, Tooltip, ListItemText, Box } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n/config';

const FLAG_EMOJI: Record<SupportedLanguage, string> = {
  ro: '🇷🇴',
  en: '🇬🇧',
  hu: '🇭🇺',
  fr: '🇫🇷',
  de: '🇩🇪',
  es: '🇪🇸',
  it: '🇮🇹',
};

interface Props {
  // NOU — 'icon' pentru header (spațiu limitat), 'full' pentru pagini
  // gen Auth/Landing unde vrem eticheta limbii vizibilă complet.
  variant?: 'icon' | 'full';
}

const LanguageSwitcher: React.FC<Props> = ({ variant = 'icon' }) => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const currentLang = (i18n.language?.slice(0, 2) as SupportedLanguage) || 'ro';

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    handleClose();
  };

  return (
    <>
      {variant === 'icon' ? (
        <Tooltip title={t('languageSwitcher.label')}>
          <IconButton onClick={handleOpen} size="small" sx={{ color: 'var(--color-earbore-gray)' }}>
            <span style={{ fontSize: 18 }}>{FLAG_EMOJI[currentLang]}</span>
          </IconButton>
        </Tooltip>
      ) : (
        <Box
          onClick={handleOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.75,
            borderRadius: 3,
            border: '1px solid var(--color-earbore-border)',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-earbore-ink)',
            '&:hover': { bgcolor: 'var(--color-earbore-grayLight)' },
          }}
        >
          <TranslateIcon sx={{ fontSize: 16, color: 'var(--color-earbore-gray)' }} />
          <span>{FLAG_EMOJI[currentLang]} {t(`languageSwitcher.${currentLang}`)}</span>
        </Box>
      )}

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <MenuItem
            key={lang}
            selected={lang === currentLang}
            onClick={() => handleSelect(lang)}
            sx={{ gap: 1.25, minWidth: 160 }}
          >
            <span style={{ fontSize: 18 }}>{FLAG_EMOJI[lang]}</span>
            <ListItemText primary={t(`languageSwitcher.${lang}`)} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;