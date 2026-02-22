
import React from 'react';
import { OrganType } from './types';

export const ORGAN_DATA: Record<OrganType, { icon: string; description: string; x: string; y: string }> = {
  [OrganType.BRAIN]: { icon: 'fa-brain', description: 'Cognitive function, focus, and memory.', x: '50%', y: '8%' },
  [OrganType.EYES]: { icon: 'fa-eye', description: 'Visual health and screen-time fatigue.', x: '50%', y: '12%' },
  [OrganType.HEART]: { icon: 'fa-heartbeat', description: 'Cardiovascular health and circulation.', x: '50%', y: '25%' },
  [OrganType.LUNGS]: { icon: 'fa-lungs', description: 'Respiratory health and oxygenation.', x: '42%', y: '23%' },
  [OrganType.LIVER]: { icon: 'fa-vial', description: 'Detoxification and metabolism.', x: '58%', y: '33%' },
  [OrganType.STOMACH]: { icon: 'fa-utensils', description: 'Digestion and nutrient absorption.', x: '50%', y: '38%' },
  [OrganType.KIDNEYS]: { icon: 'fa-tint', description: 'Filtration and fluid balance.', x: '45%', y: '45%' },
  [OrganType.BONES]: { icon: 'fa-bone', description: 'Skeletal strength and joint mobility.', x: '50%', y: '65%' },
  [OrganType.SKIN]: { icon: 'fa-user', description: 'External protection and regeneration.', x: '30%', y: '50%' },
};

export const BodyOutline: React.FC<{ 
  activeOrgan?: OrganType; 
  onSelect: (o: OrganType) => void;
  onHover?: (o: OrganType | null) => void;
  selectedOrgans: Set<OrganType>;
}> = ({ activeOrgan, onSelect, onHover, selectedOrgans }) => (
  <svg viewBox="0 0 200 500" className="w-full h-full body-map-svg drop-shadow-2xl">
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Body Silhouette */}
    <path 
      d="M100,20 C80,20 70,40 70,60 C70,80 80,100 100,100 C120,100 130,80 130,60 C130,40 120,20 100,20 M70,80 Q50,100 40,140 L35,220 Q35,240 50,240 L60,240 L65,480 Q65,495 80,495 L120,495 Q135,495 135,480 L140,240 L150,240 Q165,240 165,220 L160,140 Q150,100 130,80" 
      fill="#f8fafc" 
      stroke="#cbd5e1" 
      strokeWidth="1.5" 
    />
    
    {/* Organ Hotspots */}
    {[
      { type: OrganType.BRAIN, shape: 'circle', cx: 100, cy: 50, r: 14 },
      { type: OrganType.EYES, shape: 'eyes' },
      { type: OrganType.HEART, shape: 'circle', cx: 100, cy: 130, r: 14 },
      { type: OrganType.LUNGS, shape: 'lungs' },
      { type: OrganType.LIVER, shape: 'circle', cx: 110, cy: 170, r: 14 },
      { type: OrganType.STOMACH, shape: 'circle', cx: 100, cy: 180, r: 14 },
      { type: OrganType.KIDNEYS, shape: 'kidneys' },
      { type: OrganType.BONES, shape: 'rect', x: 90, y: 300, width: 20, height: 150 },
      { type: OrganType.SKIN, shape: 'rect', x: 40, y: 250, width: 10, height: 100 },
    ].map((item, idx) => {
      const isSelected = selectedOrgans.has(item.type);
      const isActive = activeOrgan === item.type;
      const baseClass = `organ-hotspot transition-all duration-300 cursor-pointer hover:stroke-green-400 hover:stroke-2 ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`;
      const fill = isSelected ? '#22c55e' : (isActive ? '#86efac' : '#e2e8f0');
      const stroke = isSelected ? '#16a34a' : (isActive ? '#22c55e' : '#94a3b8');
      const filter = (isSelected || isActive) ? 'url(#glow)' : 'none';

      const commonProps = {
        key: idx,
        className: baseClass,
        fill,
        stroke,
        strokeWidth: isSelected || isActive ? 2 : 1,
        filter,
        onClick: () => onSelect(item.type),
        onMouseEnter: () => onHover?.(item.type),
        onMouseLeave: () => onHover?.(null),
      };

      if (item.shape === 'circle') {
        return <circle {...commonProps} cx={item.cx} cy={item.cy} r={item.r} />;
      }
      if (item.shape === 'rect') {
        return <rect {...commonProps} x={item.x} y={item.y} width={item.width} height={item.height} rx="4" />;
      }
      if (item.shape === 'eyes') {
        return (
          <g key={idx} className={baseClass} onClick={() => onSelect(item.type)} onMouseEnter={() => onHover?.(item.type)} onMouseLeave={() => onHover?.(null)}>
            <circle cx="92" cy="65" r="5" fill={fill} stroke={stroke} filter={filter} />
            <circle cx="108" cy="65" r="5" fill={fill} stroke={stroke} filter={filter} />
          </g>
        );
      }
      if (item.shape === 'lungs') {
        return (
          <g key={idx} className={baseClass} onClick={() => onSelect(item.type)} onMouseEnter={() => onHover?.(item.type)} onMouseLeave={() => onHover?.(null)}>
            <circle cx="85" cy="125" r="12" fill={fill} stroke={stroke} filter={filter} />
            <circle cx="115" cy="125" r="12" fill={fill} stroke={stroke} filter={filter} />
          </g>
        );
      }
      if (item.shape === 'kidneys') {
        return (
          <g key={idx} className={baseClass} onClick={() => onSelect(item.type)} onMouseEnter={() => onHover?.(item.type)} onMouseLeave={() => onHover?.(null)}>
            <circle cx="90" cy="210" r="10" fill={fill} stroke={stroke} filter={filter} />
            <circle cx="110" cy="210" r="10" fill={fill} stroke={stroke} filter={filter} />
          </g>
        );
      }
      return null;
    })}
  </svg>
);
