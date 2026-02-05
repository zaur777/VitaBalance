
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

export const BodyOutline: React.FC<{ activeOrgan?: OrganType; onSelect: (o: OrganType) => void }> = ({ activeOrgan, onSelect }) => (
  <svg viewBox="0 0 200 500" className="w-full h-full body-map-svg">
    {/* Body Silhouette */}
    <path 
      d="M100,20 C80,20 70,40 70,60 C70,80 80,100 100,100 C120,100 130,80 130,60 C130,40 120,20 100,20 M70,80 Q50,100 40,140 L35,220 Q35,240 50,240 L60,240 L65,480 Q65,495 80,495 L120,495 Q135,495 135,480 L140,240 L150,240 Q165,240 165,220 L160,140 Q150,100 130,80" 
      fill="#e2e8f0" 
      stroke="#94a3b8" 
      strokeWidth="2" 
    />
    
    {/* Organ Hotspots */}
    <circle cx="100" cy="50" r="12" className={`organ-hotspot ${activeOrgan === OrganType.BRAIN ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.BRAIN)} />
    
    {/* Eyes */}
    <circle cx="92" cy="65" r="4" className={`organ-hotspot ${activeOrgan === OrganType.EYES ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.EYES)} />
    <circle cx="108" cy="65" r="4" className={`organ-hotspot ${activeOrgan === OrganType.EYES ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.EYES)} />
    
    <circle cx="100" cy="130" r="12" className={`organ-hotspot ${activeOrgan === OrganType.HEART ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.HEART)} />
    <circle cx="85" cy="125" r="10" className={`organ-hotspot ${activeOrgan === OrganType.LUNGS ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.LUNGS)} />
    <circle cx="115" cy="125" r="10" className={`organ-hotspot ${activeOrgan === OrganType.LUNGS ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.LUNGS)} />
    <circle cx="110" cy="170" r="12" className={`organ-hotspot ${activeOrgan === OrganType.LIVER ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.LIVER)} />
    <circle cx="100" cy="180" r="12" className={`organ-hotspot ${activeOrgan === OrganType.STOMACH ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.STOMACH)} />
    <circle cx="90" cy="210" r="8" className={`organ-hotspot ${activeOrgan === OrganType.KIDNEYS ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.KIDNEYS)} />
    <circle cx="110" cy="210" r="8" className={`organ-hotspot ${activeOrgan === OrganType.KIDNEYS ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.KIDNEYS)} />
    <rect x="90" y="300" width="20" height="150" className={`organ-hotspot ${activeOrgan === OrganType.BONES ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.BONES)} />
    <rect x="40" y="250" width="10" height="100" className={`organ-hotspot ${activeOrgan === OrganType.SKIN ? 'active' : ''}`} fill="#cbd5e1" onClick={() => onSelect(OrganType.SKIN)} />
  </svg>
);
