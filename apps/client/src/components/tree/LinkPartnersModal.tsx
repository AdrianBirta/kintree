import React, { useState } from 'react';
import { familyMembersService } from '../../api/familyMembersService';
import type { FamilyMember } from '../../types/family';

interface Props {
  members: FamilyMember[];
  onClose: () => void;
  onLinked: () => void;
}

const LinkPartnersModal: React.FC<Props> = ({ members, onClose, onLinked }) => {
  const [partnerAId, setPartnerAId] = useState('');
  const [partnerBId, setPartnerBId] = useState('');
  const [status, setStatus] = useState('MARRIED');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (partnerAId === partnerBId) {
      setError('Alege doi membri diferiți.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await familyMembersService.linkPartners(partnerAId, partnerBId, status);
      onLinked();
    } catch (err: any) {
      setError(err.response?.data?.message || 'A apărut o eroare.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-earbore-ink mb-1">Leagă parteneri</h3>
        <p className="text-sm text-earbore-gray mb-4">Marchează doi membri ca soț și soție / parteneri.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">Primul membru</label>
            <select value={partnerAId} onChange={(e) => setPartnerAId(e.target.value)} className="input-base" required disabled={isSaving}>
              <option value="">Alege...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">Al doilea membru</label>
            <select value={partnerBId} onChange={(e) => setPartnerBId(e.target.value)} className="input-base" required disabled={isSaving}>
              <option value="">Alege...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-earbore-gray uppercase tracking-wider mb-1.5">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-base" disabled={isSaving}>
              <option value="MARRIED">Căsătoriți</option>
              <option value="PARTNER">Parteneri</option>
              <option value="DIVORCED">Divorțați</option>
              <option value="WIDOWED">Văduv/ă</option>
            </select>
          </div>

          {error && <p className="text-earbore-danger text-sm text-center bg-red-50 p-2.5 rounded-xl">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSaving} className="btn-outline flex-1">
              Anulează
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary flex-1 disabled:opacity-50">
              {isSaving ? 'Se leagă...' : 'Leagă'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkPartnersModal;