import { useEffect, useMemo, useState } from "react";
import { FilesService } from "@/services/files.service";
import { getAuthToken, getStoredUserContext } from "@/utils/authSession.util";

/** Image id from persisted login session (same source as sidebar / JWT). */
export function readStoredProfileImageId(): number {
  const id = Number(getStoredUserContext()?.userimageid) || 0;
  return id > 0 ? id : 0;
}

/** Prefer saved profile, then auth context, then localStorage. */
export function resolveProfileImageId(
  profileImage?: number | null,
  authImageId?: number | null,
): number {
  const fromProfile = Number(profileImage) || 0;
  if (fromProfile > 0) return fromProfile;
  const fromAuth = Number(authImageId) || 0;
  if (fromAuth > 0) return fromAuth;
  return readStoredProfileImageId();
}

/** Load a private Files API image with Bearer auth and expose a blob URL for `<img>`. */
export function useAuthenticatedProfileImage(imageId: number, version = 0) {
  const filesService = useMemo(() => new FilesService(), []);
  const [blobUrl, setBlobUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!imageId || imageId <= 0) {
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return "";
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const token = getAuthToken();
        const response = await fetch(
          `${filesService.getImageUrl(imageId)}&v=${version}`,
          {
            method: "GET",
            headers: {
              Accept: "image/*",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        if (cancelled) return;

        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return objectUrl;
          });
        } else {
          console.error("Failed to load profile image:", response.status);
          setBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return "";
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading profile image:", error);
          setBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return "";
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [imageId, version, filesService]);

  const showImage = imageId > 0 && (blobUrl || isLoading);

  return { blobUrl, isLoading, showImage };
}
