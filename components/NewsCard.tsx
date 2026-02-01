
import React from 'react';
import { NewsItem, NewsGenre, Language } from '../types';

interface NewsCardProps {
  news: NewsItem;
  language: Language;
  isSaved: boolean;
  isReadLater: boolean;
  reaction?: 'up' | 'down' | null;
  onToggleSave: (e: React.MouseEvent, news: NewsItem) => void;
  onToggleReadLater: (e: React.MouseEvent, news: NewsItem) => void;
  onReaction: (e: React.MouseEvent, newsId: string, type: 'up' | 'down') => void;
  onClick: (news: NewsItem) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ 
  news, 
  language, 
  isSaved, 
  isReadLater, 
  reaction,
  onToggleSave, 
  onToggleReadLater, 
  onReaction,
  onClick 
}) => {
  const isKannada = language === Language.KANNADA;

  const getGenreStyles = (genre: NewsGenre) => {
    switch (genre) {
      case NewsGenre.TRENDING: return { icon: "fa-solid fa-fire", color: "text-orange-600", bg: "bg-orange-50" };
      case NewsGenre.POLITICS: return { icon: "fa-solid fa-landmark", color: "text-purple-600", bg: "bg-purple-50" };
      case NewsGenre.CURRENT_AFFAIRS: return { icon: "fa-solid fa-bolt", color: "text-amber-600", bg: "bg-amber-50" };
      case NewsGenre.SPORTS: return { icon: "fa-solid fa-trophy", color: "text-green-600", bg: "bg-green-50" };
      case NewsGenre.ENTERTAINMENT: return { icon: "fa-solid fa-film", color: "text-pink-600", bg: "bg-pink-50" };
      case NewsGenre.BUSINESS: return { icon: "fa-solid fa-chart-line", color: "text-blue-600", bg: "bg-blue-50" };
      case NewsGenre.TECH: return { icon: "fa-solid fa-microchip", color: "text-indigo-600", bg: "bg-indigo-50" };
      case NewsGenre.HEALTH: return { icon: "fa-solid fa-heart-pulse", color: "text-red-600", bg: "bg-red-50" };
      case NewsGenre.CRIME: return { icon: "fa-solid fa-handcuffs", color: "text-gray-800", bg: "bg-gray-100" };
      case NewsGenre.EDUCATION: return { icon: "fa-solid fa-graduation-cap", color: "text-emerald-600", bg: "bg-emerald-50" };
      default: return { icon: "fa-solid fa-newspaper", color: "text-gray-600", bg: "bg-gray-50" };
    }
  };

  const getSourceDetails = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('x') || s.includes('twitter')) return { icon: "fa-brands fa-x-twitter", label: "Social", color: "text-black" };
    if (s.includes('reddit')) return { icon: "fa-brands fa-reddit-alien", label: "Social", color: "text-orange-600" };
    if (s.includes('facebook')) return { icon: "fa-brands fa-facebook", label: "Social", color: "text-blue-700" };
    if (s.includes('instagram')) return { icon: "fa-brands fa-instagram", label: "Social", color: "text-pink-600" };
    return { icon: "fa-solid fa-globe", label: "Media", color: "text-blue-600" };
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: news.title, text: news.summary, url: news.sourceUrl }).catch(console.error);
    } else {
      navigator.clipboard.writeText(news.sourceUrl).then(() => alert(isKannada ? 'ಲಿಂಕ್ ಕಾಪಿ ಮಾಡಲಾಗಿದೆ!' : 'Link copied!'));
    }
  };

  const styles = getGenreStyles(news.category as NewsGenre);
  const sourceDetails = getSourceDetails(news.source);

  const getKannadaGenre = (genre: string) => {
    const map: Record<string, string> = { [NewsGenre.TRENDING]: 'ಟ್ರೆಂಡಿಂಗ್', [NewsGenre.POLITICS]: 'ರಾಜಕೀಯ', [NewsGenre.CURRENT_AFFAIRS]: 'ಪ್ರಚಲಿತ', [NewsGenre.SPORTS]: 'ಕ್ರೀಡೆ', [NewsGenre.ENTERTAINMENT]: 'ಮನರಂಜನೆ', [NewsGenre.BUSINESS]: 'ವ್ಯಾಪಾರ', [NewsGenre.TECH]: 'ತಂತ್ರಜ್ಞಾನ', [NewsGenre.HEALTH]: 'ಆರೋಗ್ಯ', [NewsGenre.CRIME]: 'ಅಪರಾಧ', [NewsGenre.EDUCATION]: 'ಶಿಕ್ಷಣ' };
    return map[genre] || genre;
  };

  return (
    <article 
      onClick={() => onClick(news)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(news)}
      tabIndex={0}
      className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer transform hover:-translate-y-2 outline-none"
      aria-labelledby={`news-title-${news.id}`}
    >
      <div className="relative h-60 w-full overflow-hidden">
        <img 
          src={news.imageUrl} 
          alt="" 
          aria-hidden="true"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {news.isUrgent && (
          <div className="absolute top-4 left-4 bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-xl uppercase tracking-[0.2em] animate-pulse z-20">
            {isKannada ? 'ಬ್ರೇಕಿಂಗ್' : 'Breaking'}
          </div>
        )}

        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button 
            onClick={(e) => onToggleReadLater(e, news)}
            aria-label={isReadLater ? (isKannada ? "ನಂತರ ಓದಲು ಪಟ್ಟಿಯಿಂದ ತೆಗೆದುಹಾಕಿ" : "Remove from Read Later") : (isKannada ? "ನಂತರ ಓದಲು ಸೇರಿಸಿ" : "Add to Read Later")}
            className={`w-9 h-9 ${isReadLater ? 'bg-orange-500 text-white' : 'bg-white/90 text-gray-900 hover:bg-white'} backdrop-blur-md rounded-xl flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95`}
          >
            <i className={`fa-${isReadLater ? 'solid' : 'regular'} fa-clock text-sm`} aria-hidden="true"></i>
          </button>

          <button 
            onClick={(e) => onToggleSave(e, news)}
            aria-label={isSaved ? (isKannada ? "ಉಳಿಸಿದ ಪಟ್ಟಿಯಿಂದ ತೆಗೆದುಹಾಕಿ" : "Remove from saved") : (isKannada ? "ಸುದ್ದಿ ಉಳಿಸಿ" : "Save article")}
            className={`w-9 h-9 ${isSaved ? 'bg-blue-600 text-white' : 'bg-white/90 text-gray-900 hover:bg-white'} backdrop-blur-md rounded-xl flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95`}
          >
            <i className={`fa-${isSaved ? 'solid' : 'regular'} fa-bookmark text-sm`} aria-hidden="true"></i>
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-20">
           <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black flex items-center gap-2 backdrop-blur-md bg-white/95 shadow-lg ${styles.color} transition-transform group-hover:scale-105`}>
            <i className={styles.icon} aria-hidden="true"></i>
            <span className="uppercase tracking-[0.1em]">{isKannada ? getKannadaGenre(news.category) : news.category}</span>
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <button 
              onClick={(e) => onReaction(e, news.id, 'up')}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${reaction === 'up' ? 'bg-green-500 text-white' : 'bg-white/95 text-gray-400 hover:text-green-500'}`}
             >
               <i className="fa-solid fa-thumbs-up text-[10px]"></i>
             </button>
             <button 
              onClick={(e) => onReaction(e, news.id, 'down')}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${reaction === 'down' ? 'bg-red-500 text-white' : 'bg-white/95 text-gray-400 hover:text-red-500'}`}
             >
               <i className="fa-solid fa-thumbs-down text-[10px]"></i>
             </button>
          </div>
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${sourceDetails.label === 'Social' ? 'bg-black text-white' : 'bg-blue-50 text-blue-700'}`}>
            {sourceDetails.label}
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {news.timestamp}
          </span>
        </div>
        
        <h3 id={`news-title-${news.id}`} className={`text-xl font-black mb-4 leading-snug text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 ${isKannada ? 'kannada-font' : 'news-heading'}`}>
          {news.title}
        </h3>
        
        <p className={`text-sm text-gray-500 mb-6 line-clamp-3 flex-grow leading-relaxed ${isKannada ? 'kannada-font text-base' : ''}`}>
          {news.summary}
        </p>
        
        <div className="flex items-center justify-between pt-5 border-t border-gray-50 mt-auto">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 ${sourceDetails.color} shadow-inner`}>
              <i className={`${sourceDetails.icon} text-sm`} aria-hidden="true"></i>
            </div>
            <span className="text-[11px] font-black text-gray-500 truncate max-w-[120px] uppercase tracking-wider">
              {news.source}
            </span>
          </div>
          <button 
            onClick={handleShare}
            aria-label="Share"
            className="text-gray-300 hover:text-orange-600 transition-colors p-2"
          >
            <i className="fa-solid fa-share-nodes text-sm"></i>
          </button>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
