
import React, { useState } from 'react';
import { OrganType, OrganAssessment, UserProfile, AssessmentResult, DayPlan, Language } from './types';
import { BodyOutline, ORGAN_DATA } from './constants';
import OrganCard from './components/OrganCard';
import { analyzeHealthData } from './services/geminiService';
import { TRANSLATIONS } from './translations';

const CHRONIC_CONDITIONS_LIST = [
  'Diabetes',
  'Hypertension (High BP)',
  'Allergies (Food/Seasonal)',
  'Chronic Fatigue',
  'Asthma',
  'Thyroid Issues',
  'Heart Disease',
  'Arthritis / Joint Pain',
  'Digestive Issues (IBS/IBD)',
  'Anxiety / Stress',
  'Sleep Disorders'
];

const LanguageSwitcher: React.FC<{ current: Language; onSelect: (l: Language) => void }> = ({ current, onSelect }) => {
  const langs: { code: Language; label: string; flag: string }[] = [
    { code: 'az', label: 'AZE', flag: '🇦🇿' },
    { code: 'ru', label: 'RUS', flag: '🇷🇺' },
    { code: 'tr', label: 'TUR', flag: '🇹🇷' },
    { code: 'en', label: 'ENG', flag: '🇺🇸' },
    { code: 'de', label: 'DEU', flag: '🇩🇪' },
    { code: 'fr', label: 'FRA', flag: '🇫🇷' },
    { code: 'th', label: 'THA', flag: '🇹🇭' }
  ];

  return (
    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => onSelect(l.code)}
          className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${
            current === l.code ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>{l.flag}</span>
          <span className="hidden sm:inline">{l.label}</span>
        </button>
      ))}
    </div>
  );
};

const ConsultationModal: React.FC<{ isOpen: boolean; onClose: () => void; t: any }> = ({ isOpen, onClose, t }) => {
  const [submitted, setSubmitted] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
          <i className="fas fa-times text-xl"></i>
        </button>
        
        {!submitted ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 text-2xl mx-auto mb-4">
                <i className="fas fa-calendar-check"></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">{t.modal_title}</h3>
              <p className="text-slate-500 mt-2">{t.modal_desc}</p>
            </div>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.modal_name}</label>
                <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.modal_contact}</label>
                <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="..." />
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-100">
                {t.modal_button}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-4xl mx-auto mb-2 animate-bounce">
              <i className="fas fa-check"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{t.modal_success}</h3>
            <p className="text-slate-500">{t.modal_success_desc}</p>
            <button onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all mt-4">
              {t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [step, setStep] = useState<number>(0);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ 
    name: '', 
    age: '', 
    dietType: 'Balanced',
    tiredness: 'Rarely',
    dailyMovementKm: '2',
    workType: 'Office',
    weightKg: '70',
    heightCm: '170',
    chronicConditions: []
  });
  
  const [selectedOrgans, setSelectedOrgans] = useState<Set<OrganType>>(new Set());
  const [hoveredOrgan, setHoveredOrgan] = useState<OrganType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  const toggleOrgan = (organ: OrganType) => {
    setSelectedOrgans(prev => {
      const next = new Set(prev);
      if (next.has(organ)) next.delete(organ);
      else next.add(organ);
      return next;
    });
  };

  const updateConditionValue = (baseCondition: string, subValue: string) => {
    setProfile(prev => {
      const filtered = prev.chronicConditions.filter(c => !c.startsWith(baseCondition));
      if (subValue === "") return { ...prev, chronicConditions: filtered };
      return { ...prev, chronicConditions: [...filtered, `${baseCondition} (${subValue})`] };
    });
  };

  const toggleCondition = (condition: string) => {
    setProfile(prev => {
      const exists = prev.chronicConditions.some(c => c.startsWith(condition));
      if (exists) {
        return { ...prev, chronicConditions: prev.chronicConditions.filter(c => !c.startsWith(condition)) };
      } else {
        return { ...prev, chronicConditions: [...prev.chronicConditions, condition] };
      }
    });
  };

  const calculateBMI = () => {
    const w = parseFloat(profile.weightKg);
    const h = parseFloat(profile.heightCm) / 100;
    if (!w || !h) return { bmi: 0, label: 'N/A', color: 'text-slate-400' };
    const bmi = w / (h * h);
    let label = '';
    let color = '';
    if (bmi < 18.5) { label = t.bmi_categories.underweight; color = 'text-blue-500'; }
    else if (bmi < 25) { label = t.bmi_categories.normal; color = 'text-green-500'; }
    else if (bmi < 30) { label = t.bmi_categories.overweight; color = 'text-amber-500'; }
    else { label = t.bmi_categories.obese; color = 'text-red-500'; }
    return { bmi: bmi.toFixed(1), label, color };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const assessmentArray: OrganAssessment[] = Object.values(OrganType).map((organ) => ({
        organ,
        needsSupport: selectedOrgans.has(organ)
      }));
      const data = await analyzeHealthData(profile, assessmentArray, lang);
      setResult(data);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderLandingPage = () => (
    <div className="max-w-6xl mx-auto space-y-20 py-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row items-center gap-12">
        <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Powered by Gemini AI
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
            {t.landing_title}
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
            {t.landing_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button 
              onClick={() => setStep(1)}
              className="px-8 py-5 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-2xl shadow-green-200 transition-all transform hover:-translate-y-1 active:scale-95 text-lg flex items-center justify-center gap-3"
            >
              {t.landing_start}
              <i className="fas fa-arrow-right"></i>
            </button>
            <button 
              onClick={() => setShowConsultationModal(true)}
              className="px-8 py-5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 transition-all text-lg"
            >
              {t.consultation}
            </button>
          </div>
        </div>
        <div className="lg:w-1/2 relative">
          <div className="absolute -inset-4 bg-green-500/10 rounded-[40px] blur-3xl"></div>
          <div className="relative bg-white p-4 rounded-[40px] shadow-2xl border border-slate-100 transform lg:rotate-3">
            <img 
              src="https://picsum.photos/seed/health/800/600" 
              alt="Health Analysis" 
              className="rounded-[32px] w-full object-cover shadow-inner"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-50 animate-bounce duration-[3000ms]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                  <i className="fas fa-bolt text-xl"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Vitality Score</p>
                  <p className="text-xl font-black text-slate-800">98%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: 'fa-map-marked-alt', color: 'bg-blue-100 text-blue-600', title: t.feature1_title, desc: t.feature1_desc },
          { icon: 'fa-brain', color: 'bg-purple-100 text-purple-600', title: t.feature2_title, desc: t.feature2_desc },
          { icon: 'fa-calendar-check', color: 'bg-green-100 text-green-600', title: t.feature3_title, desc: t.feature3_desc }
        ].map((f, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
              <i className={`fas ${f.icon}`}></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">{f.title}</h3>
            <p className="text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">{t.step1_title}</h2>
        <p className="text-slate-500">{t.step1_desc}</p>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 border-b border-slate-100 pb-2 mb-2">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <i className="fas fa-user-circle text-green-500"></i> {t.basic_info}
          </h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.name_label}</label>
          <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.age_label}</label>
          <select className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })}>
            <option value="">...</option>
            <option value="18-25">18 - 25</option>
            <option value="26-35">26 - 35</option>
            <option value="36-50">36 - 50</option>
            <option value="51-65">51 - 65</option>
            <option value="66+">66+</option>
          </select>
        </div>

        <div className="md:col-span-2 border-b border-slate-100 pb-2 mt-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <i className="fas fa-weight text-green-500"></i> {t.metrics}
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.weight_label}</label>
          <input type="number" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" value={profile.weightKg} onChange={(e) => setProfile({ ...profile, weightKg: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.height_label}</label>
          <input type="number" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" value={profile.heightCm} onChange={(e) => setProfile({ ...profile, heightCm: e.target.value })} />
        </div>

        <div className="md:col-span-2 border-b border-slate-100 pb-2 mt-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <i className="fas fa-walking text-green-500"></i> {t.lifestyle}
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.tired_label}</label>
          <select className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" value={profile.tiredness} onChange={(e) => setProfile({ ...profile, tiredness: e.target.value })}>
            <option value="Rarely">Rarely</option>
            <option value="Sometimes">Sometimes</option>
            <option value="Often">Often</option>
            <option value="Always">Always</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.movement_label}</label>
          <input type="number" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" value={profile.dailyMovementKm} onChange={(e) => setProfile({ ...profile, dailyMovementKm: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.work_label}</label>
          <select className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" value={profile.workType} onChange={(e) => setProfile({ ...profile, workType: e.target.value })}>
            <option value="Office">Office</option>
            <option value="Active">Active</option>
            <option value="Remote">Remote</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.diet_label}</label>
          <select className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all" value={profile.dietType} onChange={(e) => setProfile({ ...profile, dietType: e.target.value })}>
            <option value="Balanced">Balanced</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Vegan">Vegan</option>
          </select>
        </div>

        <div className="md:col-span-2 pt-4">
          <button disabled={!profile.name || !profile.age} onClick={() => setStep(2)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50">
            {t.next_body}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const displayOrgan = hoveredOrgan || Array.from(selectedOrgans).pop();
    const organInfo = displayOrgan ? {
      name: t.organs[displayOrgan],
      desc: t.organ_descriptions[displayOrgan]
    } : null;

    return (
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 animate-in slide-in-from-bottom-10 duration-500 pb-12">
        <div className="lg:w-1/3 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center sticky top-24 h-fit">
          <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">{t.step2_title}</h3>
          <p className="text-xs text-slate-400 mb-6 text-center">{t.step2_desc}</p>
          <div className="w-full max-w-[300px] aspect-[2/5] relative mb-6">
            <BodyOutline 
              activeOrgan={hoveredOrgan || undefined} 
              onSelect={toggleOrgan} 
              onHover={setHoveredOrgan}
              selectedOrgans={selectedOrgans}
            />
          </div>
          
          {organInfo && (
            <div className="w-full p-4 bg-green-50 rounded-xl border border-green-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h4 className="font-bold text-green-800 text-sm mb-1">{organInfo.name}</h4>
              <p className="text-xs text-green-700 leading-relaxed">{organInfo.desc}</p>
            </div>
          )}
        </div>

        <div className="lg:w-2/3 space-y-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-slate-800">{t.support_selections}</h3>
            <p className="text-slate-500">{t.support_desc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(OrganType).map((organ) => (
              <div 
                key={organ}
                onMouseEnter={() => setHoveredOrgan(organ)}
                onMouseLeave={() => setHoveredOrgan(null)}
              >
                <OrganCard 
                  organ={organ} 
                  isSelected={selectedOrgans.has(organ)} 
                  onToggle={() => toggleOrgan(organ)} 
                  lang={lang} 
                />
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-4 rounded-xl transition-all">{t.back}</button>
            <button onClick={() => setStep(3)} className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all">{t.next_medical}</button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">{t.step3_title}</h2>
        <p className="text-slate-500">{t.step3_desc}</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 space-y-6">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
          <i className="fas fa-notes-medical text-green-500"></i> {t.medical_concerns}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CHRONIC_CONDITIONS_LIST.map((condition) => {
            const isSelected = profile.chronicConditions.some(c => c.startsWith(condition));
            const selectedDetail = profile.chronicConditions.find(c => c.startsWith(condition));
            const currentValue = selectedDetail?.match(/\((.*)\)/)?.[1] || "";
            const subOptions = t.sub_options[condition] || [];

            return (
              <div key={condition} className="space-y-2">
                <button 
                  onClick={() => toggleCondition(condition)} 
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${isSelected ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}>
                    {isSelected && <i className="fas fa-check text-[10px]"></i>}
                  </div>
                  <span className="font-bold text-sm">{t.conditions[condition] || condition}</span>
                </button>

                {isSelected && (
                  <div className="px-4 pb-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {t.condition_questions?.[condition] && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {t.condition_questions[condition]}
                      </p>
                    )}
                    <div className="space-y-2">
                      {subOptions.length > 0 && (
                        <select
                          className="w-full p-2 bg-white border border-green-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-green-500 outline-none"
                          value={subOptions.includes(currentValue) ? currentValue : ""}
                          onChange={(e) => updateConditionValue(condition, e.target.value)}
                        >
                          <option value="">{t.select_type}...</option>
                          {subOptions.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        placeholder={t.detail_placeholder || "Specific details..."}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none"
                        value={!subOptions.includes(currentValue) ? currentValue : ""}
                        onChange={(e) => updateConditionValue(condition, e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-6 flex gap-4">
          <button onClick={() => setStep(2)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-4 rounded-xl transition-all">{t.back}</button>
          <button onClick={handleSubmit} className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all">
            {loading ? <span className="flex items-center justify-center gap-2"><i className="fas fa-circle-notch fa-spin"></i> {t.analyzing}</span> : t.generate_plan}
          </button>
        </div>
        {error && <p className="text-red-500 text-center font-medium bg-red-50 p-3 rounded-lg">{error}</p>}
      </div>
    </div>
  );

  const renderPrintLayout = () => {
    if (!result) return null;
    const bmiData = calculateBMI();
    return (
      <div className="print-only p-12 space-y-8 bg-white text-slate-900">
        <div className="flex justify-between items-start border-b-2 border-green-500 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">{t.title} - {t.report_title}</h1>
            <p className="text-slate-500 mt-2">{profile.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.bmi_report}</p>
            <div className="flex items-baseline justify-end gap-2">
              <span className="text-sm font-bold text-slate-600">{bmiData.label}</span>
              <p className="text-3xl font-black">{bmiData.bmi}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold border-l-4 border-green-500 pl-4">{t.expert_summary}</h2>
          <p className="text-lg leading-relaxed italic text-slate-700">{result.summary}</p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-amber-600">{t.vitamin_insights}</h2>
            <ul className="list-disc list-inside space-y-1">
              {result.deficiencies.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-green-600">{t.lifestyle_opt}</h2>
            <ul className="list-disc list-inside space-y-1">
              {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>

        <div className="space-y-6 pt-12">
          <h2 className="text-2xl font-bold border-b-2 border-slate-100 pb-2">{t.weekly_plan}</h2>
          <div className="space-y-8">
            {result.weeklyPlan.map((day) => (
              <div key={day.day} className="border border-slate-200 rounded-2xl p-6">
                <h3 className="text-xl font-black text-green-600 mb-4">{day.day}</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div><p className="text-xs font-bold uppercase text-slate-400">{t.breakfast}</p><p className="text-sm">{day.breakfast}</p></div>
                  <div><p className="text-xs font-bold uppercase text-slate-400">{t.lunch}</p><p className="text-sm">{day.lunch}</p></div>
                  <div><p className="text-xs font-bold uppercase text-slate-400">{t.dinner}</p><p className="text-sm">{day.dinner}</p></div>
                  <div><p className="text-xs font-bold uppercase text-slate-400">{t.snack}</p><p className="text-sm">{day.snack}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    if (!result) return null;
    const currentDay = result.weeklyPlan[activeDayIndex];
    const bmiData = calculateBMI();

    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in duration-500 pb-20 no-print">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 text-3xl">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{t.report_title}</h2>
                <p className="text-slate-500 tracking-tight">{profile.name} • {profile.age}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-right">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{t.bmi_report}</span>
              <div className="flex items-baseline justify-end gap-2">
                <span className={`text-sm font-bold ${bmiData.color}`}>{bmiData.label}</span>
                <span className="text-2xl font-black text-slate-800">{bmiData.bmi}</span>
              </div>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-info-circle text-green-500"></i> {t.expert_summary}
            </h3>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border-l-8 border-green-500 italic shadow-inner">"{result.summary}"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-amber-50/30 p-6 rounded-2xl border border-amber-100 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle text-amber-500"></i> {t.vitamin_insights}
                </h3>
                <ul className="space-y-3">
                  {result.deficiencies.map((d, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full flex-shrink-0"></span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => window.open('https://www.aznanovit.com', '_blank')} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                <i className="fas fa-shopping-cart"></i> {t.order_now}
              </button>
            </div>

            <div className="bg-green-50/30 p-6 rounded-2xl border border-green-100 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-leaf text-green-500"></i> {t.lifestyle_opt}
              </h3>
              <ul className="space-y-3">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <i className="fas fa-check-circle text-green-500 mt-1 flex-shrink-0"></i>
                    <span className="text-sm font-medium">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-calendar-alt text-green-600"></i> {t.weekly_plan}
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                {result.weeklyPlan.map((day, idx) => (
                  <button key={day.day} onClick={() => setActiveDayIndex(idx)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeDayIndex === idx ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    {day.day}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 uppercase tracking-widest">{t.breakfast}</span><p className="text-slate-700 text-sm font-medium leading-relaxed">{currentDay.breakfast}</p></div>
              <div className="space-y-2"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-widest">{t.lunch}</span><p className="text-slate-700 text-sm font-medium leading-relaxed">{currentDay.lunch}</p></div>
              <div className="space-y-2"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-widest">{t.dinner}</span><p className="text-slate-700 text-sm font-medium leading-relaxed">{currentDay.dinner}</p></div>
              <div className="space-y-2"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 uppercase tracking-widest">{t.snack}</span><p className="text-slate-700 text-sm font-medium leading-relaxed">{currentDay.snack}</p></div>
            </div>

            <div className="flex justify-center pt-4">
              <button onClick={() => setShowConsultationModal(true)} className="bg-green-600 hover:bg-green-700 text-white font-black py-4 px-8 rounded-2xl transition-all flex items-center gap-3">
                <i className="fas fa-video"></i> {t.consultation}
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-8">
            <button onClick={() => window.print()} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
              <i className="fas fa-print"></i> {t.print_guide}
            </button>
            <button onClick={() => setStep(1)} className="flex-[2] bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-xl">
              {t.start_new}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 bg-[#f8fafc]">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 mb-12 sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setStep(0)}>
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-hand-holding-heart text-lg"></i>
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tighter hidden sm:block">{t.title}</span>
          </div>
          
          <div className="flex-1 flex justify-center">
            <LanguageSwitcher current={lang} onSelect={setLang} />
          </div>

          <div className="flex items-center gap-4">
            {step > 0 && (
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.nav_phase} {step}/4</span>
            )}
          </div>
        </div>
      </nav>

      <main className="px-6">
        {step === 0 && renderLandingPage()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </main>

      {renderPrintLayout()}
      <ConsultationModal isOpen={showConsultationModal} onClose={() => setShowConsultationModal(false)} t={t} />
    </div>
  );
};

export default App;
