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
import ConfirmDialog from '../components/common/ConfirmDialog';

const GENDER_LABELS: Record<string, string> = { MALE: 'Masculin', FEMALE: 'Feminin', OTHER: 'Altul' };
const STATUS_LABELS: Record<string, string> = {
  MARRIED: 'Căsătoriți',
  PARTNER: 'Parteneri',
  DIVORCED: 'Divorțați',
  WIDOWED: 'Văduv/ă',
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

  // NOU — poza selectată în timpul editării (înainte de upload) + preview local
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

  // NOU — selectarea unei poze noi în modul editare
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  // NOU — la anulare, renunțăm și la poza selectată dar neîncă salvată
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
      // NOU — dacă a fost selectată o poză nouă, o încărcăm după salvarea datelor
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
      // membrul selectat devine părinte al membrului curent
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
      // membrul curent devine părinte al membrului selectat
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

  // nu poți alege ca părinte pe cineva care e deja copilul tău (și invers), evită cicluri evidente
  const parentOptions = allMembers.filter((m) => !currentParentIds.has(m.id) && !currentChildIds.has(m.id));
  const childOptions = allMembers.filter((m) => !currentChildIds.has(m.id) && !currentParentIds.has(m.id));

  const deceased = isDeceased(member.deathDate);
  const age = calculateAge(member.birthDate, member.deathDate);

  // NOU — sursa afișată pentru avatar: preview local (dacă tocmai a fost aleasă o poză nouă) sau poza salvată
  const displayedImageUrl = photoPreview ?? member.imageUrl;

  return (
    <div className="min-h-screen bg-earbore-grayLight">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <button onClick={() => navigate('/dashboard')} className="text-sm text-earbore-gray hover:text-earbore-700 mb-4 cursor-pointer">
          ← Înapoi la arbore
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* NOU — avatar cu buton de schimbare poză, vizibil doar în modul editare */}
              <div className="relative">
                <div
                  className={`w-20 h-20 rounded-full overflow-hidden border-2 flex items-center justify-center text-2xl font-bold ${deceased ? 'border-earbore-border bg-earbore-grayLight text-earbore-gray' : 'border-earbore-400 bg-earbore-100 text-earbore-700'
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
                      position: 'absolute', bottom: -4, right: -4, bgcolor: 'primary.main', color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <PhotoCameraIcon fontSize="small" />
                    <input hidden type="file" accept="image/*" onChange={handlePhotoSelect} />
                  </IconButton>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-earbore-ink">
                  {member.firstName} {member.lastName}
                </h1>
                {member.maidenName && (
                  <p className="text-sm text-earbore-gray italic">n. {member.maidenName}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {age !== null && <span className="text-sm text-earbore-gray">{age} ani</span>}
                  {deceased && (
                    <span className="text-xs bg-earbore-ink/5 text-earbore-gray px-2 py-0.5 rounded-full border border-earbore-border">
                      ✝ decedat
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {isEditing && (
                <button
                  onClick={handleCancelEditing}
                  disabled={isSaving}
                  className="btn-outline text-sm py-2 px-4"
                >
                  Anulează
                </button>
              )}
              <button
                onClick={() => (isEditing ? handleSave() : handleStartEditing())}
                disabled={isSaving}
                className="btn-outline text-sm py-2 px-4"
              >
                {isEditing ? (isSaving ? 'Se salvează...' : 'Salvează') : 'Editează'}
              </button>
              <Button color="error" variant="outlined" onClick={() => setConfirmOpen(true)}>
                Șterge membru
              </Button>
            </div>
          </div>

          <ConfirmDialog
            open={confirmOpen}
            title="Ștergi acest membru?"
            description={`${member.firstName} ${member.lastName} va fi eliminat definitiv din arbore, împreună cu toate relațiile asociate.`}
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => setConfirmOpen(false)}
          />

          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
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
              <div className="col-span-2">
                <Field label="Despre">
                  <textarea name="bio" value={form.bio || ''} onChange={handleChange} className="input-base" rows={3} />
                </Field>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <InfoRow label="Gen" value={member.gender ? GENDER_LABELS[member.gender] : '—'} />
              <InfoRow label="Data nașterii" value={member.birthDate ? format(new Date(member.birthDate), 'd MMMM yyyy', { locale: ro }) : '—'} />
              <InfoRow label="Data decesului" value={member.deathDate ? format(new Date(member.deathDate), 'd MMMM yyyy', { locale: ro }) : '—'} />
              <InfoRow label="Studii" value={member.education || '—'} />
              <InfoRow label="Ocupație" value={member.occupation || '—'} />
              <InfoRow label="Grupă sanguină" value={member.bloodType ? BLOOD_TYPE_LABELS[member.bloodType as BloodType] : '—'} />
              <InfoRow label="Înălțime" value={member.heightCm ? `${member.heightCm} cm` : '—'} />
              {member.bio && (
                <div className="col-span-2">
                  <InfoRow label="Despre" value={member.bio} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-8 mt-6">
          <h2 className="text-lg font-bold text-earbore-ink mb-4">Părinți</h2>

          {currentParents.length > 0 ? (
            <ul className="space-y-2 mb-5">
              {currentParents.map((p) => (
                <li key={p.id} className="flex items-center justify-between bg-earbore-grayLight rounded-xl px-4 py-2.5">
                  <span className="text-sm text-earbore-ink">{p.firstName} {p.lastName}</span>
                  <button
                    onClick={() => handleUnlinkParent(p.id)}
                    className="text-xs text-earbore-danger hover:underline cursor-pointer"
                  >
                    Dezleagă
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-earbore-gray mb-5">Niciun părinte adăugat încă.</p>
          )}

          {parentOptions.length > 0 && (
            <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-earbore-border">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-earbore-gray mb-1.5">Adaugă părinte</label>
                <select value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)} className="input-base">
                  <option value="">Alege un membru...</option>
                  {parentOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleLinkParent}
                disabled={!selectedParentId || isLinkingParent}
                className="btn-primary text-sm py-3 px-4 disabled:opacity-50"
              >
                {isLinkingParent ? 'Se leagă...' : 'Adaugă'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-8 mt-6">
          <h2 className="text-lg font-bold text-earbore-ink mb-4">Copii</h2>

          {currentChildren.length > 0 ? (
            <ul className="space-y-2 mb-5">
              {currentChildren.map((c) => (
                <li key={c.id} className="flex items-center justify-between bg-earbore-grayLight rounded-xl px-4 py-2.5">
                  <span className="text-sm text-earbore-ink">{c.firstName} {c.lastName}</span>
                  <button
                    onClick={() => handleUnlinkChild(c.id)}
                    className="text-xs text-earbore-danger hover:underline cursor-pointer"
                  >
                    Dezleagă
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-earbore-gray mb-5">Niciun copil adăugat încă.</p>
          )}

          {childOptions.length > 0 && (
            <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-earbore-border">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-earbore-gray mb-1.5">Adaugă copil</label>
                <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} className="input-base">
                  <option value="">Alege un membru...</option>
                  {childOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleLinkChild}
                disabled={!selectedChildId || isLinkingChild}
                className="btn-primary text-sm py-3 px-4 disabled:opacity-50"
              >
                {isLinkingChild ? 'Se leagă...' : 'Adaugă'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-earbore-border p-8 mt-6">
          <h2 className="text-lg font-bold text-earbore-ink mb-4">Parteneri</h2>

          {partners.length > 0 ? (
            <ul className="space-y-2 mb-5">
              {partners.map((p) => (
                <li key={p.linkId} className="flex items-center justify-between bg-earbore-grayLight rounded-xl px-4 py-2.5">
                  <span className="text-sm text-earbore-ink">
                    {p.person.firstName} {p.person.lastName}{' '}
                    <span className="text-earbore-gray">({STATUS_LABELS[p.status] ?? p.status})</span>
                  </span>
                  <button
                    onClick={() => handleUnlinkPartner(p.person.id)}
                    className="text-xs text-earbore-danger hover:underline cursor-pointer"
                  >
                    Dezleagă
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-earbore-gray mb-5">Niciun partener adăugat încă.</p>
          )}

          {allMembers.length > 0 && (
            <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-earbore-border">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-earbore-gray mb-1.5">Adaugă partener</label>
                <select value={selectedPartnerId} onChange={(e) => setSelectedPartnerId(e.target.value)} className="input-base">
                  <option value="">Alege un membru...</option>
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label className="block text-xs text-earbore-gray mb-1.5">Status</label>
                <select value={partnerStatus} onChange={(e) => setPartnerStatus(e.target.value)} className="input-base">
                  <option value="MARRIED">Căsătoriți</option>
                  <option value="PARTNER">Parteneri</option>
                  <option value="DIVORCED">Divorțați</option>
                  <option value="WIDOWED">Văduv/ă</option>
                </select>
              </div>
              <button
                onClick={handleLinkPartner}
                disabled={!selectedPartnerId || isLinkingPartner}
                className="btn-primary text-sm py-3 px-4 disabled:opacity-50"
              >
                {isLinkingPartner ? 'Se leagă...' : 'Adaugă'}
              </button>
            </div>
          )}
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

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm text-earbore-ink">{value}</p>
  </div>
);

export default MemberDetailPage;