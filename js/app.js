const resourcePath = window.location.pathname.replace(/\/+$/, "");
const isHistoryRoute = resourcePath === "/history" || resourcePath === "/history.html";
void import(isHistoryRoute ? "./controllers/history-controller.js" : "./controllers/game-controller.js");

// The controller module owns runtime behavior; this entry point only boots it.
