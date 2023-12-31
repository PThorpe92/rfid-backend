import { createSignal, For, JSXElement, Show, onMount } from "solid-js";
import AddResident from "./AddResident"; // Import your AddResident component
import { ExitType, SResident } from "../models/models";
import { API } from "../api/api";
import EditResident from "./EditResident";
import { toast, Toaster } from "solid-toast";

export interface ResidentsTableProps {
  residents: SResident[];
  onRefresh: () => void;
  onClose: () => void;
}

function ResidentsTable(props: ResidentsTableProps): JSXElement {
  const [selectedResident, setSelectedResident] =
    createSignal<SResident | null>(null);
  const [allResidents, setAllResidents] = createSignal<SResident[]>([]);
  const [showUpdateResident, setShowUpdateResident] = createSignal(false);
  const [showDeleteResident, setShowDeleteResident] = createSignal(false);

  const getAllResidents = async () => {
    const res = await API.GET("residents?all=true");
    if (res?.data) {
      setAllResidents(res.data as SResident[]);
    }
  };

  const handleSelectResident = (resident: SResident) => {
    setSelectedResident(resident);
  };

  const handleCloseResidentUpdate = (success: ExitType) => {
    switch (success) {
      case ExitType.Success:
        toast.success("Resident updated successfully.");
        break;
      case ExitType.Error:
        toast.error("Resident update failed, please try again.");
        break;
      case ExitType.Cancel:
        toast("Resident update cancelled.");
        break;
    }
    setSelectedResident(null);
    setShowUpdateResident(false);
  };

  const handleEdit = () => {
    setShowUpdateResident(true);
  };

  const handleDeleteResident = async () => {
    const res = await API.DELETE(`residents/${selectedResident()}`);
    if (res?.success === true) {
      toast.success("Resident deleted successfully.");
      props.onRefresh();
    }
  };
  const handleShowDelete = () => {
    setShowDeleteResident(true);
  };

  onMount(() => {
    if (allResidents().length === 0) {
      getAllResidents;
    }
  });

  return (
    <div class="font-mono">
      <div class="overflow-x-auto">
        <table class="table ">
          <thead>
            <tr>
              <th>Name</th>
              <th>DOC</th>
              <th>Room</th>
              <th>Unit</th>
              <th>Level</th>
              <th>Current Location</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.residents}>
              {(resident) => (
                <tr
                  class="hover cursor-pointer"
                  classList={{ 'bg-secondary-100': resident.current_location !== parseInt(localStorage.getItem("locationId")!, 10) }}
                  onClick={() => handleSelectResident(resident)}
                >
                  <td>{resident.name}</td>
                  <td>{resident.doc}</td>
                  <td>{resident.room}</td>
                  <td>{resident.unit}</td>
                  <td>{resident.level}</td>
                  <td>{resident.current_location}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <br />
        <br />
        <Toaster
          position="top-center"
          gutter={8}
          containerClassName=""
          toastOptions={{
            className: "",
            duration: 7000,
            style: {
              background: "#2b2b2b",
              color: "#02eb48",
            },
          }}
        />
        <Show when={selectedResident()}>
          <Show when={showDeleteResident()}>
            <div class="modal modal-open">
              <div class="modal-box">
                <div class="modal-header">
                  <div class="modal-title h3">Delete Selected Residents</div>
                </div>
                <div class="modal-body">
                  <div class="content">
                    <br />
                    <p class="bg-primary">
                      Are you sure you want to delete the selected resident?
                    </p>
                    <br />
                    <div class="justify-center font-mono text-xl">
                      {selectedResident()!.name}
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-error" onClick={handleDeleteResident}>
                    Delete
                  </button>
                  <button
                    class="btn"
                    onClick={() => setShowDeleteResident(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </Show>
          <div class="btn">Selected: {selectedResident()!.name}</div>
          <br />
          <button class="btn btn-secondary mt-4" onClick={handleEdit}>
            Edit Selected
          </button>
          <button class="btn btn-error mt-4 ml-2" onClick={handleShowDelete}>
            Delete Selected
          </button>
        </Show>
      </div>
      <div class="container object-center">
        <Show when={showUpdateResident()}>
          <EditResident
            resident={selectedResident()!}
            onClose={handleCloseResidentUpdate}
          />
        </Show>
        <button class="btn btn-outline mt-4" onClick={() => props.onClose()}>
          Close
        </button>
      </div>
    </div>
  );
}

export default ResidentsTable;
