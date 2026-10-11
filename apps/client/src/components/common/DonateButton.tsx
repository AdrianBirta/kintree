import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, Tooltip } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { DONATE_URL, trackDonateClick, type DonateSource } from '../../lib/donate';

interface Props {
  source?: DonateSource;
}

const DonateButton: React.FC<Props> = ({ source = 'header' }) => {
  const { t } = useTranslation();

  return (
    <Tooltip title={t('donate.tooltip')}>
      <IconButton
        component="a"
        href={DONATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackDonateClick(source)}
        size="small"
        aria-label={t('donate.tooltip')}
        sx={{
          color: 'var(--color-earbore-danger)',
          flexShrink: 0,
          transition: 'background-color 0.15s, transform 0.15s',
          '&:hover': {
            bgcolor: 'color-mix(in srgb, var(--color-earbore-danger) 10%, white)',
            transform: 'scale(1.1)',
          },
        }}
      >
        <FavoriteBorderIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default DonateButton;