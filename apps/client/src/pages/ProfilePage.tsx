import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete, TextField, Button, IconButton, CircularProgress, Alert,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import StarIcon from '@mui/icons-material/Star';
import BarChartIcon from '@mui/icons-material/BarChart';
import EditNoteIcon from '@mui/icons-material/EditNote';
import type { FamilyMember, FamilyMemberDetail, BloodType } from '../types/family';
import { BLOOD_TYPE_LABELS } from '../types/family';
import { calculateAge, isDeceased } from '../utils/age';
import Header from '../components/layout/Header';
import ConfirmDialog from '../components/common/ConfirmDialog';
import MemberStatsPanel from '../components/common/MemberStatsPanel';
import { dedupeMembers, memberLabel, renderMemberOption } from '../components/common/memberOptionUtils';
import { useAuth } from '../hooks/useAuth';
import { useMembersQuery, useSelfQuery, useTreeQuery } from '../hooks/queries/useFamilyQueries';
import { useUpdateMember, useUploadPhoto, useMarkAsMe, useUnmarkAsMe } from '../hooks/queries/useFamilyMutations';

const GENDER_LABELS: Record<string, string> = { MALE: 'Masculin', FEMALE: 'Feminin', OTHER: 'Altul' };

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const SidebarFact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-semibold text-earbore-gray uppercase tracking-wider">{label}</p>
    <p className="text-sm text-earbore-ink mt-0.5">{value}</p>
  </div>
);

const BenefitRow: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-xl bg-earbore-100 text-earbore-700 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-earbore-ink">{title}</p>
      <p className="text-xs text-earbore-gray leading-relaxed mt-0.5">{desc}</p>
    </div>
  </div>
);

const AccountInfoCard: React.FC<{
  userInitials: string;
  fullName: string;
  email: string;
  variant: 'linked' | 'unlinked';
}> = ({ userInitials, fullName, email, variant }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-5 sm:p-8">
    <h2 className="text-xs font-semibold text-earbore-500 uppercase tracking-wider mb-4">
      Informații cont
    </h2>
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-earbore-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
        {userInitials}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-earbore-ink truncate">{fullName}</p>
        <p className="text-sm text-earbore-gray truncate">{email}</p>
      </div>
    </div>
    <p className="text-sm text-earbore-gray mt-4 leading-relaxed">
      Acesta e contul cu care ești autentificat.{' '}
      {variant === 'linked'
        ? 'Este asociat cu un membru din arbore — poți schimba oricând asocierea din bara laterală.'
        : 'Nu este încă legat de niciun membru din arborele genealogic.'}
    </p>
  </div>
);

function normalizeSelf(data: FamilyMemberDetail | null | undefined): FamilyMemberDetail | null {
  return data && typeof data === 'object' && data.id ? data : null;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // NOU — "eu", lista de membri şi arborele vin din React Query, aceeaşi
  // cache-uri folosite şi de restul paginilor.
  const { data: rawSelf, isLoading: isLoadingSelf } = useSelfQuery();
  const selfMember = useMemo(() => normalizeSelf(rawSelf), [rawSelf]);
  const { data: allMembersRaw = [] } = useMembersQuery();
  const allMembers = useMemo(() => dedupeMembers(allMembersRaw), [allMembersRaw]);
  const { data: treeData } = useTreeQuery();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<FamilyMember>>({});

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const updateMemberMutation = useUpdateMember();
  const uploadPhotoMutation = useUploadPhoto();
  const markAsMeMutation = useMarkAsMe();
  const unmarkAsMeMutation = useUnmarkAsMe();

  const isSaving = updateMemberMutation.isPending || uploadPhotoMutation.isPending;
  const isLinking = markAsMeMutation.isPending;
  const isRemoving = unmarkAsMeMutation.isPending;

  useEffect(() => {
    if (selfMember) {
      const { parents, children, partnersA, partnersB, ...editableFields } = selfMember;
      setForm(editableFields);
    } else {
      // FIX — dacă nu există membru asociat, nu lăsăm în `form` datele
      // rămase de la o încărcare anterioară (ex. după "Elimină legătura")
      setForm({});
    }
  }, [selfMember]);

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
    try {
      await updateMemberMutation.mutateAsync({ id: selfMember.id, data: form });
      if (photoFile) {
        await uploadPhotoMutation.mutateAsync({ id: selfMember.id, file: photoFile });
      }
      setPhotoFile(null);
      setPhotoPreview(null);
      setIsEditing(false);
    } catch {
      // eroarea rămâne vizibilă prin starea mutaţiei
    }
  };

  const handleLink = async () => {
    if (!selectedMemberId) return;
    try {
      await markAsMeMutation.mutateAsync(selectedMemberId);
      setSelectedMemberId('');
      setShowPicker(false);
    } catch {
      // eroarea rămâne implicită
    }
  };

  const handleConfirmRemove = async () => {
    try {
      await unmarkAsMeMutation.mutateAsync();
      setSelectedMemberId('');
      setShowPicker(false);
    } finally {
      setConfirmRemoveOpen(false);
    }
  };

  const firstInitial = user?.firstName?.[0] ?? '';
  const lastInitial = user?.lastName?.[0] ?? '';
  const userInitials = (firstInitial + lastInitial).toUpperCase() || '?';
  const userFullName = user ? `${user.firstName} ${user.lastName}` : '—';
  const userEmail = user?.email ?? '—';

  if (isLoadingSelf) {
    return (
      <div className="min-h-dvh bg-earbore-grayLight">
        <Header />
        <div className="flex items-center justify-center py-24">
          <CircularProgress />
        </div>
      </div>
    );
  }

  if (!selfMember || showPicker) {
    const selected = allMembers.find((m) => m.id === selectedMemberId) ?? null;
    const isReselecting = !!selfMember;

    return (
      <div className="min-h-dvh bg-earbore-grayLight">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-16 flex flex-col gap-5 sm:gap-6">

          <AccountInfoCard
            userInitials={userInitials}
            fullName={userFullName}
            email={userEmail}
            variant={isReselecting ? 'linked' : 'unlinked'}
          />

          {!isReselecting && (
            <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-5 sm:p-8">
              <h2 className="text-xs font-semibold text-earbore-500 uppercase tracking-wider mb-4">
                De ce să te asociezi cu un membru?
              </h2>
              <div className="flex flex-col gap-4">
                <BenefitRow
                  icon={<StarIcon fontSize="small" />}
                  title="Apari marcat distinct în arbore"
                  desc="Cardul tău primește o steluță și un chenar special, ca oricine să te recunoască imediat printre generații."
                />
                <BenefitRow
                  icon={<BarChartIcon fontSize="small" />}
                  title="Statistici personalizate"
                  desc="Vezi câți strămoși, descendenți, frați/surori și parteneri ai, plus generația exactă în care te afli."
                />
                <BenefitRow
                  icon={<EditNoteIcon fontSize="small" />}
                  title="Editare directă a propriului profil"
                  desc="Poza, biografia și datele tale se editează chiar de aici, fără să mai cauți cardul tău în arbore."
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-5 sm:p-8 text-center">
            <h1 className="text-xl font-extrabold text-earbore-ink mb-2">Cine ești tu în arbore?</h1>
            <p className="text-sm text-earbore-gray mb-6">
              {isReselecting
                ? `Ești în prezent asociat cu ${selfMember?.firstName} ${selfMember?.lastName}. Alege un alt membru pentru a schimba asocierea, sau anulează pentru a rămâne cum era.`
                : 'Alege membrul din arbore care ești tu, ca să deblochezi funcționalitățile de mai sus.'}
            </p>

            {allMembers.length === 0 ? (
              <p className="text-sm text-earbore-gray">
                Nu ai adăugat încă niciun membru. Mergi în arbore și adaugă-te pe tine primul.
              </p>
            ) : (
              <div className="flex flex-col gap-3 text-left">
                <Autocomplete
                  options={allMembers.filter((m) => m.id !== selfMember?.id)}
                  getOptionLabel={memberLabel}
                  getOptionKey={(option) => option.id}
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

                {isReselecting && (
                  <Button
                    variant="text"
                    color="inherit"
                    disabled={isLinking}
                    onClick={() => { setSelectedMemberId(''); setShowPicker(false); }}
                    sx={{ borderRadius: 1.5, py: 1, textTransform: 'none' }}
                  >
                    Anulează, păstrează asocierea curentă
                  </Button>
                )}
              </div>
            )}

            {isReselecting && (
              <Button
                variant="text"
                color="error"
                size="small"
                onClick={() => setConfirmRemoveOpen(true)}
                sx={{ mt: 3, textTransform: 'none' }}
              >
                Elimină complet legătura "eu"
              </Button>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={confirmRemoveOpen}
          title="Elimini complet legătura?"
          description={`Nu vei mai fi asociat cu niciun membru din arbore${selfMember ? ` (în prezent: ${selfMember.firstName} ${selfMember.lastName})` : ''}. Poți reface asocierea oricând, mai târziu.`}
          confirmLabel="Da, elimină"
          isLoading={isRemoving}
          onConfirm={handleConfirmRemove}
          onCancel={() => setConfirmRemoveOpen(false)}
        />
      </div>
    );
  }

  const deceased = isDeceased(selfMember.deathDate);
  const age = calculateAge(selfMember.birthDate, selfMember.deathDate);
  const displayedImageUrl = photoPreview ?? selfMember.imageUrl;
  const selfInitials = `${selfMember.firstName?.[0] ?? ''}${selfMember.lastName?.[0] ?? ''}`;

  return (
    <div className="min-h-screen bg-earbore-grayLight">
      <Header />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">

        {!isEditing && (
          <div className="relative w-full rounded-2xl overflow-hidden mb-6 border border-earbore-border">
            <div
              className="h-48 sm:h-56 md:h-72 w-full bg-cover bg-center"
              style={{
                backgroundImage: selfMember.imageUrl
                  ? `url(${selfMember.imageUrl})`
                  : 'linear-gradient(135deg, var(--color-earbore-400), var(--color-earbore-800))',
                filter: deceased ? 'grayscale(35%)' : undefined,
              }}
            >
              <div
                className="w-full h-full flex items-end p-4 sm:p-6 md:p-10"
                style={{ background: 'linear-gradient(to top, rgba(20,10,40,0.82) 0%, rgba(20,10,40,0.35) 55%, rgba(20,10,40,0) 100%)' }}
              >
                <div className="text-white max-w-3xl">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider bg-earbore-500/90 backdrop-blur-sm px-3 py-1 rounded-full mb-3 mr-2">
                    Profilul tău
                  </span>
                  {selfMember.occupation && (
                    <span className="inline-block text-xs font-semibold uppercase tracking-wider bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
                      {selfMember.occupation}
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-sm">
                    {selfMember.firstName} {selfMember.lastName}
                  </h1>
                  <p className="text-white/85 text-xs sm:text-sm md:text-base mt-2 flex items-center gap-2 flex-wrap">
                    {selfMember.birthDate && (
                      <span>{new Date(selfMember.birthDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    )}
                    {age !== null && <span>• {age} ani</span>}
                    {deceased && <span>• ✝ decedat</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 sm:gap-6 items-start">

          <div className="lg:sticky lg:top-6 bg-white rounded-2xl shadow-sm border border-earbore-border overflow-hidden">
            <div
              className="h-24 w-full"
              style={{
                background: deceased
                  ? 'linear-gradient(135deg, #cfc7db, #a89bc2)'
                  : 'linear-gradient(135deg, var(--color-earbore-400), var(--color-earbore-700))',
              }}
            />
            <div className="px-5 sm:px-6 pb-6">
              <div className="relative -mt-12 mb-3">
                <div
                  className={`w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold ${deceased ? 'bg-earbore-grayLight text-earbore-gray' : 'bg-earbore-100 text-earbore-700'
                    }`}
                >
                  {displayedImageUrl ? (
                    <img src={displayedImageUrl} alt={selfMember.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{selfInitials}</span>
                  )}
                </div>
                {isEditing && (
                  <IconButton
                    component="label"
                    size="small"
                    disabled={isSaving}
                    sx={{
                      position: 'absolute', bottom: 0, left: 76, bgcolor: 'primary.main', color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <PhotoCameraIcon fontSize="small" />
                    <input hidden type="file" accept="image/*" onChange={handlePhotoSelect} />
                  </IconButton>
                )}
              </div>

              <h1 className="text-xl font-extrabold text-earbore-ink leading-tight">
                {selfMember.firstName} {selfMember.lastName}
              </h1>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {age !== null && (
                  <span className="text-xs bg-earbore-50 text-earbore-700 px-2 py-1 rounded-full font-medium">{age} ani</span>
                )}
                {deceased && (
                  <span className="text-xs bg-earbore-ink/5 text-earbore-gray px-2 py-1 rounded-full border border-earbore-border">
                    ✝ decedat
                  </span>
                )}
              </div>

              {selfMember.occupation && !isEditing && (
                <p className="text-sm text-earbore-ink mt-3">{selfMember.occupation}</p>
              )}

              {!isEditing && (
                <div className="mt-5 pt-5 border-t border-earbore-border space-y-3">
                  <SidebarFact label="Data nașterii" value={selfMember.birthDate ? new Date(selfMember.birthDate).toLocaleDateString('ro-RO') : '—'} />
                  <SidebarFact label="Gen" value={selfMember.gender ? GENDER_LABELS[selfMember.gender] : '—'} />
                  <SidebarFact label="Studii" value={selfMember.education || '—'} />
                  <SidebarFact label="Grupă sanguină" value={selfMember.bloodType ? BLOOD_TYPE_LABELS[selfMember.bloodType as BloodType] : '—'} />
                  <SidebarFact label="Înălțime" value={selfMember.heightCm ? `${selfMember.heightCm} cm` : '—'} />
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-earbore-border flex flex-col gap-2">
                {isEditing && (
                  <button onClick={handleCancelEditing} disabled={isSaving} className="btn-outline text-sm py-2.5">
                    Anulează
                  </button>
                )}
                <button
                  onClick={() => (isEditing ? handleSave() : handleStartEditing())}
                  disabled={isSaving}
                  className="btn-primary text-sm py-2.5"
                >
                  {isEditing ? (isSaving ? 'Se salvează...' : 'Salvează') : 'Editează profilul'}
                </button>

                {!isEditing && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => setShowPicker(true)}
                    sx={{ borderRadius: 1.5, textTransform: 'none', py: 1.1 }}
                  >
                    Schimbă asocierea
                  </Button>
                )}

                {!isEditing && (
                  <button
                    onClick={() => navigate(`/members/${selfMember.id}`)}
                    className="text-xs font-semibold text-earbore-600 hover:text-earbore-700 cursor-pointer text-center mt-1"
                  >
                    Vezi pagina membrului din arbore →
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:gap-6 min-w-0">

            {!isEditing && (
              <AccountInfoCard
                userInitials={userInitials}
                fullName={userFullName}
                email={userEmail}
                variant="linked"
              />
            )}

            {!isEditing && selfMember.bio && (
              <article className="bg-white rounded-2xl shadow-sm border border-earbore-border p-5 sm:p-8 md:p-10">
                <h2 className="text-xs font-semibold text-earbore-500 uppercase tracking-wider mb-5">
                  Despre mine
                </h2>
                <div className="max-w-[68ch] mx-auto">
                  {selfMember.bio.split(/\n{2,}|\n/).filter((p) => p.trim().length > 0).map((paragraph, i) => (
                    <p
                      key={i}
                      className={`text-earbore-ink/90 text-[15px] sm:text-[17px] leading-[1.85] font-normal ${i > 0 ? 'mt-5' : ''}`}
                    >
                      {i === 0 ? (
                        <>
                          <span className="float-left text-5xl sm:text-6xl font-extrabold text-earbore-600 leading-[0.8] pr-2 pt-1">
                            {paragraph.trim()[0]}
                          </span>
                          {paragraph.trim().slice(1)}
                        </>
                      ) : (
                        paragraph
                      )}
                    </p>
                  ))}
                </div>
              </article>
            )}

            {!isEditing && !selfMember.bio && (
              <div className="bg-white rounded-2xl shadow-sm border border-dashed border-earbore-border p-6 sm:p-8 text-center">
                <p className="text-earbore-gray text-sm mb-3">
                  Nu ai scris încă nimic despre tine. Povestea ta merită să fie păstrată.
                </p>
                <button onClick={handleStartEditing} className="btn-outline text-sm py-2 px-4">
                  Scrie despre mine
                </button>
              </div>
            )}

            {isEditing && (
              <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-5 sm:p-8">
                <h2 className="text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-4">Editează detalii</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Field label="Despre mine">
                      <textarea name="bio" value={form.bio || ''} onChange={handleChange} className="input-base" rows={5} />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {!isEditing && treeData && (
              <MemberStatsPanel memberId={selfMember.id} treeData={treeData} />
            )}

            {!isEditing && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Relațiile de familie (părinți, parteneri, copii) se administrează din pagina membrului în arbore.
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;