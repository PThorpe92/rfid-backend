import { createSignal, Show, onMount, JSXElement, onCleanup } from 'solid-js';
import { SResident, SLocation } from '.././models/models';
import { API } from '.././api/api';
import { initRFIDScanner, cleanupRFIDScanner } from '../components/Scanner';
import LocationsDropdown from '../components/LocationsDropdown';
import ResidentsTable from '../components/ResidentTable';
import Navbar from '../components/Navbar';

function ActiveScan() {
  const [residents, setResidents] = createSignal<SResident[]>([]);
  const [showModal, setShowModal] = createSignal<boolean>(false);
  const [showTable, setShowTable] = createSignal<boolean>(false);
  const [allLocations, setAllLocations] = createSignal<SLocation[]>([]);
  const [currentScanLocation, setCurrentScanLocation] = createSignal<number>(0);
  const [lastResidentScanned, setLastResidentScanned] = createSignal<SResident | null>(null);

  const getAllLocations = async () => {
    const res = await API.GET(`locations?all=true`).then((res) =>
      setAllLocations(res?.data as SLocation[])).catch((err) => console.log(err));
  };

  const handleScan = (resident: SResident) => {
    setLastResidentScanned(resident);
    getResidentsByLocation(currentScanLocation());
  };

  const handleUpdateLocation = (locationId: number) => {
    setCurrentScanLocation(locationId);
  };

  const refetchData = () => {
    getResidentsByLocation(currentScanLocation()).then(() => {
      console.log('residents updated');
    }).catch((err) => console.log(err));
  };

  const handleLocationChange = (locationId: number) => {
    getResidentsByLocation(locationId);
    localStorage.setItem('locationId', locationId.toString());
    setShowModal(false);
    initRFIDScanner({ locID: currentScanLocation(), callback: handleScan });
  };

  const displayToastResidentScan = () => {
    return (
      <div class="toast toast-top toast-center">
        <div class="alert alert-success">
          <span>Resident: {lastResidentScanned()!.name} {lastResidentScanned()!.current_location === currentScanLocation() ? "Arriving" : "Out"}</span>
        </div>
      </div>
    );
  };

  const getResidentsByLocation = async (locationId: number) => {
    const res = await API.GET(`locations/${locationId}/residents`);
    if (res !== undefined && res.success === true) {
      if (res.data!.length === 0) {
        const res = await API.GET(`locations/${locationId}/residents?current=true`);
        if (res !== undefined && res.success === true) {
          setResidents(res.data as SResident[]);
          setShowTable(true);
          return;
        }
        setResidents(res!.data as SResident[]);
        setShowTable(true);
      }
    }
  };

  const checkLocalStorage = async () => {
    // See if its already in storage
    const locId = localStorage.getItem('locationId');
    if (locId !== null && locId !== undefined) {
      const locIdInt = parseInt(locId!, 10);
      setCurrentScanLocation(locIdInt);
      getResidentsByLocation(locIdInt);
      setShowTable(true);
      initRFIDScanner({ locID: locIdInt, callback: handleScan });
    } else {
      getAllLocations();
      setShowModal(true);
    }
  };

  const handleCloseTable = () => {
    setShowTable(false);
    setShowModal(true);
  };

  onMount(() => checkLocalStorage());


  onMount(() => {
    initRFIDScanner({ locID: currentScanLocation(), callback: handleScan });
    currentScanLocation() && getResidentsByLocation(currentScanLocation());
  });

  onCleanup(() => {
    cleanupRFIDScanner();
  });



  return (
    <>
      <Navbar />

      <Show when={showModal()}>
        <LocationsDropdown locations={allLocations()} onClose={() => setShowModal(false)} onLocationSelect={handleLocationChange} />
      </Show>
      <div >
        <h1 class="flex justify-center text-xl font-mono">Active Scan and Attendance</h1>
        <Show when={!showTable()}>
          <span class="loading loading-bars loading-xs"></span>
          <span class="loading loading-bars loading-sm"></span>
          <span class="loading loading-bars loading-md"></span>
          <span class="loading loading-bars loading-lg"></span>
        </Show>
        <Show when={residents().length > 0 && showTable()} >
          <ResidentsTable residents={residents()} onRefresh={refetchData} onClose={handleCloseTable} />
        </Show>
      </div>
    </>
  );
};

export default ActiveScan;
