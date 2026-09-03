const isHistoryRoute = window.location.pathname.replace(/\/+$/, "") === "/history";
void import(isHistoryRoute ? "./controllers/history-controller.js" : "./controllers/game-controller.js");

// The controller module owns runtime behavior; this entry point only boots it.
