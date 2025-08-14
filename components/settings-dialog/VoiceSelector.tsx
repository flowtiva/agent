
import React, { useCallback, useMemo } from "react";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { getSelectStyles } from "./selectStyles";

type VoiceSelectorProps = {
  theme: 'light' | 'dark';
};

const voiceOptions = [
  { value: "Puck", label: "Puck" },
  { value: "Charon", label: "Charon" },
  { value: "Kore", label: "Kore" },
  { value: "Fenrir", label: "Fenrir" },
  { value: "Aoede", label: "Aoede" },
];

export default function VoiceSelector({ theme }: VoiceSelectorProps) {
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

  return (
    <div>
      <label htmlFor="voice-selector" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Voice</label>
      <Select
        id="voice-selector"
        className="react-select-container"
        classNamePrefix="react-select"
        styles={getSelectStyles(theme === 'dark')}
        value={selectedOption}
        options={voiceOptions}
        onChange={updateConfig}
      />
    </div>
  );
}