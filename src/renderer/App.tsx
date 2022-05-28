import { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputNumber } from 'primereact/inputnumber';
import { SelectButton } from 'primereact/selectbutton';
import { Divider } from 'primereact/divider';

import { Control, ControlValue, StatusValue } from './Control'
import { Temperature } from './Temperature'

import './App.css';
import '/node_modules/primeflex/primeflex.css'

const Hello = () => {
  const [modus, setModus] = useState<'winter' | 'summer'>('winter');
  const [targetTemperature, setTargetTemperature] = useState(20);

  const [firstKlappeMode, setFirstKlappeMode] = useState<ControlValue>('off');
  const [heizKlappeMode, setHeizKlappeMode] = useState<ControlValue>('off');
  const [kollektorKlappeMode, setKollektorKlappeMode] = useState<ControlValue>('off');
  const [speicherKlappeMode, setSpeicherKlappeMode] = useState<ControlValue>('off');
  const [wintergartenFensterMode, setWintergartenFensterMode] = useState<ControlValue>('off');
  const [ventilatorMode, setVentilatorMode] = useState<ControlValue>('off');
  const [pumpeWasserkollektorMode, setPumpeWasserkollektorMode] = useState<ControlValue>('off');

  const [firstKlappeStatus, setFirstKlappeStatus] = useState<StatusValue>('off');
  const [heizKlappeStatus, setHeizKlappeStatus] = useState<StatusValue>('off');
  const [kollektorKlappeStatus, setKollektorKlappeStatus] = useState<StatusValue>('off');
  const [speicherKlappeStatus, setSpeicherKlappeStatus] = useState<StatusValue>('off');
  const [wintergartenFensterStatus, setWintergartenFensterStatus] = useState<StatusValue>('off');
  const [ventilatorStatus, setVentilatorStatus] = useState<StatusValue>('off');
  const [pumpeWasserkollektorStatus, setPumpeWasserkollektorStatus] = useState<StatusValue>('off');
  
  const [regenfuehler, setRegenfuehler] = useState(500);
  const [aussenluftNord, setAussenluftNord] = useState(20);
  const [ruecklaufLuftspeicher, setRuecklaufLuftspeicher] = useState(20);
  const [vorlaufLuftspeicher, setVorlaufLuftspeicher] = useState(20);
  const [speichermasse, setSpeichermasse] = useState(20);
  const [speicherOben, setSpeicherOben] = useState(20);
  const [speicherMitte, setSpeicherMitte] = useState(20);
  const [speicherUnten, setSpeicherUnten] = useState(20);
  const [wohnraumLuft, setWohnraumLuft] = useState(20);
  const [wintergartenLuftOben, setWintergartenLuftOben] = useState(20);
  const [wintergartenLuftUnten, setWintergartenLuftUnten] = useState(20);
  const [wasserKollektorblech, setWasserKollektorblech] = useState(20);
  const [wasserWaermetauscherVorlauf, setWasserWaermetauscherVorlauf] = useState(20);
  const [wasserWaermetauscherRueklauf, setWasserWaermetauscherRuecklauf] = useState(20);
  const [wasserBoiler, setWasserboiler] = useState(20);

  function modusToString(modus: 'winter' | 'summer') {
    return modus == 'winter' ? "Winterbetrieb" : "Sommerbetrieb";
  }
  function stringToModus(string: 'Winterbetrieb' | "Sommerbetrieb") {
    return string == "Winterbetrieb" ? "winter" : "summer";
  }

  // register to ipcRenderer messages (need to use 'useEffect' to register exactly once (instead on each rendering))
  useEffect(() => {
    window.electron.ipcRenderer.on("update-modus", (value) => {
      if (value != modus)
      {
        setModus(value);
      }
    });
    window.electron.ipcRenderer.on("update-target-temperature", (value) => {
      if (value != targetTemperature)
      {
        setTargetTemperature(value);
      }
    });
    window.electron.ipcRenderer.on("update-control-values", (values) => {
      if (values["firstKlappe"] != firstKlappeMode)
      {
        setFirstKlappeMode(values["firstKlappe"]);
      }
      if (values["heizKlappe"] != heizKlappeMode)
      {
        setHeizKlappeMode(values["heizKlappe"]);
      }
      if (values["kollektorKlappe"] != kollektorKlappeMode)
      {
        setKollektorKlappeMode(values["kollektorKlappe"]);
      }
      if (values["speicherKlappe"] != speicherKlappeMode)
      {
        setSpeicherKlappeMode(values["speicherKlappe"]);
      }
      if (values["wintergartenFenster"] != wintergartenFensterMode)
      {
        setWintergartenFensterMode(values["wintergartenFenster"]);
      }
      if (values["ventilator"] != ventilatorMode)
      {
        setVentilatorMode(values["ventilator"]);
      }
      if (values["pumpeWasserkollektor"] != pumpeWasserkollektorMode)
      {
        setPumpeWasserkollektorMode(values["pumpeWasserkollektor"]);
      }
    });
    window.electron.ipcRenderer.on("update-status-values", (values) => {
      if (values["firstKlappe"] != firstKlappeStatus)
      {
        setFirstKlappeStatus(values["firstKlappe"]);
      }
      if (values["heizKlappe"] != heizKlappeStatus)
      {
        setHeizKlappeStatus(values["heizKlappe"]);
      }
      if (values["kollektorKlappe"] != kollektorKlappeStatus)
      {
        setKollektorKlappeStatus(values["kollektorKlappe"]);
      }
      if (values["speicherKlappe"] != speicherKlappeStatus)
      {
        setSpeicherKlappeStatus(values["speicherKlappe"]);
      }
      if (values["wintergartenFenster"] != wintergartenFensterStatus)
      {
        setWintergartenFensterStatus(values["wintergartenFenster"]);
      }
      console.log("renderer on status change - values[ventilator]: " + values["ventilator"] + ", ventilatorStatus: " + ventilatorStatus);
      if (values["ventilator"] != ventilatorStatus)
      {
        setVentilatorStatus(values["ventilator"]);
      }
      if (values["pumpeWasserkollektor"] != pumpeWasserkollektorStatus)
      {
        setPumpeWasserkollektorStatus(values["pumpeWasserkollektor"]);
      }
    });
  
    window.electron.ipcRenderer.on("update-temperatures", (values) => {
      if (values["regenfuehler"] != regenfuehler) {
        setRegenfuehler(values["regenfuehler"]);
      }
      if (values["aussenluftNord"] != aussenluftNord) {
        setAussenluftNord(values["aussenluftNord"]);
      }
      if (values["ruecklaufLuftspeicher"] != ruecklaufLuftspeicher) {
        setRuecklaufLuftspeicher(values["ruecklaufLuftspeicher"]);
      }
      if (values["vorlaufLuftspeicher"] != vorlaufLuftspeicher) {
        setVorlaufLuftspeicher(values["vorlaufLuftspeicher"]);
      }
      if (values["speichermasse"] != speichermasse) {
        setSpeichermasse(values["speichermasse"]);
      }
      if (values["speicherOben"] != speicherOben) {
        setSpeicherOben(values["speicherOben"]);
      }
      if (values["speicherMitte"] != speicherMitte) {
        setSpeicherMitte(values["speicherMitte"]);
      }
      if (values["speicherUnten"] != speicherUnten) {
        setSpeicherUnten(values["speicherUnten"]);
      }
      if (values["wohnraumLuft"] != wohnraumLuft) {
        setWohnraumLuft(values["wohnraumLuft"]);
      }
      if (values["wintergartenLuftOben"] != wintergartenLuftOben) {
        setWintergartenLuftOben(values["wintergartenLuftOben"]);
      }
      if (values["wintergartenLuftUnten"] != wintergartenLuftUnten) {
        setWintergartenLuftUnten(values["wintergartenLuftUnten"]);
      }
      if (values["wasserKollektorblech"] != wasserKollektorblech) {
        setWasserKollektorblech(values["wasserKollektorblech"]);
      }
      if (values["wasserWaermetauscherVorlauf"] != wasserWaermetauscherVorlauf) {
        setWasserWaermetauscherVorlauf(values["wasserWaermetauscherVorlauf"]);
      }
      if (values["wasserWaermetauscherRueklauf"] != wasserWaermetauscherRueklauf) {
        setWasserWaermetauscherRuecklauf(values["wasserWaermetauscherRueklauf"]);
      }
      if (values["wasserBoiler"] != wasserBoiler) {
        setWasserboiler(values["wasserBoiler"]);
      }
    });
    return function cleanup() {
      window.electron.ipcRenderer.removeAllListeners("update-modus");
      window.electron.ipcRenderer.removeAllListeners("update-target-temperature");
      window.electron.ipcRenderer.removeAllListeners("update-control-values");
      window.electron.ipcRenderer.removeAllListeners("update-status-values");
      window.electron.ipcRenderer.removeAllListeners("update-temperatures");
    };
  });

  // initially fetch everything (need to use 'useEffect' to register exactly once (instead on each rendering))
  useEffect(() => {
    window.electron.ipcRenderer.getModus();
    window.electron.ipcRenderer.getTargetTemperature();
    window.electron.ipcRenderer.getControlValues();
    window.electron.ipcRenderer.getStatusValues();
    window.electron.ipcRenderer.getTemperatures();
  }, []);


  // set up periodic fetches for status values and temperatures (need to use 'useEffect' to register exactly once (instead on each rendering))
  useEffect(() => {
    setTimeout(function() {
      setInterval(function() {
        console.log("renderer: requesting status values")
        window.electron.ipcRenderer.getStatusValues();
      }, 2000);
    }, 1000);

    setTimeout(function() {
      setInterval(function() {
        console.log("renderer: requesting temperatures")
        window.electron.ipcRenderer.getTemperatures();
      }, 2000);
    }, 2000);
  }, []);


  return (
    <div className='solar'>
      <div className='flex'>
        <div>
          <Card className='surface-100 m-5'>
            <div className='flex'>
              <h4 className='modusText'>Modus</h4>
              <SelectButton className='modusSelect'
                value={modusToString(modus)}
                options={["Winterbetrieb", "Sommerbetrieb"]}
                onChange={(e) => {
                  const newValue = stringToModus(e.value);
                  setModus(newValue);
                  window.electron.ipcRenderer.setModus(newValue);
                }}
              />
            </div>
          </Card>
          <Card className='surface-100 m-5'>
            <div className='flex'>
              <h4 className = "targetTemperatureText">Temperatur</h4>
              <InputNumber className = "targetTemperatureStepper"
                inputId="targetTemperatureId" 
                value={targetTemperature} 
                onValueChange={(e) => { 
                  if (e.value !== null) {
                    setTargetTemperature(e.value);
                    window.electron.ipcRenderer.setTargetTemperature(e.value);
                  }
                }} 
                showButtons
                buttonLayout = 'horizontal'
                step={1}
                decrementButtonClassName="p-button-primary"
                incrementButtonClassName="p-button-primary"
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus"
                min = {0}
                max = {50}
                mode="decimal"
                prefix="  "
                suffix="°"
                size	={4}
              />
            </div>
          </Card>

          <Card className='surface-100 m-5'>
            <Control 
              name = "Firstklappe" 
              value={firstKlappeMode} 
              onChange = {(value) => { 
                setFirstKlappeMode(value);
                window.electron.ipcRenderer.setFirstKlappeMode(value);
              }} 
              type = "window" 
              status={firstKlappeStatus}/>
            <Divider/>
            <Control 
              name = "Heizklappe" 
              value={heizKlappeMode} 
              onChange = {(value) => { 
                setHeizKlappeMode(value);
                window.electron.ipcRenderer.setHeizKlappeMode(value);
              }} 
              type = "window" 
              status={heizKlappeStatus}/>
            <Divider/>
            <Control 
              name = "Kollektorklappe" 
              value={kollektorKlappeMode} 
              onChange = {(value) => { 
                setKollektorKlappeMode(value);
                window.electron.ipcRenderer.setKollektorKlappeMode(value);
              }} 
              type = "window" 
              status={kollektorKlappeStatus}/>
            <Divider/>
            <Control 
              name = "Speicherklappe" 
              value={speicherKlappeMode} 
              onChange = {(value) => { 
                setSpeicherKlappeMode(value);
                window.electron.ipcRenderer.setSpeicherKlappeMode(value);
              }} 
              type = "window" 
              status={speicherKlappeStatus}/>
            <Divider/>
            <Control 
              name = "Wintergartenfenster" 
              value={wintergartenFensterMode} 
              onChange = {(value) => { 
                setWintergartenFensterMode(value);
                window.electron.ipcRenderer.setWintergartenFensterMode(value);
              }} 
              type = "window" 
              status={wintergartenFensterStatus}/>
            <Divider/>
            <Control 
              name = "Ventilator" 
              value={ventilatorMode} 
              onChange = {(value) => { 
                setVentilatorMode(value);
                window.electron.ipcRenderer.setVentilatorMode(value);
              }} 
              type = "pump" 
              status={ventilatorStatus}/>
            <Divider/>
            <Control 
              name = "Pumpe Wasserkollektor" 
              value={pumpeWasserkollektorMode} 
              onChange = {(value) => { 
                setPumpeWasserkollektorMode(value);
                window.electron.ipcRenderer.setPumpeWasserkollektorMode(value);
              }} 
              type = "pump" 
              status={pumpeWasserkollektorStatus}/>
          </Card>

        </div>

        <Card className='surface-100 mt-5 mr-5 mb-5'>
          <Temperature name = "Regenfühler" value={regenfuehler} type="humidity"/>
          <Divider/>
          <Temperature name = "Außenluft Nord" value={aussenluftNord} type="temperature"/>
          <Divider/>
          <Temperature name = "Rücklauf Luftspeicher" value={ruecklaufLuftspeicher} type="temperature"/>
          <Divider/>
          <Temperature name = "Vorlauf Luftspeicher" value={vorlaufLuftspeicher} type="temperature"/>
          <Divider/>
          <Temperature name = "Speichermasse" value={speichermasse} type="temperature"/>
          <Divider/>
          <Temperature name = "Speicher Oben" value={speicherOben} type="temperature"/>
          <Divider/>
          <Temperature name = "Speicher Mitte" value={speicherMitte} type="temperature"/>
          <Divider/>
          <Temperature name = "Speicher Unten" value={speicherUnten} type="temperature"/>
          <Divider/>
          <Temperature name = "Wohnraumluft" value={wohnraumLuft} type="temperature"/>
          <Divider/>
          <Temperature name = "Wintergartenluft (1. Stock)" value={wintergartenLuftOben} type="temperature"/>
          <Divider/>
          <Temperature name = "Wintergartenluft (Erdgeschoß)" value={wintergartenLuftUnten} type="temperature"/>
          <Divider/>
          <Temperature name = "Wasser Kollektorblech" value={wasserKollektorblech} type="temperature"/>
          <Divider/>
          <Temperature name = "Wasser Wärmetauscher Vorlauf" value={wasserWaermetauscherVorlauf} type="temperature"/>
          <Divider/>
          <Temperature name = "Wasser Wärmetauscher Rücklauf" value={wasserWaermetauscherRueklauf} type="temperature"/>
          <Divider/>
          <Temperature name = "Wasser Boiler" value={wasserBoiler} type="temperature"/>
        </Card>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
