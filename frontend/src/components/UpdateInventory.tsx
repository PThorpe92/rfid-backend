import { createSignal, JSXElement, Show } from 'solid-js';
import { ExitType, SItem } from '../models/models';
import { API } from '../api/api';
import toast from 'solid-toast';
import { A } from '@solidjs/router';


export interface UpdateInventoryProps {
  selectedItem: SItem;
  onClose: (exit: ExitType[]) => void;
}


function UpdateInventory(props: UpdateInventoryProps): JSXElement {
  const [formErrors, setFormErrors] = createSignal({
    price: "",
    amount: "",
  });
  const [selectedItem, setSelectedItem] = createSignal<SItem>({} as SItem);
  const [showModal, setShowModal] = createSignal(false);
  const validateForm = () => {
    let errors = { price: "", amount: "" };
    let isValid = true;
    if (!/^\d{17}$/.test(selectedItem().upc)) {
      errors.price = "Price must be a number.";
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const updateField = (field: keyof SItem, value: string | number) => {
    if (field == "quantity") {
      value = parseInt(value as string, 10);
      value += selectedItem().quantity;
    }
    if (field == "price") {
      value = parseFloat(value as string);
    }
    setSelectedItem({ ...selectedItem(), [field]: value });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    const response = await API.PATCH(`items/${selectedItem().id}`, selectedItem());
    if (!response.success) {
      toast.error("Error updating item.");
      return;
    }
    toast.success("Item updated successfully.");
    setSelectedItem({} as SItem);
  }
  return (
    <div class="modal">
      <h1 class="text-2xl">Add Item Inventory</h1>
      <div class="flex flex-col items-center justify-center">
        <div class="flex-col align-top">
          <div class="col-md-2 offset-md-3">
            <div class="card">
              <div class="card-body">
                <h1 class="card-title text-blue-300 text-2xl">Login</h1>
                <div class="form-group">
                  <label for="quantity">Add Quantity</label>
                  <input type="text"
                    class="input input-bordered w-full max-w-xs"
                    id="email"
                    value={selectedItem().quantity}
                    onInput={(e) => updateField("quantity", e.currentTarget.value)}
                  />
                </div>
                <div class="form-group">
                  <label for="price">Change Price</label>
                  <input type="float"
                    class="input input-bordered w-full max-w-xs"
                    id="price"
                    value={selectedItem().price}
                    onInput={(e) => updateField("price", e.currentTarget.value)}
                  />
                </div>
                <button class="btn btn-outline" onclick={handleSubmit}>Login</button>
                <A class="btn btn-outline" href="/annex">Annex</A>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} export default UpdateInventory;
