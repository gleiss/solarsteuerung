declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        getModus(): void;
        getTargetTemperature(): void;
        getControlValues(): void;
        getStatusValues(): void;
        getTemperatures(): void;

        setModus(value: "winter" | "summer"): void;
        setTargetTemperature(value: number): void;
        setFirstKlappeMode(value: "on" | "off" | "auto"): void;
        setHeizKlappeMode(value: "on" | "off" | "auto"): void;
        setKollektorKlappeMode(value: "on" | "off" | "auto"): void;
        setSpeicherKlappeMode(value: "on" | "off" | "auto"): void;
        setWintergartenFensterMode(value: "on" | "off" | "auto"): void;
        setVentilatorMode(value: "on" | "off" | "auto"): void;
        setPumpeWasserkollektorMode(value: "on" | "off" | "auto"): void;
      
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        on(channel: string, func: (...args: any[]) => void): void;
        removeAllListeners(channel: string): void;
      };
    };
  }
}

export {};
