import { JSXElement, For, createSignal, Show } from 'solid-js';
import LocationsTable from '../components/LocationsTable';
import ResidentTable from '../components/ResidentTable';
import Navbar from '../components/Navbar';
import { SLocation, SResident } from '../models/models';
import { API } from "../api/api";

function Admin(): JSXElement {
  const [showResidentsTable, setShowResidentsTable] = createSignal<boolean>(false);
  const [showLocationsTable, setShowLocationsTable] = createSignal<boolean>(false);
  const [residents, setResidents] = createSignal<SResident[]>([]);
  const [locations, setLocations] = createSignal<SLocation[]>([]);
  const [currentPage, setCurrentPage] = createSignal<number>(1);
  const [totalPages, setTotalPages] = createSignal<number>(1);

  const fetchResidents = async () => {
    const res = await API.GET(`residents?page=${currentPage()}`);
    if (res?.data) {
      setResidents(res.data as SResident[]);
      const pages = parseInt(res.message!.match(/pages=(\d+)/)![1]);
      setTotalPages(pages);
    }
  };

  const fetchLocations = async () => {
    const res = await API.GET(`locations?page=${currentPage()}`);
    if (res?.data) {
      setLocations(res.data as SLocation[]);
      const pages = parseInt(res.message!.match(/pages=(\d+)/)![1]);
      setTotalPages(pages);
    }
  };
  const handleLocationsClick = () => {
    fetchLocations().then(() => console.log('locations updated'));
    setShowLocationsTable(true);
    setShowResidentsTable(false);
  };
  const handleResidentsClick = () => {
    fetchResidents().then(() => console.log('residents updated'));
    setShowResidentsTable(true);
    setShowLocationsTable(false);
  };
  const onTableClose = () => {
    setShowResidentsTable(false);
    setShowLocationsTable(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (showResidentsTable()) {
      fetchResidents();
    } else if (showLocationsTable()) {
      fetchLocations();
    }
  };

  return (
    <>
      <Navbar />
      <br class="gap-4" />
      <br class="gap-4" />
      <br class="gap-4" />
      <div class="flex flex-col items-center justify-center gap-10 v-screen flow-root">
        <h1 class="text-4xl font-mono mb-2 underline gap-10">MVCF Administration</h1>
        <Show when={!showResidentsTable() && !showLocationsTable()}>
          <div class="grid gap-10 grid-cols-1 md:grid-cols-2 mt-10">
            <button class="btn btn-primary btn-lg" onClick={handleLocationsClick}>View Add or Update Locations</button>
            <button class="btn btn-secondary btn-lg" onClick={handleResidentsClick}>View Add or Update Residents</button>
          </div>
        </Show>

        <Show when={showResidentsTable()}>
          <ResidentTable residents={residents()} onRefresh={() => { return }} onClose={onTableClose} />
        </Show>
        <Show when={showLocationsTable()}>
          <LocationsTable locations={locations()} />
        </Show>

        <Show when={showResidentsTable() || showLocationsTable()}>
          <div class="flex justify-center gap-4 my-4">
            <For each={Array.from({ length: totalPages() })}>{(_, index) => (
              <button
                class="btn btn-xs"
                onClick={() => handlePageChange(index() + 1)}
                classList={{ 'btn-active': currentPage() === index() + 1 }}
              >
                {index() + 1}
              </button>
            )}</For>
          </div>
        </Show>
      </div>
    </>
  );
}

export default Admin;
