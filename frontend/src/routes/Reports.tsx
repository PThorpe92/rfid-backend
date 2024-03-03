import { createSignal, Show, onMount, For, JSXElement } from 'solid-js';
import { API } from '../api/api';
import LocationsDropdown from '../components/LocationsDropdown';
import DatePicker from '../components/DatePicker'; // Assume you have a DatePicker component
import { SLocation, SResidentTimestamp } from '../models/models';
import Navbar from '../components/Navbar';

function ViewReports(): JSXElement {
  const [showLocationsDropdown, setShowLocationsDropdown] = createSignal<boolean>(false);
  const [selectedLocation, setSelectedLocation] = createSignal<number | null>(null);
  const [startDate, setStartDate] = createSignal<string>(''); // Format: YYYY-MM-DD
  const [endDate, setEndDate] = createSignal<string>(''); // Format: YYYY-MM-DD
  const [resTimestamps, setResTimestamps] = createSignal<SResidentTimestamp[]>([]);
  const [allLocations, setAllLocations] = createSignal<SLocation[]>([]);
  const [totalPages, setTotalPages] = createSignal<number>(1);
  const [currentPage, setCurrentPage] = createSignal<number>(1);
  const [showAllLocations, setShowAllLocations] = createSignal<boolean>(false);
  const [error, setError] = createSignal<string | null>(null);
  const [showError, setShowError] = createSignal<boolean>(error() !== null);

  const fetchTimestamps = async () => {
    console.log("fetching timestamps");
    let urlstring = `timestamps?page=${currentPage()}&`;
    if (selectedLocation()) {
      urlstring += `location=${selectedLocation()}&`;
    }
    if (startDate() !== '' && endDate() !== '') {
      urlstring += `range=${startDate()};${endDate()}&`;
    }
    if (urlstring[urlstring.length - 1] === '&' || urlstring[urlstring.length - 1] === '?') {
      urlstring = urlstring.substring(0, urlstring.length - 1);
    }
    let response = await API.GET(urlstring);
    if (response?.data) {
      setTotalPages(parseInt(response.message!.split('=')[1]));
      setResTimestamps(response.data as SResidentTimestamp[]);
    }
  };

  const sortReverse = () => {
    setResTimestamps([...resTimestamps().reverse()]);
  };

  const getLocationName = (locationId: number): string => {
    if (allLocations() === undefined || allLocations().length === 0) {
      return `${locationId}`;
    } else {
      return allLocations().find((location) => location.id === locationId)!.name;
    }
  }

  const handleShowLocationsDropdown = () => {
    if (showAllLocations()) {
      setError("You must un-select 'All locations' to select a specific location.");
      setShowError(true);
      return;
    }
    setShowLocationsDropdown(true);
  };

  const handleLocationSelect = (locationId: number) => {
    setSelectedLocation(locationId);
    setShowLocationsDropdown(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTimestamps();
  }


  const handleCheckAll = () => {
    if (showError()) {
      setShowError(false);
    }
    setShowAllLocations(!showAllLocations());
    setSelectedLocation(null);
    if (showLocationsDropdown()) {
      setShowLocationsDropdown(false);
    }
  }

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
      <h1 class="text-4xl font-mono my-8 text-center">View Reports</h1>

      <div class="flex flex-col items-center">
        <div class="flex flex-wrap justify-center gap-4 mb-8">
          <DatePicker label="Start Date" onSelectDate={setStartDate} />
          <DatePicker label="End Date" onSelectDate={setEndDate} />
          <div class="pt-5 inline-flex">
            <button class='btn btn-outline' onClick={handleShowLocationsDropdown}>Location</button>
            <button class="btn btn-outline" onClick={fetchTimestamps}>Get Scan Events</button>
            <div class='badge badge-accent badge-lg'>{selectedLocation() ? `Location: ${selectedLocation()}` : '?'}</div>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer flex items-center gap-2">
              All locations
              <input type="checkbox" class="toggle" onchange={handleCheckAll} />
            </label>
          </div>
        </div>
        <Show when={showError()}>
          <div class="tooltip-error">
            {error()}
          </div>
        </Show>
        <Show when={showLocationsDropdown() && !showAllLocations()}>
          <LocationsDropdown
            locations={allLocations()}
            onLocationSelect={(locationId: number) => handleLocationSelect(locationId)}
            open={showLocationsDropdown()}
            onClose={() => setShowLocationsDropdown(false)}
            residents={[]}
          />
        </Show>

        <div class="w-full max-w-5xl overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Img</th>
                <th>Location</th>
                <th>Scan Event Time</th>
                <th>Resident Name</th>
                <th>DOC</th>
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
                              src={`/imgs/${timestamp.doc}.jpg`}
                              onError={(e) => e.currentTarget.src = '/imgs/default.jpg'}
                              class="w-12 h-12 object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{getLocationName(timestamp.location)}</td>
                    <td>{timestamp.ts}</td>
                    <td>{timestamp.name}</td>
                    <td>{timestamp.doc}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
        <div class="flex justify-center gap-4 my-4">
          <For each={Array.from({ length: totalPages() })}>
            {(_, index) => (
              <button
                class="btn btn-xs"
                onClick={() => handlePageChange(index())}
                classList={{ "btn-active": currentPage() === index() + 1 }}
              >
                {index() + 1}
              </button>
            )}
          </For>
          <input type="checkbox" class="toggle" onchange={sortReverse} />
          <label class="label cursor-pointer flex items-center gap-2">Sort Asc/Desc</label>
        </div>
      </div>
    </>
  );
};
export default ViewReports;
