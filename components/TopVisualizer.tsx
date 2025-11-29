import React, { useState, useEffect } from 'react';
import { AppStep, ImageAsset } from '../types';
import { User, Shirt, Wand2, ZoomIn, X } from 'lucide-react';

interface TopVisualizerProps {
  step: AppStep;
  person: ImageAsset | null;
  clothing: ImageAsset | null;
  resultUrl: string | null;
}

type CardId = 'person' | 'clothing' | 'result';

const TopVisualizer: React.FC<TopVisualizerProps> = ({ step, person, clothing, resultUrl }) => {
  const [focusedCard, setFocusedCard] = useState<CardId>('person');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Sync focus with step, but allow manual override
  useEffect(() => {
    if (step === AppStep.SELECT_PERSON) setFocusedCard('person');
    if (step === AppStep.SELECT_CLOTHING) setFocusedCard('clothing');
    if (step === AppStep.GENERATE) setFocusedCard('result');
  }, [step]);

  const cards: { id: CardId; label: string; image: string | null; icon: any }[] = [
    { id: 'person', label: '人物', image: person?.url || null, icon: User },
    { id: 'clothing', label: '服装', image: clothing?.url || null, icon: Shirt },
    { id: 'result', label: '生成结果', image: resultUrl, icon: Wand2 },
  ];

  return (
    <>
      <div className="w-full h-[380px] bg-gradient-to-b from-slate-50 to-slate-200 flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        
        <div className="flex items-center justify-center -space-x-8 sm:-space-x-12 md:-space-x-16 pt-8 perspective-1000">
          {cards.map((card, index) => {
            const isFocused = focusedCard === card.id;
            
            // Layout Logic:
            // Focused card: Z-index high, Scale up, Rotate 0
            // Others: Z-index low, Scale down, Rotate fan-like
            let transform = '';
            let zIndex = isFocused ? 'z-40' : 'z-10';
            
            // Adjust z-indexes for natural stacking of non-focused cards
            if (!isFocused) {
               // If we are to the left of focus, we should be slightly behind? 
               // Standard flex stack: Elements later in DOM overlap previous ones.
               // We want the focused one to overlap BOTH.
               // The generic z-10 vs z-40 handles the Focus vs Others.
               // But between two non-focused cards, e.g. Left and Right when Center is focused:
               // Left (10), Center (40), Right (10). 
               // Right overlaps Center in DOM order? No, Center is z-40.
               // Right (10) vs Left (10). They are far apart, probably won't overlap each other directly.
            }

            if (isFocused) {
              transform = 'scale-110 rotate-0 translate-y-0';
            } else {
              // Fan effect
              // Find index of focused card to determine direction
              const focusedIndex = cards.findIndex(c => c.id === focusedCard);
              const isLeftOfFocus = index < focusedIndex;
              
              const rotate = isLeftOfFocus ? '-rotate-6' : 'rotate-6';
              // Push them down a bit
              const translateY = 'translate-y-4';
              const scale = 'scale-90';
              // Add slight dimming/blur
              
              transform = `${scale} ${rotate} ${translateY}`;
            }

            // Opacity/Blur for depth
            const depthClass = isFocused ? 'brightness-100' : 'brightness-90 hover:brightness-100';

            return (
              <div 
                key={card.id}
                onClick={() => setFocusedCard(card.id)}
                className={`relative w-32 h-48 sm:w-40 sm:h-60 md:w-56 md:h-80 bg-white rounded-2xl shadow-xl transition-all duration-500 ease-out border-4 border-white overflow-hidden cursor-pointer ${transform} ${zIndex} ${depthClass} group`}
              >
                {/* Image Content */}
                {card.image ? (
                  <>
                    <img src={card.image} alt={card.label} className="w-full h-full object-cover" />
                    
                    {/* Zoom Button (Only visible on focus) */}
                    <div className={`absolute inset-0 bg-black/0 hover:bg-black/10 transition-all flex items-center justify-center ${isFocused ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                        {isFocused && (
                           <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage(card.image);
                            }}
                            className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300 text-slate-700 hover:text-brand-600"
                            title="放大查看"
                           >
                             <ZoomIn size={24} />
                           </button>
                        )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                    <card.icon size={40} className="mb-2 opacity-50" />
                    <span className="text-xs sm:text-sm font-medium">{card.label}</span>
                  </div>
                )}
                
                {/* Label Badge */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                  <div className={`backdrop-blur-md text-xs px-3 py-1 rounded-full transition-colors duration-300 ${isFocused ? 'bg-black/70 text-white' : 'bg-slate-200/80 text-slate-600'}`}>
                    {card.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X size={32} />
          </button>
          <div className="relative max-w-5xl max-h-full w-full h-full flex items-center justify-center">
             <img 
              src={lightboxImage} 
              alt="Full view" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TopVisualizer;