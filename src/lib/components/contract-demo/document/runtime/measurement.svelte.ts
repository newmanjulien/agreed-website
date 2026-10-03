import { LayoutProfileCache } from '../pagination/profile-cache';
import type { LayoutProfiler } from '../pagination/profiler';
import type { RenderFailure } from './types';

/** One native-size surface, shared by all contract presentations in this application. */
export const contractMeasurement = $state<{
	profiler?: LayoutProfiler;
	error?: RenderFailure;
	retry?: () => void;
}>({});

export const contractProfileCache = new LayoutProfileCache(256);
