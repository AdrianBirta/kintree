import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete, TextField, Button, IconButton, CircularProgress, Alert,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { familyMembersService } from '../api/familyMembersService';
import type { FamilyMember, FamilyMemberDetail, BloodType } from '../types/family';
import { BLOOD_TYPE_LABELS } from '../types/family';
import { calculateAge, isDeceased } from '../utils/age';
import Header from '../components/layout/Header';
import { dedupeMembers, memberLabel, renderMemberOption } from '../components/common/memberOptionUtils';

const GENDER_LABELS: Record<string, string> = { MALE: 'Masculin', FEMALE: 'Feminin', OTHER: 'Altul' };

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [selfMember, setSelfMember] = useState<FamilyMemberDetail | null | undefined>(undefined); // undefined = loading
  const [allMembers, setAllMembers] = useState<FamilyMember[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<FamilyMember>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const loadData = useCallback(async () => {
    const [self, all] = await Promise.all([
      familyMembersService.getSelf(),
      familyMembersService.getAll(),
    ]);
    setSelfMember(self);
    setAllMembers(dedupeMembers(all));
    if (self) {
      const { parents, children, partnersA, partnersB, ...editableFields } = self;
      setForm(editableFields);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value === '' ? undefined : name === 'heightCm' ? Number(value) : value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleStartEditing = () => setIsEditing(true);

  const handleCancelEditing = () => {
    if (selfMember) {
      const { parents, children, partnersA, partnersB, ...editableFields } = selfMember;
      setForm(editableFields);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selfMember) return;
    setIsSaving(true);
    try {
      await familyMembersService.update(selfMember.id, form);
      if (photoFile) {
        await familyMembersService.uploadPhoto(selfMember.id, photoFile);
      }
      setPhotoFile(null);
      setPhotoPreview(null);
      setIsEditing(false);
      loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleLink = async () => {
    if (!selectedMemberId) return;
    setIsLinking(true);
    try {
      await familyMembersService.markAsMe(selectedMemberId);
      setSelectedMemberId('');
      loadData();
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    setIsUnlinking(true);
    try {
      await familyMembersService.unmarkAsMe();
      setSelfMember(null);
    } finally {
      setIsUnlinking(false);
    }
  };

  // ── stare de loading inițială ──
  if (selfMember === undefined) {
    return (
      <div className="min-h-dvh bg-earbore-grayLight">
        <Header />
        <div className="flex items-center justify-center py-24">
          <CircularProgress />
        </div>
      </div>
    );
  }

  // ── nimeni marcat încă — ecran de setup ──
  if (selfMember === null) {
    const selected = allMembers.find((m) => m.id === selectedMemberId) ?? null;
    return (
      <div className="min-h-dvh bg-earbore-grayLight">
        <Header />
        <div className="max-w-lg mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-8 text-center">
            <h1 className="text-xl font-extrabold text-earbore-ink mb-2">Cine ești tu în arbore?</h1>
            <p className="text-sm text-earbore-gray mb-6">
              Alege membrul din arbore care ești tu, ca să-ți poți vedea și edita datele direct de aici.
            </p>

            {allMembers.length === 0 ? (
              <p className="text-sm text-earbore-gray">
                Nu ai adăugat încă niciun membru. Mergi în arbore și adaugă-te pe tine primul.
              </p>
            ) : (
              <div className="flex flex-col gap-3 text-left">
                <Autocomplete
                  options={allMembers}
                  getOptionLabel={memberLabel}
                  renderOption={renderMemberOption}
                  value={selected}
                  onChange={(_, val) => setSelectedMemberId(val?.id ?? '')}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Alege membru" placeholder="Caută după nume..." autoComplete="off" />
                  )}
                />
                <Button
                  variant="contained"
                  disabled={!selectedMemberId || isLinking}
                  onClick={handleLink}
                  sx={{ borderRadius: 1.5, py: 1.2 }}
                >
                  {isLinking ? 'Se salvează...' : 'Acesta sunt eu'}
                </Button>
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-earbore-gray hover:text-earbore-700 mt-6 cursor-pointer"
            >
              ← Înapoi la arbore
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── profil setat — afișare + editare ──
  const deceased = isDeceased(selfMember.deathDate);
  const age = calculateAge(selfMember.birthDate, selfMember.deathDate);
  const displayedImageUrl = photoPreview ?? selfMember.imageUrl;

  return (
    <div className="min-h-dvh bg-earbore-grayLight">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-earbore-gray hover:text-earbore-700 mb-5 cursor-pointer inline-block"
        >
          ← Înapoi la arbore
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-earbore-border overflow-hidden">
          <div
            className="h-24 w-full"
            style={{
              background: deceased
                ? 'linear-gradient(135deg, #cfc7db, #a89bc2)'
                : 'linear-gradient(135deg, var(--color-earbore-400), var(--color-earbore-700))',
            }}
          />
          <div className="px-6 sm:px-8 pb-8">
            <div className="relative -mt-12 mb-4 flex items-end justify-between">
              <div className="relative">
                <div
                  className={`w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold ${deceased ? 'bg-earbore-grayLight text-earbore-gray' : 'bg-earbore-100 text-earbore-700'
                    }`}
                >
                  {displayedImageUrl ? (
                    <img src={displayedImageUrl} alt={selfMember.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{selfMember.firstName[0]}{selfMember.lastName[0]}</span>
                  )}
                </div>
                {isEditing && (
                  <IconButton
                    component="label"
                    size="small"
                    disabled={isSaving}
                    sx={{
                      position: 'absolute', bottom: 0, right: -4, bgcolor: 'primary.main', color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <PhotoCameraIcon fontSize="small" />
                    <input hidden type="file" accept="image/*" onChange={handlePhotoSelect} />
                  </IconButton>
                )}
              </div>

              <button
                onClick={() => navigate(`/members/${selfMember.id}`)}
                className="text-xs font-semibold text-earbore-600 hover:text-earbore-700 cursor-pointer mb-2"
              >
                Vezi în arbore →
              </button>
            </div>

            <h1 className="text-2xl font-extrabold text-earbore-ink leading-tight">
              {selfMember.firstName} {selfMember.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {age !== null && (
                <span className="text-xs bg-earbore-50 text-earbore-700 px-2 py-1 rounded-full font-medium">{age} ani</span>
              )}
              {selfMember.occupation && !isEditing && (
                <span className="text-xs text-earbore-gray">{selfMember.occupation}</span>
              )}
            </div>

            {!isEditing ? (
              <div className="mt-6 pt-6 border-t border-earbore-border grid grid-cols-2 sm:grid-cols-3 gap-4">
                <SidebarFact label="Data nașterii" value={selfMember.birthDate ? new Date(selfMember.birthDate).toLocaleDateString('ro-RO') : '—'} />
                <SidebarFact label="Gen" value={selfMember.gender ? GENDER_LABELS[selfMember.gender] : '—'} />
                <SidebarFact label="Studii" value={selfMember.education || '—'} />
                <SidebarFact label="Grupă sanguină" value={selfMember.bloodType ? BLOOD_TYPE_LABELS[selfMember.bloodType as BloodType] : '—'} />
                <SidebarFact label="Înălțime" value={selfMember.heightCm ? `${selfMember.heightCm} cm` : '—'} />
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-earbore-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Prenume">
                  <input name="firstName" autoComplete="given-name" value={form.firstName || ''} onChange={handleChange} className="input-base" />
                </Field>
                <Field label="Nume">
                  <input name="lastName" autoComplete="family-name" value={form.lastName || ''} onChange={handleChange} className="input-base" />
                </Field>
                <Field label="Gen">
                  <select name="gender" value={form.gender || ''} onChange={handleChange} className="input-base">
                    <option value="">Nespecificat</option>
                    <option value="MALE">Masculin</option>
                    <option value="FEMALE">Feminin</option>
                    <option value="OTHER">Altul</option>
                  </select>
                </Field>
                <Field label="Data nașterii">
                  <input type="date" name="birthDate" autoComplete="bday" value={form.birthDate?.slice(0, 10) || ''} onChange={handleChange} className="input-base" />
                </Field>
                <Field label="Studii">
                  <input name="education" value={form.education || ''} onChange={handleChange} className="input-base" />
                </Field>
                <Field label="Ocupație">
                  <input name="occupation" autoComplete="organization-title" value={form.occupation || ''} onChange={handleChange} className="input-base" />
                </Field>
                <Field label="Grupă sanguină">
                  <select name="bloodType" value={form.bloodType || ''} onChange={handleChange} className="input-base">
                    <option value="">Nespecificat</option>
                    {Object.entries(BLOOD_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Înălțime (cm)">
                  <input type="number" name="heightCm" value={form.heightCm ?? ''} onChange={handleChange} className="input-base" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Despre mine">
                    <textarea name="bio" value={form.bio || ''} onChange={handleChange} className="input-base" rows={5} />
                  </Field>
                </div>
              </div>
            )}

            {!isEditing && selfMember.bio && (
              <div className="mt-6 pt-6 border-t border-earbore-border">
                <p className="text-xs font-semibold text-earbore-500 uppercase tracking-wider mb-3">Despre mine</p>
                <p className="text-earbore-ink/90 text-[15px] leading-relaxed whitespace-pre-line">{selfMember.bio}</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-earbore-border flex flex-col sm:flex-row gap-2">
              {isEditing && (
                <button onClick={handleCancelEditing} disabled={isSaving} className="btn-outline text-sm py-2.5 flex-1">
                  Anulează
                </button>
              )}
              <button
                onClick={() => (isEditing ? handleSave() : handleStartEditing())}
                disabled={isSaving}
                className="btn-primary text-sm py-2.5 flex-1"
              >
                {isEditing ? (isSaving ? 'Se salvează...' : 'Salvează') : 'Editează profilul'}
              </button>

              {!isEditing && (
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={handleUnlink}
                  disabled={isUnlinking}
                  sx={{ borderRadius: 1.5, textTransform: 'none' }}
                >
                  {isUnlinking ? 'Se elimină...' : 'Nu mai sunt eu'}
                </Button>
              )}
            </div>

            {!isEditing && (
              <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                Relațiile de familie (părinți, parteneri, copii) se administrează din pagina membrului în arbore.
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarFact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-semibold text-earbore-gray uppercase tracking-wider">{label}</p>
    <p className="text-sm text-earbore-ink mt-0.5">{value}</p>
  </div>
);

export default ProfilePage;