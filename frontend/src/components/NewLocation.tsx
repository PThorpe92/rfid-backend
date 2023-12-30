import { createSignal, Show, JSXElement, Setter, onMount } from 'solid-js';
import { SLocation } from "../models/models"
import { API } from "../api/api"

export interface NewLocationProps {
  handleClose: () => void;
}

function NewLocation(props: NewLocationProps): JSXElement {
  const [locationID, setLocationID] = createSignal<number>(0);
  const [locationName, setLocationName] = createSignal<string>('');
  const [locationLevel, setLocationLevel] = createSignal<number>(0);


  const levels = Array.from({ length: 4 }, (_, i) => i + 1);

  const handleLocationLevelChange = (e: string) => {
    setLocationLevel(parseInt(e, 10));
  };

  const handleLocationNameChange = (e: string) => {
    setLocationName(e);
  };
  const handleLocationIDChange = (e: string) => {
    setLocationID(parseInt(e, 10));
  }
  const submitLocation = async () => {
    const location: SLocation = { id: locationID(), name: locationName(), level: locationLevel() };
    let response = await API.POST(`locations`, location);
    if (response !== undefined && response.success === true) {
      props.handleClose();
      window.location.reload();
    } else {
      console.log(response);
    }
  };


  return (
    <div>
      <div class="modal modal-open">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Enter Location ID</h3>
          <input type="text" placeholder="Location ID" class="input input-bordered w-full max-w-xs" onInput={(e) => handleLocationIDChange(e.target.value)} />
          <input type="text" placeholder="Location Name" class="input input-bordered w-full max-w-xs" onInput={(e) => handleLocationNameChange(e.target.value)} />
          <h5 class="font-bold text-md padding-top,">Level</h5>
          <select class="select select-bordered" onChange={(e) => handleLocationLevelChange(e.target.value)}>
            {levels.map(number => <option value={number}>{number}</option>)}
          </select>
          <div class="modal-action">
            <button class="btn btn-outline" onClick={() => props.handleClose()}>Cancel</button>
            <button class="btn" onClick={submitLocation}>Submit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default NewLocation;
