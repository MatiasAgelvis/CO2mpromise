import { tick, saveGame, loadGame } from "./state.js";
import { createUI } from "./ui.js";

const app = document.getElementById("app");

loadGame();

const ui = createUI();
app.appendChild(ui.root);
ui.update();

// Simulation runs on a timer with real elapsed time so throttled background
// tabs still progress correctly.
let lastSim = performance.now();
setInterval(() => {
  const now = performance.now();
  let dt = (now - lastSim) / 1000;
  lastSim = now;
  if (!Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 2);
  tick(dt);
}, 100);

// UI refreshes at a comfortable 10 Hz.
let lastUI = performance.now();
let uiAcc = 0;
function frame(now) {
  uiAcc += now - lastUI;
  lastUI = now;
  if (uiAcc >= 100) {
    ui.update(now);
    uiAcc = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

setInterval(saveGame, 5000);
window.addEventListener("beforeunload", saveGame);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveGame();
});
