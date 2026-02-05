
import React from 'react';
import { OrganType } from '../types';
import { ORGAN_DATA } from '../constants';

interface OrganSliderProps {
  organ: OrganType;
  value: number;
  onChange: (val: number) => void;
}

const OrganSlider: React.FC<OrganSliderProps> = ({ organ, value, onChange }) => {
  const data = ORGAN_DATA[organ];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
          <i className={`fas ${data.icon} text-lg`}></i>
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">{organ}</h3>
          <p className="text-xs text-slate-500">{data.description}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-slate-400">
          <span>Poor</span>
          <span className="text-green-600 font-bold">{value}%</span>
          <span>Optimal</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
      </div>
    </div>
  );
};

export default OrganSlider;
