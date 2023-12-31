import { API } from "../api/api";
import toast, { Toaster } from "solid-toast";
import { SResidentTimestamp, SResident } from "../models/models";
let scannedRFID = "";
let lastKeyPressTime = 0;

const RFID_LENGTH = 17;
const ENTER_KEY = "Enter";
const INPUT_TIMEOUT = 100;

interface ScanCallback {
  locID: number;
  callback: (resident: SResident) => void;
}

const handleRFIDScan = async (rfid: string, data: ScanCallback) => {
  try {
    const response = await API.POST(`timestamps`, {
      rfid: rfid,
      location: data.locID,
    });
    if (response && response.data) {
      const resident: SResidentTimestamp = response.data!.at(
        0,
      ) as SResidentTimestamp;
      if (resident.location === 0) {
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
            data.callback(resident.resident);
          }
        } else {
          // Handle case where destination ID is not entered
          toast.error(
            "No destination ID entered, Resident: " +
              resident.resident.name +
              " now signed out.",
          );
          data.callback(resident.resident);
        }
      } else {
        // Handle normal case where resident is signing in/out
        toast.success(
          `Resident ${resident.resident.name} is now at ${resident.resident.current_location}`,
        );
        data.callback(resident.resident);
      }
    } else {
      toast.error("Resident not found");
    }
  } catch (error) {
    toast.error("Error processing RFID scan, please try again");
  }
};

export const initRFIDScanner = (data: ScanCallback) => {
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    const currentTime = new Date().getTime();

    if (/^\d$/.test(event.key)) {
      // Reset the buffer if the time between keystrokes is too long
      if (currentTime - lastKeyPressTime > INPUT_TIMEOUT) {
        scannedRFID = "";
      }
      scannedRFID += event.key;
      lastKeyPressTime = currentTime;
    } else if (event.key === ENTER_KEY && scannedRFID.length === RFID_LENGTH) {
      handleRFIDScan(scannedRFID, data);
      scannedRFID = "";
    }
  });
};

export const cleanupRFIDScanner = () => {
  window.removeEventListener("keydown", () => {});
  scannedRFID = "";
  lastKeyPressTime = 0;
};
