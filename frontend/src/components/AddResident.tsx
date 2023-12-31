import { createSignal, Show, JSXElement } from "solid-js";
import { API } from "../api/api";
import { SResident } from "../models/models";
import toast from "solid-toast";

interface AddResidentModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

function AddResidentModal(props: AddResidentModalProps): JSXElement {
  interface buildRoom {
    pod: "A" | "B" | "C";
    roomNumber: string;
    bunk: "T" | "B";
  }
  const [editRoom, setEditRoom] = createSignal<buildRoom>({
    pod: "A",
    roomNumber: "1",
    bunk: "T",
  });
  const [newResident, setNewResident] = createSignal<SResident>({
    current_location: 0,
    rfid: "",
    name: "",
    doc: "",
    room: "",
    unit: 0,
    level: 0,
  });

  const roomLetters = ["A", "B", "C"];
  const unitLetters = ["A", "B", "C", "D", "E"];
  const roomNumbers = Array.from({ length: 20 }, (_, i) => i + 1);
  const bunkPositions = ["Top", "Bottom"];
  const levels = Array.from({ length: 5 }, (_, i) => i + 1);

  const updateRoom = (field: keyof buildRoom, value: string | number) => {
    setEditRoom({ ...editRoom(), [field]: value });
  };

  const updateUnit = (unit: string) => {
    switch (unit) {
      case "A":
        updateField("unit", 1);
        break;
      case "B":
        updateField("unit", 6);
        break;
      case "C":
        updateField("unit", 7);
        break;
      case "D":
        updateField("unit", 14);
        break;
      default:
        break;
    }
  };

  const updateField = (field: keyof SResident, value: string | number) => {
    setNewResident({ ...newResident(), [field]: value });
  };

  const handleSubmit = async () => {
    const buildRoom = editRoom();
    setNewResident({
      ...newResident(),
      room: `${buildRoom.pod}-${buildRoom.roomNumber}${buildRoom.bunk}`,
    });
    const response = await API.POST("residents", newResident());
    if (response !== undefined && response?.success) {
      toast.success("Resident added successfully");
      props.onRefresh();
      props.onClose();
    } else {
      toast.error("Error adding resident");
      props.onClose();
    }
  };

  return (
    <div>
      <div class="modal modal-open">
        <div class="modal-box">
          <h3 class="font-bold text-lg">New Resident</h3>

          <input
            type="text"
            placeholder="RFID (please scan tag)"
            class="input input-bordered w-full max-w-xs"
            onInput={(e) => updateField("rfid", e.currentTarget.value)}
          />
          <input
            type="text"
            placeholder="Name"
            class="input input-bordered w-full max-w-xs"
            onInput={(e) => updateField("name", e.currentTarget.value)}
          />
          <input
            type="text"
            placeholder="Doc#"
            class="input input-bordered w-full max-w-xs"
            onInput={(e) => updateField("doc", e.currentTarget.value)}
          />
          {/* We'll get the Character for the unit and convert to ID */}
          <div class="grid grid-cols-3 gap-4">
            <label class="label">Unit</label>
            <select
              class="select select-bordered"
              onChange={(e) => updateUnit(e.currentTarget.value)}
            >
              {unitLetters.map((letter) => (
                <option value={letter}>{letter}</option>
              ))}
            </select>
            {/* Dropdowns for room selection */}
            <label class="label">Pod</label>
            <select
              class="select select-bordered"
              onChange={(e) => updateRoom("pod", e.currentTarget.value)}
            >
              {roomLetters.map((letter) => (
                <option value={letter}>{letter}</option>
              ))}
            </select>
            <label class="label">Room #</label>
            <select
              class="select select-bordered"
              onChange={(e) => updateRoom("roomNumber", e.currentTarget.value)}
            >
              {roomNumbers.map((number) => (
                <option value={number}>{number}</option>
              ))}
            </select>
            <label class="label">Bunk</label>
            <select
              class="select select-bordered"
              onChange={(e) => updateRoom("bunk", e.currentTarget.value)}
            >
              {bunkPositions.map((position) => (
                <option value={position}>{position}</option>
              ))}
            </select>
            <label class="label">Level</label>
            <select
              class="select select-bordered"
              onInput={(e) =>
                updateField("level", parseInt(e.currentTarget.value))
              }
            >
              {levels.map((level) => (
                <option value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div class="modal-action">
            <button class="btn" onClick={handleSubmit}>
              Submit
            </button>
            <button class="btn btn-outline" onClick={() => props.onClose()}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddResidentModal;
