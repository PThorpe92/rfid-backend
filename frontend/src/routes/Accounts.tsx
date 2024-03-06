import { JSXElement, createSignal, onMount } from "solid-js";
import { SAccount, ExitType } from "../models/models";
import { API } from "../api/api";
import toast from "solid-toast";
import AccountsTable from "../models/AccountsTable";
import Navbar from "../components/Navbar";


function Accounts(): JSXElement {
  const [allAccounts, setAllAccounts] = createSignal<SAccount[]>();

  const getAllAccounts = async () => {
    const res = await API.GET("accounts");
    if (res?.data) {
      setAllAccounts(res.data as SAccount[]);
    }
  };

  const handleCloseModal = (success: ExitType[]) => {
    success.map(s => {
      switch (s) {
        case ExitType.Success:
          toast.success("Account updated successfully.");
          break;
        case ExitType.Error:
          toast.error("Account update failed, please try again.");
          break;
        case ExitType.Cancel:
          toast("Account update cancelled.");
          break;
        case ExitType.ImageSuccess:
          toast.success("Image uploaded successfully.");
          break;
        case ExitType.ImageError:
          toast.error("Image upload failed, please try again.");
          break;
        default:
          break;
      }
    });
    getAllAccounts();
  };

  onMount(() => {
    getAllAccounts();
  });

  return (
    <>
      <Navbar />
      < div >
        <AccountsTable
          accounts={allAccounts()!}
          onClose={() => handleCloseModal}
        />
      </div >
    </>
  );
}
export default Accounts;
