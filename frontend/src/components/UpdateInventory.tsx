import { createSignal, JSXElement, Show } from 'solid-js';
import { ExitType, SItem } from '../models/models';
import { API } from '../api/api';
import toast, { Toaster } from 'solid-toast';


export interface UpdateInventoryProps {
  selectedItem: SItem;
  onClose: (exit: ExitType[]) => void;
}


function UpdateInventory(props: UpdateInventoryProps): JSXElement {
  const [selectedItem, setSelectedItem] = createSignal({ quantity: 0, price: null, purchase_order_id: "" });

  const updateField = (field: keyof SItem, value: string | number) => {
    if (field == "quantity") {
      value = parseInt(value as string, 10);
      if (value < 0) {
        value = 0;
      }
      value;
    }
    if (field == "price") {
      value = parseFloat(value as string);
    }
    setSelectedItem({ ...selectedItem(), [field]: value });
  };

  const handleSubmit = async () => {
    const response = await API.PATCH(`items/${props.selectedItem.id}`, selectedItem());
    if (!response.success) {
      toast.error("Error updating item.");
      return;
    }
    toast.success("Item updated successfully.");
    props.onClose([ExitType.Success]);
    setSelectedItem({ quantity: 0, price: null, purchase_order_id: "" });
  }
  return (
    <>
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
      <div class="modal modal-open">
        <h1 class="text-2xl">Add Item Inventory</h1>
        <div class="flex flex-col items-center justify-center">
          <div class="flex-col align-top">
            <div class="col-md-2 offset-md-3">
              <div class="card">
                <div class="card-body">
                  <div class="form-group">
                    <label for="quantity">Add Quantity</label>
                    <input type="number"
                      class="input input-bordered w-full max-w-xs"
                      id="quantity"
                      value={0}
                      onInput={(e) => updateField("quantity", e.currentTarget.value)}
                    />
                  </div>
                  <div class="form-group">
                    <label for="purchase_order_id">Purchase Order #</label>
                    <input type="text"
                      class="input input-bordered w-full max-w-xs"
                      id="purchase-order#"
                      value={0}
                      onInput={(e) => updateField("purchase_order_id", e.currentTarget.value)}
                    />
                  </div>
                  <div class="form-group">
                    <label for="price">Change Price</label>
                    <input type="float"
                      class="input input-bordered w-full max-w-xs"
                      id="price"
                      value={props.selectedItem.price / 100}
                      onInput={(e) => updateField("price", e.currentTarget.value)}
                    />
                  </div>
                  <button class="btn btn-outline" onclick={handleSubmit}>Submit</button>
                  <div class="btn btn-outline" onClick={() => props.onClose([ExitType.Cancel])}>Close</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} export default UpdateInventory;
