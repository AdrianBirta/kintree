import React from 'react';
import { Popover, Box, Typography, IconButton } from '@mui/material';

interface Props {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Frecvente',
    emojis: ['😀', '😂', '😍', '🥰', '😊', '😉', '😎', '🤗', '🤔', '😢', '😭', '😡', '👍', '👎', '❤️', '🔥'],
  },
  {
    label: 'Gesturi',
    emojis: ['👋', '🙌', '👏', '🙏', '💪', '✌️', '🤝', '👌', '✋', '🫶'],
  },
  {
    label: 'Familie',
    emojis: ['👨‍👩‍👧‍👦', '👶', '🧑‍🍼', '👴', '👵', '💐', '🎂', '🎉', '🏡', '🌳'],
  },
  {
    label: 'Simboluri',
    emojis: ['💯', '✨', '⭐', '🎈', '💜', '💙', '💚', '🧡', '💛', '🤍'],
  },
];

const EmojiPicker: React.FC<Props> = ({ anchorEl, onClose, onSelect }) => {
  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      marginThreshold={16}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2.5,
            p: 2,
            width: 'min(360px, calc(100vw - 32px))',
            boxSizing: 'border-box',
            boxShadow: '0 16px 40px -12px rgba(20,10,40,0.28)',
            border: '1px solid var(--color-earbore-border)',
          },
        },
      }}
    >
      {EMOJI_GROUPS.map((group) => (
        <Box key={group.label} sx={{ mb: 1.75 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: 'var(--color-earbore-gray)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}
          >
            {group.label}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 0.75, mt: 0.75 }}>
            {group.emojis.map((emoji) => (
              <IconButton
                key={emoji}
                size="small"
                onClick={() => onSelect(emoji)}
                sx={{
                  width: '100%',
                  aspectRatio: '1',
                  minWidth: 0,
                  padding: 0,
                  fontSize: 17,
                  borderRadius: 1.5,
                  transition: 'transform 0.1s, background-color 0.1s',
                  '&:hover': { bgcolor: 'var(--color-earbore-50)', transform: 'scale(1.15)' },
                }}
              >
                {emoji}
              </IconButton>
            ))}
          </Box>
        </Box>
      ))}
    </Popover>
  );
};

export default EmojiPicker;