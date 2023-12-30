import { JSXElement, onMount, createSignal, Show } from 'solid-js';
import { SResident } from '../models/models';
import { API } from '../api/api';

interface EditResidentModalProps {
  resident: SResident | null;
  onRefresh: () => void;
  onClose: () => void;
};

function EditResidentModal(props: EditResidentModalProps): JSXElement {
  const [showModal, setShowModal] = createSignal(false);
  const [editingResident, setEditingResident] = createSignal<SResident | null>(props.resident);

  const roomLetters = ['A', 'B', 'C'];
  const roomNumbers = Array.from({ length: 20 }, (_, i) => i + 1);
  const bunkPositions = ['Top', 'Bottom'];

  const updateField = (field: keyof SResident, value: string | number) => {
    setEditingResident({ ...editingResident()!, [field]: value });
  };

  const updateRoom = (part: 'letter' | 'number' | 'bunk', value: string) => {
    let room = editingResident()?.room || '';
    let roomParts = room.match(/([A-C])(\d+)(Top|Bottom)/) || ['', '', '', ''];

    if (part === 'letter') roomParts[1] = value;
    if (part === 'number') roomParts[2] = value;
    if (part === 'bunk') roomParts[3] = value;

    updateField('room', roomParts.slice(1).join(''));
  };

  const handleSubmit = async () => {
    if (editingResident()) {
      // Replace with your API PATCH call
      const response = await API.PATCH(`residents/${editingResident()!.rfid}`, editingResident());
      if (response !== undefined && response?.success) {
        props.onRefresh();
      } else {
        console.log('Error updating resident');
      }
    }
    props.onClose();
  };

  onMount(() => {
    if (props.resident) {
      setEditingResident(props.resident);
      setShowModal(true);
    }
  });

  return (
    <Show when={showModal()}>
      <div class="modal modal-open">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Edit Resident</h3>

          {/* Input fields for resident details */}
          <input type="text" placeholder="RFID" class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('rfid', e.currentTarget.value)} />
          <input type="text" placeholder="Name" class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('name', e.currentTarget.value)} />
          <input type="text" placeholder="Document" class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('doc', e.currentTarget.value)} />
          <input type="number" placeholder="Unit ID" class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('unit', parseInt(e.currentTarget.value))} />
          <input type="number" placeholder="Level" class="input input-bordered w-full max-w-xs" onInput={(e) => updateField('level', parseInt(e.currentTarget.value))} />
          <select class="select select-bordered" onChange={(e) => updateRoom('letter', e.currentTarget.value)}>
            {roomLetters.map(letter => <option value={letter}>{letter}</option>)}
          </select>
          <select class="select select-bordered" onChange={(e) => updateRoom('number', e.currentTarget.value)}>
            {roomNumbers.map(number => <option value={number}>{number}</option>)}
          </select>
          <select class="select select-bordered" onChange={(e) => updateRoom('bunk', e.currentTarget.value)}>
            {bunkPositions.map(position => <option value={position}>{position}</option>)}
          </select>

          <div class="modal-action">
            <button class="btn" onClick={handleSubmit}>Update</button>
            <button class="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </div>
    </Show>
  );
}

export default EditResidentModal;
