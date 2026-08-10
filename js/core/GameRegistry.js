import NeonClicker from '../games/NeonClicker.js';
import ShapeDodger from '../games/ShapeDodger.js';
import ShapeDodgerV2 from '../games/ShapeDodgerV2.js';
import Blackjack from "../games/Blackjack.js";
import Crash from "../games/Crash.js";
import PrsimaClix from "../games/PrsimaClix.js";
import Mines from '../games/Mines.js';
import BlockBuster from '../games/BlockBuster.js';

// Das ist der zentrale Ort für neue Plugins (Spiele).
// Kein anderer Code muss bei einem neuen Spiel angepasst werden.
export const GameRegistry = [
    NeonClicker,
    ShapeDodger,
    ShapeDodgerV2,
    Blackjack,
    Crash,
    PrsimaClix,
    Mines,
    BlockBuster
];