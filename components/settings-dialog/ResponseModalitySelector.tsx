
import React, { useCallback, useMemo } from "react";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { Modality } from "@google/genai";

const responseOptions = [
  { value: Modality.AUDIO, label: "Audio" },
  { value: Modality.TEXT, label: "Text" },
];

const selectStyles = {
  control: (base: any) => ({ ...base, backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', boxShadow: 'none', '&:hover': { borderColor: 'var(--border-color-hover)'} }),
  menu: (base: any) => ({ ...base, backgroundColor: 'var(--bg-color)' }),
  option: (base: any, { isFocused, isSelected }: any) => ({ ...base, backgroundColor: isSelected ? 'var(--accent-color)' : isFocused ? 'var(--bg-color-hover)' : 'var(--bg-color)', color: isSelected ? 'white' : 'inherit', '&:active': { backgroundColor: 'var(--accent-color)'} }),
  singleValue: (base: any) => ({ ...base, color: 'var(--text-color)'}),
};

export default function ResponseModalitySelector() {
  const { config, setConfig } = useLiveAPIContext();

  const selectedOption = useMemo(() => {
    const modality = config.responseModalities?.[0] || Modality.AUDIO;
    return responseOptions.find(opt => opt.value === modality) || responseOptions[0];
  }, [config.responseModalities]);

  const updateConfig = useCallback((selected: any) => {
    if (selected) {
      setConfig({ ...config, responseModalities: [selected.value] });
    }
  }, [config, setConfig]);

  const customStyles = {
    control: (base: any) => ({ ...base, backgroundColor: '#f3f4f6', borderColor: '#d1d5db', '&:hover': { borderColor: '#9ca3af' }, boxShadow: 'none' }),
    menu: (base: any) => ({ ...base, backgroundColor: 'white' }),
    option: (base: any, { isFocused, isSelected }: any) => ({ ...base, backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#f3f4f6' : 'white', color: isSelected ? 'white' : 'black' }),
    singleValue: (base: any) => ({ ...base, color: 'black' }),
  };
  
  const customStylesDark = {
    control: (base: any) => ({ ...base, backgroundColor: '#374151', borderColor: '#4b5563', '&:hover': { borderColor: '#6b7280' }, boxShadow: 'none' }),
    menu: (base: any) => ({ ...base, backgroundColor: '#1f2937' }),
    option: (base: any, { isFocused, isSelected }: any) => ({ ...base, backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#374151' : '#1f2937', color: 'white' }),
    singleValue: (base: any) => ({ ...base, color: 'white' }),
  };


  return (
    <div>
      <label htmlFor="response-modality-selector" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Response</label>
      <Select
        id="response-modality-selector"
        className="react-select-container"
        classNamePrefix="react-select"
        styles={document.documentElement.classList.contains('dark') ? customStylesDark : customStyles}
        value={selectedOption}
        options={responseOptions}
        onChange={updateConfig}
      />
    </div>
  );
}
