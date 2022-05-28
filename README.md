### Solarsteuerung Kasten 123

### Electron App
Backend:
- Code in src/main
- Sprache Typescript
- verwendet 'serialport' Javascript library um mit Microcontroller zu kommunizieren (Microcontroller steht im Büro in dem in der Wand eingelassenen Kasten)
  gesamter Code der für die Kommunikation mit dem Microcontroller verantwortlich ist, befindet sich in src/main/SerialCommunicationKasten123.ts

Frontend:
- Code in src/renderer
- Typescript, React framework, Primereact library




## Starting Development

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```

## Docs

See our [docs and guides here](https://electron-react-boilerplate.js.org/docs/installation)