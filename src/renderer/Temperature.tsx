type Props = {
    name: string
    value: number
    type: "temperature" | "humidity"
}

export function Temperature(props: Props) {
    return (
        <div className="flex">
            <h4 className="temperatureName">{props.name}:</h4>
            <h3 className="temperatureValue">{Math.round(props.value)}{props.type === "temperature" ? "°" : ""}</h3>
            {/* <h4 className="temperature border-round border-1 p-2 border-gray-300">{props.value}°</h4> */}
        </div>
    );
  }