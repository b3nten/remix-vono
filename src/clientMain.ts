import "./assets/styles.css"
import { launchConfetti } from "./utils/confetti.ts";

const hasVisited = sessionStorage.getItem("hasVisited");
if (!hasVisited) {
	launchConfetti();
	sessionStorage.setItem("hasVisited", "true");
}
