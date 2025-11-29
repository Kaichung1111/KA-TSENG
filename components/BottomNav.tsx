import React from 'react';
import { Layers, LayoutTemplate, Settings } from './Icons';

export const BottomNav = () => {
  return (
    <div className="h-[83px] bg-white border-t border-gray-200 sticky bottom-0 z-20 w-full">
      <div className="max-w-md mx-auto h-full flex items-start pt-3 justify-around pb-8">
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <Layers className="text-primary w-7 h-7" />
          <span className="text-[10px] font-medium text-primary">My Flows</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <LayoutTemplate className="text-gray-400 w-7 h-7" />
          <span className="text-[10px] font-medium text-gray-400">Templates</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <Settings className="text-gray-400 w-7 h-7" />
          <span className="text-[10px] font-medium text-gray-400">Settings</span>
        </div>
      </div>
    </div>
  );
};