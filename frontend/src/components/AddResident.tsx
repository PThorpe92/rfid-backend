import { createSignal, Show, JSXElement } from 'solid-js';
import { API } from '../api/api';
import { SResident } from '../models/models';

interface AddResidentModalProps {
  onRefresh: () => void;
};

function AddResidentModal(props: AddResidentModalProps): JSXElement {
  const [showModal, setShowModal] = createSignal(false);
  const [newResident, setNewResident] = createSignal<SResident>({
    current_location: 0,
    rfid: '',
    name: '',
    doc: '',
    room: '',
    unit: 0,
    level: 0
  });

  const roomLetters = ['A', 'B', 'C'];
  const roomNumbers = Array.from({ length: 20 }, (_, i) => i + 1);
  const bunkPositions = ['Top', 'Bottom'];

  const updateUnit = (unit: string) => {
    switch (unit) {
      case 'A':
        updateField('unit', 1);
        break;
      case 'B':
        updateField('unit', 6);
        break;
      case 'C':
        updateField('unit', 7);
        break;
      case 'D':
        updateField('unit', 14);
        break;
      default:
        break;
    }
  }

  const updateField = (field: keyof SResident, value: string | number) => {
    setNewResident({ ...newResident(), [field]: value });
  };

  const updateRoom = (part: 'pod' | 'number' | 'bunk', value: string) => {
    let room = newResident().room;
    let roomParts = room.match(/([A-C])(\d+)(Top|Bottom)/);

    if (roomParts) {
      if (part === 'pod') roomParts[1] = value;
      if (part === 'number') roomParts[2] = value;
      if (part === 'bunk') roomParts[3] = value;
      updateField('room', roomParts.slice(1).join(''));
    }
  };

  const handleSubmit = async () => {
    // Replace with your API POST call
    const response = await API.POST('residents', newResident());
    if (response !== undefined && response?.success) {
      props.onRefresh();
    } else {
      console.log('Error adding resident');
    }
    setShowModal(false);
  };

  return (
    <div>
      <button class="btn" onClick={() => setShowModal(true)}>Add New Resident</button>

      <Show when={showModal()}>
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg">New Resident</h3>

            <input type="text" placeholder="RFID (please scan tag)" class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('rfid', e.currentTarget.value)} />
            <input type="text" placeholder="Name" class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('name', e.currentTarget.value)} />
            <input type="text" placeholder="Doc#" class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('doc', e.currentTarget.value)} />
            <input type="text" placeholder="Unit ID" class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('unit', parseInt(e.currentTarget.value))} />

            {/* We'll get the Character for the unit and convert to ID */}
            <label class="label">Unit</label>
            <select class="select select-bordered" onChange={(e) => updateUnit(e.currentTarget.value)}>
              {roomLetters.map(letter => <option value={letter}>{letter}</option>)}
            </select>
            <label class="label">Level</label>
            <input type="number" placeholder="Level" class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('level', parseInt(e.currentTarget.value))} />

            {/* Dropdowns for room selection */}
            <label class="label">Pod</label>
            <select class="select select-bordered" onChange={(e) => updateRoom('pod', e.currentTarget.value)}>
              {roomLetters.map(letter => <option value={letter}>{letter}</option>)}
            </select>
            <label class="label">Room #</label>
            <select class="select select-bordered" onChange={(e) => updateRoom('number', e.currentTarget.value)}>
              {roomNumbers.map(number => <option value={number}>{number}</option>)}
            </select>
            <label class="label">Bunk</label>
            <select class="select select-bordered" onChange={(e) => updateRoom('bunk', e.currentTarget.value)}>
              {bunkPositions.map(position => <option value={position}>{position}</option>)}
            </select>
            <div class="modal-action">
              <button class="btn" onClick={handleSubmit}>Submit</button>
              <button class="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default AddResidentModal;
