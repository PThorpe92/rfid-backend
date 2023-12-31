import { API } from "../api/api";
import { createSignal, Show, For, onMount, JSXElement } from "solid-js";
import { SLocation } from "../models/models";

export interface EditLocationModalProps {
  handleClose: () => void;
  selectedLocation: SLocation;
  updateSelectedLocation: (loc: SLocation) => void;
}

function EditLocationModal(props: EditLocationModalProps): JSXElement {
  const [location, setLocation] = createSignal<SLocation | null>(null);

  const handleLocationNameChange = (e: string) => {
    const loc = { ...props.selectedLocation, name: e };
    setLocation(loc);
  };
  const handleLocationLevelChange = (e: number) => {
    const loc = { ...props.selectedLocation, level: e };
    setLocation(loc);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    props.updateSelectedLocation(location()!);
    let res = await API.PATCH(
      `locations/${props.selectedLocation.id}`,
      location(),
    );
    if (res !== undefined && res?.success) {
    }
    props.handleClose();
  };

  return (
    <div>
      <div class="modal modal-open">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Edit Location</h3>

          <label class="label">Location Name</label>
          <input
            type="text"
            class="input input-bordered w-full max-w-xs my-2"
            value={props.selectedLocation.name}
            onInput={(e) => handleLocationNameChange(e.target.value)}
          />
          <label class="label text-sm">Restriction Level</label>
          <input
            type="text"
            class="input input-bordered w-full max-w-xs my-2"
            value={props.selectedLocation.level}
            onInput={(e) =>
              handleLocationLevelChange(parseInt(e.target.value, 10))
            }
          />
          <h5 class="font-bold text-lg">
            Note: ID's may not be changed. You must create a new location and
            delete the existing one.
            <br />
            Be aware that you will lose all data about the location if it is
            deleted (timestamps, etc){" "}
          </h5>
          <div class="modal-action">
            <button class="btn btn-outline" onClick={() => props.handleClose}>
              Cancel
            </button>
            <button class="btn" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditLocationModal;
