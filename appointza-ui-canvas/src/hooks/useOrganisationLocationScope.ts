import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import {
  getCurrentLocationFromStorage,
  getLocationDisplayName,
} from "@/utils/location.util";
import { getStoredUserContext } from "@/utils/authSession.util";

function readStoredLocationId(): number {
  const fromKey = Number(localStorage.getItem("organizationlocationid") || 0);
  if (fromKey > 0) return fromKey;
  return Number(getStoredUserContext()?.organisationlocationid || 0);
}

/** Resolves the active organisation location from dashboard selection — no API fetch. */
export function useOrganisationLocationScope(_organisationId: number) {
  const { user } = useAuth();
  const { id: globalLocationId, setId: setGlobalLocationId } = useGlobalId();
  const [locationId, setLocationId] = useState(0);

  useEffect(() => {
    const fromGlobal = globalLocationId ? Number(globalLocationId) : 0;
    const fromStorage = readStoredLocationId();
    const staffLocationId = user?.locationid && user.locationid > 0 ? user.locationid : 0;
    setLocationId(fromGlobal > 0 ? fromGlobal : fromStorage > 0 ? fromStorage : staffLocationId);
  }, [globalLocationId, user?.locationid]);

  useEffect(() => {
    const handleLocationChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ organizationlocationid?: number }>).detail;
      const nextId = Number(detail?.organizationlocationid || 0);
      if (nextId > 0) {
        setGlobalLocationId(nextId);
        setLocationId(nextId);
      }
    };

    window.addEventListener("organizationlocationidChanged", handleLocationChanged);
    return () => window.removeEventListener("organizationlocationidChanged", handleLocationChanged);
  }, [setGlobalLocationId]);

  const locationLabel = useMemo(() => {
    const stored = getCurrentLocationFromStorage();
    if (stored?.id === locationId) {
      const name = (stored.name || "").trim();
      const city = (stored.city || "").trim();
      if (name && city) return `${name} — ${city}`;
      return name || city || getLocationDisplayName(stored);
    }
    return locationId > 0 ? `Location #${locationId}` : "";
  }, [locationId]);

  return {
    locationId,
    locationLabel,
    loading: false,
  };
}
