'use client'

import React, { useState } from 'react';
import { VisualScreen, VisualComponent } from '@/lib/whatsapp/flows/validator';
import { Battery, Wifi, Signal, ChevronLeft, X, ChevronDown, Calendar, Upload, Camera, FileText, Check } from 'lucide-react';

interface WhatsappPreviewProps {
  screen: VisualScreen | null;
}

/**
 * High-fidelity WhatsApp Flows WYSIWYG Preview.
 * Renders the screen components exactly as they appear in the native WhatsApp
 * Flows interface on a user's phone.
 */
export default function WhatsappPreview({ screen }: WhatsappPreviewProps) {
  const [selectedRadio, setSelectedRadio] = useState<string | null>(null);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  if (!screen) {
    return (
      <div className="w-[340px] h-[700px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[44px] border-[10px] border-slate-700 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
        {/* Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-slate-700 rounded-b-[18px] z-30" />
        <div className="text-slate-500 text-sm px-10 text-center leading-relaxed">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12" y2="18" />
            </svg>
          </div>
          Sélectionnez un écran<br />pour voir l&apos;aperçu
        </div>
      </div>
    );
  }

  const toggleCheckbox = (optId: string) => {
    setSelectedCheckboxes(prev => {
      const next = new Set(prev);
      if (next.has(optId)) next.delete(optId);
      else next.add(optId);
      return next;
    });
  };

  const renderComponent = (comp: VisualComponent, index: number) => {
    switch (comp.type) {
      case 'TextHeading':
        return (
          <div key={index} className="mb-1">
            <h2 className="text-[17px] font-bold text-[#111b21] leading-snug">
              {comp.text || comp.label || 'Titre'}
            </h2>
          </div>
        );

      case 'TextBody':
        return (
          <div key={index} className="mb-3">
            <p className="text-[14px] text-[#667781] leading-relaxed">
              {comp.text || comp.label || 'Corps du texte'}
            </p>
          </div>
        );

      case 'TextCaption':
        return (
          <div key={index} className="mb-2">
            <p className="text-[12px] text-[#8696a0] leading-relaxed">
              {comp.text || comp.label || 'Légende'}
            </p>
          </div>
        );

      case 'TextInput':
        return (
          <div key={index} className="mb-4">
            <label className="block text-[13px] text-[#667781] mb-1.5 font-medium">
              {comp.label || 'Champ texte'} {comp.required && <span className="text-[#ea4335]">*</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                placeholder={comp.helper_text || 'Saisir...'}
                className="w-full bg-white border border-[#e0e0e0] rounded-lg px-3 py-2.5 text-[14px] text-[#111b21] placeholder:text-[#b0b6bc] focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]/30 transition-all"
              />
            </div>
          </div>
        );

      case 'TextArea':
        return (
          <div key={index} className="mb-4">
            <label className="block text-[13px] text-[#667781] mb-1.5 font-medium">
              {comp.label || 'Zone de texte'} {comp.required && <span className="text-[#ea4335]">*</span>}
            </label>
            <textarea
              readOnly
              placeholder={comp.helper_text || 'Saisir du texte...'}
              rows={3}
              className="w-full bg-white border border-[#e0e0e0] rounded-lg px-3 py-2.5 text-[14px] text-[#111b21] placeholder:text-[#b0b6bc] focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]/30 transition-all resize-none"
            />
          </div>
        );

      case 'Dropdown':
        return (
          <div key={index} className="mb-4 relative">
            <label className="block text-[13px] text-[#667781] mb-1.5 font-medium">
              {comp.label || 'Liste déroulante'} {comp.required && <span className="text-[#ea4335]">*</span>}
            </label>
            <button
              onClick={() => setDropdownOpen(dropdownOpen === comp.id ? null : comp.id)}
              className="w-full bg-white border border-[#e0e0e0] rounded-lg px-3 py-2.5 text-[14px] text-left flex items-center justify-between hover:border-[#00a884] transition-colors"
            >
              <span className="text-[#b0b6bc]">Sélectionner...</span>
              <ChevronDown className={`w-4 h-4 text-[#667781] transition-transform ${dropdownOpen === comp.id ? 'rotate-180' : ''}`} />
            </button>
            {/* Dropdown Options Preview */}
            {dropdownOpen === comp.id && comp.options && comp.options.length > 0 && (
              <div className="absolute z-30 w-full mt-1 bg-white border border-[#e0e0e0] rounded-lg shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                {comp.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="px-3 py-2.5 text-[14px] text-[#111b21] hover:bg-[#f0f2f5] cursor-pointer border-b border-[#f0f2f5] last:border-b-0 transition-colors"
                    onClick={() => setDropdownOpen(null)}
                  >
                    {opt.title}
                  </div>
                ))}
              </div>
            )}
            {(!comp.options || comp.options.length === 0) && dropdownOpen === comp.id && (
              <div className="absolute z-30 w-full mt-1 bg-white border border-[#e0e0e0] rounded-lg shadow-lg p-3 text-[12px] text-[#8696a0] italic text-center">
                Aucune option définie
              </div>
            )}
          </div>
        );

      case 'RadioButtons':
        return (
          <div key={index} className="mb-4">
            <label className="block text-[13px] text-[#667781] mb-2 font-medium">
              {comp.label || 'Choix unique'} {comp.required && <span className="text-[#ea4335]">*</span>}
            </label>
            <div className="space-y-0 border border-[#e0e0e0] rounded-lg overflow-hidden bg-white">
              {comp.options && comp.options.length > 0 ? (
                comp.options.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedRadio(opt.id)}
                    className={`flex items-center gap-3 px-3 py-3 border-b border-[#f0f2f5] last:border-b-0 cursor-pointer transition-colors ${
                      selectedRadio === opt.id ? 'bg-[#e7f8f0]' : 'hover:bg-[#f0f2f5]'
                    }`}
                  >
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      selectedRadio === opt.id
                        ? 'border-[#00a884] bg-[#00a884]'
                        : 'border-[#c5c9cd]'
                    }`}>
                      {selectedRadio === opt.id && (
                        <div className="w-[7px] h-[7px] rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] text-[#111b21]">{opt.title}</span>
                      {opt.description && (
                        <p className="text-[12px] text-[#8696a0] mt-0.5 truncate">{opt.description}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-[12px] text-[#8696a0] italic text-center">
                  Aucune option définie
                </div>
              )}
            </div>
          </div>
        );

      case 'CheckboxGroup':
        return (
          <div key={index} className="mb-4">
            <label className="block text-[13px] text-[#667781] mb-2 font-medium">
              {comp.label || 'Choix multiples'} {comp.required && <span className="text-[#ea4335]">*</span>}
            </label>
            <div className="space-y-0 border border-[#e0e0e0] rounded-lg overflow-hidden bg-white">
              {comp.options && comp.options.length > 0 ? (
                comp.options.map((opt) => {
                  const isChecked = selectedCheckboxes.has(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => toggleCheckbox(opt.id)}
                      className={`flex items-center gap-3 px-3 py-3 border-b border-[#f0f2f5] last:border-b-0 cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#e7f8f0]' : 'hover:bg-[#f0f2f5]'
                      }`}
                    >
                      <div className={`w-[18px] h-[18px] rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        isChecked
                          ? 'border-[#00a884] bg-[#00a884]'
                          : 'border-[#c5c9cd]'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[14px] text-[#111b21]">{opt.title}</span>
                        {opt.description && (
                          <p className="text-[12px] text-[#8696a0] mt-0.5 truncate">{opt.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-[12px] text-[#8696a0] italic text-center">
                  Aucune option définie
                </div>
              )}
            </div>
          </div>
        );

      case 'DatePicker':
        return (
          <div key={index} className="mb-4">
            <label className="block text-[13px] text-[#667781] mb-1.5 font-medium">
              {comp.label || 'Date'} {comp.required && <span className="text-[#ea4335]">*</span>}
            </label>
            <div className="w-full bg-white border border-[#e0e0e0] rounded-lg px-3 py-2.5 text-[14px] flex items-center justify-between text-[#b0b6bc] hover:border-[#00a884] transition-colors cursor-pointer">
              <span>JJ/MM/AAAA</span>
              <Calendar className="w-4 h-4 text-[#667781]" />
            </div>
          </div>
        );

      case 'PhotoPicker':
        return (
          <div key={index} className="mb-4">
            {comp.label && (
              <label className="block text-[13px] text-[#667781] mb-1.5 font-medium">
                {comp.label}
              </label>
            )}
            <div className="w-full bg-[#f7f8fa] border-2 border-dashed border-[#d1d5db] rounded-xl py-6 flex flex-col items-center justify-center gap-2 hover:border-[#00a884]/50 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#e7f8f0] flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#00a884]" />
              </div>
              <span className="text-[13px] text-[#667781]">Ajouter une photo</span>
              <span className="text-[10px] text-[#8696a0]">Appuyez pour sélectionner</span>
            </div>
          </div>
        );

      case 'DocumentPicker':
        return (
          <div key={index} className="mb-4">
            {comp.label && (
              <label className="block text-[13px] text-[#667781] mb-1.5 font-medium">
                {comp.label}
              </label>
            )}
            <div className="w-full bg-[#f7f8fa] border-2 border-dashed border-[#d1d5db] rounded-xl py-6 flex flex-col items-center justify-center gap-2 hover:border-[#00a884]/50 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#e7f8f0] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#00a884]" />
              </div>
              <span className="text-[13px] text-[#667781]">Ajouter un document</span>
              <span className="text-[10px] text-[#8696a0]">PDF, Word, Excel...</span>
            </div>
          </div>
        );

      case 'OptIn':
        return (
          <div key={index} className="mb-4">
            <div
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => toggleCheckbox(`optin_${comp.id}`)}
            >
              <div className={`w-[18px] h-[18px] rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all ${
                selectedCheckboxes.has(`optin_${comp.id}`)
                  ? 'border-[#00a884] bg-[#00a884]'
                  : 'border-[#c5c9cd]'
              }`}>
                {selectedCheckboxes.has(`optin_${comp.id}`) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span className="text-[13px] text-[#667781] leading-relaxed">
                {comp.label || "J'accepte les conditions"}
              </span>
            </div>
          </div>
        );

      case 'Footer':
        // Rendered separately at the bottom
        return null;

      default:
        return (
          <div key={index} className="mb-4 p-3 border border-dashed border-[#e0e0e0] bg-[#f7f8fa] rounded-lg text-center text-[12px] text-[#8696a0]">
            [{comp.type}] {comp.label}
          </div>
        );
    }
  };

  const footerComponent = screen.components.find(c => c.type === 'Footer');
  const contentComponents = screen.components.filter(c => c.type !== 'Footer');

  return (
    <div className="w-[340px] h-[700px] bg-white rounded-[44px] border-[10px] border-slate-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] relative flex flex-col overflow-hidden font-['SF_Pro_Text',system-ui,sans-serif] mx-auto">
      {/* Dynamic Island */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-slate-700 rounded-b-[18px] z-30" />

      {/* Status Bar */}
      <div className="h-[50px] bg-white flex justify-between items-end px-7 pb-1 z-10 text-[#111b21]">
        <span className="text-[13px] font-semibold tracking-tight">12:00</span>
        <div className="flex items-center gap-[3px]">
          <Signal className="w-[14px] h-[14px]" />
          <Wifi className="w-[14px] h-[14px]" />
          <Battery className="w-[16px] h-[16px]" />
        </div>
      </div>

      {/* WhatsApp Flow Header - matches the real WhatsApp Flows UI */}
      <div className="bg-[#f0f2f5] border-b border-[#e0e0e0] px-3 py-2.5 flex items-center gap-2 shrink-0">
        <button className="p-1 text-[#54656f] hover:bg-[#e0e0e0] rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-[#111b21] truncate">
            {screen.title || 'Formulaire'}
          </h1>
        </div>
      </div>

      {/* Screen Content - scrollable area */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="px-4 py-5">
          {contentComponents.length > 0 ? (
            contentComponents.map((comp, idx) => renderComponent(comp, idx))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-[#f0f2f5] flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <p className="text-[13px] text-[#8696a0]">Ajoutez des composants<br />pour concevoir cet écran</p>
            </div>
          )}
        </div>
        {/* Spacer for fixed footer */}
        {footerComponent && <div className="h-[80px]" />}
      </div>

      {/* WhatsApp Fixed Footer Button */}
      {footerComponent && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#e0e0e0] px-4 py-3 pb-7 z-20">
          <button className="w-full bg-[#00a884] hover:bg-[#008f6f] active:bg-[#00755e] text-white font-semibold py-3 rounded-full transition-all shadow-sm text-[15px] tracking-wide">
            {footerComponent.label || 'Continuer'}
          </button>
        </div>
      )}

      {/* Home Indicator */}
      <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-[#111b21] rounded-full z-30 opacity-30" />
    </div>
  );
}
