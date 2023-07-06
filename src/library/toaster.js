/* eslint-disable import/prefer-default-export */
import { Position, Intent, OverlayToaster } from "@blueprintjs/core";

const toaster = OverlayToaster.create({
  position: Position.TOP,
  className: "recipe-toaster",
});

export const showError = (message) => {
  console.error(message);
  toaster.show({
    message,
    intent: Intent.DANGER,
  });
};
