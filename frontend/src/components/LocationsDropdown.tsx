import { JSXElement, Show } from "solid-js";
import { SLocation, SResident } from "../models/models";

interface LocationModalProps {
  locations: SLocation[];
  open: boolean;
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
      <Show when={props.open}>
        <div class="modal modal-open">
          <div class="modal-box">
            <div class="modal-action">
              <button class="btn" onClick={() => props.onClose()}>Close</button>
            </div>
            <table class="table w-full">
              <thead>
                <tr>
                  <th>Location ID</th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {props.locations.map((location) => (
                  <tr>
                    <td>{location.id}</td>
                    <td>
                      <div class="tooltip" data-tip={`Residents at this location: ${countResidentsAtLocation(location.id)}`}>
                        {location.name}
                      </div>
                    </td>
                    <td>
                      <button class="btn" onClick={() => handleLocationChange(location.id)}>Select</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Show>
    </>
  );
}
export default LocationsDropdown;
