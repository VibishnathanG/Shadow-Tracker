'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lucide } from '@/components/icons';

interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  currentEmoji?: string;
}

interface EmojiCategory {
  name: string;
  icon: string;
  emojis: { emoji: string; keywords: string }[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: 'Greens & Veggies',
    icon: '🥬',
    emojis: [
      { emoji: '🥬', keywords: 'keerai spinach greens lettuce cabbage palak leaves' },
      { emoji: '🥦', keywords: 'broccoli vegetable healthy' },
      { emoji: '🥕', keywords: 'carrot root vegetable' },
      { emoji: '🥒', keywords: 'cucumber salad cooling' },
      { emoji: '🍅', keywords: 'tomato rasam gravy' },
      { emoji: '🥔', keywords: 'potato aloo tuber' },
      { emoji: '🫑', keywords: 'bell pepper capsicum' },
      { emoji: '🧅', keywords: 'onion kanda pyaaz' },
      { emoji: '🧄', keywords: 'garlic poondu lahsun' },
      { emoji: '🌽', keywords: 'corn sweetcorn makka' },
      { emoji: '🥑', keywords: 'avocado healthy fat' },
      { emoji: '🥗', keywords: 'salad bowl mixed veg' },
      { emoji: '🍄', keywords: 'mushroom protein' },
    ],
  },
  {
    name: 'Proteins & Meats',
    icon: '🍗',
    emojis: [
      { emoji: '🍗', keywords: 'chicken poultry thigh leg roast' },
      { emoji: '🥩', keywords: 'meat steak beef mutton lamb' },
      { emoji: '🍖', keywords: 'bone meat ribs barbecue' },
      { emoji: '🐟', keywords: 'fish salmon tuna curry' },
      { emoji: '🦐', keywords: 'shrimp prawn seafood' },
      { emoji: '🥚', keywords: 'egg boiled egg white protein' },
      { emoji: '🍳', keywords: 'fried egg bhurji omelette' },
      { emoji: '🧀', keywords: 'cheese paneer cottage cheese dairy' },
      { emoji: '🫘', keywords: 'beans dal rajma chana soya' },
      { emoji: '🥤', keywords: 'whey protein shake cup drink' },
    ],
  },
  {
    name: 'Curries, Rice & Breads',
    icon: '🍛',
    emojis: [
      { emoji: '🍚', keywords: 'rice basmati steamed sadam curd rice' },
      { emoji: '🫓', keywords: 'roti phulka chapati naan paratha flatbread' },
      { emoji: '🍛', keywords: 'curry biryani rice dish plate' },
      { emoji: '🍲', keywords: 'dal kootu soup stew gravy' },
      { emoji: '🥣', keywords: 'sambar rasam upma poha oats bowl' },
      { emoji: '🥞', keywords: 'dosa dosai pancake chilla' },
      { emoji: '⚪', keywords: 'idli idly steam white' },
      { emoji: '🍩', keywords: 'vada vadai medu donut' },
      { emoji: '🥪', keywords: 'sandwich toast subway' },
      { emoji: '🍞', keywords: 'bread loaf brown bread' },
      { emoji: '🥟', keywords: 'samosa dumpling momo' },
      { emoji: '🍝', keywords: 'pasta spaghetti noodle' },
      { emoji: '🍕', keywords: 'pizza slice' },
      { emoji: '🍔', keywords: 'burger patty' },
    ],
  },
  {
    name: 'Fruits & Berries',
    icon: '🍎',
    emojis: [
      { emoji: '🍎', keywords: 'apple red fruit' },
      { emoji: '🍌', keywords: 'banana potassium yellow' },
      { emoji: '🍊', keywords: 'orange citrus vitamin c' },
      { emoji: '🍋', keywords: 'lemon nimbu lime' },
      { emoji: '🍇', keywords: 'grapes raisins' },
      { emoji: '🍓', keywords: 'strawberry berry' },
      { emoji: '🫐', keywords: 'blueberry berry chia' },
      { emoji: '🍉', keywords: 'watermelon melon hydration' },
      { emoji: '🥭', keywords: 'mango king of fruits aam' },
      { emoji: '🍍', keywords: 'pineapple tropical' },
      { emoji: '🥥', keywords: 'coconut water tender coconut nariyal' },
      { emoji: '🥝', keywords: 'kiwi fruit' },
    ],
  },
  {
    name: 'Dairy, Nuts & Snacks',
    icon: '🥛',
    emojis: [
      { emoji: '🥛', keywords: 'milk dahi curd yogurt glass' },
      { emoji: '🍨', keywords: 'greek yogurt ice cream' },
      { emoji: '🧈', keywords: 'butter ghee butter' },
      { emoji: '🥜', keywords: 'peanut nuts peanut butter almond' },
      { emoji: '🌰', keywords: 'chestnut walnut dry fruit' },
      { emoji: '🍿', keywords: 'popcorn makhana foxnuts' },
    ],
  },
  {
    name: 'Drinks & Chai',
    icon: '☕',
    emojis: [
      { emoji: '☕', keywords: 'chai tea coffee hot cup' },
      { emoji: '🍵', keywords: 'green tea herbal matcha' },
      { emoji: '🧃', keywords: 'juice box drink' },
      { emoji: '🥤', keywords: 'protein shake smoothie soda cup' },
      { emoji: '🧋', keywords: 'boba bubble tea' },
      { emoji: '💧', keywords: 'water droplet hydration' },
    ],
  },
  {
    name: 'Sweets & Treats',
    icon: '🍬',
    emojis: [
      { emoji: '🍬', keywords: 'candy sweet mithai' },
      { emoji: '🍫', keywords: 'chocolate dark chocolate bar' },
      { emoji: '🟤', keywords: 'gulab jamun brown ball' },
      { emoji: '🍪', keywords: 'cookie biscuit snack' },
      { emoji: '🧁', keywords: 'cupcake muffin dessert' },
      { emoji: '🍰', keywords: 'cake pastry slice' },
      { emoji: '🍯', keywords: 'honey sweet organic' },
    ],
  },
];

export default function EmojiPickerModal({
  isOpen,
  onClose,
  onSelectEmoji,
  currentEmoji,
}: EmojiPickerModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, onClose]);

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const filteredEmojis = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      if (selectedCat === 'all') {
        return EMOJI_CATEGORIES.flatMap(c => c.emojis);
      }
      const cat = EMOJI_CATEGORIES.find(c => c.name === selectedCat);
      return cat ? cat.emojis : [];
    }
    const all = EMOJI_CATEGORIES.flatMap(c => c.emojis);
    return all.filter(e => e.keywords.includes(q) || e.emoji.includes(q));
  }, [search, selectedCat]);

  if (!isOpen || !mounted || typeof window === 'undefined') return null;

  const modalContent = (
    <div 
      className="fixed inset-0 top-0 left-0 w-full h-full z-[100001] flex flex-col items-center justify-center p-3 sm:p-4 pointer-events-auto overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85"
      />

      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        className="relative w-full max-w-md bg-surface-elevated border border-border/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden my-auto z-10 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h3 className="text-sm font-black text-foreground">Select Dish Icon / Emoji</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary cursor-pointer"
          >
            <Lucide.X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative shrink-0">
            <Lucide.Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search icons (e.g. keerai, chicken, egg, rice, dosa, tea)..."
              className="w-full bg-secondary border border-border/70 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary"
            />
          </div>

          {/* Category Tabs */}
          {!search && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold no-scrollbar scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCat('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap border ${
                  selectedCat === 'all'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/60 text-muted-foreground border-border/50 hover:bg-secondary'
                }`}
              >
                All
              </button>
              {EMOJI_CATEGORIES.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedCat(c.name)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1 ${
                    selectedCat === c.name
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/60 text-muted-foreground border-border/50 hover:bg-secondary'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Emoji Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-2 p-1 min-h-[220px]">
            {filteredEmojis.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectEmoji(item.emoji);
                  onClose();
                }}
                className={`p-2.5 text-2xl rounded-2xl transition-all cursor-pointer flex items-center justify-center hover:scale-125 hover:bg-primary/20 ${
                  currentEmoji === item.emoji
                    ? 'bg-primary/25 ring-2 ring-primary'
                    : 'bg-secondary/40 border border-border/50'
                }`}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
  );

  return createPortal(modalContent, document.body);
}
