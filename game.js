import { tick } from "./state.js";
import { createUI } from "./ui.js";

const app = document.getElementById("app");

const ui = createUI();
app.appendChild(ui.root);

ui.update();

setInterval(() => {
  // tick with dt in seconds (interval is 100ms -> 0.1s)
  tick(0.1);
  ui.update();
}, 100);