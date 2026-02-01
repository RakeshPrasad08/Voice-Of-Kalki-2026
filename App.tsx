
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Language, Region, NewsGenre, NewsItem } from './types';
import { fetchNews, getCityFromCoords } from './services/geminiService';
import { supabase, getAnonymousUserId } from './services/supabaseClient';
import NewsCard from './components/NewsCard';
import SkeletonCard from './components/SkeletonCard';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [region, setRegion] = useState<Region>(Region.GLOBAL);
  const [genreFilter, setGenreFilter] = useState<NewsGenre>(NewsGenre.ALL);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [savedArticles, setSavedArticles] = useState<NewsItem[]>([]);
  const [readLaterArticles, setReadLaterArticles] = useState<NewsItem[]>([]);
  const [reactions, setReactions] = useState<{ [key: string]: 'up' | 'down' | null }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorType, setErrorType] = useState<'none' | 'quota' | 'general'>('none');
  const [city, setCity] = useState<string>("Bengaluru");
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  const userId = getAnonymousUserId();
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const isKannada = language === Language.KANNADA;

  // Sync state from Storage & Supabase
  useEffect(() => {
    const saved = localStorage.getItem('vok_saved_articles');
    const later = localStorage.getItem('vok_read_later_articles');
    const reacts = localStorage.getItem('vok_reactions');
    if (saved) try { setSavedArticles(JSON.parse(saved)); } catch (e) {}
    if (later) try { setReadLaterArticles(JSON.parse(later)); } catch (e) {}
    if (reacts) try { setReactions(JSON.parse(reacts)); } catch (e) {}

    const syncCloud = async () => {
      if (!supabase) return;
      try {
        const { data: bks, error: bError } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', userId);
        
        if (bks && !bError) {
          setSavedArticles(bks.filter(b => b.type === 'saved').map(b => b.content));
          setReadLaterArticles(bks.filter(b => b.type === 'read_later').map(b => b.content));
          setIsDbConnected(true);
        }

        const { data: rts, error: rError } = await supabase
          .from('reactions')
          .select('*')
          .eq('user_id', userId);

        if (rts && !rError) {
          const mappedReacts = rts.reduce((acc, curr) => {
            acc[curr.news_id] = curr.reaction_type;
            return acc;
          }, {} as any);
          setReactions(mappedReacts);
        }
      } catch (err) { 
        console.error("Supabase sync failed:", err);
        setIsDbConnected(false); 
      }
    };
    syncCloud();
  }, [userId]);

  // Local persistence backup
  useEffect(() => {
    localStorage.setItem('vok_saved_articles', JSON.stringify(savedArticles));
    localStorage.setItem('vok_read_later_articles', JSON.stringify(readLaterArticles));
    localStorage.setItem('vok_reactions', JSON.stringify(reactions));
  }, [savedArticles, readLaterArticles, reactions]);

  // Accessibility: Focus Management
  useEffect(() => {
    if (selectedNews) {
      lastFocusedElement.current = document.activeElement as HTMLElement;
      setTimeout(() => modalRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      lastFocusedElement.current?.focus();
    }
  }, [selectedNews]);

  // Keyboard navigation
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedNews(null);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  const load = useCallback(async (lang: Language, reg: Region, c: string, g: NewsGenre) => {
    if (reg === Region.SAVED || reg === Region.READ_LATER) {
      setIsLoading(false);
      setErrorType('none');
      return;
    }
    setIsLoading(true);
    setErrorType('none');
    try {
      const res = await fetchNews(lang, reg, c, g);
      setNewsList(res);
    } catch (e: any) { 
      if (e.message === 'QUOTA_EXHAUSTED') {
        setErrorType('quota');
      } else {
        setErrorType('general');
      }
      console.error(e); 
    } finally { 
      setIsLoading(false); 
      setIsRefreshing(false); 
    }
  }, []);

  useEffect(() => { 
    load(language, region, city, genreFilter); 
  }, [language, region, city, genreFilter, load]);

  const toggleSave = async (e: React.MouseEvent | null, news: NewsItem) => {
    if (e) e.stopPropagation();
    const isSaved = savedArticles.some(i => i.id === news.id);
    if (isSaved) {
      setSavedArticles(prev => prev.filter(i => i.id !== news.id));
      if (supabase) {
        await supabase.from('bookmarks').delete().match({ user_id: userId, news_id: news.id, type: 'saved' });
      }
    } else {
      setSavedArticles(prev => [...prev, news]);
      if (supabase) {
        await supabase.from('bookmarks').upsert({ user_id: userId, news_id: news.id, type: 'saved', content: news });
      }
    }
  };

  const toggleLater = async (e: React.MouseEvent | null, news: NewsItem) => {
    if (e) e.stopPropagation();
    const isLater = readLaterArticles.some(i => i.id === news.id);
    if (isLater) {
      setReadLaterArticles(prev => prev.filter(i => i.id !== news.id));
      if (supabase) {
        await supabase.from('bookmarks').delete().match({ user_id: userId, news_id: news.id, type: 'read_later' });
      }
    } else {
      setReadLaterArticles(prev => [...prev, news]);
      if (supabase) {
        await supabase.from('bookmarks').upsert({ user_id: userId, news_id: news.id, type: 'read_later', content: news });
      }
    }
  };

  const handleReaction = async (e: React.MouseEvent | null, newsId: string, type: 'up' | 'down') => {
    if (e) e.stopPropagation();
    const currentReaction = reactions[newsId];
    const newReaction = currentReaction === type ? null : type;
    
    setReactions(prev => ({ ...prev, [newsId]: newReaction }));

    if (supabase) {
      if (newReaction === null) {
        await supabase.from('reactions').delete().match({ user_id: userId, news_id: newsId });
      } else {
        await supabase.from('reactions').upsert({ user_id: userId, news_id: newsId, reaction_type: newReaction });
      }
    }
  };

  const handleDetect = () => {
    if (!navigator.geolocation) return;
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const cityStr = await getCityFromCoords(pos.coords.latitude, pos.coords.longitude);
      if (cityStr) { 
        setCity(cityStr); 
        setRegion(Region.CITY); 
      }
      setIsDetecting(false);
    }, () => setIsDetecting(false));
  };

  const newsToDisplay = (region === Region.SAVED ? savedArticles : region === Region.READ_LATER ? readLaterArticles : newsList).filter(n => {
    const genreMatch = genreFilter === NewsGenre.ALL || (genreFilter === NewsGenre.TRENDING ? n.isUrgent : n.category === genreFilter);
    const verifyMatch = !verifiedOnly || n.isVerified;
    const searchMatch = searchQuery === '' || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return genreMatch && verifyMatch && searchMatch;
  });

  return (
    <div className="min-h-screen flex flex-col antialiased bg-[#fdfdfd]" lang={isKannada ? "kn" : "en"}>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100" role="banner">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-2" aria-hidden="true">
               <span className="text-white font-black text-xl italic tracking-tighter">VOK</span>
             </div>
             <div className="hidden sm:block">
               <h1 className={`text-xl font-black text-gray-900 tracking-tight leading-none ${isKannada ? 'kannada-font' : 'news-heading'}`}>
                 {isKannada ? 'ಕಲ್ಕಿಯ ದನಿ' : 'VOICE OF KALKI'}
               </h1>
               <div className="flex items-center gap-1.5 mt-1" aria-live="polite">
                 <span className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-green-500 animate-pulse' : 'bg-orange-400'}`}></span>
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                   {isKannada ? (isDbConnected ? 'ಮೇಘ ಸಿಂಕ್' : 'ಸ್ಥಳೀಯ ಮೋಡ್') : (isDbConnected ? 'Cloud Active' : 'Offline Storage')}
                 </span>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden lg:block">
              <input 
                type="text" 
                placeholder={isKannada ? "ಸುದ್ದಿ ಹುಡುಕಿ..." : "Search stories..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label={isKannada ? "ಸುದ್ದಿ ಹುಡುಕಾಟ" : "Search news"}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm w-48 xl:w-64 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
            </div>
            
            <button 
              onClick={handleDetect} 
              className="p-2.5 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors border border-orange-100" 
              aria-label="Detect Location"
            >
              <i className={`fa-solid ${isDetecting ? 'fa-spinner fa-spin' : 'fa-location-arrow'}`}></i>
            </button>
            
            <button 
              onClick={() => setLanguage(l => l === Language.ENGLISH ? Language.KANNADA : Language.ENGLISH)} 
              className="px-5 py-2.5 bg-gray-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md shadow-gray-200"
            >
              {isKannada ? 'English' : 'ಕನ್ನಡ'}
            </button>
          </div>
        </div>

        <nav className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar" aria-label="Region filters">
          {Object.values(Region).map(r => {
            const isActive = region === r;
            return (
              <button 
                key={r} 
                onClick={() => setRegion(r)} 
                aria-pressed={isActive} 
                className={`whitespace-nowrap px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                  isActive 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 transform scale-105' 
                    : 'text-gray-500 hover:bg-gray-100 border border-transparent'
                } ${isKannada ? 'kannada-font' : ''}`}
              >
                {isKannada ? (r === Region.GLOBAL ? 'ಜಾಗತಿಕ' : r === Region.COUNTRY ? 'ಭಾರತ' : r === Region.STATE ? 'ಕರ್ನಾಟಕ' : r === Region.SAVED ? 'ಉಳಿಸಲಾಗಿದೆ' : r === Region.READ_LATER ? 'ನಂತರ ಓದಿ' : city) : (r === Region.CITY ? city : r)}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full" role="main">
        <div className="mb-10">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h2 className={`text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tighter ${isKannada ? 'kannada-font' : 'news-heading'}`}>
                  {isKannada ? 'ಈ ಕ್ಷಣದ ಮುಖ್ಯಾಂಶಗಳು' : 'The Real-Time Pulse'}
                </h2>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm hover:border-orange-300 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={verifiedOnly} 
                      onChange={() => setVerifiedOnly(!verifiedOnly)} 
                      className="w-4 h-4 rounded text-orange-600 border-gray-300 focus:ring-orange-500" 
                    />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-900">
                      {isKannada ? 'ಅಧಿಕೃತ ಮೂಲ ಮಾತ್ರ' : 'Verified Only'}
                    </span>
                  </label>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                    Showing: <span className="text-orange-600">{region === Region.CITY ? city : region}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto py-2" role="group" aria-label="Category filters">
                 {Object.values(NewsGenre).map(g => (
                   <button 
                    key={g} 
                    onClick={() => setGenreFilter(g)} 
                    aria-pressed={genreFilter === g} 
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                      genreFilter === g ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                   >
                     {isKannada ? g : g}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : errorType === 'quota' ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-orange-50 rounded-[3rem] border-2 border-dashed border-orange-200" role="alert">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
               <i className="fa-solid fa-triangle-exclamation text-3xl text-orange-600" aria-hidden="true"></i>
            </div>
            <h3 className={`text-2xl font-black text-orange-900 ${isKannada ? 'kannada-font' : ''}`}>
              {isKannada ? 'ದೈನಂದಿನ ಮಿತಿ ಮೀರಿದೆ' : 'Daily limit reached'}
            </h3>
            <p className="text-orange-700/70 mt-4 font-bold max-w-md mx-auto">
              {isKannada 
                ? 'ಸುದ್ದಿ ಹರಿವು ತಾತ್ಕಾಲಿಕವಾಗಿ ಸ್ಥಗಿತಗೊಂಡಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' 
                : 'The news flow is temporarily paused due to high traffic. Please try refreshing in a few moments.'}
            </p>
            <button 
              onClick={() => load(language, region, city, genreFilter)}
              className="mt-8 px-8 py-3 bg-orange-600 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg"
            >
              {isKannada ? 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ' : 'Try Again'}
            </button>
          </div>
        ) : newsToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsToDisplay.map(n => (
              <NewsCard 
                key={n.id} 
                news={n} 
                language={language} 
                isSaved={savedArticles.some(s => s.id === n.id)} 
                isReadLater={readLaterArticles.some(l => l.id === n.id)} 
                reaction={reactions[n.id]}
                onToggleSave={toggleSave} 
                onToggleReadLater={toggleLater} 
                onReaction={handleReaction} 
                onClick={setSelectedNews} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100" role="status">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
               <i className="fa-solid fa-feather-pointed text-3xl text-gray-200" aria-hidden="true"></i>
            </div>
            <h3 className={`text-2xl font-black text-gray-400 ${isKannada ? 'kannada-font' : ''}`}>
              {isKannada ? 'ಯಾವುದೇ ಸುದ್ದಿ ಲಭ್ಯವಿಲ್ಲ' : 'No stories found in this pulse.'}
            </h3>
            <p className="text-gray-300 mt-2 font-bold uppercase tracking-widest text-[10px]">Try changing your filters or location</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 pt-16 pb-8" role="contentinfo">
         <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
           <div className="flex items-center gap-2 mb-6">
              <span className="text-orange-600 font-black text-2xl italic">VOK</span>
              <span className="text-gray-900 font-black tracking-tighter text-lg uppercase">Voice of Kalki</span>
           </div>
           <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-12">© 2025 VOX MEDIA NETWORKS</p>
           <div className="w-full pt-8 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-6">
              <p className="text-[10px] text-gray-300 font-medium max-w-md text-center sm:text-left leading-relaxed">
                AI Aggregation: Content is processed in real-time from traditional media and social networks. Use of this application implies acceptance of human-AI oversight.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-gray-300 hover:text-orange-600 transition-colors"><i className="fa-brands fa-x-twitter text-lg"></i></a>
                <a href="#" className="text-gray-300 hover:text-orange-600 transition-colors"><i className="fa-brands fa-linkedin text-lg"></i></a>
                <a href="#" className="text-gray-300 hover:text-orange-600 transition-colors"><i className="fa-brands fa-github text-lg"></i></a>
              </div>
           </div>
         </div>
      </footer>

      {selectedNews && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md animate-overlay" onClick={() => setSelectedNews(null)}></div>
          <div ref={modalRef} tabIndex={-1} className="relative bg-white w-full max-w-5xl max-h-[92vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-modal outline-none border border-white/20">
             <button 
              onClick={() => setSelectedNews(null)} 
              className="absolute top-6 right-6 z-[110] w-14 h-14 bg-white/95 text-gray-900 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-xl hover:scale-110 active:scale-95" 
              aria-label="Close"
             >
               <i className="fa-solid fa-xmark text-xl" aria-hidden="true"></i>
             </button>

             <div className="overflow-y-auto scroll-smooth no-scrollbar">
               <div className="relative h-[45vh] w-full">
                  <img src={selectedNews.imageUrl} className="w-full h-full object-cover" alt="" aria-hidden="true" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                     <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-4 py-1.5 bg-orange-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg">{selectedNews.category}</span>
                        {selectedNews.isVerified && <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-lg flex items-center gap-2 uppercase tracking-widest shadow-lg"><i className="fa-solid fa-circle-check"></i>Verified</span>}
                     </div>
                     <h2 id="modal-title" className={`text-4xl sm:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter ${isKannada ? 'kannada-font' : 'news-heading'}`}>
                       {selectedNews.title}
                     </h2>
                  </div>
               </div>

               <div className="px-8 sm:px-12 pb-16 pt-8">
                 <div className="flex flex-wrap items-center justify-between gap-6 mb-12 pb-8 border-b border-gray-100">
                    <div className="flex items-center gap-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                       <span className="flex items-center gap-2"><i className="fa-solid fa-calendar text-orange-500"></i>{selectedNews.timestamp}</span>
                       <span className="flex items-center gap-2"><i className="fa-solid fa-newspaper text-orange-500"></i>{selectedNews.source}</span>
                    </div>
                    <div className="flex gap-3">
                       <button 
                        onClick={() => toggleLater(null, selectedNews)} 
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${readLaterArticles.some(s => s.id === selectedNews.id) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:text-orange-600'}`}
                       >
                         <i className="fa-solid fa-clock"></i>
                       </button>
                       <button 
                        onClick={() => toggleSave(null, selectedNews)} 
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${savedArticles.some(s => s.id === selectedNews.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                       >
                         <i className="fa-solid fa-bookmark"></i>
                       </button>
                    </div>
                 </div>

                 <div className={`prose prose-xl max-w-none text-gray-700 leading-relaxed mb-16 ${isKannada ? 'kannada-font text-2xl' : ''}`}>
                    <p className="font-black text-2xl sm:text-3xl text-gray-900 border-l-[12px] border-orange-500 pl-8 mb-12 italic bg-orange-50/30 py-6 rounded-r-3xl">
                      {selectedNews.summary}
                    </p>
                    <div className="space-y-8">
                      {selectedNews.fullDescription?.split('\n').map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                 </div>

                 <div className="p-10 bg-gray-900 rounded-[3rem] flex flex-col lg:flex-row justify-between items-center gap-10 text-white">
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                       <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center border border-white/20">
                          <i className="fa-solid fa-link text-orange-400 text-3xl"></i>
                       </div>
                       <div className="text-center sm:text-left">
                          <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] mb-2">Original Context Verified</p>
                          <h4 className="text-2xl font-black tracking-tighter truncate max-w-[300px]">{selectedNews.source}</h4>
                       </div>
                    </div>
                    <a 
                      href={selectedNews.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full lg:w-auto px-12 py-5 bg-orange-600 text-white rounded-[2rem] font-black text-sm hover:bg-orange-500 transform hover:-translate-y-1 active:scale-95 transition-all text-center shadow-2xl shadow-orange-900/40"
                    >
                      VISIT ORIGINAL SOURCE
                    </a>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
