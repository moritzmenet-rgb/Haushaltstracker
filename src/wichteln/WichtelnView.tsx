import React, { useEffect, useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { FamilyMember } from '../types';
import { getInitials } from '../utils';
import { countdownText, currentSeason } from './season';
import { saveAssignment, subscribeAssignment } from './wichtelService';
import { useWichtelSession } from './useWichtelSession';
import type { WichtelAssignment } from './types';
import { MIN_MEMBERS } from './types';
import { WichtelPinScreen } from './components/WichtelPinScreen';
import { WichtelSetup } from './components/WichtelSetup';
import { TreeBoard } from './components/TreeBoard';
import { WichtelAdmin } from './components/WichtelAdmin';
import { WichtelHeader } from './components/WichtelHeader';
import './wichteln.css';

interface Props {
  /** increments when the top bar "Wunsch" button is pressed */
  addWishTrigger: number;
}

/** After login: first the one-time setup, then the board. */
const WichtelMain: React.FC<{ season: string; me: FamilyMember; members: FamilyMember[]; addWishTrigger: number }> = ({
  season, me, members, addWishTrigger,
}) => {
  const [assignment, setAssignment] = useState<WichtelAssignment | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAssignment(undefined);
    return subscribeAssignment(season, me.id, setAssignment, () => setError('Deine Wichtel-Daten konnten nicht geladen werden.'));
  }, [season, me.id]);

  if (error) return <div className="w-body"><p className="w-error">{error}</p></div>;
  if (assignment === undefined) return <div className="w-spinner" aria-label="Wird geladen" />;

  if (!assignment) {
    return (
      <div className="w-body">
        <WichtelSetup me={me} members={members} onSave={(r) => saveAssignment(season, me.id, r)} />
      </div>
    );
  }

  const receivers = assignment.receivers
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is FamilyMember => !!m);

  return <TreeBoard season={season} me={me} members={members} receivers={receivers} addWishTrigger={addWishTrigger} />;
};

export const WichtelnView: React.FC<Props> = ({ addWishTrigger }) => {
  const { activeUser, data, isMoritzAccount } = useApp();
  const season = currentSeason();
  const members = useMemo(
    () => Object.values(data.members).sort((a, b) => a.name.localeCompare(b.name, 'de')),
    [data.members],
  );
  const session = useWichtelSession(activeUser?.id ?? null);

  const tooFew = members.length < MIN_MEMBERS;

  return (
    <div className="wichteln">
      {isMoritzAccount && !tooFew && <WichtelAdmin season={season} members={members} />}

      <WichtelHeader
        countdown={countdownText()}
        right={
          activeUser && session.phase === 'ready' ? (
            <div className="w-whoami">
              <span className="w-avatar w-avatar-sm" style={{ backgroundColor: activeUser.avatar_color }}>
                {getInitials(activeUser.name)}
              </span>
              <span className="w-hide-xs">{activeUser.name}</span>
              <button type="button" className="w-btn w-btn-ghost w-btn-small" onClick={session.lock} title="Wichteln auf diesem Gerät sperren">
                <Lock className="w-4 h-4" />
                Sperren
              </button>
            </div>
          ) : null
        }
      />

      {tooFew ? (
        <div className="w-body">
          <div className="w-empty">
            <p className="w-empty-title">Wichteln braucht mindestens drei Personen</p>
            <p className="w-muted">Sobald drei Familienmitglieder in der App sind, könnt ihr loslegen.</p>
          </div>
        </div>
      ) : !activeUser ? null : session.phase === 'loading' ? (
        <div className="w-spinner" aria-label="Wird geladen" />
      ) : session.phase === 'error' ? (
        <div className="w-body"><p className="w-error">{session.loadError}</p></div>
      ) : session.phase === 'create-pin' ? (
        <div className="w-body">
          <WichtelPinScreen key="create" mode="create" name={activeUser.name} onSubmit={session.createPin} />
        </div>
      ) : session.phase === 'enter-pin' ? (
        <div className="w-body">
          <WichtelPinScreen key="enter" mode="enter" name={activeUser.name} onSubmit={session.enterPin} />
        </div>
      ) : (
        <WichtelMain season={season} me={activeUser} members={members} addWishTrigger={addWishTrigger} />
      )}
    </div>
  );
};
