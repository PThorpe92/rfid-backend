import { Toaster, toast } from "solid-toast";
import { ExitType, SAccount, SResident } from "../models/models";
import { createSignal, JSXElement, Show } from "solid-js";
import { API } from "../api/api.js";
import TransactionHistoryTable from "../components/TransactionHistoryTable";

export interface AccountsTableProps {
  accounts: SAccount[];
  onClose: () => void;
};

function AccountsTable(props: AccountsTableProps): JSXElement {
  const [selectedAccount, setSelectedAccount] = createSignal<SAccount | null>(null);
  const [showAccountHistory, setShowAccountHistory] = createSignal(false);
  const [selectedResident, setSelectedResident] = createSignal<SResident | null>(null);

  const getResidentInfo = async () => {
    if (selectedAccount() !== null) {
      const res = await API.GET(`residents/${selectedAccount()!.doc}`);
      if (res?.data) {
        setSelectedResident(res.data.at(0) as SResident);
      }
    }
  };

  const handleSelectAccount = (account: SAccount) => {
    setSelectedAccount(account);
    getResidentInfo();
    setShowAccountHistory(true);
  };


  return (
    <>
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          className: "toast",
          duration: 4000,
          style: {
            background: "#2b2b2b",
            color: "#02eb48",
          },
        }}
      />
      <div>
        <h1>Accounts</h1>
        <Show when={showAccountHistory() && selectedAccount() !== null}>
          <TransactionHistoryTable
            account={selectedAccount()!}
            resident={selectedResident()!}
            onClose={() => setShowAccountHistory(false)
            } />
          <div class="flex justify-center">
            <div class="modal modal-open">
              <div class="modal-box">
                <div class="modal-header">
                  <h3>Account Details</h3>
                </div>
                <div class="modal-body">
                  <div class="flex justify-center">
                    <div>Resident Name: {selectedResident()!.name}</div>
                    <div>Resident Doc: {selectedResident()!.doc}</div>
                    <div>Resident Unit: {selectedResident()!.unit}</div>
                    <div>Account Number: {selectedAccount()!.account_number}</div>
                    <div>Account Balance: {selectedAccount()!.balance}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>
        <table>
          <thead>
            <tr>
              <th>Account Number</th>
              <th>Account Type</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {props.accounts.map((account) => (
              <tr onclick={() => handleSelectAccount(account)}>
                <td>{account.account_number}</td>
                <td>{account.account_type}</td>
                <td>{account.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={() => props.onClose()}>Close</button>
      </div>
    </>
  );
}
export default AccountsTable;
