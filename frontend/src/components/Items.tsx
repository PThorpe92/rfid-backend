import { createSignal, For, JSXElement, onMount, Show } from 'solid-js';
import { ExitType, SItem } from '../models/models';
import { API } from '../api/api';
import toast from 'solid-toast';
import UpdateInventory from './UpdateInventory';
import AddItemModal from './AddItem';



function Items(): JSXElement {

  const [location, setLocation] = createSignal(0);
  const [showUploadPhoto, setShowUploadPhoto] = createSignal(false);
  const [allItems, setAllItems] = createSignal<SItem[]>([]);
  const [selectedItem, setSelectedItem] = createSignal<SItem | null>(null);
  const [showUpdateItem, setShowUpdateItem] = createSignal(false);
  const [showDeleteItem, setShowDeleteItem] = createSignal(false);
  const [showAddItem, setShowAddItem] = createSignal(false);
  const [selectedItemNumber, setSelectedItemNumber] = createSignal(0);
  const getAllItems = async () => {
    const res = await API.GET("items?all=true");
    if (res?.data) {
      setAllItems(res.data as SItem[]);
    }
  };

  const handleSelectItem = (item: SItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = (success: ExitType[]) => {
    success.map(s => {
      switch (s) {
        case ExitType.Success:
          toast.success("Item updated successfully.");
          break;
        case ExitType.Error:
          toast.error("Item update failed, please try again.");
          break;
        case ExitType.Cancel:
          toast("Item update cancelled.");
          break;
        case ExitType.ImageSuccess:
          toast.success("Image uploaded successfully.");
          break;
        case ExitType.ImageError:
          toast.error("Image upload failed, please try again.");
          break;
        case ExitType.Cancel:
          toast("Image upload cancelled.");
          break;
      }
    });
  }

  const handleCloseUpdateItem = (exit: ExitType[]) => {
    handleCloseModal(exit);
    setShowUpdateItem(false);
    setSelectedItem(null);
  };

  const handleEdit = () => {
    setShowUpdateItem(true);
  };

  const handleDeleteItem = async () => {
    const res = await API.DELETE(`items/${selectedItem()?.id}`);
    if (res?.success === true) {
      toast.success("item deleted successfully.");
      setShowDeleteItem(false);
      setSelectedItem(null);
    }
  };

  const handleShowUploadPhoto = () => {
    setSelectedItemNumber(selectedItem()?.id!);
    setShowUploadPhoto(true);
    setSelectedItem(null);
  };
  const handleCloseAddItem = (success: ExitType[]) => {
    handleCloseModal(success);
    setShowAddItem(false);
  };

  const handleShowDelete = () => {
    setShowDeleteItem(true);
  };

  onMount(() => {
    if (allItems().length === 0) {
      getAllItems;
    }
  });

  return (
    <div class="font-mono">
      <div class="overflow-x-auto">
        <div class="flex justify-between">
          <div class="btn btn-primary" onClick={() => setShowAddItem(true)}>
            Add Item
          </div>
          <Show when={showAddItem()}>
            <AddItemModal onRefresh={getAllItems} onClose={handleCloseAddItem} />
          </Show>
        </div>
        <table class="table ">
          <thead>
            <tr>
              <th>Name</th>
              <th>Upc</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Id</th>
            </tr>
          </thead>
          <tbody>
            <For each={allItems()}>
              {(item) => (
                <tr
                  class="hover cursor-pointer"
                  onClick={() => handleSelectItem(item)}
                >
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar avatar-rounded">
                        <div class="mask mask-squircle w-12 h-12">
                          <img
                            src={`/imgs/${item.upc}.jpg`}
                            onError={(e) => e.currentTarget.src = '/imgs/default.jpg'}
                            class="w-12 h-12 object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="text-l">{item.name}</td>
                  <td class="text-l">{item.upc}</td>
                  <td class="text-l">{item.price}</td>
                  <td class="text-l">{item.quantity}</td>
                  <td class="text-l">{item.id}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <br />
        <br />
        <Show when={selectedItem()}>
          <div class="modal modal-open">
            <div class="modal-box">
              <div class="modal-title">
                <img src={`/imgs/${selectedItem()!.upc}.jpg`} />
                <div class="font-mono text-xl">Name: {selectedItem()!.name}</div>
                <div class="font-mono text-xl">Price: {selectedItem()!.price}</div>
                <div class="font-mono text-xl">Quantity: {selectedItem()!.quantity}</div>
                <div class="font-mono text-xl">Id: {selectedItem()!.id}</div>
              </div>
              <div class="modal-body">
                <div class="content">
                  <button class="btn btn-outline" onClick={handleEdit}>
                    Edit
                  </button>
                  <button class="btn btn-error" onClick={handleShowDelete}>
                    Delete
                  </button>
                  <button class="btn btn-outline" onClick={handleShowUploadPhoto}>
                    Upload Photo
                  </button>
                  <button class="btn btn-outline" onClick={() => setSelectedItem(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
          <Show when={showDeleteItem()}>
            <div class="modal modal-open">
              <div class="modal-box">
                <div class="modal-header">
                  <div class="modal-title h3">Delete Selected Item</div>
                </div>
                <div class="modal-body">
                  <div class="content">
                    <br />
                    <p class="bg-primary">
                      Are you sure you want to delete the selected item?
                    </p>
                    <br />
                    <div class="justify-center font-mono text-xl">
                      {selectedItem()!.name}
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-error" onClick={handleDeleteItem}>
                    Delete
                  </button>
                  <button
                    class="btn"
                    onClick={() => setShowDeleteItem(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </Show>
        </Show>
      </div>
      <div class="container object-center">
        <Show when={showUpdateItem()}>
          <UpdateInventory
            selectedItem={selectedItem()!}
            onClose={handleCloseUpdateItem}
          />
        </Show>
        <button class="btn btn-outline mt-4" onClick={() => handleCloseUpdateItem}>
          Close
        </button>
      </div>
    </div>
  );
} export default Items;
