import { JSXElement, createSignal, Show } from 'solid-js';
import { SResident } from '../models/models';
import { API } from '../api/api';
import { ExitType } from '../models/models';
interface EditResidentModalProps {
  resident: SResident;
  onClose: (success: ExitType) => void;
};


function EditResidentModal(props: EditResidentModalProps): JSXElement {
  const getBuildRoom = () => {
    let room = props.resident.room;
    let pod = room.split('-')[0];
    let roomNumber = room.split('-')[1].slice(0, -1);
    let bunk = room.split('-')[1].slice(-1);
    return { pod, roomNumber, bunk } as buildRoom;
  }
  interface buildRoom {
    pod: 'A' | 'B' | 'C',
    roomNumber: string,
    bunk: 'T' | 'B'
  };
  const [editingResident, setEditingResident] = createSignal<SResident>(props.resident);
  const [editRoom, setEditRoom] = createSignal<buildRoom>(getBuildRoom());
  const [rfid, setRfid] = createSignal<string>(props.resident.rfid);
  const podLetters = ['A', 'B', 'C'];
  const roomNumbers = Array.from({ length: 20 }, (_, i) => i + 1);
  const bunkPositions = ['Top', 'Bottom'];
  const levels = Array.from({ length: 5 }, (_, i) => i + 1);
  const unitLetters = ['A', 'B', 'C', 'D', 'E'];
  const [formErrors, setFormErrors] = createSignal({
    rfid: '',
    name: '',
    doc: ''
  });

  const validateForm = () => {
    let errors = { rfid: '', name: '', doc: '' };
    let isValid = true;

    // Validate RFID (17 digits)
    if (!/^\d{17}$/.test(editingResident().rfid)) {
      errors.rfid = 'RFID must be 17 digits.';
      isValid = false;
    }
    // Validate Name (two words, no numbers)
    if (!/^[A-Za-z]+ [A-Za-z]+$/.test(editingResident().name)) {
      errors.name = 'Name must be two words, no numbers.';
      isValid = false;
    }

    // Validate DOC (all numbers, no more than 10 digits)
    if (!/^\d{1,10}$/.test(editingResident().doc)) {
      errors.doc = 'DOC must be all numbers and no more than 10 digits.';
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const updateField = (field: keyof SResident, value: string | number) => {
    setEditingResident({ ...editingResident(), [field]: value });
  };

  const determineBunk = (bunk: string) => {
    switch (bunk) {
      case 'Top':
        return 'T';
      case 'Bottom':
        return 'B';
      default:
        return 'T';
    }
  }

  const updateBuildRoom = (field: keyof buildRoom, value: string | number) => {
    if (field === 'bunk') {
      setEditRoom({ ...editRoom(), bunk: determineBunk(value.toString()) });
    } else {
      setEditRoom({ ...editRoom(), [field]: value });
    }
  };

  const determineUnit = (unit: number) => {
    switch (unit) {
      case 1:
        return 'A';
      case 6:
        return 'B';
      case 7:
        return 'C';
      case 14:
        return 'D';
      default:
        return 'A';
    }
  };

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
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const buildRoom = editRoom();
      setEditingResident({ ...editingResident(), room: `${buildRoom.pod}-${buildRoom.roomNumber}${buildRoom.bunk}` });
      // Replace with your API PATCH call
      API.PATCH(`residents/${rfid()}`, editingResident()).then(response => {
        if (response && response.success) {
          props.onClose(ExitType.Success);
        }
      }).catch(error => {
        props.onClose(ExitType.Error);
        console.log(error);
      });
    }
  }



  return (
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Edit Resident</h3>
        <Show when={formErrors().rfid}>
          <div class="text-red-500">{formErrors().rfid}</div>
        </Show>
        <Show when={formErrors().name}>
          <div class="text-red-500">{formErrors().name}</div>
        </Show>
        <Show when={formErrors().doc}>
          <div class="text-red-500">{formErrors().doc}</div>
        </Show>
        {/* Input fields for resident details */}
        <label class="label">RFID</label>
        <input type="text" value={editingResident().rfid} class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('rfid', e.currentTarget.value)} />
        <label class="label">Full Name (Last, First)</label>
        <input type="text" value={editingResident().name} class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('name', e.currentTarget.value)} />
        <label class="label">DOC #</label>
        <input type="text" value={editingResident().doc} class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('doc', e.currentTarget.value)} />
        <div class="flex grid grid-cols-2">
          <label class="label">Unit</label>
          <select class="select select-bordered" value={determineUnit(editingResident().unit)} onInput={(e) => updateUnit(e.currentTarget.value)}>
            {unitLetters.map(letter => <option value={letter}>{letter}</option>)}
          </select>
          <label class="label">Level</label>
          <select class="select select-bordered" value={editingResident().level} onChange={(e) => updateField('level', parseInt(e.currentTarget.value, 10))}>
            {levels.map(level => <option value={level}>{level}</option>)}
          </select>
          <label class="label">Pod</label>
          <select class="select select-bordered" value={editRoom().pod} onChange={(e) => updateBuildRoom('pod', e.currentTarget.value)}>
            {podLetters.map(letter => <option value={letter}>{letter}</option>)}
          </select>
          <label class="label">Room#</label>
          <select class="select select-bordered" value={editRoom().roomNumber} onChange={(e) => updateBuildRoom('roomNumber', e.currentTarget.value.toString())}>
            {roomNumbers.map(number => <option value={number}>{number}</option>)}
          </select>
          <label class="label">Bunk</label>
          <select class="select select-bordered" onChange={(e) => updateBuildRoom('bunk', e.currentTarget.value)}>
            {bunkPositions.map(position => <option value={position}>{position}</option>)}
          </select>
        </div>
        <div class="modal-action">
          <button class="btn btn-outline" onClick={() => props.onClose(ExitType.Cancel)}>Cancel</button>
          <button class="btn btn-primary" onClick={handleSubmit}>Update</button>
        </div>
      </div>
    </div>
  );
}

export default EditResidentModal;
