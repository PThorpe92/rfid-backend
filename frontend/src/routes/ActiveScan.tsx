import { createSignal, Show, onMount, JSXElement, onCleanup } from "solid-js";
import { SResident, SLocation } from ".././models/models";
import { API } from ".././api/api";
import { initRFIDScanner, cleanupRFIDScanner } from "../components/Scanner";
import LocationsDropdown from "../components/LocationsDropdown";
import ResidentsTable from "../components/ResidentTable";
import Navbar from "../components/Navbar";
import { Toaster, toast } from "solid-toast";

function ActiveScan() {
  const [residents, setResidents] = createSignal<SResident[]>([]);
  const [showModal, setShowModal] = createSignal<boolean>(false);
  const [showTable, setShowTable] = createSignal<boolean>(false);
  const [allLocations, setAllLocations] = createSignal<SLocation[]>([]);
  const [allResidents, setAllResidents] = createSignal<SResident[]>([]);
  const [currentScanLocation, setCurrentScanLocation] = createSignal<number>(0);
  const [lastResidentScanned, setLastResidentScanned] =
    createSignal<SResident | null>(null);
  let intervalId: number | undefined;
  const getAllLocations = () => {
    API.GET(`locations?all=true`)
      .then((res) => setAllLocations(res?.data as SLocation[]))
      .catch((err) => console.log(err));
  };
  const getAllResidents = async () => {
    const res = await API.GET("residents?all=true");
    if (res?.data) {
      setAllResidents(res.data as SResident[]);
    }
  }

  const handleScan = (resident: SResident) => {
    setLastResidentScanned(resident);
    toast.success(`Resident ${resident.name} scanned in to ${resident.current_location}`);
    getResidentsByLocation(currentScanLocation());
  };

  const handleUpdateLocation = (locationId: number) => {
    setCurrentScanLocation(locationId);
  };

  const refetchData = () => {
    setResidents(getResidentsByLocation(currentScanLocation()));
  };

  const handleLocationChange = (locationId: number) => {
    setResidents(getResidentsByLocation(locationId));
    localStorage.setItem("locationId", locationId.toString());
    setShowModal(false);
    setShowTable(true);
    initRFIDScanner({ locID: currentScanLocation(), callback: handleScan });
  };

  const getResidentsByLocation = (locationId: number): SResident[] => {
    return allResidents().filter(resident => resident.unit === locationId).length === 0
      ? allResidents().filter(resident => resident.current_location === locationId)
      : allResidents().filter(resident => resident.unit === locationId);
  };

  const checkLocalStorage = () => {
    getAllResidents();
    getAllLocations();
    setShowModal(true);
  };

  const handleCloseTable = () => {
    setShowTable(false);
    setShowModal(true);
  };

  onMount(() => {
    checkLocalStorage();
    intervalId = setInterval(() => {
      if (currentScanLocation()) {
        getAllResidents();
        refetchData();
      }
    }, 5000); // Refresh every 5000 milliseconds (5 seconds)
  });

  onCleanup(() => {
    clearInterval(intervalId);
    cleanupRFIDScanner();
  });

  return (
    <>
      <Navbar />
      <Toaster />
      <h1 class="flex justify-center text-xl font-mono">
        Active Scan and Attendance
      </h1>
      <Show when={showModal()}>
        <div class="flex justify-center">
          <LocationsDropdown
            locations={allLocations()}
            residents={allResidents()}
            onClose={() => setShowModal(false)}
            onLocationSelect={handleLocationChange}
          />
        </div>
      </Show>
      <div>
        <Show when={showTable()}>
          <ResidentsTable
            residents={residents()}
            onRefresh={refetchData}
            onClose={handleCloseTable}
          />
        </Show>
      </div>
    </>
  );
}

export default ActiveScan;
