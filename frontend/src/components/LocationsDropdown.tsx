import { JSXElement } from 'solid-js';
import { SLocation } from '../models/models';

interface LocationModalProps {
  onClose: () => void;
  onLocationSelect: (locationId: number) => void;
}

interface LocationModalProps {
  locations: SLocation[];
  onClose: () => void;
  onLocationSelect: (locationId: number) => void;
}

function LocationsDropdown(props: LocationModalProps): JSXElement {

  const handleLocationChange = (locationId: number) => {
    props.onLocationSelect(locationId);
  };

  return (
    <div class="dropdown">
      <label tabindex="0" class="btn m-1">Select Location</label>
      <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
        {props.locations.map((location) => (
          <li accessKey={'id'}>
            <a onClick={() => handleLocationChange(location.id)}>
              {location.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LocationsDropdown;
