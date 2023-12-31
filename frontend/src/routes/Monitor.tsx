import { createSignal, Show, onMount, JSXElement, onCleanup } from "solid-js";
import { SResident, SLocation } from ".././models/models";
import { API } from ".././api/api";
import LocationsDropdown from "../components/LocationsDropdown";
import ResidentsTable from "../components/ResidentTable";
import Navbar from "../components/Navbar";
import { Toaster, toast } from "solid-toast";

function Monitor() {
  const [residents, setResidents] = createSignal<SResident[]>([]);
  const [showModal, setShowModal] = createSignal<boolean>(false);
  const [showTable, setShowTable] = createSignal<boolean>(false);
  const [allLocations, setAllLocations] = createSignal<SLocation[]>([]);
  const [allResidents, setAllResidents] = createSignal<SResident[]>([]);
  const [currentLocation, setCurrentLocation] = createSignal<SLocation | null>(null);

  let intervalId: number | undefined;

  const fetchResidentsForLocation = async (locationId: number) => {
    try {
      const res = await API.GET(`/locations/${locationId}/residents`);
      if (res?.data) {
        setResidents(res.data as SResident[]);
      }
    } catch (error) {
      console.error("Error fetching residents:", error);
      toast.error("Failed to fetch residents.");
    }
  };
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

  const refetchData = () => {
    setResidents(getResidentsByLocation(currentLocation()!.id));
  };

  const handleLocationChange = (locationId: number) => {
    setCurrentLocation(allLocations().find(location => location.id === locationId)!);
    setResidents(getResidentsByLocation(locationId));
    setShowModal(false);
    setShowTable(true);
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
      if (currentLocation()) {
        fetchResidentsForLocation(currentLocation()!.id);
      }
    }, 5000);
  });

  onCleanup(() => {
    clearInterval(intervalId);
  });

  return (
    <>
      <Navbar />
      <h1 class="flex justify-center text-xl font-mono">
        {currentLocation()!.name} Attendance
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

export default Monitor;
