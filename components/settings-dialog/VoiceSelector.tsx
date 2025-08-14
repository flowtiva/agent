
import React, { useCallback, useMemo } from "react";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";

const voiceOptions = [
  { value: "Puck", label: "Puck" },
  { value: "Charon", label: "Charon" },
  { value: "Kore", label: "Kore" },
  { value: "Fenrir", label: "Fenrir" },
  { value: "Aoede", label: "Aoede" },
];

export default function VoiceSelector() {
  const { config, setConfig } = useLiveAPIContext();

  const selectedOption = useMemo(() => {
    const voiceName = config.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName || "Aoede";
    return voiceOptions.find(opt => opt.value === voiceName) || voiceOptions[4];
  }, [config.speechConfig]);

  const updateConfig = useCallback((selected: any) => {
      if (selected) {
        setConfig({
          ...config,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selected.value } } },
        });
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
      <label htmlFor="voice-selector" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Voice</label>
      <Select
        id="voice-selector"
        className="react-select-container"
        classNamePrefix="react-select"
        styles={document.documentElement.classList.contains('dark') ? customStylesDark : customStyles}
        value={selectedOption}
        options={voiceOptions}
        onChange={updateConfig}
      />
    </div>
  );
}
