import { ServerAPI, staticClasses } from 'decky-frontend-lib';
import React, { VFC, useState, useEffect, useRef } from 'react';
import { FaCloud } from 'react-icons/fa';
import { SettingsPanel } from './components/SettingsPanel';
import { GFNSettings, DEFAULT_SETTINGS } from './types';
import { patchGamePage } from './patches/GamePagePatch';

// Global settings that can be updated and read by both the content panel and game page patch
class SettingsManager {
  private settings: GFNSettings = DEFAULT_SETTINGS;

  getSettings(): GFNSettings {
    return this.settings;
  }

  updateSettings(newSettings: GFNSettings): void {
    this.settings = newSettings;
  }
}

const settingsManager = new SettingsManager();

// Get all app IDs from the local Steam library
function getLibraryAppIds(): string[] {
  try {
    const apps = (window as any).collectionStore?.localGamesCollection?.apps;
    if (!apps) return [];
    return Array.from(apps.keys()).map(String);
  } catch {
    return [];
  }
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [settings, setSettings] = useState<GFNSettings>(settingsManager.getSettings());
  const [cacheStats, setCacheStats] = useState<{
    total: number;
    expired: number;
    fresh: number;
  } | null>(null);
  const [dbInfo, setDbInfo] = useState<{
    db_size: number;
    plugin_dir: string | null;
    last_updated: string | null;
  } | null>(null);
  const [libraryStats, setLibraryStats] = useState<{
    total: number;
    available: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{
    status: string;
    old_count?: number;
    new_count?: number;
    added?: number;
    message?: string;
  } | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Quick lookup state
  const [lookupAppId, setLookupAppId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    available: boolean;
    appid: string;
  } | null>(null);

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings, cache stats, and library stats on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await serverAPI.callPluginMethod<{}, GFNSettings>(
          'get_settings',
          {}
        );
        if (result.success && result.result) {
          setSettings(result.result);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    const loadCacheStats = async () => {
      try {
        const result = await serverAPI.callPluginMethod<
          {},
          { total: number; expired: number; fresh: number }
        >('get_cache_stats', {});
        if (result.success && result.result) {
          setCacheStats(result.result);
        }
      } catch (error) {
        console.error('Error loading cache stats:', error);
      }
    };

    const loadLibraryStats = async () => {
      try {
        const appids = getLibraryAppIds();
        if (appids.length === 0) return;
        const result = await serverAPI.callPluginMethod<
          { appids: string[] },
          { total: number; available: number }
        >('get_library_stats', { appids });
        if (result.success && result.result) {
          setLibraryStats(result.result);
        }
      } catch (error) {
        console.error('Error loading library stats:', error);
      }
    };

    loadSettings();
    loadCacheStats();
    loadLibraryStats();

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, []);

  // Auto-load db info when debug section is expanded
  useEffect(() => {
    if (showDebug) {
      handleLoadDbInfo();
    }
  }, [showDebug]);

  const handleSettingsChange = (newSettings: GFNSettings) => {
    setSettings(newSettings);
    settingsManager.updateSettings(newSettings);

    // Debounce the backend save by 500ms
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      try {
        await serverAPI.callPluginMethod('save_settings', { settings: newSettings });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }, 500);
  };

  const handleClearCache = async () => {
    try {
      await serverAPI.callPluginMethod('clear_cache', {});
      setCacheStats({ total: 0, expired: 0, fresh: 0 });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const handleLoadDbInfo = async () => {
    try {
      const result = await serverAPI.callPluginMethod('get_db_info', {});
      if (result.success) {
        setDbInfo(result.result);
      }
    } catch (error) {
      console.error('Error loading DB info:', error);
    }
  };

  const handleRefreshDatabase = async () => {
    setRefreshing(true);
    setRefreshResult(null);

    try {
      const result = await serverAPI.callPluginMethod('refresh_database', {});
      if (result.success) {
        setRefreshResult(result.result);
        // Reload cache stats, db info, and library stats after refresh
        const statsResult = await serverAPI.callPluginMethod('get_cache_stats', {});
        if (statsResult.success) setCacheStats(statsResult.result);

        const dbResult = await serverAPI.callPluginMethod('get_db_info', {});
        if (dbResult.success) setDbInfo(dbResult.result);

        const appids = getLibraryAppIds();
        if (appids.length > 0) {
          const libResult = await serverAPI.callPluginMethod('get_library_stats', { appids });
          if (libResult.success) setLibraryStats(libResult.result);
        }
      } else {
        setRefreshResult({ status: 'error', message: 'Failed to refresh database' });
      }
    } catch (error) {
      console.error('Error refreshing database:', error);
      setRefreshResult({ status: 'error', message: String(error) });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLookup = async () => {
    const appid = lookupAppId.trim();
    if (!appid) return;

    setLookupLoading(true);
    setLookupResult(null);

    try {
      const result = await serverAPI.callPluginMethod('check_gfn_availability', { appid });
      if (result.success) {
        setLookupResult({ available: result.result.available, appid });
      }
    } catch (error) {
      console.error('Error checking game:', error);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, marginBottom: '8px' }}>GeForce NOW for Deck</h2>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '14px' }}>
          Check if games are available on GeForce NOW
        </p>
        {dbInfo?.last_updated && (
          <p style={{ margin: 0, marginTop: '4px', opacity: 0.5, fontSize: '12px' }}>
            DB last updated: {dbInfo.last_updated}
          </p>
        )}
      </div>

      {/* Library Overview */}
      {libraryStats && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: 'rgba(118, 185, 0, 0.08)',
          borderRadius: '8px',
          border: '1px solid rgba(118, 185, 0, 0.25)',
        }}>
          <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>
            Your Library
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#76b900', lineHeight: 1 }}>
              {libraryStats.available}
            </span>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>
              of {libraryStats.total} installed games on GeForce NOW
            </span>
          </div>
          {libraryStats.total > 0 && (
            <div style={{
              marginTop: '8px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(libraryStats.available / libraryStats.total) * 100}%`,
                backgroundColor: '#76b900',
                borderRadius: '2px',
                transition: 'width 0.4s ease',
              }} />
            </div>
          )}
        </div>
      )}

      {/* Quick Game Lookup */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
          Quick Lookup
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            placeholder="Steam App ID"
            value={lookupAppId}
            onChange={(e) => {
              setLookupAppId(e.target.value);
              setLookupResult(null);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
            style={{
              flex: 1,
              padding: '8px 10px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px',
            }}
          />
          <button
            onClick={handleLookup}
            disabled={lookupLoading || !lookupAppId.trim()}
            style={{
              padding: '8px 14px',
              backgroundColor: '#76b900',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: lookupLoading || !lookupAppId.trim() ? 'default' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: lookupLoading || !lookupAppId.trim() ? 0.5 : 1,
            }}
          >
            {lookupLoading ? '...' : 'Check'}
          </button>
        </div>

        {lookupResult && (
          <div style={{
            marginTop: '10px',
            padding: '10px 12px',
            borderRadius: '4px',
            backgroundColor: lookupResult.available
              ? 'rgba(118, 185, 0, 0.15)'
              : 'rgba(128, 128, 128, 0.15)',
            border: lookupResult.available
              ? '1px solid rgba(118, 185, 0, 0.4)'
              : '1px solid rgba(128, 128, 128, 0.3)',
            fontSize: '14px',
            fontWeight: 'bold',
            color: lookupResult.available ? '#76b900' : '#aaa',
          }}>
            {lookupResult.available
              ? `✓ App ${lookupResult.appid} is on GeForce NOW`
              : `✗ App ${lookupResult.appid} is not on GeForce NOW`}
          </div>
        )}
      </div>

      {/* Refresh progress / result */}
      {refreshing && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: 'rgba(118, 185, 0, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(118, 185, 0, 0.3)',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Refreshing database from Steam curators...
          </div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
            This may take 30-60 seconds
          </div>
        </div>
      )}

      {refreshResult && !refreshing && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: refreshResult.status === 'success'
            ? 'rgba(118, 185, 0, 0.1)'
            : 'rgba(255, 0, 0, 0.1)',
          borderRadius: '8px',
          border: refreshResult.status === 'success'
            ? '1px solid rgba(118, 185, 0, 0.3)'
            : '1px solid rgba(255, 0, 0, 0.3)',
        }}>
          {refreshResult.status === 'success' ? (
            <>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#76b900' }}>
                ✓ Database Refreshed Successfully!
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                <div>Previous count: {refreshResult.old_count} games</div>
                <div>New count: {refreshResult.new_count} games</div>
                <div style={{ color: '#76b900', fontWeight: 'bold' }}>
                  {refreshResult.added && refreshResult.added > 0
                    ? `+${refreshResult.added} new games added!`
                    : refreshResult.added === 0
                    ? 'Database is up to date'
                    : `${Math.abs(refreshResult.added || 0)} games removed`}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff0000' }}>
                ✗ Refresh Failed
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
                {refreshResult.message || 'Unknown error'}
              </div>
            </>
          )}
        </div>
      )}

      {/* Cache stats */}
      {cacheStats && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
        }}>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Cache Statistics</div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>
            Total: {cacheStats.total} | Fresh: {cacheStats.fresh} | Expired: {cacheStats.expired}
          </div>
        </div>
      )}

      {/* Debug Section — hidden by default */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowDebug((v) => !v)}
          style={{
            padding: '6px 12px',
            backgroundColor: 'transparent',
            color: 'rgba(255, 165, 0, 0.8)',
            border: '1px solid rgba(255, 165, 0, 0.4)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            width: '100%',
          }}
        >
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>

        {showDebug && (
          <div style={{
            marginTop: '8px',
            padding: '16px',
            backgroundColor: 'rgba(255, 165, 0, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 165, 0, 0.3)',
          }}>
            <h3 style={{ margin: 0, marginBottom: '12px', fontSize: '16px' }}>Debug Info</h3>
            <button
              onClick={handleLoadDbInfo}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff9900',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                width: '100%',
              }}
            >
              Reload Database Info
            </button>

            {dbInfo && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}>
                <div><strong>DB Size:</strong> {dbInfo.db_size} games</div>
                <div><strong>Last Updated:</strong> {dbInfo.last_updated || 'Unknown'}</div>
                <div><strong>Plugin Dir:</strong> {dbInfo.plugin_dir || 'Not set'}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <SettingsPanel
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onClearCache={handleClearCache}
        onRefreshDatabase={handleRefreshDatabase}
      />
    </div>
  );
};

export default function (serverApi: ServerAPI) {
  // Load settings on plugin initialization
  const initPlugin = async () => {
    try {
      const result = await serverApi.callPluginMethod<{}, GFNSettings>('get_settings', {});
      if (result.success && result.result) {
        settingsManager.updateSettings(result.result);
      }
    } catch (error) {
      console.error('Error loading GFN settings:', error);
    }
  };

  initPlugin();

  // Register game page patch
  const unpatch = patchGamePage(serverApi, settingsManager);

  return {
    title: <div className={staticClasses.Title}>GFN for Deck</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaCloud />,
    onDismount() {
      unpatch();
    },
  };
}
