import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    getModus() {
      ipcRenderer.send("get-modus");
    },
    getTargetTemperature() {
      ipcRenderer.send("get-target-temperature");
    },
    getControlValues() {
      ipcRenderer.send("get-control-values");
    },
    getStatusValues() {
      ipcRenderer.send("get-status-values");
    },
    getTemperatures() {
      ipcRenderer.send("get-temperatures");
    },
    setModus(value: "winter" | "summer") {
      ipcRenderer.send("set-modus", value);
    },
    setTargetTemperature(value: number) {
      ipcRenderer.send("set-target-temperature", value);
    },
    setFirstKlappeMode(value: "on" | "off" | "auto") {
      ipcRenderer.send("set-first-klappe-mode", value);
    },
    setHeizKlappeMode(value: "on" | "off" | "auto") {
      ipcRenderer.send("set-heiz-klappe-mode", value);
    },
    setKollektorKlappeMode(value: "on" | "off" | "auto") {
      ipcRenderer.send("set-kollektor-klappe-mode", value);
    },
    setSpeicherKlappeMode(value: "on" | "off" | "auto") {
      ipcRenderer.send("set-speicher-klappe-mode", value);
    },
    setWintergartenFensterMode(value: "on" | "off" | "auto") {
      ipcRenderer.send("set-wintergarten-fenster-mode", value);
    },
    setVentilatorMode(value: "on" | "off" | "auto") {
      ipcRenderer.send("set-ventilator-mode", value);
    },
    setPumpeWasserkollektorMode(value: "on" | "off" | "auto") {
      ipcRenderer.send("set-pumpe-wasserkollektor-mode", value);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(channel: string, func: (...args: any[]) => void) {
      const validChannels = ["update-modus", "update-target-temperature", "update-control-values", "update-status-values", "update-temperatures",];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (_event, ...args) => func(...args));
      }
    },
    removeAllListeners(channel: string) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
});
