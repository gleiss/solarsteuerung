const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')

export type ModusValue = 'winter' | 'summer';
export type ControlValue = 'on' | 'off' | 'auto';
export type StatusValue = 'on' | 'off' | 'opening' | 'closing';

// TODO: refactor by splitting apart Serial Communication Interface and Scheduling (use two classes, only export the Scheduling class (which wraps around the Serial Communication Class))

// TODO: rewrite this documentation, it is just copy-pastied
// periodically ask for status and temperatures (the things that cannot be changed via the UI)
// never ask for modus, temperature, modes (except initially), ask for them after setting it
// temperatures and status are set at the beginning of the 1. and 2. second
// setting modus/target-temperature/modes is performed at 500ms each second
// TODO: use only two timers: one for the current second, one for the next second, pass both variables by reference to performOnceRastered
// TODO: getting modus/target-temperature/modes after setting them is performed at 600ms each second



// Documentation for serial interface of microcontroller:
// - microcontroller acts as server with request-response pattern: It waits for a message and sends a reply as soon as it gets the message (in other words, it does not initiate messages on its own)
// - serial port configuration:
//    - standard values
//    - port does not need any flow control
// - standard ascii encoding
// - Delimiters (Attention: very inconsistent!):
//    - messages from the computer to the microcontroller need to end with \r (\r\n is also possible - in this case \n will be ignored)
//    - messages from the microcontroller end with \n
// - Supported messages:
//    - see below
//    - if message is not supported, microcontroller answers QU01 (90% sure that this is the case, should be the command in file INPB.c in line 115)
// - Conceptually, most of the system is run by the microcontroller. The computer can be used to send commands via the serial interface to
//    1) set
//        (a) 'Regelmodus',
//        (b) target temperature
//        (c) 7 'Schalter'
//    2) ask for 
//        (a) the current modus, 
//        (b) the current target temperature, 
//        (c) the current value for the 7 'Schalter' that has been requested by the PC, 
//        (d) the actual value for the 7 'Schalter' (note that it can take up to 1-2 Minutes until 'Schalter' get into the requested position, so during that time the requested and the actual position differ)
//        (e) get current temperatures that have been measured (using the 'Fuehler')
//    3) set time and date
//    4) unimportant stuff (historic temperatures, use a test temperature for some 'Fuehler', and reset the system) 

export type ControlValues = {
	firstKlappe: ControlValue,
	heizKlappe: ControlValue,
	kollektorKlappe: ControlValue,
	speicherKlappe: ControlValue,
	wintergartenFenster: ControlValue,
	ventilator: ControlValue,
	pumpeWasserkollektor: ControlValue,
} 
export type StatusValues = {
	firstKlappe: StatusValue,
	heizKlappe: StatusValue,
	kollektorKlappe: StatusValue,
	speicherKlappe: StatusValue,
	wintergartenFenster: StatusValue,
	ventilator: StatusValue,
	pumpeWasserkollektor: StatusValue,
}
export type Temperatures = {
	regenfuehler: number,
	aussenluftNord: number,
	ruecklaufLuftspeicher: number,
	vorlaufLuftspeicher: number,
	speichermasse: number,
	speicherOben: number,
	speicherMitte: number,
	speicherUnten: number,
	wohnraumLuft: number,
	wintergartenLuftOben: number,
	wintergartenLuftUnten: number,
	wasserKollektorblech: number,
	wasserWaermetauscherVorlauf: number,
	wasserWaermetauscherRueklauf: number,
	wasserBoiler: number
}

export class SerialCommunicationKasten123 {
	private durationSetAnything = 100 * 2;
	private durationGetModus = 100 * 2;
	private durationGetTargetTemperature = 100 * 2;
	private durationGetControlValues = 400 * 2;
	private durationGetStatusValues = 400 * 2;
	private durationGetTemperatures = 500 * 2;

	private timerGetModus: NodeJS.Timeout | null = null;
	private timerGetTargetTemperature: NodeJS.Timeout | null = null;
	private timerGetControlValues: NodeJS.Timeout | null = null;
	private timerGetStatusValues: NodeJS.Timeout | null = null;
	private timerGetTemperatures: NodeJS.Timeout | null = null;
	private timerSetModus: NodeJS.Timeout | null = null;
	private timerSetTargetTemperature: NodeJS.Timeout | null = null;
	private timerSetFirstKlappe: NodeJS.Timeout | null = null;
	private timerSetHeizklappe: NodeJS.Timeout | null = null;
	private timerSetKollektorklappe: NodeJS.Timeout | null = null;
	private timerSetSpeicherklappe: NodeJS.Timeout | null = null;
	private timerSetWintergartenfenster: NodeJS.Timeout | null = null;
	private timerSetVentilator: NodeJS.Timeout | null = null;
	private timerSetPumpeWasserkollektor: NodeJS.Timeout | null = null;
	private nextFreeSlot = 0;
	
	private onCurrentModus: (modus: ModusValue) => void;
	private onCurrentTargetTemperature: (targetTemperature: number) => void;
	private onCurrentControlValues: (controlValues: ControlValues) => void;
	private onCurrentStatusValues: (statusValues: StatusValues) => void;
	private onCurrentTemperatures: (temperatures: Temperatures) => void;

	private port;
	private parser;

	constructor(
		onCurrentModus: (modus: ModusValue) => void,
		onCurrentTargetTemperature: (targetTemperature: number) => void,
		onCurrentControlValues: (controlValues: ControlValues) => void,
		onCurrentStatusValues: (statusValues: StatusValues) => void,
		onCurrentTemperatures: (temperatures: Temperatures) => void
	){
		this.onCurrentModus = onCurrentModus;
		this.onCurrentTargetTemperature = onCurrentTargetTemperature;
		this.onCurrentControlValues = onCurrentControlValues;
		this.onCurrentStatusValues = onCurrentStatusValues;
		this.onCurrentTemperatures = onCurrentTemperatures;

		this.port = new SerialPort({
			path: '/dev/tty.Plser',
			baudRate: 9600,
			parity: 'none',
			dataBits: 8,
			stopBits: 1,
			rtscts: false,
			xoff: false,
			xon: false,
			xany: false
		});
		this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
		this.parser.on('data', this.handleIncomingData.bind(this));
	}

	// TODO: setTime using 'TIM'
	// TODO: setDate using 'DAT'
	// NOTE: we don't support the command 'HMW' (getting historic messwerte) as we never use it in practice
	// NOTE: we don't support the command 'ZHW' as it is undefined / unused
	// NOTE: we don't support the command 'TTP' as it was only used back then in the 90s to test something related to the temperatures
	// NOTE: we don't support the command 'RESET', unclear what it does and whether it's save to call it :D

	private writeToPort(message: string) {
		this.port.write(
			Buffer.from(message + "\r", "ascii"),
			function(err: any) {
				if (err) {
					return console.log('Error on writing to port: ', err.message)
				}
			}
		);
	}

	private computeScheduling() {
		const currentTime = Date.now();
		const scheduledTime = Math.max(this.nextFreeSlot, currentTime);
		const scheduledInterval = scheduledTime - currentTime;
		return [scheduledTime, scheduledInterval];
	}

	sendGetModus() {
		// console.log("\n" + (Date.now() % 4000) + "- send: get modus\n");
		this.writeToPort("ARE");
	}
	sendGetTargetTemperature() {
		// console.log("\n" + (Date.now() % 4000) + "- send: get target temperature\n");
		this.writeToPort("ATW");
	}
	sendGetControlValues() {
		// console.log("\n" + (Date.now() % 4000) + "- send: get control values\n");
		this.writeToPort("ASW");
	}
	sendGetStatusValues() {
		// console.log("\n" + (Date.now() % 4000) + "- send: get status values\n");
		this.writeToPort("AZW");
	}
	sendGetTemperatures() {
		// console.log("\n" + (Date.now() % 4000) + "- send: get temperatures\n");
		this.writeToPort("AMW");
	}
	sendSetModus(value: ModusValue) {
		// console.log("\n" + (Date.now() % 4000) + "- send: set modus to " + value + "\n");
		this.writeToPort("RSW " + ((value === "summer") ? "SOM1" : "WIN1"));
	}
	sendSetTargetTemperature(value: number) {
		// console.log("\n" + (Date.now() % 4000) + "- send: set target temperature to " + value + "\n");
		this.writeToPort("TSW " + value.toString());
	}
	sendSetFirstklappe(value: ControlValue) {
		// console.log("\n" + (Date.now() % 4000) + "- send: set firstklappe to " + value + "\n");
		this.writeToPort("FKL " + value.toUpperCase());
	}
	sendSetHeizKlappe(value: ControlValue) {
		// console.log("\n" + (Date.now() % 4000) + "- send: set heizklappe to " + value + "\n");
		this.writeToPort("HKL " + value.toUpperCase());
	}
	sendSetKollektorKlappe(value: ControlValue) {
		// console.log("\n" + (Date.now() % 4000) + "- send: set kollektorklappe to " + value + "\n");
		this.writeToPort("KKL " + value.toUpperCase());
	}
	sendSetSpeicherKlappe(value: ControlValue) {
		// console.log("\n" + (Date.now() % 4000) + "- send: set speicherklappe to " + value + "\n");
		this.writeToPort("SKL " + value.toUpperCase());
	}
	sendSetWintergartenFenster(value: ControlValue) {
		// console.log("\n" + (Date.now() % 4000) + "- send: set wintergartenfenster to " + value + "\n");
		this.writeToPort("WFE " + value.toUpperCase());
	}
	sendSetVentilator(value: ControlValue) {
		// console.log("\n" + (Date.now() % 4000) + "- send: set ventilator to " + value + "\n");
		this.writeToPort("VNT " + value.toUpperCase());
	}
	sendSetPumpeWasserKollektor(value: ControlValue) {
		// console.log("\n" + (Date.now() % 4000) + "- send: set pumpewasserkollektor to " + value + "\n");
		this.writeToPort("PKO " + value.toUpperCase());
	}

	getModus() {
		if (this.timerGetModus !== null) {
			clearTimeout(this.timerGetModus);
		}
		const [scheduledTime, scheduledInterval] = this.computeScheduling();
		this.timerGetModus = setTimeout(() => {
			this.sendGetModus();
		}, scheduledInterval);
		this.nextFreeSlot = scheduledTime + this.durationGetModus;
	}
	getTargetTemperature() {
		if (this.timerGetTargetTemperature !== null) {
			clearTimeout(this.timerGetTargetTemperature);
		}
		const [scheduledTime, scheduledInterval] = this.computeScheduling();
		this.timerGetTargetTemperature = setTimeout(() => {
			this.sendGetTargetTemperature();
		}, scheduledInterval);
		this.nextFreeSlot = scheduledTime + this.durationGetTargetTemperature;
	}
	getControlValues() {
		if (this.timerGetControlValues !== null) {
			clearTimeout(this.timerGetControlValues);
		}
		const [scheduledTime, scheduledInterval] = this.computeScheduling();
		this.timerGetControlValues = setTimeout(() => {
			this.sendGetControlValues();
		}, scheduledInterval);
		this.nextFreeSlot = scheduledTime + this.durationGetControlValues;
	}
	getStatusValues() {
		if (this.timerGetStatusValues !== null) {
			clearTimeout(this.timerGetStatusValues);
		}
		const [scheduledTime, scheduledInterval] = this.computeScheduling();
		this.timerGetStatusValues = setTimeout(() => {
			this.sendGetStatusValues();
		}, scheduledInterval);
		this.nextFreeSlot = scheduledTime + this.durationGetStatusValues;
	}
	getTemperatures() {
		if (this.timerGetTemperatures !== null) {
			clearTimeout(this.timerGetTemperatures);
		}
		const [scheduledTime, scheduledInterval] = this.computeScheduling();
		this.timerGetTemperatures = setTimeout(() => {
			this.sendGetTemperatures();
		}, scheduledInterval);
		this.nextFreeSlot = scheduledTime + this.durationGetTemperatures;
	}

	private setValue(funcSet: (value: any) => void, value: string, timerSet: NodeJS.Timeout | null, funcGet: () => void, durationGet: number, timerGet: NodeJS.Timeout | null): [NodeJS.Timeout, NodeJS.Timeout] {
		if (timerSet !== null) {
			clearTimeout(timerSet);
		}
		if (timerGet !== null) {
			clearTimeout(timerGet);
		}
		const [scheduledTimeSet, scheduledIntervalSet] = this.computeScheduling();
		this.nextFreeSlot = scheduledTimeSet + this.durationSetAnything;
		const newTimerSet = setTimeout(funcSet, scheduledIntervalSet, value);

		const [scheduledTimeGet, scheduledIntervalGet] = this.computeScheduling();
		this.nextFreeSlot = scheduledTimeGet + durationGet;
		const newTimerGet = setTimeout(funcGet, scheduledIntervalGet);

		return [newTimerSet, newTimerGet];
	}
	
	setModus(value: ModusValue) {
		[this.timerSetModus, this.timerGetModus] = this.setValue(
			this.sendSetModus.bind(this),
			value,
			this.timerSetModus,
			this.sendGetModus.bind(this),
			this.durationGetModus,
			this.timerGetModus
		);
	}
	setTargetTemperature(value: number) {
		[this.timerSetTargetTemperature, this.timerGetTargetTemperature] = this.setValue(
			this.sendSetTargetTemperature.bind(this),
			value.toString(),
			this.timerSetTargetTemperature,
			this.sendGetTargetTemperature.bind(this),
			this.durationGetTargetTemperature,
			this.timerGetTargetTemperature
		);
	}
	setFirstklappe(value: ControlValue) {
		[this.timerSetFirstKlappe, this.timerGetControlValues] = this.setValue(
			this.sendSetFirstklappe.bind(this),
			value,
			this.timerSetFirstKlappe,
			this.sendGetControlValues.bind(this),
			this.durationGetControlValues,
			this.timerGetControlValues
		);
	}
	setHeizklappe(value: ControlValue) {
		[this.timerSetHeizklappe, this.timerGetControlValues] = this.setValue(
			this.sendSetHeizKlappe.bind(this),
			value,
			this.timerSetHeizklappe,
			this.sendGetControlValues.bind(this),
			this.durationGetControlValues,
			this.timerGetControlValues
		);
	}
	setKollektorklappe(value: ControlValue) {
		[this.timerSetKollektorklappe, this.timerGetControlValues] = this.setValue(
			this.sendSetKollektorKlappe.bind(this),
			value,
			this.timerSetKollektorklappe,
			this.sendGetControlValues.bind(this),
			this.durationGetControlValues,
			this.timerGetControlValues
		);
	}
	setSpeicherklappe(value: ControlValue) {
		[this.timerSetSpeicherklappe, this.timerGetControlValues] = this.setValue(
			this.sendSetSpeicherKlappe.bind(this),
			value,
			this.timerSetSpeicherklappe,
			this.sendGetControlValues.bind(this),
			this.durationGetControlValues,
			this.timerGetControlValues
		);
	}
	setWintergartenfenster(value: ControlValue) {
		[this.timerSetWintergartenfenster, this.timerGetControlValues] = this.setValue(
				this.sendSetWintergartenFenster.bind(this),
			value,
			this.timerSetWintergartenfenster,
			this.sendGetControlValues.bind(this),
			this.durationGetControlValues,
			this.timerGetControlValues
		);
	}
	setVentilator(value: ControlValue) {
		[this.timerSetVentilator, this.timerGetControlValues] = this.setValue(
				this.sendSetVentilator.bind(this),
			value,
			this.timerSetVentilator,
			this.sendGetControlValues.bind(this),
			this.durationGetControlValues,
			this.timerGetControlValues
		);
	}
	setPumpeWasserkollektor(value: ControlValue) {
		[this.timerSetPumpeWasserkollektor, this.timerGetControlValues] = this.setValue(
			this.sendSetPumpeWasserKollektor.bind(this),
			value,
			this.timerSetPumpeWasserkollektor,
			this.sendGetControlValues.bind(this),
			this.durationGetControlValues,
			this.timerGetControlValues
		);
	}

	private handleIncomingData(data: any){
		const message = data.toString('ascii');
		if (message.startsWith("ARE"))
		{
			const code = message.substring(4);
			// WIN2: Wintermodus mit Nachtabsenkung von 21.00 - 5.00
			// WIN3: Wintermodus mit maximaler Speichertemp von 35°
			const modus = code == "SOM1" ? "summer" : "winter"; // we interpret WIN1, WIN2, and WIN3 as a single wintermodus (corresponding to WIN1)
			// console.log("Aktueller Regelmodus: " + modus + "\n")
			this.onCurrentModus(modus);
		}
		else if (message.startsWith("ATW"))
		{
			const targetTemperature = parseInt(message.substring(4));
			// console.log("Aktuelle Zieltemperatur: " + targetTemperature + "°\n");
			this.onCurrentTargetTemperature(targetTemperature);
		}
		else if (message.startsWith("ASW"))
		{
			const messageParts = message.substring(4).split(';');
			const timeString = messageParts[0].replace(/ /gi, '0');
			const dateString = messageParts[1].replace(/ /gi, '0');			
			const controlValues = {
				firstKlappe: messageParts[2].substring(4).toLowerCase(),
				heizKlappe: messageParts[3].substring(4).toLowerCase(),
				kollektorKlappe: messageParts[4].substring(4).toLowerCase(),
				speicherKlappe: messageParts[5].substring(4).toLowerCase(),
				wintergartenFenster: messageParts[7].substring(4).toLowerCase(),
				ventilator: messageParts[6].substring(4).toLowerCase(),
				// messageParts[8] and messageParts[9] are not used / undefined
				pumpeWasserkollektor: messageParts[10].substring(4).toLowerCase()
				// messageParts[11] is not used / undefined
			};
			// console.log("Aktuelle Steuerwerte für Uhrzeit: " + timeString + ", Datum: " + dateString);
			// console.log("- Firstklappe: " + controlValues.firstKlappe);
			// console.log("- Heizklappe: " + controlValues.heizKlappe);
			// console.log("- Kollektorklappe: " + controlValues.kollektorKlappe);
			// console.log("- Speicherklappe: " + controlValues.speicherKlappe);
			// console.log("- Wintergarten-Fenster: " + controlValues.wintergartenFenster);
			// console.log("- Ventilator: " + controlValues.ventilator);
			// messageParts[8] and messageParts[9] are not used / undefined
			// console.log("- Pumpe Wasserkollektor: " + controlValues.pumpeWasserkollektor);
			// messageParts[11] is not used / undefined
			// console.log("")
			this.onCurrentControlValues(controlValues);
		}
		else if (message.startsWith("AZW"))
		{
			const messageParts = message.substring(4).split(';');
			const timeString = messageParts[0].replace(/ /gi, '0');
			const dateString = messageParts[1].replace(/ /gi, '0');		
			const statusValues = {
				firstKlappe: messageParts[2].substring(4).toLowerCase(),
				heizKlappe: messageParts[3].substring(4).toLowerCase(),
				kollektorKlappe: messageParts[4].substring(4).toLowerCase(),
				speicherKlappe: messageParts[5].substring(4).toLowerCase(),
				wintergartenFenster: messageParts[7].substring(4).toLowerCase(),
				ventilator: messageParts[6].substring(4).toLowerCase(),
				// messageParts[8] and messageParts[9] are not used / undefined
				pumpeWasserkollektor: messageParts[10].substring(4).toLowerCase()
				// messageParts[11] is not used / undefined
			};
			console.log("Aktuelle Zustandswerte für Uhrzeit: " + timeString + ", Datum: " + dateString);
			console.log("- Firstklappe: " + statusValues.firstKlappe);
			console.log("- Heizklappe: " + statusValues.heizKlappe);
			console.log("- Kollektorklappe: " + statusValues.kollektorKlappe);
			console.log("- Speicherklappe: " + statusValues.speicherKlappe);
			console.log("- Wintergarten-Fenster: " + statusValues.wintergartenFenster);
			console.log("- Ventilator: " + statusValues.ventilator);
			// messageParts[8] and messageParts[9] are not used / undefined
			console.log("- Pumpe Wasserkollektor: " + statusValues.pumpeWasserkollektor);
			// messageParts[11] is not used / undefined
			console.log("")
			this.onCurrentStatusValues(statusValues);
		}
		else if (message.startsWith('AMW')) {
			const messageParts = message.substring(4).split(';');
			const timeString = messageParts[0].replace(/ /gi, '0');
			const dateString = messageParts[1].replace(/ /gi, '0');
			const temperatures = {
				regenfuehler: parseFloat(messageParts[5]),
				aussenluftNord: parseFloat(messageParts[2]),
				ruecklaufLuftspeicher: parseFloat(messageParts[3]),
				vorlaufLuftspeicher: parseFloat(messageParts[4]),
				speichermasse: parseFloat(messageParts[6]),
				speicherOben: parseFloat(messageParts[7]),
				speicherMitte: parseFloat(messageParts[16]),
				speicherUnten: parseFloat(messageParts[8]),
				wohnraumLuft: parseFloat(messageParts[10]),
				wintergartenLuftOben: parseFloat(messageParts[9]),
				wintergartenLuftUnten: parseFloat(messageParts[15]),
				wasserKollektorblech: parseFloat(messageParts[11]),
				wasserWaermetauscherVorlauf: parseFloat(messageParts[12]),
				wasserWaermetauscherRueklauf: parseFloat(messageParts[13]),
				wasserBoiler: parseFloat(messageParts[14])
			};

			// console.log("Aktuelle Messwerte für Uhrzeit: " + timeString + ", Datum: " + dateString);
			// console.log("- Außenluft Nord: " + temperatures.aussenluftNord + "°");
			// console.log("- Rücklauf Luftspeicher: " + temperatures.ruecklaufLuftspeicher + "°");
			// console.log("- Vorlauf Luftspeicher: " + temperatures.vorlaufLuftspeicher + "°");
			// console.log("- Regenfühler: " + temperatures.regenfuehler);
			// console.log("- Speichermasse: " + temperatures.speichermasse + "°");
			// console.log("- Speicher oben: " + temperatures.speicherOben + "°");
			// console.log("- Speicher unten: " + temperatures.speicherUnten + "°");
			// console.log("- Wintergartenluft (1.Stock): " + temperatures.wintergartenLuftOben + "°");
			// console.log("- Wohnraumluft: " + temperatures.wohnraumLuft + "°");
			// console.log("- Wasser-Kollektorblech: " + temperatures.wasserKollektorblech + "°");
			// console.log("- Wasser-Wärmetauscher Vorlauf: " + temperatures.wasserWaermetauscherVorlauf + "°");
			// console.log("- Wasser-Wärmetauscher Rücklauf: " + temperatures.wasserWaermetauscherRueklauf + "°");
			// console.log("- Boiler-Wasser: " + temperatures.wasserBoiler + "°");
			// console.log("- Wintergartenluft (Erdgeschoß): " + temperatures.wintergartenLuftUnten + "°");
			// console.log("- Speicher Mitte: " + temperatures.speicherMitte + "°");
			// console.log("")

			this.onCurrentTemperatures(temperatures);
		}
	}
}