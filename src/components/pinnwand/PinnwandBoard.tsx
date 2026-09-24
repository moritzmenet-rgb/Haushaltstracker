import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Pin, 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  GitFork, 
  Wand2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Vote, 
  Maximize2, 
  Check, 
  MessageSquare,
  Sparkles,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { PinnwandNote, PostItColor } from '../../types';
import { PinnwandPostIt } from './PinnwandPostIt';
import { RedThreadCanvas } from './RedThreadCanvas';
import { PinnwandNoteModal } from './PinnwandNoteModal';
import { ConfirmModal } from '../ConfirmModal';
import { MemberProfileModal } from '../MemberProfileModal';

export const PinnwandBoard: React.FC = () => {
  const {
    data,
    activeUser,
    isAdmin,
    pinnwandNotes,
    createPinnwandNote,
    updatePinnwandNote,
    deletePinnwandNote,
    votePinnwandPoll,
    togglePinnwandReaction,
    updateNotePosition,
    autoArrangePinnwand
  } = useApp();

  // View mode: 'canvas' (freely draggable corkboard with red threads) vs 'stream' (padlet thread columns)
  const [viewMode, setViewMode] = useState<'canvas' | 'stream'>('canvas');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'polls' | 'pinned' | 'mine'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [replyParentNote, setReplyParentNote] = useState<PinnwandNote | null>(null);
  const [noteToEdit, setNoteToEdit] = useState<PinnwandNote | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Corkboard Canvas Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Dragging a note state
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });
  const [livePositions, setLivePositions] = useState<Record<string, { x: number; y: number }>>({});

  const boardContainerRef = useRef<HTMLDivElement>(null);

  // Sync initial note positions into livePositions
  useEffect(() => {
    const posMap: Record<string, { x: number; y: number }> = {};
    pinnwandNotes.forEach((n) => {
      posMap[n.id] = n.position || { x: 60, y: 60 };
    });
    setLivePositions(posMap);
  }, [pinnwandNotes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return pinnwandNotes.filter((note) => {
      // Search text match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title?.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        const matchesAuthor = note.authorName.toLowerCase().includes(query);
        const matchesCategory = note.category?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent && !matchesAuthor && !matchesCategory) {
          return false;
        }
      }

      // Quick tab filters
      if (activeFilter === 'polls' && !note.poll) return false;
      if (activeFilter === 'pinned' && !note.isPinned) return false;
      if (activeFilter === 'mine' && activeUser && note.authorId !== activeUser.id) return false;

      // Category filter
      if (selectedCategory && note.category !== selectedCategory) return false;

      return true;
    });
  }, [pinnwandNotes, searchQuery, activeFilter, selectedCategory, activeUser]);

  // Group notes into tree threads for 'stream' mode
  const threadTrees = useMemo(() => {
    const rootNotes = filteredNotes.filter((n) => !n.parentId);
    const notesById = new Map<string, PinnwandNote>();
    pinnwandNotes.forEach((n) => notesById.set(n.id, n));

    return rootNotes.map((root) => {
      // Collect all descendants recursively
      const descendants: PinnwandNote[] = [];
      const collect = (parentId: string) => {
        const children = pinnwandNotes.filter((n) => n.parentId === parentId);
        children.forEach((child) => {
          descendants.push(child);
          collect(child.id);
        });
      };
      collect(root.id);

      return {
        root,
        descendants
      };
    });
  }, [filteredNotes, pinnwandNotes]);

  // Dynamic canvas bounds to allow scrolling if notes are spread out
  const canvasBounds = useMemo(() => {
    let maxX = 1600;
    let maxY = 1200;
    Object.values(livePositions).forEach((pos) => {
      if (pos.x + 400 > maxX) maxX = pos.x + 500;
      if (pos.y + 400 > maxY) maxY = pos.y + 500;
    });
    return { width: maxX, height: maxY };
  }, [livePositions]);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.45));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Dragging a note handlers
  const handleNoteDragStart = (e: React.MouseEvent | React.TouchEvent, noteId: string) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentPos = livePositions[noteId] || { x: 50, y: 50 };
    dragStartOffsetRef.current = {
      x: (clientX / zoom) - currentPos.x,
      y: (clientY / zoom) - currentPos.y
    };
    setDraggingNoteId(noteId);
  };

  // Canvas Pan handlers (dragging background)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (draggingNoteId) return;
    if (e.button !== 0) return; // only left click
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggingNoteId) {
      // Repositioning note
      const newX = Math.max(20, Math.round((e.clientX / zoom) - dragStartOffsetRef.current.x));
      const newY = Math.max(20, Math.round((e.clientY / zoom) - dragStartOffsetRef.current.y));
      setLivePositions((prev) => ({
        ...prev,
        [draggingNoteId]: { x: newX, y: newY }
      }));
    } else if (isPanning) {
      // Panning the board
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggingNoteId) {
      const finalPos = livePositions[draggingNoteId];
      if (finalPos) {
        updateNotePosition(draggingNoteId, finalPos);
      }
      setDraggingNoteId(null);
    }
    setIsPanning(false);
  };

  // Touch support for mobile canvas panning & dragging
  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggingNoteId && e.touches.length === 1) {
      const t = e.touches[0];
      const newX = Math.max(20, Math.round((t.clientX / zoom) - dragStartOffsetRef.current.x));
      const newY = Math.max(20, Math.round((t.clientY / zoom) - dragStartOffsetRef.current.y));
      setLivePositions((prev) => ({
        ...prev,
        [draggingNoteId]: { x: newX, y: newY }
      }));
    } else if (isPanning && e.touches.length === 1) {
      const t = e.touches[0];
      setPan({
        x: t.clientX - panStartRef.current.x,
        y: t.clientY - panStartRef.current.y
      });
    }
  };

  const handleTouchEnd = () => {
    if (draggingNoteId) {
      const finalPos = livePositions[draggingNoteId];
      if (finalPos) {
        updateNotePosition(draggingNoteId, finalPos);
      }
      setDraggingNoteId(null);
    }
    setIsPanning(false);
  };

  // Actions
  const handleOpenNewTopic = () => {
    setReplyParentNote(null);
    setNoteToEdit(null);
    setIsModalOpen(true);
  };

  const handleReplyToNote = (parent: PinnwandNote) => {
    setReplyParentNote(parent);
    setNoteToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditNote = (note: PinnwandNote) => {
    setReplyParentNote(null);
    setNoteToEdit(note);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: any) => {
    try {
      if (noteToEdit) {
        await updatePinnwandNote(noteToEdit.id, formData);
      } else {
        await createPinnwandNote(formData);
      }
    } catch (err) {
      console.warn('Post-it save notice:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deletePinnwandNote(deleteConfirmId);
    } catch (err) {
      console.warn('Post-it delete notice:', err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const categories = data.settings?.categories || ['Allgemein', 'Küche', 'Bad', 'Wohnbereich'];

  return (
    <div className="space-y-4">
      {/* Top Header Card & View Controls */}
      <div className="bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] rounded-[32px] p-5 shadow-sm space-y-4">
        {/* Title + Stats + Primary Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 shadow-sm shrink-0">
              <Pin className="w-6 h-6 fill-current rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--m3-on-surface)] tracking-tight">
                  Pinnwand
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-black">
                  {pinnwandNotes.length} Notizen
                </span>
              </div>
              <p className="text-xs font-semibold text-[var(--m3-on-surface-variant)] mt-0.5">
                Themen starten, antworten und mit dem roten Faden verknüpfen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            {/* View Mode Switcher */}
            <div className="p-1 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === 'canvas'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)]'
                }`}
                title="Interaktive Pinnwand mit roten Fäden"
              >
                <GitFork className="w-4 h-4" />
                <span>Freie Pinnwand</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('stream')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === 'stream'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)]'
                }`}
                title="Übersichtliche Themen-Spalten"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Themen-Fokus</span>
              </button>
            </div>

            {/* Neues Thema Button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={handleOpenNewTopic}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">Neues Thema anpinnen</span>
              <span className="xs:hidden">Anpinnen</span>
            </motion.button>
          </div>
        </div>

        {/* Search, Filter Pills & Canvas Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-[var(--m3-outline-variant)]/40">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Themen, Notizen oder Autoren suchen..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 text-xs font-bold text-[var(--m3-on-surface)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)]/60 hover:text-[var(--m3-on-surface)]'
              }`}
            >
              Alle
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('polls')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeFilter === 'polls'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)]/60 hover:text-[var(--m3-on-surface)]'
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Abstimmungen</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pinned')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeFilter === 'pinned'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)]/60 hover:text-[var(--m3-on-surface)]'
              }`}
            >
              <Pin className="w-3.5 h-3.5 fill-current" />
              <span>Festgepinnt</span>
            </button>
            {activeUser && (
              <button
                type="button"
                onClick={() => setActiveFilter('mine')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeFilter === 'mine'
                    ? 'bg-rose-600 text-white'
                    : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)]/60 hover:text-[var(--m3-on-surface)]'
                }`}
              >
                Meine
              </button>
            )}
          </div>

          {/* Canvas Tools (Zoom & Auto-Arrange) */}
          {viewMode === 'canvas' && (
            <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
              {/* Auto Arrange */}
              <button
                type="button"
                onClick={autoArrangePinnwand}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] text-[var(--m3-on-surface)] text-xs font-bold transition shadow-xs cursor-pointer"
                title="Fäden und Post-its automatisch ordentlich sortieren"
              >
                <Wand2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Fäden ordnen</span>
              </button>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--m3-on-surface)] transition cursor-pointer"
                  title="Verkleinern"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 text-[11px] font-black text-[var(--m3-on-surface-variant)] min-w-[34px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--m3-on-surface)] transition cursor-pointer"
                  title="Vergrößern"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)] transition cursor-pointer border-l border-black/10 dark:border-white/10"
                  title="Ansicht zurücksetzen"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Board Presentation Area */}
      {viewMode === 'canvas' ? (
        /* ======================== CANVAS MODE (CORKBOARD + RED THREADS) ======================== */
        <div 
          ref={boardContainerRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-[76vh] min-h-[580px] rounded-[36px] overflow-hidden select-none border-4 border-amber-900/30 dark:border-stone-800 shadow-2xl bg-[#E8D4B4] dark:bg-[#2A231C] cursor-grab active:cursor-grabbing"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(139, 69, 19, 0.12) 1px, transparent 1px),
              radial-gradient(circle at 0% 0%, rgba(160, 82, 45, 0.08) 2px, transparent 2px),
              radial-gradient(circle at 100% 100%, rgba(205, 133, 63, 0.1) 1.5px, transparent 1.5px)
            `,
            backgroundSize: '24px 24px, 48px 48px, 36px 36px'
          }}
        >
          {/* Subtle Corkboard Wood Grain Frame Corner Accents */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.18)]" />

          {/* Quick Info Badge in Corner */}
          <div className="absolute bottom-4 left-4 z-30 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-2 pointer-events-none opacity-80 shadow-md">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
            <span>Klicke auf den Pin eines Post-its, um es zu verschieben • Fäden spinnen mit "Faden anheften"</span>
          </div>

          {/* Zoom Level floating indicator */}
          {zoom !== 1 && (
            <div className="absolute top-4 right-4 z-30 bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-black pointer-events-none">
              Zoom: {Math.round(zoom * 100)}%
            </div>
          )}

          {/* Pannable & Zoomable World Layer */}
          <div
            style={{
              width: `${canvasBounds.width}px`,
              height: `${canvasBounds.height}px`,
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: '0 0',
              transition: isPanning || draggingNoteId ? 'none' : 'transform 0.1s ease-out'
            }}
            className="relative"
          >
            {/* SVG Red Thread Layer connecting parent pushpins to child pushpins */}
            <RedThreadCanvas
              notes={filteredNotes}
              positions={livePositions}
              canvasWidth={canvasBounds.width}
              canvasHeight={canvasBounds.height}
            />

            {/* Post-it Cards on Corkboard */}
            {filteredNotes.map((note) => {
              const parentNote = note.parentId ? pinnwandNotes.find((n) => n.id === note.parentId) : undefined;
              return (
                <PinnwandPostIt
                  key={note.id}
                  note={note}
                  activeUserId={activeUser?.id || null}
                  activeUserName={activeUser?.name}
                  isAdmin={isAdmin}
                  viewMode="canvas"
                  isDragging={draggingNoteId === note.id}
                  parentNoteSnippet={parentNote?.content?.slice(0, 50)}
                  parentAuthorName={parentNote?.authorName}
                  onStartDrag={handleNoteDragStart}
                  onReply={handleReplyToNote}
                  onEdit={handleEditNote}
                  onDelete={(id) => setDeleteConfirmId(id)}
                  onVote={votePinnwandPoll}
                  onReact={togglePinnwandReaction}
                  onTogglePin={(id) => updatePinnwandNote(id, { isPinned: !note.isPinned })}
                  onOpenProfile={(id) => setSelectedProfileId(id)}
                />
              );
            })}

            {/* Empty state when no notes match search or board is empty */}
            {filteredNotes.length === 0 && (
              <div className="absolute top-48 left-1/2 -translate-x-1/2 p-8 rounded-3xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-black/10 text-center max-w-sm shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-600 mx-auto mb-3">
                  <Pin className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-[var(--m3-on-surface)]">
                  Keine Notizen gefunden
                </h3>
                <p className="text-xs font-semibold text-[var(--m3-on-surface-variant)] mt-1 mb-4">
                  {searchQuery 
                    ? 'Passe deine Suche oder Filter an.' 
                    : 'Die Pinnwand ist noch leer. Starte das erste Thema!'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenNewTopic}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black shadow-md cursor-pointer hover:bg-rose-700 transition"
                >
                  Erstes Post-it anheften
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================== STREAM / THEMEN-FOKUS MODE ======================== */
        <div className="space-y-6">
          {threadTrees.map(({ root, descendants }) => {
            return (
              <div 
                key={root.id}
                className="bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] rounded-[32px] p-6 shadow-sm space-y-4"
              >
                {/* Topic Header banner */}
                <div className="flex items-center justify-between gap-3 border-b border-[var(--m3-outline-variant)]/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-600 inline-block shadow-xs" />
                    <span className="text-xs font-black uppercase tracking-wider text-rose-600">
                      Thema #{root.id.slice(-4)}
                    </span>
                    <span className="text-xs text-[var(--m3-on-surface-variant)] font-bold">
                      • {descendants.length} {descendants.length === 1 ? 'Antwort' : 'Antworten im Faden'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReplyToNote(root)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 dark:text-rose-300 text-xs font-black transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Auf dieses Thema antworten</span>
                  </button>
                </div>

                {/* Root Post-It Card */}
                <div className="max-w-xl">
                    <PinnwandPostIt
                      note={root}
                      activeUserId={activeUser?.id || null}
                      activeUserName={activeUser?.name}
                      isAdmin={isAdmin}
                      viewMode="list"
                      onReply={handleReplyToNote}
                      onEdit={handleEditNote}
                      onDelete={(id) => setDeleteConfirmId(id)}
                      onVote={votePinnwandPoll}
                      onReact={togglePinnwandReaction}
                      onTogglePin={(id) => updatePinnwandNote(id, { isPinned: !root.isPinned })}
                      onOpenProfile={(id) => setSelectedProfileId(id)}
                    />
                </div>

                {/* Connected Descendants with Red Thread line */}
                {descendants.length > 0 && (
                  <div className="pl-6 sm:pl-10 relative space-y-4 pt-2">
                    {/* Visual Vertical Red Thread connecting comments */}
                    <div 
                      className="absolute left-3 sm:left-5 top-0 bottom-6 w-1 bg-gradient-to-b from-rose-600 via-rose-500 to-rose-400 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.4)]"
                      aria-hidden="true"
                    />

                    {descendants.map((childNote) => {
                      const parent = pinnwandNotes.find((n) => n.id === childNote.parentId);
                      return (
                        <div key={childNote.id} className="relative flex items-start gap-3">
                          {/* Pushpin Knot Dot on the thread line */}
                          <div 
                            className="absolute -left-6 sm:-left-8 top-5 w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-md flex items-center justify-center shrink-0 z-10"
                            aria-hidden="true"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>

                          <div className="flex-1 max-w-lg">
                             <PinnwandPostIt
                               note={childNote}
                               activeUserId={activeUser?.id || null}
                               activeUserName={activeUser?.name}
                               isAdmin={isAdmin}
                               viewMode="list"
                               parentNoteSnippet={parent?.content?.slice(0, 45)}
                               parentAuthorName={parent?.authorName}
                               onReply={handleReplyToNote}
                               onEdit={handleEditNote}
                               onDelete={(id) => setDeleteConfirmId(id)}
                               onVote={votePinnwandPoll}
                               onReact={togglePinnwandReaction}
                               onTogglePin={(id) => updatePinnwandNote(id, { isPinned: !childNote.isPinned })}
                               onOpenProfile={(id) => setSelectedProfileId(id)}
                             />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {threadTrees.length === 0 && (
            <div className="p-12 text-center bg-[var(--m3-surface-container)] rounded-[32px] border border-[var(--m3-outline-variant)]">
              <Pin className="w-12 h-12 text-rose-500/40 mx-auto mb-3" />
              <h3 className="text-base font-black text-[var(--m3-on-surface)]">
                Keine Themen gefunden
              </h3>
              <p className="text-xs font-semibold text-[var(--m3-on-surface-variant)] mt-1 mb-4">
                Starte das erste Thema auf der Pinnwand!
              </p>
              <button
                type="button"
                onClick={handleOpenNewTopic}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-black shadow-md cursor-pointer hover:bg-rose-700 transition"
              >
                Neues Thema starten
              </button>
            </div>
          )}
        </div>
      )}

      {/* Note Creation / Reply / Edit Modal */}
      <PinnwandNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        parentNote={replyParentNote}
        noteToEdit={noteToEdit}
        categories={categories}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        title="Post-it von der Pinnwand entfernen?"
        message="Möchtest du diese Notiz wirklich löschen? Alle Antworten, die direkt an diesen Faden angeheftet sind, werden ebenfalls entfernt."
        confirmLabel="Notiz entfernen"
        cancelLabel="Abbrechen"
        isDanger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
      {selectedProfileId && (
        <MemberProfileModal
          memberId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
        />
      )}
    </div>
  );
};
