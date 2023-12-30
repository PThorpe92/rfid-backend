import { createSignal, For, JSX, Show, onMount } from 'solid-js';
import AddResident from './AddResident'; // Import your AddResident component
import { SResident } from '../models/models';
import { API } from '../api/api';
import EditResident from './EditResident';

export interface ResidentsTableProps {
  residents: SResident[];
  onRefresh: () => void;
  onClose: () => void;
};

function ResidentsTable(props: ResidentsTableProps): JSX.Element {
  const [selectedResident, setSelectedResident] = createSignal<SResident | null>(null);
  const [showAddResident, setShowAddResident] = createSignal(false);
  const [allResidents, setAllResidents] = createSignal<SResident[]>([]);

  const getAllResidents = async () => {
    const res = await API.GET('residents?all=true');
    if (res?.data) {
      setAllResidents(res.data as SResident[]);
    }
  };

  const toggleResident = (doc: string) => {
    const res = allResidents().find((resident) => resident.doc === doc);
    if (res) {
      setSelectedResident(res);
    }
    return;
  };


  const handleEdit = () => {
    return (
      <EditResident />
    );
  };

  const handleDeleteResident = async () => {
    const res = await API.DELETE(`residents/${selectedResident()}`);
    if (res?.success === true) {
      props.onRefresh();
    }

  }

  const handleShowDelete = () => {
    return (
      <div class="modal active">
        <a href="#close" class="modal-overlay" aria-label="Close"></a>
        <div class="modal-container">
          <div class="modal-header">
            <a href="#close" class="btn btn-clear float-right" aria-label="Close"></a>
            <div class="modal-title h5">Delete Selected Residents</div>
          </div>
          <div class="modal-body">
            <div class="content">
              <p>Are you sure you want to delete the selected residents?</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-error" onClick={() => { }}>Delete</button>
            <a href="#close" class="btn">Cancel</a>
          </div>
        </div>
      </div>
    );
  };
  onMount(() => {
    if (allResidents().length === 0) { getAllResidents }
  });

  return (
    <div class="font-mono">
      <button class="btn btn-primary mb-4" onClick={() => setShowAddResident(true)}>Add Resident</button>

      <Show when={showAddResident()}>
        <AddResident onRefresh={props.onRefresh} />
      </Show>
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th></th>
              <th>RFID</th>
              <th>Name</th>
              <th>Document</th>
              <th>Room</th>
              <th>Unit</th>
              <th>Level</th>
              <th>Current Location</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.residents}>{(resident) =>
              <tr
                class="hover cursor-pointer"
                classList={{ 'bg-gray-400': selectedResident() === resident }}
                onClick={() => setSelectedResident(resident === selectedResident() ? null : resident)}>
                <td>{resident.id}</td>
                <td>{resident.name}</td>
                <td>{resident.doc}</td>
                <td>{resident.room}</td>
                <td>{resident.unit}</td>
                <td>{resident.level}</td>
                <td>{resident.current_location}</td>
              </tr>
            }</For>
          </tbody>
        </table>
        <br />
        <br />
        <Show when={selectedResident()}>
          <div class="badge badge-secondary">Selected: {selectedResident()!.name}</div>
          <button class="btn btn-secondary mt-4" onClick={handleEdit}>Edit Selected</button>
          <button class="btn btn-error mt-4 ml-2" onClick={handleShowDelete}>Delete Selected</button>
        </Show>
      </div>
      <button class="btn btn-outline mt-4" onClick={() => props.onClose()}>Close</button>
    </div>

  );
}

export default ResidentsTable;
