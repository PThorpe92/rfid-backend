import { JSXElement, For, createSignal, Show } from "solid-js";
import LocationsTable from "../components/LocationsTable";
import ResidentTable from "../components/ResidentTable";
import Navbar from "../components/Navbar";
import { SLocation, SResident } from "../models/models";
import { API } from "../api/api";
import AddResident from "../components/AddResident";

function Admin(): JSXElement {
  const [showResidentsTable, setShowResidentsTable] =
    createSignal<boolean>(false);
  const [showLocationsTable, setShowLocationsTable] =
    createSignal<boolean>(false);
  const [residents, setResidents] = createSignal<SResident[]>([]);
  const [locations, setLocations] = createSignal<SLocation[]>([]);
  const [currentPage, setCurrentPage] = createSignal<number>(1);
  const [totalPages, setTotalPages] = createSignal<number>(1);
  const [showAddResident, setShowAddResident] = createSignal<boolean>(false);

  const fetchResidents = async () => {
    const res = await API.GET(`residents?page=${currentPage()}`);
    if (res?.data) {
      setResidents(res.data as SResident[]);
      const pages = parseInt(res.message!.match(/pages=(\d+)/)![1], 10);
      setTotalPages(pages);
    }
  };

  const handleRefresh = () => {
    fetchResidents().then(() => console.log("residents updated"));
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
    fetchLocations().then(() => console.log("locations updated"));
    setShowLocationsTable(true);
    setShowResidentsTable(false);
  };

  const handleResidentsClick = () => {
    fetchResidents().then(() => console.log("residents updated"));
    fetchLocations();
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

  const handleShowAddResident = () => {
    setShowAddResident(true);
  };
  const handleCloseAddResident = () => {
    setShowAddResident(false);
  }

  return (
    <>
      <Navbar />
      <br class="gap-4" />
      <br class="gap-4" />
      <br class="gap-4" />
      <h1 class="text-4xl text-center font-mono underline">
        MVCF Administration
      </h1>
      <div class="flex flex-col items-center justify-center gap-10 v-screen">
        <Show when={!showResidentsTable() && !showLocationsTable()}>
          <div class="grid gap-10 grid-cols-1 md:grid-cols-2 mt-10">
            <button
              class="btn btn-primary btn-lg"
              onClick={handleLocationsClick}
            >
              View Add or Update Locations
            </button>
            <button
              class="btn btn-secondary btn-lg"
              onClick={handleResidentsClick}
            >
              View Add or Update Residents
            </button>
          </div>
        </Show>

        <Show when={showResidentsTable()}>
          <ResidentTable
            locations={locations()}
            residents={residents()}
            onRefresh={handleRefresh}
            onClose={onTableClose}
            currentScanLocation={0}
          />
        </Show>
        <Show when={showLocationsTable()}>
          <LocationsTable locations={locations()} />
        </Show>

        <Show when={showResidentsTable() || showLocationsTable()}>
          <div class="flex justify-center gap-4 my-4">
            <For each={Array.from({ length: totalPages() })}>
              {(_, index) => (
                <button
                  class="btn btn-xs"
                  onClick={() => handlePageChange(index() + 1)}
                  classList={{ "btn-active": currentPage() === index() + 1 }}
                >
                  {index() + 1}
                </button>
              )}
            </For>
          </div>
          <Show when={showAddResident()}>
            <AddResident onClose={handleCloseAddResident} onRefresh={handleRefresh} />
          </Show>
          <div class="btn btn-primary btn-lg" onClick={handleShowAddResident}>Add Resident</div>
        </Show>
      </div>
    </>
  );
}

export default Admin;
