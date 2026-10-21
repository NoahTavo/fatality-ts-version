import { MenuController } from "./controllers/MenuController";
import { PlayerRepository } from "./models/PlayerRepository";
import { MenuView } from "./views/MenuView";

document.addEventListener("DOMContentLoaded", () => {
    new MenuController(new PlayerRepository(), new MenuView()).init();
});
