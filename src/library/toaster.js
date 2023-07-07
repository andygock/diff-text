import { toast } from "react-toastify";

export const showError = (message) => {
  // console.error("TODO: showError()", message);
  toast(message, {
    type: "error",
    position: toast.POSITION.TOP_CENTER,
  });
};
