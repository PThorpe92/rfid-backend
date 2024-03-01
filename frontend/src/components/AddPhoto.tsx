import { JSXElement, createSignal } from "solid-js";
import { ExitType } from "../models/models";
import { API } from "../api/api";


export interface AddPhotoProps {
  onClose: (e: ExitType) => void;
  residentDoc: number;
}

function AddPhoto(props: AddPhotoProps): JSXElement {
  const [uploadFile, setUploadFile] = createSignal<FormData>(new FormData);
  const [formErrors, setFormErrors] = createSignal({
    file: "",
  });

  const verifyFile = async () => {
    if (uploadFile() !== null) {
      if (uploadFile().get("file") === null) {
        setFormErrors({ file: "Please select a file to upload." });
        return false;
      }
      let photo = await fetch(`http://localhost:3000/imgs/${props.residentDoc}.jpg`, { method: "HEAD" });
      if (photo.status === 200) {
        let resp = confirm("This resident already has a photo. Do you want to replace it? (Y/N)");
        if (resp) {
          return true;
        } else {
          setFormErrors({ file: "This resident already has a photo." });
          return false;
        }
      } else {
        return true;
      }
    }
  }
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
  const handleSubmit = async () => {
    if (await verifyFile() === true) {
      let resp = await API.UPLOAD(`residents/${props.residentDoc}/upload`, uploadFile());
      if (resp !== undefined && resp.success) {
        props.onClose(ExitType.ImageSuccess);
      } else {
        props.onClose(ExitType.ImageError);
      }
    }
  }
  return (
    <>
      <div class="modal modal-open">
        <div class="modal-box">
          <div class="modal-header">Upload Resident Photo</div>
          <div class="modal-actions">
            <input type="file" id="file" name="file" accept="image/*" onchange={handleFileUpload} class="file-input file-input-bordered file-input-accent w-full max-w-xs" />

            <div class="modal-buttons">
              <br />
              <div class="btn btn-accent" onclick={handleSubmit}>Submit</div>
              <div class="btn btn-outline" onclick={() => props.onClose(ExitType.Cancel)}>Cancel</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

}
export default AddPhoto;
