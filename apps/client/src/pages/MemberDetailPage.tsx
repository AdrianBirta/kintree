import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { familyMembersService } from '../api/familyMembersService';
import type { FamilyMember, FamilyMemberDetail, BloodType } from '../types/family';
import { BLOOD_TYPE_LABELS } from '../types/family';
import { calculateAge, isDeceased } from '../utils/age';
import Header from '../components/layout/Header';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { Autocomplete, TextField } from '@mui/material';
import ConfirmDialog from '../components/common/ConfirmDialog';

const GENDER_LABELS: Record<string, string> = { MALE: 'Masculin', FEMALE: 'Feminin', OTHER: 'Altul' };
const STATUS_LABELS: Record<string, string> = {
  MARRIED: 'Căsătoriți',
  PARTNER: 'Parteneri',
  DIVORCED: 'Divorțați',
  WIDOWED: 'Văduv/ă',
};

const memberLabel = (m: FamilyMember) => `${m.firstName} ${m.lastName}`;

const estimateReadTime = (text?: string | null) => {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180)); // ~180 cuvinte/minut
};

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<FamilyMemberDetail | null>(null);
  const [allMembers, setAllMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<FamilyMember>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [partnerStatus, setPartnerStatus] = useState('MARRIED');
  const [isLinkingPartner, setIsLinkingPartner] = useState(false);

  const [selectedParentId, setSelectedParentId] = useState('');
  const [isLinkingParent, setIsLinkingParent] = useState(false);

  const [selectedChildId, setSelectedChildId] = useState('');
  const [isLinkingChild, setIsLinkingChild] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMember = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([familyMembersService.getOne(id), familyMembersService.getAll()]).then(([data, all]) => {
      setMember(data);
      const { parents, children, partnersA, partnersB, ...editableFields } = data;
      setForm(editableFields);
      setAllMembers(all.filter((m) => m.id !== id));
      setIsLoading(false);
    });
  }, [id]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value === '' ? undefined : name === 'heightCm' ? Number(value) : value });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    if (member) {
      const { parents, children, partnersA, partnersB, ...editableFields } = member;
      setForm(editableFields);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await familyMembersService.update(id, form);
      if (photoFile) {
        await familyMembersService.uploadPhoto(id, photoFile);
      }
      setPhotoFile(null);
      setPhotoPreview(null);
      loadMember();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkPartner = async () => {
    if (!id || !selectedPartnerId) return;
    setIsLinkingPartner(true);
    try {
      await familyMembersService.linkPartners(id, selectedPartnerId, partnerStatus);
      setSelectedPartnerId('');
      loadMember();
    } finally {
      setIsLinkingPartner(false);
    }
  };

  const handleUnlinkPartner = async (partnerId: string) => {
    if (!id) return;
    await familyMembersService.unlinkPartners(id, partnerId);
    loadMember();
  };

  const handleLinkParent = async () => {
    if (!id || !selectedParentId) return;
    setIsLinkingParent(true);
    try {
      await familyMembersService.linkParentChild(selectedParentId, id);
      setSelectedParentId('');
      loadMember();
    } finally {
      setIsLinkingParent(false);
    }
  };

  const handleUnlinkParent = async (parentId: string) => {
    if (!id) return;
    await familyMembersService.unlinkParentChild(parentId, id);
    loadMember();
  };

  const handleLinkChild = async () => {
    if (!id || !selectedChildId) return;
    setIsLinkingChild(true);
    try {
      await familyMembersService.linkParentChild(id, selectedChildId);
      setSelectedChildId('');
      loadMember();
    } finally {
      setIsLinkingChild(false);
    }
  };

  const handleUnlinkChild = async (childId: string) => {
    if (!id) return;
    await familyMembersService.unlinkParentChild(id, childId);
    loadMember();
  };

  const handleDelete = async () => {
    if (!id || !member) return;
    setIsDeleting(true);
    try {
      await familyMembersService.remove(id);
      navigate('/dashboard');
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (isLoading || !member) {
    return (
      <div className="min-h-screen bg-earbore-grayLight flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-earbore-200 border-t-earbore-600 rounded-full animate-spin" />
      </div>
    );
  }

  const partners = [
    ...member.partnersA.map((p) => ({ linkId: p.id, status: p.status, person: p.partnerB })),
    ...member.partnersB.map((p) => ({ linkId: p.id, status: p.status, person: p.partnerA })),
  ];

  const currentParents = member.parents.map((p) => p.parent);
  const currentChildren = member.children.map((c) => c.child);

  const currentParentIds = new Set(currentParents.map((p) => p.id));
  const currentChildIds = new Set(currentChildren.map((c) => c.id));

  const parentOptions = allMembers.filter((m) => !currentParentIds.has(m.id) && !currentChildIds.has(m.id));
  const childOptions = allMembers.filter((m) => !currentChildIds.has(m.id) && !currentParentIds.has(m.id));
  const partnerOptions = allMembers.filter((m) => !partners.some((p) => p.person.id === m.id));

  const deceased = isDeceased(member.deathDate);
  const age = calculateAge(member.birthDate, member.deathDate);

  const displayedImageUrl = photoPreview ?? member.imageUrl;

  const selectedParent = parentOptions.find((m) => m.id === selectedParentId) ?? null;
  const selectedChild = childOptions.find((m) => m.id === selectedChildId) ?? null;
  const selectedPartner = partnerOptions.find((m) => m.id === selectedPartnerId) ?? null;

  return (
    <div className="min-h-screen bg-earbore-grayLight">
      <Header />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">

        {/* ───────────── HERO — copertă în stil articol de blog ───────────── */}
        {!isEditing && (
          <div className="relative w-full rounded-2xl overflow-hidden mb-6 border border-earbore-border">
            <div
              className="h-56 sm:h-72 w-full bg-cover bg-center"
              style={{
                backgroundImage: member.imageUrl
                  ? `url(${member.imageUrl})`
                  : 'linear-gradient(135deg, var(--color-earbore-400), var(--color-earbore-800))',
                filter: deceased ? 'grayscale(35%)' : undefined,
              }}
            >
              <div
                className="w-full h-full flex items-end p-6 sm:p-10"
                style={{ background: 'linear-gradient(to top, rgba(20,10,40,0.82) 0%, rgba(20,10,40,0.35) 55%, rgba(20,10,40,0) 100%)' }}
              >
                <div className="text-white max-w-3xl">
                  {member.occupation && (
                    <span className="inline-block text-xs font-semibold uppercase tracking-wider bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
                      {member.occupation}
                    </span>
                  )}
                  <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight drop-shadow-sm">
                    {member.firstName} {member.lastName}
                  </h1>
                  <p className="text-white/85 text-sm sm:text-base mt-2 flex items-center gap-2 flex-wrap">
                    {member.birthDate && (
                      <span>
                        {format(new Date(member.birthDate), 'd MMMM yyyy', { locale: ro })}
                        {member.deathDate && ` – ${format(new Date(member.deathDate), 'd MMMM yyyy', { locale: ro })}`}
                      </span>
                    )}
                    {age !== null && <span>• {age} ani</span>}
                    {member.bio && <span>• {estimateReadTime(member.bio)} min citire</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => navigate('/dashboard')} className="text-sm text-earbore-gray hover:text-earbore-700 mb-5 cursor-pointer inline-block">
          ← Înapoi la arbore
        </button>

        <ConfirmDialog
          open={confirmOpen}
          title="Ștergi acest membru?"
          description={`${member.firstName} ${member.lastName} va fi eliminat definitiv din arbore, împreună cu toate relațiile asociate.`}
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />

        {/* Layout principal: sidebar fix (identitate) + conținut (restul, pe lățime) */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

          {/* ───────────── SIDEBAR STÂNGA — identitate, fixă la scroll ───────────── */}
          <div className="lg:sticky lg:top-6 bg-white rounded-2xl shadow-sm border border-earbore-border overflow-hidden">
            <div
              className="h-24 w-full"
              style={{
                background: deceased
                  ? 'linear-gradient(135deg, #cfc7db, #a89bc2)'
                  : 'linear-gradient(135deg, var(--color-earbore-400), var(--color-earbore-700))',
              }}
            />
            <div className="px-6 pb-6">
              <div className="relative -mt-12 mb-3">
                <div
                  className={`w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold ${deceased ? 'bg-earbore-grayLight text-earbore-gray' : 'bg-earbore-100 text-earbore-700'
                    }`}
                >
                  {displayedImageUrl ? (
                    <img src={displayedImageUrl} alt={member.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{member.firstName[0]}{member.lastName[0]}</span>
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
                {member.firstName} {member.lastName}
              </h1>
              {member.maidenName && (
                <p className="text-earbore-gray italic text-sm mt-0.5">n. {member.maidenName}</p>
              )}

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

              {member.occupation && !isEditing && (
                <p className="text-sm text-earbore-ink mt-3">{member.occupation}</p>
              )}

              {/* Fapte rapide — o listă verticală simplă, potrivită unui sidebar îngust */}
              {!isEditing && (
                <div className="mt-5 pt-5 border-t border-earbore-border space-y-3">
                  <SidebarFact label="Data nașterii" value={member.birthDate ? format(new Date(member.birthDate), 'd MMMM yyyy', { locale: ro }) : '—'} />
                  <SidebarFact label="Data decesului" value={member.deathDate ? format(new Date(member.deathDate), 'd MMMM yyyy', { locale: ro }) : '—'} />
                  <SidebarFact label="Gen" value={member.gender ? GENDER_LABELS[member.gender] : '—'} />
                  <SidebarFact label="Studii" value={member.education || '—'} />
                  <SidebarFact label="Grupă sanguină" value={member.bloodType ? BLOOD_TYPE_LABELS[member.bloodType as BloodType] : '—'} />
                  <SidebarFact label="Înălțime" value={member.heightCm ? `${member.heightCm} cm` : '—'} />
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-earbore-border flex flex-col gap-2">
                {isEditing && (
                  <button
                    onClick={handleCancelEditing}
                    disabled={isSaving}
                    className="btn-outline text-sm py-2.5"
                  >
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
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  onClick={() => setConfirmOpen(true)}
                  sx={{ borderRadius: 1.5, textTransform: 'none', py: 1.1 }}
                >
                  Șterge membru
                </Button>
              </div>
            </div>
          </div>

          {/* ───────────── CONȚINUT DREAPTA — bio + formular editare + relații pe grid ───────────── */}
          <div className="flex flex-col gap-6 min-w-0">

            {/* Bio, ca introducere de articol */}
            {/* Bio, ca articol de blog */}
            {!isEditing && member.bio && (
              <article className="bg-white rounded-2xl shadow-sm border border-earbore-border p-8 sm:p-10">
                <h2 className="text-xs font-semibold text-earbore-500 uppercase tracking-wider mb-5">
                  Povestea vieții
                </h2>
                <div className="max-w-[68ch] mx-auto">
                  {member.bio.split(/\n{2,}|\n/).filter((p) => p.trim().length > 0).map((paragraph, i) => (
                    <p
                      key={i}
                      className={`text-earbore-ink/90 text-[17px] leading-[1.85] font-normal ${i > 0 ? 'mt-5' : ''}`}
                    >
                      {i === 0 ? (
                        <>
                          <span className="float-left text-6xl font-extrabold text-earbore-600 leading-[0.8] pr-2 pt-1">
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

            {/* Stare goală — încurajăm completarea bio-ului, ca un "scrie primul articol" */}
            {!isEditing && !member.bio && (
              <div className="bg-white rounded-2xl shadow-sm border border-dashed border-earbore-border p-8 text-center">
                <p className="text-earbore-gray text-sm mb-3">
                  {member.firstName} nu are încă o poveste scrisă. Fiecare viață merită o istorie păstrată.
                </p>
                <button onClick={handleStartEditing} className="btn-outline text-sm py-2 px-4">
                  Scrie povestea lui {member.firstName}
                </button>
              </div>
            )}

            {/* Formular de editare — toate câmpurile, pe lățimea disponibilă, 3 coloane */}
            {isEditing && (
              <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-8">
                <h2 className="text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-4">Editează detalii</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Prenume"><input name="firstName" value={form.firstName || ''} onChange={handleChange} className="input-base" /></Field>
                  <Field label="Nume"><input name="lastName" value={form.lastName || ''} onChange={handleChange} className="input-base" /></Field>
                  <Field label="Nume anterior"><input name="maidenName" value={form.maidenName || ''} onChange={handleChange} className="input-base" /></Field>
                  <Field label="Gen">
                    <select name="gender" value={form.gender || ''} onChange={handleChange} className="input-base">
                      <option value="">Nespecificat</option>
                      <option value="MALE">Masculin</option>
                      <option value="FEMALE">Feminin</option>
                      <option value="OTHER">Altul</option>
                    </select>
                  </Field>
                  <Field label="Data nașterii"><input type="date" name="birthDate" value={form.birthDate?.slice(0, 10) || ''} onChange={handleChange} className="input-base" /></Field>
                  <Field label="Data decesului"><input type="date" name="deathDate" value={form.deathDate?.slice(0, 10) || ''} onChange={handleChange} className="input-base" /></Field>
                  <Field label="Studii"><input name="education" value={form.education || ''} onChange={handleChange} className="input-base" /></Field>
                  <Field label="Ocupație"><input name="occupation" value={form.occupation || ''} onChange={handleChange} className="input-base" /></Field>
                  <Field label="Grupă sanguină">
                    <select name="bloodType" value={form.bloodType || ''} onChange={handleChange} className="input-base">
                      <option value="">Nespecificat</option>
                      {Object.entries(BLOOD_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Înălțime (cm)"><input type="number" name="heightCm" value={form.heightCm ?? ''} onChange={handleChange} className="input-base" /></Field>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Field label="Despre">
                      <textarea name="bio" value={form.bio || ''} onChange={handleChange} className="input-base" rows={4} />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Relații — 3 carduri UNA LÂNGĂ ALTA pe ecrane late, nu stivuite */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

              {/* Părinți */}
              <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-6 flex flex-col gap-4">
                <h2 className="text-base font-bold text-earbore-ink">Părinți</h2>

                {currentParents.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {currentParents.map((p) => (
                      <li key={p.id} className="flex items-center justify-between bg-earbore-grayLight rounded-xl px-3 py-2">
                        <span className="text-sm text-earbore-ink truncate">{p.firstName} {p.lastName}</span>
                        <button
                          onClick={() => handleUnlinkParent(p.id)}
                          className="text-xs text-earbore-danger hover:underline cursor-pointer flex-shrink-0 ml-2"
                        >
                          Dezleagă
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-earbore-gray">Niciun părinte adăugat încă.</p>
                )}

                {parentOptions.length > 0 && (
                  <div className="flex flex-col gap-2 pt-3 border-t border-earbore-border">
                    <Autocomplete
                      options={parentOptions}
                      getOptionLabel={memberLabel}
                      value={selectedParent}
                      onChange={(_, val) => setSelectedParentId(val?.id ?? '')}
                      isOptionEqualToValue={(a, b) => a.id === b.id}
                      renderInput={(params) => (
                        <TextField {...params} size="small" label="Adaugă părinte" placeholder="Caută..." />
                      )}
                    />
                    <button
                      onClick={handleLinkParent}
                      disabled={!selectedParentId || isLinkingParent}
                      className="btn-primary text-sm py-2.5 disabled:opacity-50"
                    >
                      {isLinkingParent ? 'Se leagă...' : 'Adaugă'}
                    </button>
                  </div>
                )}
              </div>

              {/* Copii */}
              <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-6 flex flex-col gap-4">
                <h2 className="text-base font-bold text-earbore-ink">Copii</h2>

                {currentChildren.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {currentChildren.map((c) => (
                      <li key={c.id} className="flex items-center justify-between bg-earbore-grayLight rounded-xl px-3 py-2">
                        <span className="text-sm text-earbore-ink truncate">{c.firstName} {c.lastName}</span>
                        <button
                          onClick={() => handleUnlinkChild(c.id)}
                          className="text-xs text-earbore-danger hover:underline cursor-pointer flex-shrink-0 ml-2"
                        >
                          Dezleagă
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-earbore-gray">Niciun copil adăugat încă.</p>
                )}

                {childOptions.length > 0 && (
                  <div className="flex flex-col gap-2 pt-3 border-t border-earbore-border">
                    <Autocomplete
                      options={childOptions}
                      getOptionLabel={memberLabel}
                      value={selectedChild}
                      onChange={(_, val) => setSelectedChildId(val?.id ?? '')}
                      isOptionEqualToValue={(a, b) => a.id === b.id}
                      renderInput={(params) => (
                        <TextField {...params} size="small" label="Adaugă copil" placeholder="Caută..." />
                      )}
                    />
                    <button
                      onClick={handleLinkChild}
                      disabled={!selectedChildId || isLinkingChild}
                      className="btn-primary text-sm py-2.5 disabled:opacity-50"
                    >
                      {isLinkingChild ? 'Se leagă...' : 'Adaugă'}
                    </button>
                  </div>
                )}
              </div>

              {/* Parteneri */}
              <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-6 flex flex-col gap-4">
                <h2 className="text-base font-bold text-earbore-ink">Parteneri</h2>

                {partners.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {partners.map((p) => (
                      <li key={p.linkId} className="flex items-center justify-between bg-earbore-grayLight rounded-xl px-3 py-2">
                        <span className="text-sm text-earbore-ink truncate">
                          {p.person.firstName} {p.person.lastName}{' '}
                          <span className="text-earbore-gray">({STATUS_LABELS[p.status] ?? p.status})</span>
                        </span>
                        <button
                          onClick={() => handleUnlinkPartner(p.person.id)}
                          className="text-xs text-earbore-danger hover:underline cursor-pointer flex-shrink-0 ml-2"
                        >
                          Dezleagă
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-earbore-gray">Niciun partener adăugat încă.</p>
                )}

                {partnerOptions.length > 0 && (
                  <div className="flex flex-col gap-2 pt-3 border-t border-earbore-border">
                    <Autocomplete
                      options={partnerOptions}
                      getOptionLabel={memberLabel}
                      value={selectedPartner}
                      onChange={(_, val) => setSelectedPartnerId(val?.id ?? '')}
                      isOptionEqualToValue={(a, b) => a.id === b.id}
                      renderInput={(params) => (
                        <TextField {...params} size="small" label="Adaugă partener" placeholder="Caută..." />
                      )}
                    />
                    <select value={partnerStatus} onChange={(e) => setPartnerStatus(e.target.value)} className="input-base">
                      <option value="MARRIED">Căsătoriți</option>
                      <option value="PARTNER">Parteneri</option>
                      <option value="DIVORCED">Divorțați</option>
                      <option value="WIDOWED">Văduv/ă</option>
                    </select>
                    <button
                      onClick={handleLinkPartner}
                      disabled={!selectedPartnerId || isLinkingPartner}
                      className="btn-primary text-sm py-2.5 disabled:opacity-50"
                    >
                      {isLinkingPartner ? 'Se leagă...' : 'Adaugă'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

export default MemberDetailPage;