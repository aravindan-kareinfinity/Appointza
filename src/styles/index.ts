import { DefaultColor } from "./default-color.style";
import { AppText } from "./app-text.style";
import { AppView } from "./app-view.style";

export const $ = {
  ...DefaultColor.instance,
  ...AppView.instance,
  ...AppText.instance,
};
