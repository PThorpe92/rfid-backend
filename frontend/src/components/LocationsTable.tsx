import { createSignal, For, JSXElement, Show } from 'solid-js';
import NewLocation from '../components/NewLocation'; // Import your AddLocation component
import { SLocation } from '../models/models';
import { API } from '../api/api';
import EditLocation from './EditLocation';

interface LocationTableProps {
  locations: SLocation[];
};

function LocationsTable(props: LocationTableProps): JSXElement {
  const [selectedLocation, setSelectedLocation] = createSignal<SLocation | null>(null);
  const [showAddLocation, setShowAddLocation] = createSignal(false);
  const [showEditLocation, setShowEditLocation] = createSignal(false);


  const toggleLocation = (checked: SLocation) => {
    setSelectedLocation(checked);
  };

  const sortLocations = (a: SLocation, b: SLocation) => {
    if (a.id! < b.id!) {
      return -1;
    }
    if (a.id! > b.id!) {
      return 1;
    }
    return 0;
  }
  const refreshSortedLocations = () => {
    props.locations.sort(sortLocations);
  }
  const handleNewLocationClose = () => {
    refreshSortedLocations();
    setShowAddLocation(false);
  };
  const handleEditLocationClose = () => {
    refreshSortedLocations();
    setShowEditLocation(false);
  };

  const handleEdit = () => {
    setShowEditLocation(true);
  };

  const handleDelete = async (e: Event) => {
    e.preventDefault();
    let prompt = window.confirm("Are you sure you want to delete the selected location?");
    if (prompt) {
      let location = await API.DELETE(`locations/${selectedLocation()!.id}`);
      if (location !== undefined && location.success === true) {
        window.location.reload();
      }
    };
  };

  return (
    <div class="font-mono">
      <button class="btn btn-primary mb-4" onClick={() => setShowAddLocation(true)}>Add Location</button>

      <Show when={showAddLocation()}>
        <NewLocation handleClose={handleNewLocationClose} />
      </Show>
      <Show when={showEditLocation()}>
        <EditLocation selectedLocation={selectedLocation()!} handleClose={handleEditLocationClose} updateSelectedLocation={toggleLocation} />
      </Show>
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th></th>
              <th>Name</th>
              <th></th>
              <th>Permission Level</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.locations}>{(location) =>
              <tr
                class="hover cursor-pointer"
                classList={{ 'bg-gray-200': selectedLocation() === location }}
                onClick={() => setSelectedLocation(location === selectedLocation() ? null : location)}>
                <td class="table-cell">{location.id}</td>
                <td class="table-cell">{location.name}</td>
                <td class="table-cell">{location.level}</td>
              </tr>
            }</For>
          </tbody>
        </table>
        <Show when={selectedLocation()}>
          <div class="badge badge-secondary">Selected: {selectedLocation()!.id}</div>
          <button class="btn btn-secondary mt-4" onClick={handleEdit}>Edit</button>
          <button class="btn btn-error mt-4 ml-2" onClick={handleDelete}>Delete</button>
        </Show>
      </div>
    </div>
  );
}
export default LocationsTable;
