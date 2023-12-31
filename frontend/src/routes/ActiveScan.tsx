import { createSignal, Show, onMount, JSXElement, onCleanup } from "solid-js";
import { SResident, SLocation, SResidentTimestamp } from ".././models/models";
import { API } from ".././api/api";
import LocationsDropdown from "../components/LocationsDropdown";
import ResidentsTable from "../components/ResidentTable";
import Navbar from "../components/Navbar";
import { Toaster, toast } from "solid-toast";
import AddResident from "../components/AddResident";

function ActiveScan() {
  const [residents, setResidents] = createSignal<SResident[]>([]);
  const [showModal, setShowModal] = createSignal<boolean>(false);
  const [showTable, setShowTable] = createSignal<boolean>(false);
  const [allLocations, setAllLocations] = createSignal<SLocation[]>([]);
  const [allResidents, setAllResidents] = createSignal<SResident[] | null>(null);
  const [currentScanLocation, setCurrentScanLocation] = createSignal<number>(0);
  const [lastResidentScanned, setLastResidentScanned] = createSignal<SResident | null>(null);
  const [showAddResident, setShowAddResident] = createSignal(false);

  let intervalId: number | undefined;

  let scannedRFID = "";
  let lastKeyPressTime = 0;
  const hiddenInput = document.createElement('input');
  hiddenInput.setAttribute('type', 'text');
  hiddenInput.style.position = 'absolute';
  hiddenInput.style.opacity = '0';
  hiddenInput.style.pointerEvents = 'none';
  hiddenInput.style.height = '0';
  hiddenInput.style.overflow = 'hidden';

  document.body.appendChild(hiddenInput);
  const RFID_LENGTH = 17;
  const ENTER_KEY = "Enter";
  const INPUT_TIMEOUT = 100;

  const handleAddResidentClose = () => {
    hiddenInput.focus();
    setShowAddResident(false);
  };

  const handleShowAddResident = () => {
    hiddenInput.blur();
    setShowAddResident(true);
  };

  const handleRFIDScan = async (rfid: string) => {
    console.log("handleRFIDScan");
    try {
      const response = await API.POST("timestamps", {
        rfid: rfid,
        location: currentScanLocation(),
      });
      if (response && response.data) {
        const resident: SResidentTimestamp = response.data!.at(
          0,
        ) as SResidentTimestamp;
        if (resident.resident.current_location === 0) {
          // Prompt for destination ID
          const destinationId = prompt("Please enter your destination ID:");
          if (destinationId) {
            // Send another POST request with the destination ID
            const response = await API.POST("timestamps", {
              rfid,
              location: parseInt(destinationId, 10),
            });
            if (response && response.data) {
              const resident: SResidentTimestamp = response.data!.at(
                0,
              ) as SResidentTimestamp;
              toast.success(
                `Resident ${resident.resident.name} is now at ${resident.resident.current_location}`,
              );
              setLastResidentScanned(resident.resident);
            }
          } else {
            // Handle case where destination ID is not entered
            toast.error(
              "No destination ID entered, Resident: " +
              resident.resident.name +
              " now signed out.",
            );
            setLastResidentScanned(resident.resident);
          }
        } else {
          // Handle normal case where resident is signing in/out
          toast.success(
            `Resident ${resident.resident.name} is now at ${resident.resident.current_location}`,
          );
          setLastResidentScanned(resident.resident);
        }
      } else {
        toast.error("Resident not found");
      }
    } catch (error) {
      toast.error("Error processing RFID scan, please try again");
    }
  };

  const scanEvent = (event: KeyboardEvent) => {
    const currentTime = new Date().getTime();

    if (event.key === ENTER_KEY) {
      if (scannedRFID.length === RFID_LENGTH) {
        console.log("RFID scanned: " + scannedRFID);
        handleRFIDScan(scannedRFID);
        scannedRFID = "";
      } else {
        scannedRFID = "";
      }
      hiddenInput.value = ''; // Clear the hidden input
    } else if (/^\d$/.test(event.key)) {
      if (currentTime - lastKeyPressTime > INPUT_TIMEOUT) {
        scannedRFID = ""; // Timeout logic may be unnecessary for HID scanners
      }
      scannedRFID += event.key;
      lastKeyPressTime = currentTime;
    }
  };

  const initRFIDScanner = () => {
    // Create a hidden input element
    hiddenInput.focus();
    window.addEventListener('keydown', scanEvent);
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

  const refetchData = async () => {
    try {
      await getAllResidents();
      setResidents(getResidentsByLocation(currentScanLocation()));
    } catch (error) {
      console.error("Error fetching residents:", error);
    }
  };

  const handleLocationChange = (locationId: number) => {
    setCurrentScanLocation(locationId);
    setResidents(getResidentsByLocation(locationId));
    localStorage.setItem("locationId", locationId.toString());
    setShowModal(false);
    setShowTable(true);
    initRFIDScanner();
  };

  const getResidentsByLocation = (locationId: number): SResident[] => {
    return allResidents().filter(resident => resident.unit === locationId).length === 0
      ? allResidents().filter(resident => resident.current_location === locationId)
      : allResidents().filter(resident => resident.unit === locationId || resident.current_location === locationId);
  };

  const handleCloseTable = () => {
    hiddenInput.blur();
    setShowTable(false);
    setShowModal(true);
  };

  onMount(() => {
    getAllResidents();
    getAllLocations();
    setShowModal(true);
    intervalId = setInterval(() => {
      if (currentScanLocation()) {
        refetchData();
      }
    }, 5000);
  });

  onCleanup(() => {
    clearInterval(intervalId);
    window.removeEventListener("keydown", scanEvent);
    if (document.body.contains(hiddenInput)) {
      document.body.removeChild(hiddenInput);
    }
  });

  return (
    <>
      <Navbar />
      <Toaster
        position="top-center"
        gutter={8}
        containerClassName="badge badge-xl badge-success"
        toastOptions={{
          className: "",
          duration: 7000,
          style: {
            background: "#2b2b2b",
            color: "#02eb48",
          },
        }}
      />
      <h1 class="flex justify-center text-xl font-mono">
        Active Scan and Attendance
      </h1>
      {currentScanLocation() === 0 ? "" : <h2 class="flex justify-center text-xl font-mono">Location {currentScanLocation()}</h2>}

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
      <button
        class="btn btn-primary mb-4"
        onClick={handleShowAddResident}
      >
        Add Resident
      </button>

      <Show when={showAddResident()}>
        <AddResident
          onRefresh={refetchData}
          onClose={handleAddResidentClose}
        />
      </Show>
    </>
  );
}

export default ActiveScan;
