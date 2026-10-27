import { napzFunctions } from '../services/firebase/functionsClient';
import type { RidePlace } from './types';
import type { BlaBlaCarRideOffer } from './blaBlaCarCatalog';

export type BlaBlaCarProStatus = {
  configured: boolean;
  loggedIn: boolean;
  login: string | null;
  firstName: string | null;
};

export async function fetchBlaBlaCarProStatus(): Promise<BlaBlaCarProStatus> {
  const result = await napzFunctions().httpsCallable('blaBlaCarProStatus')();
  const data = (result.data ?? {}) as Partial<BlaBlaCarProStatus>;
  return {
    configured: data.configured === true,
    loggedIn: data.loggedIn === true,
    login: data.login ?? null,
    firstName: data.firstName ?? null,
  };
}

export async function loginBlaBlaCarPro(login: string, password: string): Promise<BlaBlaCarProStatus> {
  const result = await napzFunctions().httpsCallable('blaBlaCarProLogin')({ login, password });
  const data = (result.data ?? {}) as Partial<BlaBlaCarProStatus>;
  return {
    configured: true,
    loggedIn: data.loggedIn === true,
    login: data.login ?? login,
    firstName: data.firstName ?? null,
  };
}

export async function logoutBlaBlaCarPro(): Promise<void> {
  await napzFunctions().httpsCallable('blaBlaCarProLogout')();
}

export async function searchBlaBlaCarProRides(
  pickup: RidePlace,
  destination: RidePlace,
  departureDate: string
): Promise<{ configured: boolean; loggedIn: boolean; rides: BlaBlaCarRideOffer[]; message?: string }> {
  const result = await napzFunctions().httpsCallable('blaBlaCarProSearch')({
    originName: pickup.name,
    destinationName: destination.name,
    departureDate,
  });
  const data = (result.data ?? {}) as {
    configured?: boolean;
    loggedIn?: boolean;
    rides?: BlaBlaCarRideOffer[];
    message?: string;
  };
  return {
    configured: data.configured === true,
    loggedIn: data.loggedIn === true,
    rides: Array.isArray(data.rides) ? data.rides : [],
    message: data.message,
  };
}
