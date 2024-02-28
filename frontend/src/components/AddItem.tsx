import { JSXElement, Show, createSignal } from 'solid-js';
import { ExitType, SItem } from '../models/models';
import { API } from '../api/api';
import toast from 'solid-toast';


interface AddItemProps {
  onClose: (exit: ExitType[]) => void;
  onRefresh: () => void;
}

function AddItemModal(props: AddItemProps): JSXElement {
  const [formErrors, setFormErrors] = createSignal({
    upc: "",
    name: "",
    price: "",
  });
  const [newItem, setNewItem] = createSignal<SItem>({} as SItem);

  const [uploadFile, setUploadFile] = createSignal<FormData>(new FormData);


  const validateForm = () => {
    let errors = { upc: "", name: "", price: "" };
    let isValid = true;

    if (!/^\d{17}$/.test(newItem().upc)) {
      errors.upc = "RFID must be 17 digits.";
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
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

  const updateField = (field: keyof SItem, value: string | number) => {
    setNewItem({ ...newItem(), [field]: value });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const response = await API.POST("items", newItem());
    if (response !== undefined && response?.success) {
      toast.success("Resident added successfully");
      props.onRefresh();
      props.onClose([ExitType.Success]);
    } else {
      toast.error("Error adding resident");
      props.onClose([ExitType.Error]);
    }
    if (uploadFile() !== null) {
      const res = await API.UPLOAD(`items/${newItem().upc}/upload`, uploadFile());
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
            <Show when={formErrors().upc}>
              <div class="text-red-500">{formErrors().upc}</div>
            </Show>
            <Show when={formErrors().name}>
              <div class="text-red-500">{formErrors().name}</div>
            </Show>
            <Show when={formErrors().price}>
              <div class="text-red-500">{formErrors().price}</div>
            </Show>
            <input
              type="text"
              placeholder="UPC (please scan tag)"
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
              placeholder="Price"
              class="input input-bordered w-full max-w-xs"
              onInput={(e) => updateField("doc", e.currentTarget.value)}
            />
            <input
              type="text"
              placeholder="Amount"
              class="input input-bordered w-full max-w-xs"
              onInput={(e) => updateField("doc", e.currentTarget.value)}
            />
            {/* We'll get the Character for the unit and convert to ID */}
            <label class="label label-outline justify-center">Upload Image</label>
            <div class="modal-action">
              <input type="file" onChange={handleFileUpload} class="file-input file-input-bordered file-input-accent w-full max-w-xs" />
            </div>
            <div class="modal-action">
              <button class="btn" onClick={handleSubmit}>
                Submit
              </button>
              <button class="btn btn-outline" onClick={() => props.onClose([ExitType.Cancel])}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddItemModal;
