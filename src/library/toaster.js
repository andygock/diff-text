const toaster = document.createElement("div");
toaster.style.position = "fixed";
toaster.style.top = "0";
toaster.style.left = "50%";
toaster.style.transform = "translateX(-50%)";
toaster.style.backgroundColor = "darkred";
toaster.style.color = "#fff";
toaster.style.padding = "10px";
toaster.style.borderRadius = "5px";
toaster.style.zIndex = "9999";
toaster.style.transition = "opacity 0.5s ease-in-out";
toaster.style.fontSize = "1.2rem";

const showToast = (message) => {
  toaster.textContent = message;
  document.body.appendChild(toaster);
  setTimeout(() => {
    toaster.style.opacity = "1";
    setTimeout(() => {
      toaster.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(toaster);
      }, 500);
    }, 3000);
  }, 100);
};

export const showError = (message) => {
  // console.error("TODO: showError()", message);
  showToast(message);
};
