import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, MenuItem, IconButton, Tooltip, ListItemText, ListItemIcon, Box } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckIcon from '@mui/icons-material/Check';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n/config';
import { LANGUAGE_MANUAL_FLAG_KEY } from '../../i18n/detectCountryLanguage';

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
  // 'icon' pentru header (spațiu limitat), 'full' pentru pagini
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
    try {
      localStorage.setItem(LANGUAGE_MANUAL_FLAG_KEY, 'true');
    } catch {
      // ignorăm — localStorage indisponibil
    }
    handleClose();
  };

  return (
    <>
      {variant === 'icon' ? (
        <Tooltip title={t('languageSwitcher.label')}>
          <IconButton
            onClick={handleOpen}
            size="small"
            sx={{
              color: 'var(--color-earbore-gray)',
              bgcolor: anchorEl ? 'var(--color-earbore-50)' : 'transparent',
              transition: 'background-color 0.15s',
            }}
          >
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
            whiteSpace: 'nowrap',
            transition: 'background-color 0.15s, border-color 0.15s',
            '&:hover': { bgcolor: 'var(--color-earbore-grayLight)', borderColor: 'var(--color-earbore-300)' },
          }}
        >
          <TranslateIcon sx={{ fontSize: 16, color: 'var(--color-earbore-gray)' }} />
          <span>{FLAG_EMOJI[currentLang]} {t(`languageSwitcher.${currentLang}`)}</span>
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              // radius doar jos-stânga și jos-dreapta; colțurile de sus rămân drepte
              borderRadius: 0,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              boxShadow: '0 12px 32px -8px rgba(20,10,40,0.22)',
              border: '1px solid',
              borderColor: 'var(--color-earbore-border)',
              // ancorăm lățimea minimă la trigger-ul care a deschis meniul,
              // ca opțiunile să nu mai apară mai înguste decât selectorul
              minWidth: anchorEl ? anchorEl.offsetWidth : undefined,
              py: 0.5,
            },
          },
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = lang === currentLang;
          return (
            <MenuItem
              key={lang}
              selected={active}
              onClick={() => handleSelect(lang)}
              sx={{
                gap: 1.25,
                minWidth: 180,
                py: 1,
                borderRadius: 1.5,
                mx: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'var(--color-earbore-50)',
                  '&:hover': { bgcolor: 'var(--color-earbore-100)' },
                },
              }}
            >
              <span style={{ fontSize: 18 }}>{FLAG_EMOJI[lang]}</span>
              <ListItemText
                primary={t(`languageSwitcher.${lang}`)}
                slotProps={{ primary: { sx: { fontWeight: active ? 700 : 500, fontSize: 14 } } }}
              />
              {active && (
                <ListItemIcon sx={{ minWidth: 'auto !important', ml: 1 }}>
                  <CheckIcon sx={{ fontSize: 18, color: 'var(--color-earbore-600)' }} />
                </ListItemIcon>
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;