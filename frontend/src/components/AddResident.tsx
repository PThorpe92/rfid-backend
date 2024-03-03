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
  const [formErrors, setFormErrors] = createSignal({
    rfid: "",
    name: "",
    doc: "",
  });

  const [uploadFile, setUploadFile] = createSignal<FormData>(new FormData);
  const [editRoom, setEditRoom] = createSignal<buildRoom>({
    pod: "A",
    roomNumber: "1",
    bunk: "T",
  });

  const [newResident, setNewResident] = createSignal<SResident>({
    current_location: 0,
    rfid: "",
    name: "",
    doc: 0,
    room: "",
    unit: 1,
    level: 2,
  });

  const roomLetters = ["A", "B", "C", "D", "E", "F"];
  const unitLetters = ["A", "B", "C", "D", "E"];
  const roomNumbers = Array.from({ length: 20 }, (_, i) => i + 1);
  const bunkPositions = ["Top", "Bottom"];
  const levels = Array.from({ length: 5 }, (_, i) => i + 1);

  const validateForm = () => {
    let errors = { rfid: "", name: "", doc: "" };
    let isValid = true;

    // Validate RFID (17 digits)
    if (!/^\d{17}$/.test(newResident().rfid)) {
      errors.rfid = "RFID must be 17 digits.";
      isValid = false;
    }
    // Validate Name (two words, no numbers)
    if (!/^[A-Za-z]+ [A-Za-z]+$/.test(newResident().name)) {
      errors.name = "Name must be two words, no numbers.";
      isValid = false;
    }

    // Validate DOC (all numbers, no more than 10 digits)
    if (newResident().doc.toString().length > 10 || !/^\d+$/.test(newResident().doc.toString())) {
      errors.doc = "DOC must be all numbers and no more than 10 digits.";
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const updateRoom = (field: keyof buildRoom, value: string | number) => {
    if (field === 'bunk' && value === 'Top') {
      setEditRoom({ ...editRoom(), bunk: 'T' });
      return;
    } else if (field === 'bunk' && value === 'Bottom') {
      setEditRoom({ ...editRoom(), bunk: 'B' });
      return;
    }
    setEditRoom({ ...editRoom(), [field]: value });
  };
  // handle file upload. pictures are stored on the front end 
  // in the /imgs folder and are named the residents DOC#.jpg
  const handleFileUpload = (e: any) => {
    const field = e.target;
    if (field.files.length > 0) {
      console.log("file found!")
      const file = field.files[0];
      const data = new FormData();
      data.append("file", file);
      data.append("filename", file.name);
      data.append("type", "image/jpeg");
      data.append("size", file.size.toString());
      setUploadFile(data);
    }
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
    if (!validateForm()) {
      return;
    }
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
    if (uploadFile() !== null) {
      const res = await API.UPLOAD(`residents/${newResident().doc}/upload`, uploadFile());
      if (res !== undefined && res.success) {
        toast.success("Image uploaded successfully");
      } else {
        toast.error("Error uploading image");
      }
    }
  };

  return (
    <div>
      <div class="modal modal-open">
        <div class="modal-box">
          <div class="grid grid-flow-row auto-rows-max md:auto-rows-min">
            <h3 class="font-bold text-lg">New Resident</h3>
            <Show when={formErrors().rfid}>
              <div class="text-red-500">{formErrors().rfid}</div>
            </Show>
            <Show when={formErrors().name}>
              <div class="text-red-500">{formErrors().name}</div>
            </Show>
            <Show when={formErrors().doc}>
              <div class="text-red-500">{formErrors().doc}</div>
            </Show>
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
              onInput={(e) => updateField("doc", parseInt(e.currentTarget.value, 10))}
            />
            {/* We'll get the Character for the unit and convert to ID */}
            <div class="grid grid-flow-row">
              <div class="label">{"Unit"}</div>
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
            <label class="label label-outline justify-center">Upload Image</label>
            <div class="modal-action">
              <input type="file" onChange={handleFileUpload} class="file-input file-input-bordered file-input-accent w-full max-w-xs" />
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
    </div>
  );
}

export default AddResidentModal;
