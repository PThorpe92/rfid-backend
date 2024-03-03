import { createSignal, For, JSXElement, Show, onMount } from "solid-js";
import AddResident from "./AddResident";
import { ExitType, SResident, SLocation } from "../models/models";
import { API } from "../api/api";
import EditResident from "./EditResident";
import { toast, Toaster } from "solid-toast";
import AddPhoto from "../components/AddPhoto";

export interface ResidentsTableProps {
  residents: SResident[];
  locations: SLocation[];
  onRefresh: () => void;
  onClose: () => void;
  currentScanLocation: number;
}

function ResidentsTable(props: ResidentsTableProps): JSXElement {
  const [allLocations, setAllLocations] = createSignal<SLocation[]>(props.locations);
  const [selectedResident, setSelectedResident] =
    createSignal<SResident | null>(null);
  const [allResidents, setAllResidents] = createSignal<SResident[]>([]);
  const [showUploadPhoto, setShowUploadPhoto] = createSignal(false);
  const [showUpdateResident, setShowUpdateResident] = createSignal(false);
  const [showDeleteResident, setShowDeleteResident] = createSignal(false);
  const [currentScanLocation, setCurrentScanLocation] = createSignal<number>(props.currentScanLocation);
  const [location, setLocation] = createSignal(0);
  const [selectedResidentDoc, setSelectedResidentDoc] = createSignal<number>();

  const lookupLocation = (locationId: number): SLocation => {
    if (allLocations() === undefined || allLocations().length === 0) {
      return { id: locationId, name: `${locationId}`, level: 1 };
    } else {
      return allLocations().find((location) => location.id === locationId)!;
    }
  };

  const getAllResidents = async () => {
    const res = await API.GET("residents?all=true");
    if (res?.data) {
      setAllResidents(res.data as SResident[]);
    }
  };

  let currentScanLoc = localStorage.getItem("locationId");
  if (currentScanLoc !== null) {
    setLocation(parseInt(currentScanLoc, 10));
  }

  const handleSelectResident = (resident: SResident) => {
    setSelectedResident(resident);
    setSelectedResidentDoc(resident.doc);
  };

  const handleCloseModal = (success: ExitType[]) => {
    success.map(s => {
      switch (s) {
        case ExitType.Success:
          toast.success("Resident updated successfully.");
          break;
        case ExitType.Error:
          toast.error("Resident update failed, please try again.");
          break;
        case ExitType.Cancel:
          toast("Resident update cancelled.");
          break;
        case ExitType.ImageSuccess:
          toast.success("Image uploaded successfully.");
          break;
        case ExitType.ImageError:
          toast.error("Image upload failed, please try again.");
          break;
        case ExitType.Cancel:
          toast("Image upload cancelled.");
          break;
      }
    });
  }

  const handleCloseResidentUpdate = (success: ExitType[]) => {
    handleCloseModal(success);
    setShowUpdateResident(false);
    setSelectedResident(null);
  };

  const handleEdit = () => {
    setShowUpdateResident(true);
  };

  const handleDeleteResident = async () => {
    const res = await API.DELETE(`residents/${selectedResident()?.rfid}`);
    if (res?.success === true) {
      toast.success("Resident deleted successfully.");
      props.onRefresh();
      setShowDeleteResident(false);
      setSelectedResident(null);
    }
  };

  const handleShowUploadPhoto = () => {
    setSelectedResidentDoc(selectedResident()?.doc!);
    setShowUploadPhoto(true);
    setSelectedResident(null);
  };

  const handleCloseAddPhoto = (success: ExitType) => {
    handleCloseResidentUpdate([success]);
    setShowUploadPhoto(false);
  }

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
        <table class="table table-lg">
          <thead>
            <tr>
              <th>Img</th>
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
                  classList={{
                    'bg-base-300': currentScanLocation() === 0,
                    'bg-secondary-content': resident.current_location !== currentScanLocation(),
                    'bg-neutral': resident.unit === currentScanLocation() && resident.current_location !== currentScanLocation(),
                    'bg-base-100': resident.unit !== currentScanLocation() && resident.current_location === currentScanLocation(),
                  }}
                  onClick={() => handleSelectResident(resident)}
                >
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar avatar-rounded">
                        <div class="mask mask-squircle w-12 h-12">
                          <img
                            src={`/imgs/${resident.doc}.jpg`}
                            onError={(e) => e.currentTarget.src = '/imgs/default.jpg'}
                            class="w-12 h-12 object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="text-l">{resident.name}</td>
                  <td class="text-l">{resident.doc}</td>
                  <td class="text-l">{resident.room}</td>
                  <td class="text-l">{resident.unit}</td>
                  <td class="text-l">{resident.level}</td>
                  <td class="text-l">{lookupLocation(resident.current_location).name}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <br />
        <br />
        <Show when={selectedResident()}>
          <div class="modal modal-open">
            <div class="modal-box">
              <div class="modal-title">
                <img src={`/imgs/${selectedResident()!.doc}.jpg`} />
                <div class="font-mono text-xl">Name: {selectedResident()!.name}</div>
                <div class="font-mono text-xl">DOC#: {selectedResident()!.doc}</div>
                <div class="font-mono text-xl">Pod/Room/Bunk: {selectedResident()!.room}</div>
                <div class="font-mono text-xl">Unit: {selectedResident()!.unit}</div>
                <div class="font-mono text-xl">Level: {selectedResident()!.level}</div>
              </div>
              <div class="modal-body">
                <div class="content">
                  <button class="btn btn-outline" onClick={handleEdit}>
                    Edit
                  </button>
                  <button class="btn btn-error" onClick={handleShowDelete}>
                    Delete
                  </button>
                  <button class="btn btn-outline" onClick={handleShowUploadPhoto}>
                    Upload Photo
                  </button>
                  <button class="btn btn-outline" onClick={() => setSelectedResident(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
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
        <Show when={showUploadPhoto()}>
          <AddPhoto
            residentDoc={selectedResidentDoc()!}
            onClose={handleCloseAddPhoto}
          />
        </Show>
      </div>
    </div>
  );
}

export default ResidentsTable;
