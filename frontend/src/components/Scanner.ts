import { API } from "../api/api";
import toast, { Toaster } from "solid-toast";

/**
 * Here we declare a window global which holds the scannedRFID string.
 */
declare global {
  interface Window {
    facilityLocationId: number;
    scannedRFID: string;
    lastScannedRFID: string;
    lastKeyPress: number;
  }
}

export const initScanner = () => {
  console.log("Attaching Scanner Event Listeners");
  window.scannedRFID = "";

  window.addEventListener("keydown", (event: KeyboardEvent) => {
    const currentTime = new Date().getTime();

    if (/^\d$/.test(event.key)) {
      window.scannedRFID += event.key;
      window.lastKeyPress = currentTime;
    } if ((event.key === "Enter") && (
      window.scannedRFID.length === 17 &&
      currentTime - window.lastKeyPress < 100
    )) {
      console.log("Scanned RFID: ", window.scannedRFID);
      handleScan(window.scannedRFID);
      window.lastScannedRFID = window.scannedRFID;
      window.scannedRFID = "";
    }
  });
};

export const cleanupScanner = () => {
  window.removeEventListener("keydown", () => { });

  window.scannedRFID = "";
  window.lastKeyPress = 0;
  window.facilityLocationId = 0;
};

export const handleScan = async (rfid: string) => {
  console.log(rfid);
  const locId = localStorage.getItem("locationId");
  try {
    const originalResidentResponse = await API.GET(`residents/${rfid}`);
    if (!originalResidentResponse) {
      if (
        window.confirm(
          "Resident not found, please add Resident or update the Resident's RFID in the Admin Portal",
        )
      ) {
        return;
      }
      return;
    } else {
      const response = await API.POST(`timestamps`, {
        location: parseInt(locId!, 10),
        rfid: rfid,
      });
      if (response === undefined || !response.success) {
        throw Error(response!.message);
      }

      const data = response!.data;
      console.log("Scan Response: ", data);

      if (data!.at(0)?.current_location == 0) {
        // Resident is leaving, prompt user for location
        let dest = window.prompt("Enter Destination: ", "1");
        if (dest === null) {
          toast.error("Invalid Destination, Scan Again");
          return;
        }

        if (isNaN(parseInt(dest, 10))) {
          toast.error("Invalid Destination, Scan Again");
          return;
        }

        let residentResp = await API.GET(`residents/${rfid}`);
        if (!residentResp) {
          toast.error("Error: No response from server when fetching resident");
          return;
        }
        if (!residentResp.success) {
          toast.error(residentResp.message);
          return;
        }

        let currentlocationResp = await API.GET(
          `locations/${residentResp!.data!.at(0)!.current_location}`,
        );
        if (!currentlocationResp) {
          toast.error(
            "Error: No response from server when fetching current location",
          );
          return;
        }
        if (!currentlocationResp.success) {
          toast.error(currentlocationResp.message);
          return;
        }

        let response = await API.POST("timestamps", {
          location: parseInt(dest, 10),
          rfid: rfid,
        });

        if (!response) {
          toast.error("Error: No response from server");
          return;
        }

        if (!response.success) {
          toast("Warning: Timestamp not created");
          toast(response.message);
          return;
        }

        let locationResp = await API.GET(`locations/${dest}`);
        if (!locationResp) {
          toast("Error: No response from server when fetching location");
          return;
        }
        if (!locationResp.success) {
          toast.error("Warning: Location not found, scan again");
          toast.error(locationResp.message);

          return;
        }

        toast.success(
          `Resident ${originalResidentResponse?.data!.at(0)
            ?.name} Leaving Pod for ${locationResp!.data!.at(0)!.name}`,
        );
      } else {
        console.log("Resident Arriving at: ", data!.at(0)?.current_location);
        let arrivingLocation = await API.GET(
          `locations/${window.facilityLocationId}`,
        );
        if (!arrivingLocation) {
          toast.error("Error: No response from server when fetching location");
          return;
        }
        if (!arrivingLocation.success) {
          toast.error(arrivingLocation.message);
        }
        toast.success(
          `Resident ${originalResidentResponse!.data!.at(0)!.name
          } Arriving at ${arrivingLocation!.data!.at(0)!.name}`,
        );
      }
    }
  } catch (error) {
    console.error("Error Fetching Resident Data After Scan: ", error);
    return;
  }
};
