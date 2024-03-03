import { createSignal, Show, onMount, JSXElement, onCleanup } from "solid-js";
import { SResident, SLocation, SResidentTimestamp } from ".././models/models";
import { API } from ".././api/api";
import LocationsDropdown from "../components/LocationsDropdown";
import ResidentsTable from "../components/ResidentTable";
import Navbar from "../components/Navbar";
import { Toaster, toast } from "solid-toast";
import AddResident from "../components/AddResident";

function ActiveScan() {
  // make this residents
  const [residents, setResidents] = createSignal<SResident[]>([]);
  const [showModal, setShowModal] = createSignal<boolean>(false);
  const [showTable, setShowTable] = createSignal<boolean>(false);
  const [allLocations, setAllLocations] = createSignal<SLocation[]>([]);
  const [allResidents, setAllResidents] = createSignal<SResident[]>([]);
  const [currentScanLocation, setCurrentScanLocation] = createSignal<number>(0);
  const [lastResidentScanned, setLastResidentScanned] = createSignal<SResidentTimestamp | null>(null);
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

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = createSignal(1);

  const getSortedResidents = () => {
    const locationId = currentScanLocation();
    return residents()
      .sort((a, b) => {
        if (b.current_location === locationId && b.unit !== locationId) {
          return 1; // b should come before a
        }
        if (a.current_location !== locationId && a.unit === locationId) {
          return -1; // a should come before b
        }
        return 0; // no change in order
      });
  };

  const lookupLocationName = (locationId: number): string => {
    if (allLocations() === undefined || allLocations().length === 0) {
      return "";
    } else {
      let loc = allLocations().find((location) => location.id === locationId)!;
      return loc.name;
    }
  };

  const handleAddResidentClose = () => {
    initRFIDScanner();
    hiddenInput.focus();
    setShowAddResident(false);
  };

  const handleShowAddResident = () => {
    detachRFIDScanner();
    hiddenInput.blur();
    setShowAddResident(true);
  };

  const handlePromptLocation = (resident: SResidentTimestamp, rfid: string): number => {
    // Prompt for destination ID
    const destinationId = parseInt(prompt("Please enter your destination ID:") || "", 10);
    if (destinationId !== undefined && destinationId === currentScanLocation()) {
      toast.error("Destination ID cannot be the same as current location.");
      handlePromptLocation(resident, rfid);
    } else if (destinationId !== undefined && destinationId > 0) {
      return destinationId as number;
    };
    return handlePromptLocation(resident, rfid);
  };

  const handleRFIDScan = async (rfid: string, loc: number) => {
    try {
      if (loc === undefined) {
        loc = currentScanLocation();
      }
      const response = await API.POST("timestamps", {
        rfid: rfid,
        location: loc,
      });
      if (response.success) {
        const resident: SResidentTimestamp = response.data!.at(
          0,
        ) as SResidentTimestamp;
        if (resident.location === 0) {
          const location = handlePromptLocation(resident, rfid);
          handleRFIDScan(rfid, location);
          return;
        }
        refetchData();
        toast.success(
          `Resident ${resident.name} is now at ${resident.location}`,
        );
        setLastResidentScanned(resident);
        return;
      }
      toast.error("Resident not found");
    } catch (error) {
      console.log(error);
      toast.error("Error processing RFID scan, please try again");
    }
  };

  // ******* RFID Scanner Logic *********
  const scanEvent = (event: KeyboardEvent) => {
    const currentTime = new Date().getTime();

    if (event.key === ENTER_KEY) {
      if (scannedRFID.length === RFID_LENGTH) {
        console.log("RFID scanned: " + scannedRFID);
        handleRFIDScan(scannedRFID, currentScanLocation());
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

  // ********** Initialize RFID scanner **************
  const initRFIDScanner = () => {
    // Create a hidden input element
    hiddenInput.focus();
    window.addEventListener('keydown', scanEvent);
  };

  const detachRFIDScanner = () => {
    window.removeEventListener('keydown', scanEvent);
  }

  const getAllLocations = () => {
    API.GET(`locations?all=true`)
      .then((res) => setAllLocations(res?.data as SLocation[]))
      .catch((err) => console.log(err));
  };

  const getAllResidents = async () => {
    const res = await API.GET("residents");
    if (res?.data) {
      setAllResidents(res.data as SResident[]);
    }
  }

  const refetchData = async () => {
    try {
      await getResidentsByLocation(currentScanLocation());
    } catch (error) {
      console.error("Error fetching residents:", error);
    }
  };

  const handleLocationChange = async (locationId: number) => {
    setCurrentScanLocation(locationId);
    await getResidentsByLocation(locationId);
    localStorage.setItem("locationId", locationId.toString());
    setShowModal(false);
    setShowTable(true);
    initRFIDScanner();
    refetchData();
  };

  const getResidentsByLocation = async (locationId: number) => {
    await API.GET(`locations/${locationId}/residents?active_scan=true`).then(res => {
      if (res?.data) {
        setResidents(res.data as SResident[]);
      }
    }).catch(err => {
      console.error(err)
    });
  };

  const handleCloseTable = () => {
    hiddenInput.blur();
    setShowTable(false);
    setShowModal(true);
  };

  onMount(() => {
    // get all residents to pass to the dropdown box to demonstrate how many are at each unit
    getAllResidents();
    // get all locations to pass to dropdown box
    getAllLocations();
    // show the modal to select a location
    setShowModal(true);
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
          className: "toast",
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
      {currentScanLocation() === 0 ? "" : <h2 class="flex justify-center text-xl font-mono">Location {currentScanLocation()}: {lookupLocationName(currentScanLocation())}</h2>}

      <Show when={showModal()}>
        <div class="flex justify-center">
          <LocationsDropdown
            locations={allLocations()}
            residents={allResidents()}
            open={showModal()}
            onClose={() => setShowModal(false)}
            onLocationSelect={handleLocationChange}
          />
        </div>
      </Show>
      <div>
        <div>
          {/* Pagination Controls */}
          <button
            onClick={() => setCurrentPage(currentPage() - 1)}
            disabled={currentPage() === 1}
          >
            <div class="btn btn-md">Previous</div>
          </button>
          <button
            onClick={() => setCurrentPage(currentPage() + 1)}
            disabled={currentPage() * PAGE_SIZE >= getSortedResidents().length}
          >
            <div class="btn btn-md">Next</div>
          </button>

          {/* Residents Table */}
          <Show when={showTable()}>
            <ResidentsTable
              residents={residents()}
              onRefresh={refetchData}
              locations={allLocations()}
              currentScanLocation={currentScanLocation()}
              onClose={handleCloseTable}
            />
          </Show>
        </div>
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
      <div class="justify-center grid grid-flow-col auto-cols-max gap-4">
        <div class="badge secondary-content">Signed In</div>
        <div class="badge badge-neutral">Signed Out</div>
        <div class="badge badge-base-100">Not from Unit</div>
      </div>
    </>
  );
}
export default ActiveScan;
