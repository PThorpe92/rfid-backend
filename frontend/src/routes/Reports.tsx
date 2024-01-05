import { createSignal, Show, onMount, For, JSXElement } from 'solid-js';
import { API } from '../api/api';
import LocationsDropdown from '../components/LocationsDropdown';
import DatePicker from '../components/DatePicker'; // Assume you have a DatePicker component
import { STimestamp, SLocation, SResidentTimestamp, SResident } from '../models/models';
import Navbar from '../components/Navbar';

function ViewReports(): JSXElement {
  const [showLocationsDropdown, setShowLocationsDropdown] = createSignal<boolean>(false);
  const [selectedLocation, setSelectedLocation] = createSignal<number | null>(null);
  const [startDate, setStartDate] = createSignal<string>(''); // Format: YYYY-MM-DD
  const [endDate, setEndDate] = createSignal<string>(''); // Format: YYYY-MM-DD
  const [resTimestamps, setResTimestamps] = createSignal<SResidentTimestamp[]>([]);
  const [allLocations, setAllLocations] = createSignal<SLocation[]>([]);
  const [allResidents, setAllResidents] = createSignal<SResident[]>([]);
  const [unique, setUnique] = createSignal<boolean>(false);

  const fetchTimestamps = async () => {
    console.log("fetching timestamps");
    let urlstring = ``;
    switch (true) {
      case (selectedLocation() && startDate() !== '' && endDate() !== ''):
        urlstring = `timestamps?location=${selectedLocation()}&range=${startDate()}=${endDate()}`;
        break;
      case (startDate() !== '' && endDate() !== ''):
        urlstring = `timestamps?range=${startDate()}-${endDate()}`;
        break;
      case (selectedLocation() !== null):
        urlstring = `timestamps?location=${selectedLocation()}`;
        break;
      case (unique()):
        urlstring = `timestamps?unique=true`;
        break;
      default:
        urlstring = `timestamps`;
    };
    let response = await API.GET(urlstring);
    if (response?.data) {
      setResTimestamps(response.data as SResidentTimestamp[]);
    }
  };
  const getLocationName = (locationId: number): string => {
    if (allLocations() === undefined || allLocations().length === 0) {
      return `${locationId}`;
    } else {
      return allLocations().find((location) => location.id === locationId)!.name;
    }
  }

  const fetchResidents = async () => {
    const response = await API.GET('residents?all=true');
    if (response?.data) {
      setAllResidents(response.data as SResident[]);
    }
  }
  const handleCheckUnique = () => {
    setUnique(!unique());
  }
  const handleShowLocationsDropdown = () => {
    setShowLocationsDropdown(true);
  };

  const handleHideLocationsDropdown = () => {
    setShowLocationsDropdown(false);
  };
  const handleLocationSelect = (locationId: number) => {
    setSelectedLocation(locationId);
    setShowLocationsDropdown(false);
  };


  // Fetch all locations for the dropdown
  onMount(async () => {
    const response = await API.GET('locations?all=true');
    if (response?.data) {
      setAllLocations(response.data as SLocation[]);
      fetchResidents();
    }
  });
  return (
    <>
      <Navbar />
      <h1 class="flex justify-center text-4xl font-mono mb-4">View Reports</h1>

      <div class="grid grid-cols-5 gap-4">
        <div class="col-span-1">
          <h3 class="text-2xl font-mono">Filter by Location:</h3>
          <div class="btn-group">
            <DatePicker label="Start Date" onSelectDate={setStartDate} />
            <DatePicker label="End Date" onSelectDate={setEndDate} />
            <div class='btn btn-primary mt-4' onClick={handleShowLocationsDropdown}>Select Location</div>
            <button class="btn btn-primary mt-4" onClick={fetchTimestamps}>Fetch Timestamps</button>
            <div class='badge badge-accent badge-lg mt-4' onClick={handleHideLocationsDropdown}>{selectedLocation() ? `Location: ${selectedLocation()}` : 'Select Location'}</div>
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="badge badge-primary badge-lg mt-4">Show Unique Only</span>
                <input type="checkbox" class="toggle mt-5" onchange={handleCheckUnique} />
              </label>
            </div>
          </div>
          <Show when={showLocationsDropdown()}>
            <LocationsDropdown
              locations={allLocations()}
              onLocationSelect={(locationId: number) => handleLocationSelect(locationId)}
              onClose={() => { }}
              residents={[]}
            />
          </Show>
        </div>
        <div class="col-span-4 overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Img</th>
                <th>Location</th>
                <th>Time</th>
                <th>Name</th>
                <th>DOC</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              <For each={resTimestamps()}>
                {(timestamp) => (
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="avatar avatar-rounded">
                          <div class="mask mask-squircle w-12 h-12">
                            <img
                              src={`/imgs/${timestamp.resident.doc}.jpg`}
                              onError={(e) => e.currentTarget.src = '/imgs/default.jpg'}
                              class="w-12 h-12 object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{getLocationName(timestamp.timestamp.location)}</td>
                    <td>{timestamp.timestamp.ts}</td>
                    <td>{timestamp.resident.name}</td>
                    <td>{timestamp.resident.doc}</td>
                    <td>{timestamp.resident.level}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
export default ViewReports;
