import React, { useState } from 'react';
import { Card, Avatar, Typography, Chip, Dialog, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { FamilyMember } from '../../types/family';
import { calculateAge, isDeceased } from '../../utils/age';

interface Props {
  member: FamilyMember;
  onOpen: () => void;
}

const MemberCard3D: React.FC<Props> = ({ member, onOpen }) => {
  const deceased = isDeceased(member.deathDate);
  const age = calculateAge(member.birthDate, member.deathDate);
  const [zoomOpen, setZoomOpen] = useState(false);

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (member.imageUrl) setZoomOpen(true);
  };

  return (
    <>
      <Card
        onClick={onOpen}
        elevation={2}
        sx={{
          width: 168, minHeight: 112, p: 1.25, display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center', cursor: 'pointer', userSelect: 'none',
          borderWidth: 2, borderStyle: 'solid',
          borderColor: deceased ? 'divider' : 'primary.light',
          filter: deceased ? 'grayscale(40%)' : undefined,
          '&:hover': { boxShadow: 6 },
        }}
      >
        <Box onClick={handlePhotoClick} sx={{ cursor: member.imageUrl ? 'zoom-in' : 'default' }}>
          <Avatar
            src={member.imageUrl ?? undefined}
            sx={{
              width: 50, height: 50, mb: 0.75, fontWeight: 700,
              border: '2px solid', borderColor: deceased ? 'divider' : 'primary.main',
              bgcolor: deceased ? 'grey.100' : 'primary.light', color: deceased ? 'text.secondary' : 'primary.dark',
            }}
          >
            {member.firstName[0]}{member.lastName[0]}
          </Avatar>
        </Box>

        <Typography variant="body2" noWrap sx={{ maxWidth: '100%', fontWeight: 600, lineHeight: 1.15 }}>
          {member.firstName} {member.lastName}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
          {age !== null && <Typography variant="caption" color="text.secondary">{age} ani</Typography>}
          {deceased && <Chip label="✝" size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />}
        </Box>
      </Card>

      {member.imageUrl && (
        <Dialog open={zoomOpen} onClose={() => setZoomOpen(false)} maxWidth="md">
          <IconButton onClick={() => setZoomOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}>
            <CloseIcon />
          </IconButton>
          <Box component="img" src={member.imageUrl} alt={member.firstName} sx={{ display: 'block', maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain' }} />
        </Dialog>
      )}
    </>
  );
};

export default MemberCard3D;