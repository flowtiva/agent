
import React, { useCallback, useMemo } from "react";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { Modality } from "@google/genai";
import { getSelectStyles } from "./selectStyles";

type ResponseModalitySelectorProps = {
  theme: 'light' | 'dark';
};

const responseOptions = [
  { value: Modality.AUDIO, label: "Audio" },
  { value: Modality.TEXT, label: "Text" },
];


export default function ResponseModalitySelector({ theme }: ResponseModalitySelectorProps) {
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

  return (
    <div>
      <label htmlFor="response-modality-selector" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Response Modality</label>
      <Select
        id="response-modality-selector"
        className="react-select-container"
        classNamePrefix="react-select"
        styles={getSelectStyles(theme === 'dark')}
        value={selectedOption}
        options={responseOptions}
        onChange={updateConfig}
      />
    </div>
  );
}