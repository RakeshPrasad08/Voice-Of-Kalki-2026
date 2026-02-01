
import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 flex flex-col h-full overflow-hidden p-0 shadow-sm">
      <div className="shimmer w-full h-60"></div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="shimmer w-12 h-4 rounded-md"></div>
          <div className="shimmer w-20 h-3 rounded-md"></div>
        </div>
        
        <div className="shimmer w-full h-6 rounded-md mb-2"></div>
        <div className="shimmer w-3/4 h-6 rounded-md mb-6"></div>
        
        <div className="shimmer w-full h-4 rounded-md mb-2"></div>
        <div className="shimmer w-full h-4 rounded-md mb-2"></div>
        <div className="shimmer w-2/3 h-4 rounded-md mb-8"></div>
        
        <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="shimmer w-8 h-8 rounded-full"></div>
            <div className="shimmer w-24 h-3 rounded-md"></div>
          </div>
          <div className="shimmer w-5 h-5 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
