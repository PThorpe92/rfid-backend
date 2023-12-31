import { createSignal, onMount, For, JSXElement } from 'solid-js';
import { API } from '../api/api';
import LocationsDropdown from '../components/LocationsDropdown';
import DatePicker from '../components/DatePicker'; // Assume you have a DatePicker component
import { STimestamp, SLocation } from '../models/models';
import Navbar from '../components/Navbar';

function ViewReports(): JSXElement {
  const [selectedLocation, setSelectedLocation] = createSignal<number | undefined>();
  const [startDate, setStartDate] = createSignal<string>(''); // Format: YYYY-MM-DD
  const [endDate, setEndDate] = createSignal<string>(''); // Format: YYYY-MM-DD
  const [timestamps, setTimestamps] = createSignal<STimestamp[]>([]);
  const [allLocations, setAllLocations] = createSignal<SLocation[]>([]);

  const fetchTimestamps = async () => {
    if (selectedLocation() && startDate() && endDate()) {
      const response = await API.GET(`locations/${selectedLocation()}/timestamps/${startDate()}/${endDate()}`);
      if (response?.data) {
        setTimestamps(response.data as STimestamp[]);
      }
    }
  };

  // Fetch all locations for the dropdown
  onMount(async () => {
    const response = await API.GET('locations?all=true');
    if (response?.data) {
      setAllLocations(response.data as SLocation[]);
    }
  });

  return (
    <>
      <Navbar />
      <br />
      <br />
      <h1 class="flex justify-center text-4xl font-mono mb-4">View Reports</h1>

      <div class="grid grid-cols-3 gap-4 mb-4">
        <div>
          <h3 class="text-2xl font-mono">Filter by Location:</h3>
          <LocationsDropdown
            locations={allLocations()}
            onLocationSelect={(locationId: number) => setSelectedLocation(locationId)}
            onClose={() => { /* Your close logic */ }}
            residents={[]}
          />
        </div>
        <div>
          <DatePicker label="Start Date" onSelectDate={setStartDate} />
        </div>
        <div>
          <DatePicker label="End Date" onSelectDate={setEndDate} />
          <button class="btn btn-primary mt-4" onClick={fetchTimestamps}>Fetch Timestamps</button>
          <div class="overflow-x-auto">
            <table class="table table-xs">
              <thead>
                <tr>
                  <th>RFID</th>
                  <th>Location</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                <For each={timestamps()}>
                  {(timestamp) => (
                    <tr>
                      <td>{timestamp.rfid}</td>
                      <td>{timestamp.location}</td>
                      <td>{timestamp.time}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}

export default ViewReports;
