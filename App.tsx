import React, { useState, useRef, useEffect } from 'react';
import { AppStep, ImageAsset, GenerationHistory, LoadingState } from './types';
import { PRESET_PEOPLE, PRESET_CLOTHES } from './constants';
import TopVisualizer from './components/TopVisualizer';
import AssetGrid from './components/AssetGrid';
import { resizeImage, getDisplayUrl } from './services/utils';
import { generateClothingItem, generateTryOn } from './services/geminiService';
import { ChevronRight, ArrowLeft, Wand2, Sparkles, Image as ImageIcon, Shirt, ChevronDown, ChevronUp } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [step, setStep] = useState<AppStep>(AppStep.SELECT_PERSON);
  
  // Data Lists
  const [people, setPeople] = useState<ImageAsset[]>(PRESET_PEOPLE);
  const [clothes, setClothes] = useState<ImageAsset[]>(PRESET_CLOTHES);
  
  // Selection
  const [selectedPerson, setSelectedPerson] = useState<ImageAsset | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<ImageAsset | null>(null);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  
  // Generation States
  const [clothingPrompt, setClothingPrompt] = useState('');
  const [isGeneratingClothing, setIsGeneratingClothing] = useState(false);
  const [isGeneratingResult, setIsGeneratingResult] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(true);

  // --- Handlers ---

  // Handle Person Upload
  const handlePersonUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    const newAsset: ImageAsset = {
      id: `u_p_${Date.now()}`,
      url,
      isUserUploaded: true
    };
    setPeople([newAsset, ...people]);
    setSelectedPerson(newAsset);
  };

  // Handle Clothing Upload
  const handleClothingUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    const newAsset: ImageAsset = {
      id: `u_c_${Date.now()}`,
      url,
      isUserUploaded: true
    };
    setClothes([newAsset, ...clothes]);
    setSelectedClothing(newAsset);
  };

  // Handle Clothing Generation (Text to Image)
  const handleGenerateClothing = async () => {
    if (!clothingPrompt.trim()) return;
    setIsGeneratingClothing(true);
    setGenerationError(null);
    try {
      const base64 = await generateClothingItem(clothingPrompt);
      const url = `data:image/png;base64,${base64}`;
      const newAsset: ImageAsset = {
        id: `g_c_${Date.now()}`,
        url,
        base64, // caching the base64 for later use
        isUserUploaded: true
      };
      setClothes([newAsset, ...clothes]);
      setSelectedClothing(newAsset);
      setClothingPrompt('');
    } catch (err) {
      setGenerationError("生成服装失败，请重试。");
    } finally {
      setIsGeneratingClothing(false);
    }
  };

  // Handle Final Try-On Generation
  const handleTryOn = async () => {
    if (!selectedPerson || !selectedClothing) return;
    
    setIsGeneratingResult(true);
    setGenerationError(null);
    setGeneratedResult(null);

    try {
      // 1. Prepare Base64 strings with Resizing
      // STRICT LIMIT: 800px to prevent Vercel 413 Payload Too Large
      const personB64 = await resizeImage(selectedPerson.url, 800);
      const clothesB64 = await resizeImage(selectedClothing.url, 800);

      // 2. Call API
      const resultB64 = await generateTryOn(personB64, clothesB64);
      const resultUrl = `data:image/png;base64,${resultB64}`;

      // 3. Update State
      setGeneratedResult(resultUrl);

      // 4. Add to History
      const newHistory: GenerationHistory = {
        id: `h_${Date.now()}`,
        personImage: selectedPerson.url,
        clothingImage: selectedClothing.url,
        resultImage: resultUrl,
        timestamp: Date.now()
      };
      setHistory([newHistory, ...history]);
      setIsGalleryOpen(true); // Open gallery when new item is added

    } catch (err) {
      console.error(err);
      setGenerationError("试穿生成失败。请检查网络或稍后重试。");
    } finally {
      setIsGeneratingResult(false);
    }
  };

  // --- Render Sections ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">选择模特</h2>
          <p className="text-slate-500">上传你的照片或选择预设模特</p>
        </div>
      </div>
      <AssetGrid 
        assets={people} 
        selectedId={selectedPerson?.id || null} 
        onSelect={setSelectedPerson} 
        onUpload={handlePersonUpload}
        uploadLabel="上传照片"
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">选择服装</h2>
          <p className="text-slate-500">选择、上传或用 AI 生成新衣服</p>
        </div>
      </div>

      {/* AI Gen Tool */}
      <div className="bg-gradient-to-r from-brand-50 to-white p-4 rounded-xl border border-brand-100 shadow-sm">
        <label className="block text-sm font-medium text-brand-900 mb-2 flex items-center gap-2">
          <Sparkles size={16} className="text-brand-500" />
          AI 生成独家设计
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={clothingPrompt}
            onChange={(e) => setClothingPrompt(e.target.value)}
            placeholder="描述你想要的衣服 (例如: 一件红色的丝绸晚礼服...)"
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
          <button
            onClick={handleGenerateClothing}
            disabled={isGeneratingClothing || !clothingPrompt}
            className={`px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2 transition-all ${
              isGeneratingClothing || !clothingPrompt
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isGeneratingClothing ? '设计中...' : '生成'}
            {!isGeneratingClothing && <Wand2 size={16} />}
          </button>
        </div>
      </div>

      <AssetGrid 
        assets={clothes} 
        selectedId={selectedClothing?.id || null} 
        onSelect={setSelectedClothing} 
        onUpload={handleClothingUpload}
        uploadLabel="上传服装"
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">准备生成</h2>
        <p className="text-slate-500">Nano Banana AI 将为你合成真人试穿效果</p>
      </div>

      <div className="flex justify-center py-8">
        {!generatedResult && !isGeneratingResult && (
          <button
            onClick={handleTryOn}
            className="group relative px-8 py-4 bg-brand-600 text-white text-lg font-bold rounded-full shadow-xl hover:shadow-2xl hover:bg-brand-700 transition-all active:scale-95 flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Sparkles className="animate-pulse" />
            开始试穿
          </button>
        )}

        {isGeneratingResult && (
          <div className="flex flex-col items-center gap-4">
             <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shirt className="text-brand-500 animate-bounce" size={32} />
                </div>
             </div>
             <p className="text-brand-600 font-medium animate-pulse">正在编织梦想...</p>
          </div>
        )}

        {generatedResult && (
           <div className="w-full max-w-md bg-white p-2 rounded-2xl shadow-2xl border-4 border-white rotate-1 hover:rotate-0 transition-transform duration-500">
             <img src={generatedResult} alt="Result" className="w-full h-auto rounded-xl" />
             <div className="p-4 flex justify-between items-center">
               <span className="text-slate-800 font-bold">生成完成!</span>
               <a 
                href={generatedResult} 
                download={`try-on-${Date.now()}.png`}
                className="text-brand-600 text-sm font-medium hover:underline"
               >
                 保存图片
               </a>
             </div>
           </div>
        )}
      </div>
      
      {generationError && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm border border-red-100">
          {generationError}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-40">
      
      {/* Top Visual Area */}
      <TopVisualizer 
        step={step}
        person={selectedPerson}
        clothing={selectedClothing}
        resultUrl={generatedResult}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 -mt-12 z-20 relative">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-8 min-h-[500px]">
          
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <span className={step >= 1 ? "text-brand-600" : ""}>模特</span>
              <ChevronRight size={14} />
              <span className={step >= 2 ? "text-brand-600" : ""}>服装</span>
              <ChevronRight size={14} />
              <span className={step >= 3 ? "text-brand-600" : ""}>生成</span>
            </div>

            {step > 1 && (
               <button 
                onClick={() => setStep(step - 1)}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium transition-colors"
               >
                 <ArrowLeft size={16} /> 返回上一步
               </button>
            )}
          </div>

          {/* Context Preview for Step 2 */}
          {step === AppStep.SELECT_CLOTHING && selectedPerson && (
             <div className="mb-6 flex items-center gap-3 bg-brand-50/50 p-3 rounded-xl border border-brand-100/50">
                <img src={selectedPerson.url} alt="Selected Person" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                <span className="text-sm text-slate-600">当前模特已就绪</span>
             </div>
          )}

          {/* Step Content */}
          <div className="min-h-[300px]">
            {step === AppStep.SELECT_PERSON && renderStep1()}
            {step === AppStep.SELECT_CLOTHING && renderStep2()}
            {step === AppStep.GENERATE && renderStep3()}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-end">
            {step === AppStep.SELECT_PERSON && (
              <button
                onClick={() => setStep(AppStep.SELECT_CLOTHING)}
                disabled={!selectedPerson}
                className={`px-6 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 ${
                  selectedPerson 
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                下一步: 选择服装 <ChevronRight size={18} />
              </button>
            )}

            {step === AppStep.SELECT_CLOTHING && (
               <button
                onClick={() => setStep(AppStep.GENERATE)}
                disabled={!selectedClothing}
                className={`px-6 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 ${
                  selectedClothing 
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                下一步: 预览生成 <ChevronRight size={18} />
              </button>
            )}
             {/* Step 3 navigation is handled by the "Start Try On" button or Reset */}
             {step === AppStep.GENERATE && generatedResult && (
                <button
                  onClick={() => {
                    setGeneratedResult(null);
                    setStep(AppStep.SELECT_PERSON);
                    setSelectedPerson(null);
                    setSelectedClothing(null);
                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-2.5 rounded-full bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
                >
                  开始新的试穿
                </button>
             )}
          </div>

        </div>
      </main>

      {/* Bottom Gallery */}
      {history.length > 0 && (
        <div 
          className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50 transition-transform duration-300 ease-in-out ${
            isGalleryOpen ? 'translate-y-0' : 'translate-y-[calc(100%-44px)]'
          }`}
        >
          {/* Toggle Header */}
          <div 
            className="h-11 flex items-center justify-between px-4 max-w-6xl mx-auto cursor-pointer group select-none"
            onClick={() => setIsGalleryOpen(!isGalleryOpen)}
          >
             <div className="flex items-center gap-3">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-brand-600 transition-colors">历史作品</h3>
               <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold border border-slate-200 group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                 {history.length}
               </span>
             </div>
             <button className="p-1 rounded-full hover:bg-slate-100 text-slate-400 group-hover:text-brand-600 transition-colors">
                {isGalleryOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
             </button>
          </div>

          {/* Content */}
          <div className="border-t border-slate-100">
            <div className="max-w-6xl mx-auto px-4 py-4">
               <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {history.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-32 relative group cursor-pointer border-2 border-transparent hover:border-brand-500 rounded-xl overflow-hidden transition-all shadow-sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setGeneratedResult(item.resultImage);
                        setStep(AppStep.GENERATE);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <img src={item.resultImage} alt="History" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;