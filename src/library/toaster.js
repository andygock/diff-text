import { toast } from "react-toastify";

// https://fkhadra.github.io/react-toastify/

export const showError = (message) => {
  // console.error("TODO: showError()", message);
  toast(message, {
    type: "error",
    position: toast.POSITION.TOP_CENTER,
  });
};

export const showMessage = (message) => {
  toast(message, {
    type: "info",
    position: toast.POSITION.TOP_CENTER,
  });
};
