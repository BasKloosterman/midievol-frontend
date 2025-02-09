import { createContext } from "react";
import { ConfigState, MelodyState } from "./state";
import { AnyAction } from "@reduxjs/toolkit";

export const ConfigContext = createContext<{ state: ConfigState; dispatch: React.Dispatch<AnyAction> } | undefined>(undefined);
export const MelodyContext = createContext<{ state: MelodyState; dispatch: React.Dispatch<AnyAction> } | undefined>(undefined);