import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { readJsonMeta, writeJsonMeta } from "@/lib/offline/offline-db";
import { useNetworkStatus } from "@/lib/offline/network-status";
import {
  clearDownloadedYears,
  downloadYear as downloadYearOnce,
  downloadYearRange,
  listDownloadedYears,
  type DownloadRangeProgress,
  type DownloadedYearsSummary,
} from "@/lib/offline/offline-store";
import { computeDefaultInstallRange, type YearRange } from "@/lib/offline/offline-range";
import { getStoredDataMode } from "@/lib/onboarding-storage";
import { usePanchangaLocation } from "@/lib/use-panchanga-location";

const INSTALL_STATE_KEY = "install_prefetch_v1";
const WIFI_ONLY_PREF_KEY = "offline_wifi_only_v1";

interface InstallState {
  done: boolean;
  range: YearRange;
}

const IDLE_PROGRESS: DownloadRangeProgress = {
  status: "idle",
  total: 0,
  completed: 0,
  skipped: 0,
  currentYear: null,
  error: null,
};

const EMPTY_SUMMARY: DownloadedYearsSummary = {
  years: [],
  minYear: null,
  maxYear: null,
  count: 0,
  approxBytes: 0,
};

interface OfflineDataContextValue {
  isOnline: boolean;
  isWifi: boolean;
  /** Years actually on disk right now, for the location the provider is tracking. */
  summary: DownloadedYearsSummary;
  /** The BS year window the app tries to have downloaded by default. */
  installRange: YearRange;
  /** Progress of the automatic first-install (or resumed) background download. */
  initialDownload: DownloadRangeProgress;
  wifiOnly: boolean;
  setWifiOnly: (value: boolean) => void;
  isYearAvailableOffline: (year: number) => boolean;
  refreshSummary: () => Promise<void>;
  /** Explicit single-year download, e.g. from the "download for offline use" prompt. */
  downloadYear: (year: number) => Promise<void>;
  /** Explicit range download, e.g. from the Offline Data settings screen. */
  downloadRange: (
    range: YearRange,
    onProgress?: (progress: DownloadRangeProgress) => void,
  ) => Promise<DownloadRangeProgress>;
  /**
   * Kicks off the default install-range download. Downloading offline data is
   * the user's choice, not something the app does on its own — this is only
   * called from the onboarding screen once someone picks "offline", and is
   * auto-resumed on later launches solely to finish a download that specific
   * choice started (see the effect below), never for someone who chose online.
   */
  startInstallDownload: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

const OfflineDataContext = createContext<OfflineDataContextValue | null>(null);

/**
 * Owns the on-disk BS-year calendar cache and exposes the read/write API the
 * calendar screens, the onboarding screen, and the Offline Data settings
 * screen use. Never downloads anything on its own — `startInstallDownload`
 * only runs when the onboarding screen calls it (the user chose "offline"),
 * or to resume that same choice's download after an interruption.
 *
 * Tracks its own `usePanchangaLocation()` instance, matching how every other
 * screen in the app reads that location independently from SecureStore — so a
 * location change made elsewhere is only picked up here on next mount, same as
 * everywhere else. Fine for the common case (one home location); a user who
 * frequently switches cities may need to re-open the app for a location switch
 * to reflect during a single session here.
 */
export function OfflineDataProvider({ children }: { children: React.ReactNode }) {
  const { isOnline, isWifi } = useNetworkStatus();
  const { location } = usePanchangaLocation();
  const [summary, setSummary] = useState<DownloadedYearsSummary>(EMPTY_SUMMARY);
  const [installRange, setInstallRange] = useState<YearRange>(() => computeDefaultInstallRange());
  const [initialDownload, setInitialDownload] = useState<DownloadRangeProgress>(IDLE_PROGRESS);
  const [wifiOnly, setWifiOnlyState] = useState(true);

  const runningRef = useRef(false);
  const installDoneRef = useRef(false);
  const locationRef = useRef(location);
  locationRef.current = location;

  const refreshSummary = useCallback(async () => {
    const next = await listDownloadedYears(locationRef.current.params);
    setSummary(next);
  }, []);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary, location.label]);

  useEffect(() => {
    readJsonMeta<boolean>(WIFI_ONLY_PREF_KEY).then((stored) => {
      if (stored != null) setWifiOnlyState(stored);
    });
  }, []);

  const setWifiOnly = useCallback((value: boolean) => {
    setWifiOnlyState(value);
    void writeJsonMeta(WIFI_ONLY_PREF_KEY, value);
  }, []);

  const startInstallDownload = useCallback(async () => {
    if (runningRef.current || installDoneRef.current) return;
    runningRef.current = true;
    try {
      const stored = await readJsonMeta<InstallState>(INSTALL_STATE_KEY);
      if (stored?.done) {
        installDoneRef.current = true;
        return;
      }
      const range = stored?.range ?? computeDefaultInstallRange();
      setInstallRange(range);

      const result = await downloadYearRange(range.startYear, range.endYear, {
        location: locationRef.current.params,
        wifiOnly,
        onProgress: setInitialDownload,
        shouldContinue: () => runningRef.current,
      });

      if (result.status === "done") {
        installDoneRef.current = true;
        await writeJsonMeta<InstallState>(INSTALL_STATE_KEY, { done: true, range });
      } else {
        await writeJsonMeta<InstallState>(INSTALL_STATE_KEY, { done: false, range });
      }
      await refreshSummary();
    } finally {
      runningRef.current = false;
    }
  }, [wifiOnly, refreshSummary]);

  // Resumes an in-progress download only for someone who already opted into
  // offline mode at onboarding — never starts one on its own for anyone else.
  useEffect(() => {
    if (!isOnline) return;
    if (wifiOnly && !isWifi) return;
    let cancelled = false;
    getStoredDataMode().then((mode) => {
      if (!cancelled && mode === "offline") void startInstallDownload();
    });
    return () => {
      cancelled = true;
    };
  }, [isOnline, isWifi, wifiOnly, startInstallDownload]);

  useEffect(
    () => () => {
      runningRef.current = false;
    },
    [],
  );

  const yearsSet = useMemo(() => new Set(summary.years), [summary.years]);
  const isYearAvailableOffline = useCallback((year: number) => yearsSet.has(year), [yearsSet]);

  const downloadYear = useCallback(
    async (year: number) => {
      await downloadYearOnce(year, locationRef.current.params);
      await refreshSummary();
    },
    [refreshSummary],
  );

  const downloadRange = useCallback(
    async (range: YearRange, onProgress?: (progress: DownloadRangeProgress) => void) => {
      const result = await downloadYearRange(range.startYear, range.endYear, {
        location: locationRef.current.params,
        onProgress,
      });
      await refreshSummary();
      return result;
    },
    [refreshSummary],
  );

  const clearOfflineData = useCallback(async () => {
    await clearDownloadedYears(locationRef.current.params);
    await writeJsonMeta<InstallState>(INSTALL_STATE_KEY, { done: false, range: installRange });
    installDoneRef.current = false;
    await refreshSummary();
  }, [refreshSummary, installRange]);

  const value = useMemo<OfflineDataContextValue>(
    () => ({
      isOnline,
      isWifi,
      summary,
      installRange,
      initialDownload,
      wifiOnly,
      setWifiOnly,
      isYearAvailableOffline,
      refreshSummary,
      downloadYear,
      downloadRange,
      startInstallDownload,
      clearOfflineData,
    }),
    [
      isOnline,
      isWifi,
      summary,
      installRange,
      initialDownload,
      wifiOnly,
      setWifiOnly,
      isYearAvailableOffline,
      refreshSummary,
      downloadYear,
      downloadRange,
      startInstallDownload,
      clearOfflineData,
    ],
  );

  return <OfflineDataContext.Provider value={value}>{children}</OfflineDataContext.Provider>;
}

export function useOfflineData(): OfflineDataContextValue {
  const ctx = useContext(OfflineDataContext);
  if (!ctx) throw new Error("useOfflineData must be used within OfflineDataProvider");
  return ctx;
}
