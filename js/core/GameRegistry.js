import NeonClicker from '../games/NeonClicker.js';
import ShapeDodger from '../games/ShapeDodger.js';
import Blackjack from "../games/Blackjack.js";
import Crash from "../games/Crash.js";

// Das ist der zentrale Ort für neue Plugins (Spiele).
// Kein anderer Code muss bei einem neuen Spiel angepasst werden.
export const GameRegistry = [
    NeonClicker,
    ShapeDodger,
    Blackjack,
    Crash
];