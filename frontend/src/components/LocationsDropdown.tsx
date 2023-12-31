import { JSXElement } from "solid-js";
import { SLocation, SResident } from "../models/models";

interface LocationModalProps {
  locations: SLocation[];
  onClose: () => void;
  onLocationSelect: (locationId: number) => void;
  residents: SResident[];
}

function LocationsDropdown(props: LocationModalProps): JSXElement {
  const handleLocationChange = (locationId: number) => {
    props.onLocationSelect(locationId);
  };

  const countResidentsAtLocation = (locationId: number): string => {
    return props.residents.length > 0 ? props.residents.filter(resident => resident.current_location === locationId).length.toString() : ""
  };

  return (
    <>
      <div class="dropdown">
        <ul class="menu flex  bg-base-200 w-56 rounded-box"
          tabindex="0">
          {props.locations.map((location) => (
            <li accessKey={location.id.toString()} class="w-full">
              <a onClick={() => handleLocationChange(location.id)}>
                {`${location.name}      ${countResidentsAtLocation(location.id)}`}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
export default LocationsDropdown;
