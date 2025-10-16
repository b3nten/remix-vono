import "./assets/styles.css"
import { yay } from "./utils/confetti.ts";

const hasVisited = sessionStorage.getItem("hasVisited");
if (!hasVisited) {
	yay();
	sessionStorage.setItem("hasVisited", "true");
}
