import { createSignal, Show, onMount, JSXElement } from 'solid-js';
import { SResident, SLocation } from '.././models/models';
import { API } from '.././api/api';
import { initScanner } from '../components/Scanner';
import LocationsDropdown from '../components/LocationsDropdown';
import ResidentsTable from '../components/ResidentTable';
import Navbar from '../components/Navbar';

function ActiveScan() {
  const [residents, setResidents] = createSignal<SResident[]>([]);
  const [showModal, setShowModal] = createSignal<boolean>(false);
  const [showTable, setShowTable] = createSignal<boolean>(false);
  const [allLocations, setAllLocations] = createSignal<SLocation[]>([]);
  const [currentScanLocation, setCurrentScanLocation] = createSignal<number>(0);

  const getAllLocations = async () => {
    const res = await API.GET(`locations?all=true`).then((res) =>
      setAllLocations(res?.data as SLocation[])).catch((err) => console.log(err));
  };

  const handleUpdateLocation = (locationId: number) => {
    setCurrentScanLocation(locationId);
  };

  const refetchData = () => {
    getResidents(currentScanLocation()).then(() => {
      console.log('residents updated');
    }).catch((err) => console.log(err));
  }

  const getResidents = async (loc: number) => {
    const res = await API.GET(`locations/${loc}/residents`);
    setResidents(res?.data as SResident[]);
  };

  const handleLocationChange = (locationId: number) => {
    getResidents(locationId);
    localStorage.setItem('locationId', locationId.toString());
    setShowModal(false);
    initScanner();
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
  }

  const checkLocalStorage = async () => {
    // See if its already in storage
    const locId = localStorage.getItem('locationId');
    if (locId !== null && locId !== undefined) {
      const locIdInt = parseInt(locId!, 10);
      setCurrentScanLocation(locIdInt);
      getResidentsByLocation(locIdInt);
      setShowTable(true);
      initScanner();
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
    initScanner()
    currentScanLocation() && getResidents(currentScanLocation());
  });


  return (
    <>
      <Navbar />
      <Show when={showModal()}>
        <LocationsDropdown locations={allLocations()} onClose={() => setShowModal(false)} onLocationSelect={handleLocationChange} />
      </Show>
      <div >
        <h1 class="flex justify-center text-xl font-mono">Active Scan and Attendance</h1>
        <Show when={residents().length > 0 && showTable()} >
          <ResidentsTable residents={residents()} onRefresh={refetchData} onClose={handleCloseTable} />
        </Show>
      </div>
    </>
  );
};

export default ActiveScan;
