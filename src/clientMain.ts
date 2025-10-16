import "./assets/styles.css"
import { launchConfetti } from "./utils/confetti.ts";

if (!sessionStorage.getItem("hasVisited")) {
	launchConfetti();
	sessionStorage.setItem("hasVisited", "true");
}
