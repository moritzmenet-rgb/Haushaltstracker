import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CAT_FUR_COLORS } from '../../data/catItemsData';
import { PetAppearance } from '../../types';

interface CatAvatarProps {
  appearance: PetAppearance;
  hunger: number;
  hygiene: number;
  happiness: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onPet?: () => void;
  showHeartsOnClick?: boolean;
}

export const CatAvatar: React.FC<CatAvatarProps> = ({
  appearance,
  hunger,
  hygiene,
  happiness,
  size = 'lg',
  onPet,
  showHeartsOnClick = true
}) => {
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isBlinking, setIsBlinking] = useState(false);

  const isHungry = hunger < 35;
  const isDirty = hygiene < 35;
  const isSadAndMessy = isHungry || isDirty || happiness < 35;
  const isSuperHappy = hunger >= 75 && hygiene >= 75 && happiness >= 75;

  const fur = CAT_FUR_COLORS[appearance.furColor] || CAT_FUR_COLORS.orange;

  // Natural cute blinking interval
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 4200 + Math.random() * 2500);

    return () => clearInterval(blinkInterval);
  }, []);

  const sizeClasses = {
    sm: 'w-28 h-28',
    md: 'w-44 h-44',
    lg: 'w-64 h-64 sm:w-72 sm:h-72',
    xl: 'w-80 h-80 sm:w-96 sm:h-96'
  }[size];

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onPet) onPet();
    if (showHeartsOnClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now() + Math.random();
      setHearts(prev => [...prev.slice(-4), { id, x, y }]);
      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== id));
      }, 1000);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative select-none cursor-pointer flex items-center justify-center ${sizeClasses}`}
      title={isSadAndMessy ? 'Die Katze ist traurig und zerzaust... Bitte füttern und waschen!' : 'Klicke zum Kraulen & Schnurren! ✨'}
    >
      {/* Floating Hearts Particle Container */}
      <AnimatePresence>
        {hearts.map(h => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, scale: 0.5, x: h.x - 12, y: h.y - 12 }}
            animate={{ opacity: 0, scale: 1.6, y: h.y - 90, x: h.x + (Math.random() * 50 - 25) }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.95, ease: 'easeOut' }}
            className="absolute pointer-events-none z-40 text-2xl font-black drop-shadow-md text-pink-500"
          >
            {isSuperHappy ? '💖' : '❤️'}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main Anime Chibi Kitten SVG */}
      <motion.svg
        viewBox="0 0 320 320"
        className="w-full h-full overflow-visible drop-shadow-2xl"
        animate={{
          y: isSadAndMessy ? [0, 3, 0] : [0, -5, 0],
          rotate: isSadAndMessy ? [-0.5, 0.5, -0.5] : [0, 1, -1, 0]
        }}
        transition={{
          duration: isSadAndMessy ? 3.8 : 2.4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        whileTap={{ scale: 0.93, y: 4 }}
      >
        <defs>
          {/* Fur Gradient */}
          <linearGradient id={`fur-base-${fur.primary}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="60%" stopColor="#FFF8EB" />
            <stop offset="100%" stopColor="#F5E8D0" />
          </linearGradient>

          {/* Anime Emerald/Hazel Eye Gradient */}
          <linearGradient id="eye-grad-emerald" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#14532D" />
            <stop offset="35%" stopColor="#15803D" />
            <stop offset="70%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#BBF7D0" />
          </linearGradient>

          {/* Soft Shadow Gradient for Cheeks & Chin */}
          <radialGradient id="cheek-blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDA4AF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0" />
          </radialGradient>

          {/* Chef Hat Shading */}
          <linearGradient id="hat-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Soft Clay Filter */}
          <filter id="soft-shading" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#78350F" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* --- 1. TAIL & LITTLE PUFF (Like in Reference) --- */}
        <g id="tail-group">
          {/* Playful Animated Tail */}
          <motion.path
            d="M 215 220 C 245 210 265 175 250 145 C 242 130 228 136 232 152 C 238 175 220 195 200 205 Z"
            fill="#FFFDF7"
            stroke="#451A03"
            strokeWidth="3.5"
            strokeLinejoin="round"
            animate={{
              rotate: isSadAndMessy ? [-3, -7, -3] : [-4, 10, -4],
              originX: '205px',
              originY: '220px'
            }}
            transition={{ duration: isSadAndMessy ? 3 : 1.7, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Tabby Tail Stripes */}
          <g opacity="0.85">
            <path d="M 238 152 Q 248 156 244 164" stroke="#451A03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 230 172 Q 245 178 238 188" stroke="#451A03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 216 195 Q 232 200 222 210" stroke="#451A03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Tail dark tip */}
            <path d="M 248 140 C 255 145 245 152 238 148 Z" fill="#451A03" />
          </g>

          {/* Little Cute Steam/Puff Cloud next to tail */}
          <motion.g
            animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.6, 0.95, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            transform="translate(255, 140)"
          >
            <path
              d="M 12 8 C 12 3 6 0 2 4 C -2 0 -8 4 -6 10 C -10 14 -6 20 0 19 C 6 22 12 18 12 12 Z"
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="2"
            />
          </motion.g>
        </g>

        {/* --- 2. CAPE (if equipped) --- */}
        {appearance.clothingId === 'cape_hero' && (
          <motion.path
            d="M 95 190 C 70 240 60 270 120 275 C 160 278 200 278 235 272 C 265 255 245 220 220 190 Z"
            fill="#EF4444"
            stroke="#991B1B"
            strokeWidth="3.5"
            animate={{ skewX: [-2, 3, -2] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* --- 3. BODY & HIPS --- */}
        <g id="body-group" filter="url(#soft-shading)">
          {/* Back Hip & Foot */}
          <ellipse cx="205" cy="235" rx="36" ry="26" fill="#F5E8D0" stroke="#451A03" strokeWidth="3.5" />
          {/* Side Tiger Tabby Marks on Hip */}
          <g opacity="0.8">
            <path d="M 215 218 L 195 230" stroke="#451A03" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 225 228 L 205 242" stroke="#451A03" strokeWidth="4.5" strokeLinecap="round" />
          </g>

          {/* Main Kitten Body */}
          <path
            d="M 105 160 C 90 200 95 255 125 260 C 165 265 210 260 220 235 C 228 205 215 170 195 160 Z"
            fill="url(#fur-base-orange)"
            stroke="#451A03"
            strokeWidth="3.5"
          />

          {/* Fluffy White Chest Patch */}
          <path
            d="M 125 170 C 115 200 125 245 160 245 C 195 245 200 200 190 170 C 175 180 145 180 125 170 Z"
            fill="#FFFFFF"
          />
        </g>

        {/* --- 4. CLOTHING (Hoodie, Sweater, Royal, Scarf) --- */}
        {appearance.clothingId === 'hoodie_red' && (
          <g id="hoodie">
            <path
              d="M 105 180 C 98 235 218 235 212 180 C 205 172 110 172 105 180 Z"
              fill="#EF4444"
              stroke="#991B1B"
              strokeWidth="3"
            />
            {/* Pocket */}
            <path d="M 130 205 Q 158 215 186 205 L 180 228 Q 158 234 136 228 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
            {/* Drawstrings */}
            <line x1="145" y1="180" x2="145" y2="202" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <line x1="172" y1="180" x2="172" y2="202" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {appearance.clothingId === 'sweater_cozy' && (
          <g id="sweater">
            <path
              d="M 105 180 C 98 235 218 235 212 180 C 205 172 110 172 105 180 Z"
              fill="#0284C7"
              stroke="#075985"
              strokeWidth="3"
            />
            <line x1="110" y1="198" x2="208" y2="198" stroke="#E0F2FE" strokeWidth="3.5" strokeDasharray="5,5" />
            <line x1="114" y1="214" x2="204" y2="214" stroke="#BAE6FD" strokeWidth="3.5" strokeDasharray="6,6" />
          </g>
        )}

        {appearance.clothingId === 'dress_royal' && (
          <g id="royal-dress">
            <path
              d="M 105 180 C 98 235 218 235 212 180 C 205 172 110 172 105 180 Z"
              fill="#831843"
              stroke="#500724"
              strokeWidth="3"
            />
            <circle cx="158" cy="192" r="4.5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
            <circle cx="158" cy="210" r="4.5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
            <path d="M 108 180 Q 158 190 208 180" stroke="#F59E0B" strokeWidth="3.5" fill="none" />
          </g>
        )}

        {/* --- 5. FRONT PAWS --- */}
        <g id="paws-group">
          {/* Left Front Paw */}
          <ellipse cx="130" cy="254" rx="15" ry="11" fill="#FFFFFF" stroke="#451A03" strokeWidth="3" />
          {/* Toes */}
          <line x1="125" y1="250" x2="125" y2="262" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
          <line x1="134" y1="250" x2="134" y2="262" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />

          {/* Middle Front Paw */}
          <ellipse cx="166" cy="254" rx="15" ry="11" fill="#FFFFFF" stroke="#451A03" strokeWidth="3" />
          <line x1="161" y1="250" x2="161" y2="262" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
          <line x1="170" y1="250" x2="170" y2="262" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />

          {/* Right Foot */}
          <ellipse cx="205" cy="254" rx="16" ry="11" fill="#FFFFFF" stroke="#451A03" strokeWidth="3" />
          <line x1="200" y1="250" x2="200" y2="262" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
          <line x1="209" y1="250" x2="209" y2="262" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* --- 6. GREEN NECK RIBBON / BOW (Default Cute Style like Reference) --- */}
        {appearance.clothingId === null && appearance.accessoryId !== 'bell_collar' && (
          <g id="green-ribbon">
            {/* Collar Band */}
            <path
              d="M 112 170 Q 158 182 204 170 Q 206 179 158 188 Q 110 179 112 170 Z"
              fill="#86EFAC"
              stroke="#166534"
              strokeWidth="2.5"
            />
            {/* Ribbon Tie Bow */}
            <g transform="translate(142, 175)">
              {/* Left loop */}
              <ellipse cx="-8" cy="6" rx="9" ry="6" fill="#4ADE80" stroke="#166534" strokeWidth="2" transform="rotate(-25 -8 6)" />
              {/* Right loop */}
              <ellipse cx="14" cy="6" rx="9" ry="6" fill="#4ADE80" stroke="#166534" strokeWidth="2" transform="rotate(25 14 6)" />
              {/* Center Knot */}
              <circle cx="3" cy="6" r="4.5" fill="#22C55E" stroke="#166534" strokeWidth="2" />
              {/* Ribbon Tails */}
              <path d="M 0 10 L -6 24 L 0 22 L 6 24 Z" fill="#4ADE80" stroke="#166534" strokeWidth="1.8" />
              <path d="M 6 10 L 14 24 L 8 22 L 2 24 Z" fill="#4ADE80" stroke="#166534" strokeWidth="1.8" />
            </g>
          </g>
        )}

        {/* Bowtie Gold (if equipped) */}
        {appearance.clothingId === 'bowtie_gold' && (
          <g transform="translate(158, 178)" id="gold-bowtie">
            <polygon points="-18,-10 -18,10 0,0" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <polygon points="18,-10 18,10 0,0" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <circle cx="0" cy="0" r="5" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
          </g>
        )}

        {/* Bell Collar (if equipped) */}
        {appearance.accessoryId === 'bell_collar' && (
          <g id="bell-collar">
            <path d="M 112 170 Q 158 184 204 170" stroke="#DC2626" strokeWidth="5.5" fill="none" strokeLinecap="round" />
            <circle cx="158" cy="182" r="7.5" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
            <circle cx="158" cy="182" r="2" fill="#78350F" />
          </g>
        )}

        {/* Winter Scarf (if equipped) */}
        {appearance.clothingId === 'scarf_winter' && (
          <g id="winter-scarf">
            <path d="M 108 168 Q 158 186 208 168 Q 212 182 158 192 Q 104 182 108 168 Z" fill="#0D9488" stroke="#115E59" strokeWidth="2.5" />
            <rect x="175" y="180" width="18" height="38" rx="4" fill="#0F766E" stroke="#115E59" strokeWidth="2" />
            <line x1="175" y1="216" x2="193" y2="216" stroke="#FDE047" strokeWidth="3" strokeDasharray="3,3" />
          </g>
        )}

        {/* --- 7. EARS --- */}
        <g id="ears-group">
          {/* Left Ear */}
          <motion.g
            animate={isSadAndMessy ? { rotate: -18, originX: '85px', originY: '110px' } : { rotate: [0, -3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <polygon points="70,125 95,45 138,105" fill="#FFFDF7" stroke="#451A03" strokeWidth="3.5" strokeLinejoin="round" />
            <polygon points="82,118 100,60 128,102" fill="#FDA4AF" />
            {/* White inner ear fluff */}
            <path d="M 85 110 Q 98 100 105 112 Q 95 120 85 110 Z" fill="#FFFFFF" />
          </motion.g>

          {/* Right Ear */}
          <motion.g
            animate={isSadAndMessy ? { rotate: 18, originX: '235px', originY: '110px' } : { rotate: [0, 3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <polygon points="248,125 222,45 178,105" fill="#FFFDF7" stroke="#451A03" strokeWidth="3.5" strokeLinejoin="round" />
            <polygon points="236,118 218,60 190,102" fill="#FDA4AF" />
            <path d="M 233 110 Q 220 100 213 112 Q 223 120 233 110 Z" fill="#FFFFFF" />
          </motion.g>
        </g>

        {/* --- 8. CHIBI KITTEN HEAD (Large & Round with Chubby Cheeks) --- */}
        <g id="head-group" filter="url(#soft-shading)">
          <path
            d="M 82 125 C 75 75 245 75 238 125 C 248 165 210 188 160 188 C 110 188 72 165 82 125 Z"
            fill="url(#fur-base-orange)"
            stroke="#451A03"
            strokeWidth="3.5"
          />

          {/* Soft Cheeks Blush */}
          <ellipse cx="106" cy="144" rx="14" ry="8" fill="url(#cheek-blush)" />
          <ellipse cx="214" cy="144" rx="14" ry="8" fill="url(#cheek-blush)" />

          {/* Tabby Markings on Forehead (Like Reference) */}
          <g opacity="0.85" id="tabby-forehead">
            <path d="M 160 85 L 160 102" stroke="#451A03" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 148 88 L 152 104" stroke="#451A03" strokeWidth="4" strokeLinecap="round" />
            <path d="M 172 88 L 168 104" stroke="#451A03" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* Tabby Markings on Cheeks */}
          <g opacity="0.85" id="tabby-cheeks">
            <path d="M 84 130 Q 98 132 108 128" stroke="#451A03" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 86 142 Q 102 144 114 138" stroke="#451A03" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 236 130 Q 222 132 212 128" stroke="#451A03" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 234 142 Q 218 144 206 138" stroke="#451A03" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
        </g>

        {/* --- 9. ANIME GIANT EYES (The Highlight of the Design) --- */}
        <g id="anime-eyes">
          {isBlinking ? (
            /* Blinking Line */
            <g>
              <path d="M 112 130 Q 132 140 148 128" stroke="#451A03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M 172 128 Q 188 140 208 130" stroke="#451A03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            </g>
          ) : isSadAndMessy ? (
            /* Sad Teardrop Eyes */
            <g>
              <ellipse cx="130" cy="130" rx="18" ry="20" fill="#1E293B" stroke="#451A03" strokeWidth="3" />
              <ellipse cx="190" cy="130" rx="18" ry="20" fill="#1E293B" stroke="#451A03" strokeWidth="3" />
              <circle cx="125" cy="122" r="7" fill="#60A5FA" opacity="0.9" />
              <circle cx="185" cy="122" r="7" fill="#60A5FA" opacity="0.9" />
              <circle cx="132" cy="138" r="3.5" fill="#FFFFFF" />
              <circle cx="192" cy="138" r="3.5" fill="#FFFFFF" />
              {/* Sad eyebrows */}
              <path d="M 114 112 Q 130 120 145 116" stroke="#451A03" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M 206 112 Q 190 120 175 116" stroke="#451A03" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </g>
          ) : (
            /* Big, Radiant Anime Emerald/Hazel Eyes (Exact Reference Style) */
            <g>
              {/* Left Eye Base */}
              <ellipse cx="130" cy="128" rx="21" ry="24" fill="url(#eye-grad-emerald)" stroke="#451A03" strokeWidth="3" />
              {/* Left Pupil Dark Core */}
              <ellipse cx="130" cy="124" rx="14" ry="17" fill="#0A2F14" />
              {/* Left Eye Big Sparkle Star */}
              <circle cx="122" cy="116" r="8" fill="#FFFFFF" />
              {/* Left Eye Secondary Sparkle */}
              <circle cx="139" cy="138" r="3.8" fill="#FFFFFF" />
              <circle cx="123" cy="138" r="2.2" fill="#BBF7D0" />
              {/* Left Thick Eyelash Arch */}
              <path d="M 108 122 C 114 105 146 105 152 122" stroke="#451A03" strokeWidth="5.5" strokeLinecap="round" fill="none" />
              {/* Cute Eyelash Wings */}
              <path d="M 108 120 L 103 116" stroke="#451A03" strokeWidth="3.5" strokeLinecap="round" />

              {/* Right Eye Base */}
              <ellipse cx="190" cy="128" rx="21" ry="24" fill="url(#eye-grad-emerald)" stroke="#451A03" strokeWidth="3" />
              {/* Right Pupil Dark Core */}
              <ellipse cx="190" cy="124" rx="14" ry="17" fill="#0A2F14" />
              {/* Right Eye Big Sparkle Star */}
              <circle cx="182" cy="116" r="8" fill="#FFFFFF" />
              {/* Right Eye Secondary Sparkle */}
              <circle cx="199" cy="138" r="3.8" fill="#FFFFFF" />
              <circle cx="183" cy="138" r="2.2" fill="#BBF7D0" />
              {/* Right Thick Eyelash Arch */}
              <path d="M 168 122 C 174 105 206 105 212 122" stroke="#451A03" strokeWidth="5.5" strokeLinecap="round" fill="none" />
              <path d="M 212 120 L 217 116" stroke="#451A03" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}

          {/* Tiny Pink Stupsnase */}
          <ellipse cx="160" cy="138" rx="3.8" ry="3" fill="#FB7185" />

          {/* Cute Open Mouth with Little Tongue (Like Reference) */}
          {isSadAndMessy ? (
            <path d="M 152 154 Q 160 148 168 154" stroke="#451A03" strokeWidth="3" strokeLinecap="round" fill="none" />
          ) : (
            <g id="open-mouth">
              {/* Mouth contour */}
              <path
                d="M 148 144 Q 154 150 160 146 Q 166 150 172 144 Q 170 162 160 162 Q 150 162 148 144 Z"
                fill="#881337"
                stroke="#451A03"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Pink tongue sticking out */}
              <path
                d="M 153 152 Q 160 148 167 152 Q 165 162 160 162 Q 155 162 153 152 Z"
                fill="#F43F5E"
              />
            </g>
          )}

          {/* Delicate Feline Whiskers */}
          <g stroke="#451A03" strokeWidth="1.8" strokeLinecap="round" opacity="0.65">
            <line x1="102" y1="140" x2="68" y2={isSadAndMessy ? 148 : 136} />
            <line x1="100" y1="146" x2="64" y2={isSadAndMessy ? 156 : 148} />
            <line x1="218" y1="140" x2="252" y2={isSadAndMessy ? 148 : 136} />
            <line x1="220" y1="146" x2="256" y2={isSadAndMessy ? 156 : 148} />
          </g>
        </g>

        {/* --- 10. DIRT & SMUDGES (when sad/dirty) --- */}
        {isSadAndMessy && (
          <g opacity="0.8">
            <ellipse cx="102" cy="120" rx="9" ry="6" fill="#78350F" transform="rotate(-15 102 120)" />
            <ellipse cx="218" cy="115" rx="10" ry="5" fill="#78350F" transform="rotate(12 218 115)" />
            <circle cx="85" cy="175" r="4.5" fill="#94A3B8" />
            <circle cx="230" cy="195" r="5" fill="#94A3B8" />
          </g>
        )}

        {/* --- 11. EYEWEAR (Glasses / Monocle) --- */}
        {appearance.accessoryId === 'glasses_cool' && (
          <g id="sunglasses">
            <rect x="108" y="112" width="44" height="28" rx="8" fill="#0F172A" stroke="#F59E0B" strokeWidth="2.5" />
            <rect x="168" y="112" width="44" height="28" rx="8" fill="#0F172A" stroke="#F59E0B" strokeWidth="2.5" />
            <line x1="152" y1="124" x2="168" y2="124" stroke="#F59E0B" strokeWidth="4" />
            <line x1="116" y1="118" x2="130" y2="134" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
            <line x1="176" y1="118" x2="190" y2="134" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          </g>
        )}

        {appearance.accessoryId === 'monocle' && (
          <g id="monocle">
            <circle cx="190" cy="128" r="18" stroke="#F59E0B" strokeWidth="3" fill="rgba(255,255,255,0.2)" />
            <line x1="208" y1="128" x2="228" y2="160" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4,3" />
          </g>
        )}

        {/* --- 12. HATS & HAIRSTYLES (Including Big Fluffy Chef Hat from Reference!) --- */}
        {appearance.hairStyle === 'chef' && (
          <g id="chef-hat" filter="url(#soft-shading)">
            {/* Puffy Chef Hat Top with Rich Cloud Folds */}
            <path
              d="M 95 85 C 60 55 75 5 118 12 C 130 -8 185 -8 200 12 C 245 5 260 55 225 85 Z"
              fill="url(#hat-grad)"
              stroke="#451A03"
              strokeWidth="3.5"
            />
            {/* Hat Fold Lines */}
            <path d="M 125 12 Q 138 45 132 82" stroke="#CBD5E1" strokeWidth="2.5" fill="none" />
            <path d="M 160 6 Q 164 45 160 82" stroke="#CBD5E1" strokeWidth="3" fill="none" />
            <path d="M 195 12 Q 185 45 190 82" stroke="#CBD5E1" strokeWidth="2.5" fill="none" />

            {/* Chef Hat Headband Band */}
            <path
              d="M 88 82 Q 160 98 232 82 L 230 112 Q 160 126 90 112 Z"
              fill="#FFFFFF"
              stroke="#451A03"
              strokeWidth="3.5"
            />
            {/* Golden Buckle on Band (Like Reference) */}
            <rect x="204" y="90" width="10" height="15" rx="2" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
            <circle cx="209" cy="97" r="1.5" fill="#78350F" />
          </g>
        )}

        {appearance.hairStyle === 'crown' && (
          <g id="royal-crown" filter="url(#soft-shading)">
            <polygon points="120,85 110,40 140,62 160,30 180,62 210,40 200,85" fill="#F59E0B" stroke="#78350F" strokeWidth="3" />
            <circle cx="110" cy="40" r="4.5" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
            <circle cx="160" cy="30" r="5.5" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" />
            <circle cx="210" cy="40" r="4.5" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
          </g>
        )}

        {appearance.hairStyle === 'punk' && (
          <g fill="#EC4899" stroke="#BE185D" strokeWidth="2.5" id="punk-hair">
            <polygon points="140,85 150,30 162,85" />
            <polygon points="152,85 164,22 176,85" />
            <polygon points="166,85 178,34 190,85" />
          </g>
        )}

        {appearance.hairStyle === 'flower' && (
          <g id="flower-crown">
            <circle cx="130" cy="78" r="8" fill="#F43F5E" stroke="#9F1239" strokeWidth="2" />
            <circle cx="160" cy="74" r="9" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
            <circle cx="190" cy="78" r="8" fill="#EC4899" stroke="#9D174D" strokeWidth="2" />
            <circle cx="145" cy="76" r="5" fill="#34D399" />
            <circle cx="175" cy="76" r="5" fill="#34D399" />
          </g>
        )}

        {appearance.hairStyle === 'curls' && (
          <g fill="#D97706" stroke="#78350F" strokeWidth="2.5" id="curls">
            <circle cx="138" cy="75" r="12" />
            <circle cx="160" cy="70" r="14" />
            <circle cx="182" cy="75" r="12" />
          </g>
        )}

        {/* --- 13. CUTE LITTLE PIE & SNACKS BESIDE CAT (Like Reference!) --- */}
        <g id="pastry-treat" transform="translate(48, 222)">
          {/* Little Baked Pie */}
          <path
            d="M 12 18 Q 30 14 48 18 L 44 34 Q 30 38 16 34 Z"
            fill="#D97706"
            stroke="#451A03"
            strokeWidth="2.5"
          />
          {/* Fluffy Pie Crust Top */}
          <path
            d="M 10 18 C 10 10 50 10 50 18 C 50 24 10 24 10 18 Z"
            fill="#FDE68A"
            stroke="#451A03"
            strokeWidth="2.5"
          />
          {/* Pie Crust cuts */}
          <line x1="24" y1="16" x2="28" y2="18" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          <line x1="32" y1="16" x2="36" y2="18" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />

          {/* Floating Cookie Crumb / Leaf */}
          <circle cx="4" cy="2" r="3.5" fill="#F87171" stroke="#991B1B" strokeWidth="1.5" />
          <ellipse cx="-4" cy="12" rx="6" ry="3" fill="#4ADE80" stroke="#166534" strokeWidth="1.5" transform="rotate(-30 -4 12)" />
        </g>
      </motion.svg>
    </div>
  );
};
