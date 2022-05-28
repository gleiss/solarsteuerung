import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';

export type ControlValue = 'on' | 'off' | 'auto';
export type ControlType = 'window' | 'pump';
export type StatusValue = 'on' | 'off' | 'opening' | 'closing';

type Props = {
    name: string
    type: ControlType
    value: ControlValue,
    onChange: (newValue: ControlValue) => void,
    status: StatusValue
}

function valueToString(type: ControlType, value: ControlValue) {
    if (type == 'window') {
        switch (value) {
            case 'on':
                return "Offen";
            case 'off':
                return 'Geschlossen';
            case 'auto':
                return "Automatik";
        }
    } else {
        switch (value) {
            case 'on':
                return "An";
            case 'off':
                return 'Aus';
            case 'auto':
                return "Automatik";
        }
    }
}
function stringToValue(type: ControlType, string: string) {
    if (type == 'window') {
        switch (string) {
            case 'Offen':
                return "on";
            case 'Geschlossen':
                return 'off';
            default:
                return "auto";
        }
    } else {
        switch (string) {
            case 'An':
                return "on";
            case 'Aus':
                return 'off';
            default:
                return "auto";
        }
    }
}
function statusToString(type: ControlType, value: StatusValue) {
    if (type == 'window') {
        switch (value) {
            case 'on':
                return "Offen";
            case 'off':
                return 'Geschlossen';
            case 'opening':
                return "Öffnet";
            default:
                return "Schließt";
        }
    } else {
        switch (value) {
            case 'on':
                return "An";
            case 'off':
                return 'Aus';
            case 'opening':
                return "Startet";
            case 'closing':
                return "Schaltet aus";
        }
    }
}
export function Control(props: Props) {
    return (
        <div className='flex'>
            <h4 className='controlName'>{props.name}</h4>
            <SelectButton className='controlSelect'
                value={valueToString(props.type, props.value)}
                options={props.type == 'window' ? ["Offen", "Geschlossen", "Automatik"] : ["An", "Aus", "Automatik"]}
                onChange={(e) => {props.onChange(stringToValue(props.type, e.value));}}
            />
            <Tag className="controlTag" severity={ (props.status === "on" || props.status === "off") ? "success" : "warning"} value={statusToString(props.type, props.status)}></Tag>
        </div>
    );
}