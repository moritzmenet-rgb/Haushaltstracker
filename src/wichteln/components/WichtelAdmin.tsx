import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { adminResetAssignment, adminResetPin, loadAdminOverview } from '../wichtelService';
import type { WichtelAssignment } from '../types';
import { RECEIVERS_PER_PERSON } from '../types';
import { WichtelConfirm } from './WichtelConfirm';

interface Props {
  season: string;
  members: FamilyMember[];
}

type PendingReset = { kind: 'assign' | 'account'; member: FamilyMember } | null;

/**
 * Only for Moritz (Google admin login). Shows HOW MANY Wichtel each person has,
 * never WHO gifts whom, and lets him reset an assignment or a forgotten PIN.
 */
export const WichtelAdmin: React.FC<Props> = ({ season, members }) => {
  const [assignments, setAssignments] = useState<WichtelAssignment[] | null>(null);
  const [pinMemberIds, setPinMemberIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState<PendingReset>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await loadAdminOverview(season);
      setAssignments(data.assignments);
      setPinMemberIds(data.pinMemberIds);
      setError(null);
    } catch {
      setError('Die Wichtel-Übersicht konnte nicht geladen werden.');
    }
  }, [season]);

  useEffect(() => {
    reload();
    const t = setInterval(reload, 60_000);
    return () => clearInterval(t);
  }, [reload]);

  const stats = useMemo(() => {
    const received: Record<string, number> = {};
    members.forEach((m) => (received[m.id] = 0));
    (assignments ?? []).forEach((a) => a.receivers.forEach((r) => (received[r] = (received[r] ?? 0) + 1)));
    const entered = new Set((assignments ?? []).map((a) => a.giver_id));
    const missing = members.filter((m) => !entered.has(m.id));
    const allEntered = missing.length === 0;
    const wrong = members.filter((m) =>
      allEntered ? received[m.id] !== RECEIVERS_PER_PERSON : received[m.id] > RECEIVERS_PER_PERSON,
    );
    return { received, entered, missing, wrong };
  }, [assignments, members]);

  const nameOf = (m: FamilyMember) => m.name;
  const hasAccount = (id: string) => pinMemberIds.includes(id);

  const doReset = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.kind === 'assign') await adminResetAssignment(season, pending.member.id);
      else await adminResetPin(pending.member.id);
      setPending(null);
      await reload();
    } catch {
      setError('Das Zurücksetzen hat nicht geklappt.');
    } finally {
      setBusy(false);
    }
  };

  if (assignments === null && !error) return null;

  const mismatchText = stats.wrong
    .map((m) => `${nameOf(m)} hat ${stats.received[m.id]} Wichtel`)
    .join(', ');

  return (
    <div className="w-admin">
      {stats.wrong.length > 0 && (
        <div className="w-admin-banner" role="status">
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ marginTop: 2 }} />
          <div>
            <strong style={{ fontWeight: 500 }}>Zuordnung geht nicht auf:</strong> {mismatchText}. Kläre in der Familie, wer
            sich vertippt hat, und setz dessen Zuordnung unten zurück.
          </div>
        </div>
      )}
      {error && <p className="w-error" style={{ marginBottom: 8 }}>{error}</p>}

      <button
        type="button"
        className="w-link"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Wichtel-Verwaltung (nur Admin)
        {stats.missing.length > 0 && ` · ${stats.missing.length} noch nicht eingetragen`}
      </button>

      {expanded && (
        <table className="w-admin-table" style={{ marginTop: 12 }}>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td className="w-muted">
                  {hasAccount(m.id) ? 'PIN gesetzt' : 'Keine PIN'}
                  {' · '}
                  {stats.entered.has(m.id) ? 'eingetragen' : 'nicht eingetragen'}
                  {' · '}
                  hat {stats.received[m.id] ?? 0} Wichtel
                </td>
                <td>
                  {stats.entered.has(m.id) && (
                    <button type="button" className="w-btn w-btn-outline w-btn-small" onClick={() => setPending({ kind: 'assign', member: m })}>
                      Zuordnung zurücksetzen
                    </button>
                  )}{' '}
                  {hasAccount(m.id) && (
                    <button type="button" className="w-btn w-btn-outline w-btn-small" onClick={() => setPending({ kind: 'account', member: m })}>
                      PIN zurücksetzen
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <WichtelConfirm
        open={!!pending}
        title={
          pending?.kind === 'assign'
            ? `Zuordnung von ${pending.member.name} zurücksetzen?`
            : `Wichtel-PIN von ${pending?.member.name ?? ''} zurücksetzen?`
        }
        text={
          pending?.kind === 'assign'
            ? `${pending.member.name} wählt beim nächsten Öffnen die zwei Personen neu aus. Bereits gemerkte Wünsche bleiben gemerkt.`
            : `${pending?.member.name ?? ''} legt beim nächsten Öffnen eine neue PIN fest. Die Wünsche bleiben erhalten.`
        }
        confirmLabel="Zurücksetzen"
        cancelLabel="Behalten"
        danger
        busy={busy}
        onConfirm={doReset}
        onCancel={() => setPending(null)}
      />
    </div>
  );
};
