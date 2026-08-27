import React, { useState } from 'react';
import { familyMembersService } from '../../api/familyMembersService';
import type { FamilyMember } from '../../types/family';

interface Props {
  members: FamilyMember[];
  onClose: () => void;
  onCreated: () => void;
}

const AddMemberModal: React.FC<Props> = ({ members, onClose, onCreated }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    fatherId: '',
    motherId: '',
    partnerId: '',
    partnerStatus: 'MARRIED',
  });
  const [childrenIds, setChildrenIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleChild = (id: string) => {
    setChildrenIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const newMember = await familyMembersService.create({
        firstName: form.firstName,
        lastName: form.lastName,
        gender: (form.gender || undefined) as any,
        birthDate: form.birthDate || undefined,
      });

      if (form.fatherId) {
        await familyMembersService.linkParentChild(form.fatherId, newMember.id);
      }
      if (form.motherId) {
        await familyMembersService.linkParentChild(form.motherId, newMember.id);
      }
      if (form.partnerId) {
        await familyMembersService.linkPartners(newMember.id, form.partnerId, form.partnerStatus);
      }
      for (const childId of childrenIds) {
        await familyMembersService.linkParentChild(newMember.id, childId);
      }

      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'A apărut o eroare.');
    } finally {
      setIsSaving(false);
    }
  };

  const fatherOptions = members.filter((m) => m.gender !== 'FEMALE');
  const motherOptions = members.filter((m) => m.gender !== 'MALE');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-earbore-ink mb-4">Adaugă membru</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">Prenume</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} className="input-base" required disabled={isSaving} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">Nume</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} className="input-base" required disabled={isSaving} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">Gen</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="input-base" disabled={isSaving}>
              <option value="">Nespecificat</option>
              <option value="MALE">Masculin</option>
              <option value="FEMALE">Feminin</option>
              <option value="OTHER">Altul</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">Data nașterii</label>
            <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} className="input-base" disabled={isSaving} />
          </div>

          {members.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-earbore-border">
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5 mt-2">
                    Părinți (opțional)
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-earbore-gray mb-1.5">Tată</label>
                  <select name="fatherId" value={form.fatherId} onChange={handleChange} className="input-base" disabled={isSaving}>
                    <option value="">—</option>
                    {fatherOptions.map((m) => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-earbore-gray mb-1.5">Mamă</label>
                  <select name="motherId" value={form.motherId} onChange={handleChange} className="input-base" disabled={isSaving}>
                    <option value="">—</option>
                    {motherOptions.map((m) => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-earbore-border">
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5 mt-2">
                    Partener (opțional)
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-earbore-gray mb-1.5">Partener</label>
                  <select name="partnerId" value={form.partnerId} onChange={handleChange} className="input-base" disabled={isSaving}>
                    <option value="">—</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-earbore-gray mb-1.5">Status</label>
                  <select name="partnerStatus" value={form.partnerStatus} onChange={handleChange} className="input-base" disabled={isSaving}>
                    <option value="MARRIED">Căsătoriți</option>
                    <option value="PARTNER">Parteneri</option>
                    <option value="DIVORCED">Divorțați</option>
                    <option value="WIDOWED">Văduv/ă</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-earbore-border">
                <p className="text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5 mt-2">
                  Copii (opțional) — noul membru va deveni părintele lor
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1.5 bg-earbore-grayLight rounded-xl p-2.5">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm text-earbore-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={childrenIds.includes(m.id)}
                        onChange={() => toggleChild(m.id)}
                        disabled={isSaving}
                        className="accent-earbore-600"
                      />
                      {m.firstName} {m.lastName}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <p className="text-earbore-danger text-sm text-center bg-red-50 p-2.5 rounded-xl">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSaving} className="btn-outline flex-1">
              Anulează
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary flex-1 disabled:opacity-50">
              {isSaving ? 'Se salvează...' : 'Salvează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;