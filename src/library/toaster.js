/* eslint-disable import/prefer-default-export */
import { Position, Toaster, Intent } from "@blueprintjs/core";

const toaster = Toaster.create({
  className: "recipe-toaster",
  position: Position.TOP,
});

export const showError = (message) => {
  console.error(message);
  toaster.show({
    message,
    intent: Intent.DANGER,
  });
};
