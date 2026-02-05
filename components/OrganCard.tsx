
import React from 'react';
import { OrganType, Language } from '../types';
import { ORGAN_DATA } from '../constants';
import { TRANSLATIONS } from '../translations';

interface OrganCardProps {
  organ: OrganType;
  isSelected: boolean;
  onToggle: () => void;
  lang: Language;
}

const OrganCard: React.FC<OrganCardProps> = ({ organ, isSelected, onToggle, lang }) => {
  const data = ORGAN_DATA[organ];
  const t = TRANSLATIONS[lang];

  return (
    <button
      onClick={onToggle}
      className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 group ${
        isSelected 
          ? 'bg-green-50 border-green-500 shadow-lg shadow-green-100' 
          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${
          isSelected ? 'bg-green-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'
        }`}>
          <i className={`fas ${data.icon}`}></i>
        </div>
        <div className="flex-1">
          <h3 className={`font-bold transition-colors ${isSelected ? 'text-green-800' : 'text-slate-700'}`}>
            {t.organs[organ]}
          </h3>
          <p className="text-[10px] text-slate-400 leading-tight uppercase tracking-wider font-semibold">
            {isSelected ? t.support_active : t.select_support}
          </p>
        </div>
        {isSelected && (
          <div className="bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] animate-in zoom-in duration-200">
            <i className="fas fa-check"></i>
          </div>
        )}
      </div>
    </button>
  );
};

export default OrganCard;
