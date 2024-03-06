import { createSignal, For, JSXElement, onMount, Show } from 'solid-js';
import { ExitType, SItem } from '../models/models';
import { API } from '../api/api';
import toast, { Toaster } from 'solid-toast';
import UpdateInventory from './UpdateInventory';
import AddItemModal from './AddItem';
import Navbar from './Navbar';
import { A } from '@solidjs/router';


function ItemsTable(): JSXElement {

  const [showUploadPhoto, setShowUploadPhoto] = createSignal(false);
  const [allItems, setAllItems] = createSignal<SItem[]>([]);
  const [selectedItem, setSelectedItem] = createSignal<SItem | null>(null);
  const [showUpdateItem, setShowUpdateItem] = createSignal(false);
  const [showDeleteItem, setShowDeleteItem] = createSignal(false);
  const [showAddItem, setShowAddItem] = createSignal(false);
  const [showItem, setShowItem] = createSignal(false);
  const [selectedItemNumber, setSelectedItemNumber] = createSignal(0);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [totalPages, setTotalPages] = createSignal(1);
  const [pageLimit, setPageLimit] = createSignal(10);

  const getAllItems = async () => {
    const res = await API.GET("items");
    if (res?.data) {
      setAllItems(res.data as SItem[]);
    }
  };

  const getCurrentPageItems = async () => {
    const res = await API.GET(`items?page=${pageLimit()}&per_page=${currentPage()}`);
    if (res?.data) {
      setAllItems(res.data as SItem[]);
    }
  };


  const handleSelectItem = (item: SItem) => {
    setSelectedItem(item);
    setShowItem(true);
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
    setShowItem(false);
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    getCurrentPageItems();
  };

  onMount(() => {
    getAllItems();
  });

  return (
    <>
      <Navbar />
      <div class="font-mono">
        <Toaster
          position="bottom-right"
          gutter={8}
          containerClassName="badge badge-xl"
          toastOptions={{
            className: "toast",
            duration: 4000,
            style: {
              background: "#2b2b2b",
              color: "#02eb48",
            },
          }}
        />
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
                <th>Photo</th>
                <th>Name</th>
                <th>Upc</th>
                <th>Price</th>
                <th>Quantity</th>
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
                    <td class="text-l">{item.price / 100}</td>
                    <td class="text-l">{item.quantity}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
          <br />
          <br />
          <Show when={selectedItem() && showItem()}>
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
                    <button class="btn btn-outline" onClick={() => handleEdit()}>
                      Add Quantity
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
          <Show when={showUpdateItem() && selectedItem()}>
            <UpdateInventory
              selectedItem={selectedItem()!}
              onClose={handleCloseUpdateItem}
            />
          </Show>
          <A class="btn btn-outline mt-4" href="/annex">
            Back
          </A>
        </div>
        <div class="flex justify-center gap-4 my-4">
          <For each={Array.from({ length: totalPages() })}>
            {(_, index) => (
              <button
                class="btn btn-xs"
                onClick={() => handlePageChange(index() + 1)}
                classList={{ "btn-active": currentPage() === index() + 1 }}
              >
                {index() + 1}
              </button>
            )}
          </For>
        </div>
      </div>
    </>
  );
} export default ItemsTable;
