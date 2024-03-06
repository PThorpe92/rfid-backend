import { For, JSXElement, createSignal, onMount } from "solid-js";
import { SAccount, SResident, STransaction } from "../models/models";
import { API } from "../api/api";

export interface TransactionHistoryTableProps {
  resident: SResident;
  account: SAccount;
  onClose: () => void;
};

function TransactionHistoryTable(props: TransactionHistoryTableProps): JSXElement {
  const [page, setPage] = createSignal(1);
  const [totalPages, setTotalPages] = createSignal([1]);
  const [itemsPerPage, setItemsPerPage] = createSignal(10);
  const [transactions, setTransactions] = createSignal<STransaction[]>();
  const [totalTransactions, setTotalTransactions] = createSignal(0);

  const fetchTransactions = async () => {
    const res = await API.GET(`accounts/${props.account.id}/transactions?page=${page()}&per_page=${itemsPerPage()}`);
    if (res?.data) {
      const total = parseInt(res.message?.split("=")[2] ?? "0");
      setTotalTransactions(total);
      const total_pages = Array.from({ length: Math.ceil(total / itemsPerPage()) }, (_, i) => i + 1);
      setTotalPages(total_pages);
      setTransactions(res.data as STransaction[]);
    }
  }

  const handleChangePage = (page: number) => {
    setPage(page);
  }

  const handleChangeItemsPerPage = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage);
  }

  const handleNextPage = () => {
    page() < totalPages().pop()! && setPage(page() + 1);
  }

  const handlePreviousPage = () => {
    page() > 1 && setPage(page() - 1);
  }

  // add pagination to the table
  onMount(() => {
    fetchTransactions();
  });

  return (
    <div class="modal modal-open">
      <div class="modal-box">
        <div class="font-mono">
          <div class="overflow-x-auto">
            <table class="table table-lg">
              <thead>
                <tr>
                  <th>Resident Name</th>
                  <th>DOC#</th>
                  <th>Transaction Type</th>
                  <th>Amount</th>
                  <th>Date/Time</th>
                </tr>
              </thead>
              <tbody>
                <For each={transactions()}>
                  {(transaction: STransaction) => (
                    <tr>
                      <td class="text-l">{props.resident.name}</td>
                      <td class="text-l">{transaction.doc}</td>
                      <td class="text-l">{transaction.kind}</td>
                      <td class="text-l">{transaction.amount}</td>
                      <td class="text-l">{transaction.timestamp}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
            <br />
            <br />
            <For each={[5, 10, 15, 20]}>
              {(itemsPerPage) => (
                <button class="btn btn-sm btn-outline" onClick={() => handleChangeItemsPerPage(itemsPerPage)}>
                  {itemsPerPage}
                </button>
              )}
            </For>
            <div class="badge-info badge">total: {totalTransactions()}</div>
            <button class="btn btn-sm btn-outline" onClick={() => handlePreviousPage()}>Prev</button>
            <For each={totalPages()}>
              {(page) => (
                <button class="btn btn-sm btn-outline" onClick={() => handleChangePage(page)}>
                  {page}
                </button>
              )}
            </For>
            <button class="btn btn-sm btn-outline" onClick={() => handleNextPage()}>Next</button>
            <button class="btn btn-outline mt-4" onClick={() => props.onClose()}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TransactionHistoryTable;
