import type { GuidedTourStep } from './tour-model';

export type ContractDemoScene =
	| { mode: 'clause'; itemId: string; triggerId: string; concessionId?: string }
	| { mode: 'actions'; itemId: string; concessionId: string };

export type ContractSceneLayout =
	| { mode: 'clause'; highlight: HTMLElement; panel: HTMLElement }
	| { mode: 'actions'; actions: HTMLElement };

export interface ContractTourState {
	panelOpen: boolean;
	hovered: boolean;
	openSection?: 'negotiation' | 'preferred' | null;
	concessionId?: string | null;
}

export type ContractTourTarget = 'origin' | 'highlight' | 'negotiation' | 'preferred' | 'apply' | 'approval' | 'send';
export type ContractTourStep = GuidedTourStep<string, ContractTourState, ContractTourTarget>;

export const contractCursorMoveDuration = 850;
