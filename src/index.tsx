import { ServerAPI, staticClasses } from 'decky-frontend-lib';
import React, { VFC, useState, useEffect } from 'react';
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

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [settings, setSettings] = useState<GFNSettings>(settingsManager.getSettings());
  const [cacheStats, setCacheStats] = useState<{
    total: number;
    expired: number;
    fresh: number;
  } | null>(null);
  const [currentGame, setCurrentGame] = useState<{ appid: string; name: string; available: boolean } | null>(null);
  const [checking, setChecking] = useState(false);
  const [dbInfo, setDbInfo] = useState<{ db_size: number; plugin_dir: string | null } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ status: string; old_count?: number; new_count?: number; added?: number; message?: string } | null>(null);

  // Load settings from backend
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

    loadSettings();
    loadCacheStats();
  }, []);

  const handleSettingsChange = async (newSettings: GFNSettings) => {
    setSettings(newSettings);
    settingsManager.updateSettings(newSettings);
    try {
      await serverAPI.callPluginMethod('save_settings', {
        settings: newSettings,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      await serverAPI.callPluginMethod('clear_cache', {});
      setCacheStats({ total: 0, expired: 0, fresh: 0 });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const handleCheckCurrentGame = async () => {
    setChecking(true);
    setCurrentGame(null);

    try {
      // Get current app ID from URL
      const pathname = window.location.pathname;
      const match = pathname.match(/\/library\/app\/(\d+)/);

      if (!match) {
        setCurrentGame({ appid: '', name: 'Not on a game page', available: false });
        setChecking(false);
        return;
      }

      const appid = match[1];

      const result = await serverAPI.callPluginMethod('check_gfn_availability', { appid });

      if (result.success) {
        setCurrentGame({
          appid,
          name: `App ID: ${appid}`,
          available: result.result.available
        });
      }
    } catch (error) {
      console.error('Error checking game:', error);
      setCurrentGame({ appid: '', name: 'Error checking game', available: false });
    } finally {
      setChecking(false);
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
        // Reload cache stats after refresh
        const statsResult = await serverAPI.callPluginMethod('get_cache_stats', {});
        if (statsResult.success) {
          setCacheStats(statsResult.result);
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, marginBottom: '8px' }}>GeForce NOW for Deck</h2>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '14px' }}>
          Check if games are available on GeForce NOW
        </p>
      </div>

      {/* Test Section */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: 'rgba(118, 185, 0, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(118, 185, 0, 0.3)'
      }}>
        <h3 style={{ margin: 0, marginBottom: '12px', fontSize: '16px' }}>Test Plugin</h3>
        <button
          onClick={handleCheckCurrentGame}
          disabled={checking}
          style={{
            padding: '10px 20px',
            backgroundColor: '#76b900',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: checking ? 'wait' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          {checking ? 'Checking...' : 'Check Current Game'}
        </button>

        {currentGame && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: currentGame.available ? 'rgba(118, 185, 0, 0.2)' : 'rgba(128, 128, 128, 0.2)',
            borderRadius: '4px',
            border: currentGame.available ? '2px solid #76b900' : '2px solid #808080'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              {currentGame.name}
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: currentGame.available ? '#76b900' : '#808080'
            }}>
              {currentGame.available ? '✓ Available on GeForce NOW' : '✗ Not Available on GeForce NOW'}
            </div>
          </div>
        )}
      </div>

      {refreshing && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'rgba(118, 185, 0, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(118, 185, 0, 0.3)',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Refreshing database from Steam curators...
          </div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
            This may take 30-60 seconds
          </div>
        </div>
      )}

      {refreshResult && !refreshing && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: refreshResult.status === 'success'
              ? 'rgba(118, 185, 0, 0.1)'
              : 'rgba(255, 0, 0, 0.1)',
            borderRadius: '8px',
            border: refreshResult.status === 'success'
              ? '1px solid rgba(118, 185, 0, 0.3)'
              : '1px solid rgba(255, 0, 0, 0.3)',
          }}
        >
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

      {cacheStats && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Cache Statistics</div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>
            Total: {cacheStats.total} | Fresh: {cacheStats.fresh} | Expired:{' '}
            {cacheStats.expired}
          </div>
        </div>
      )}

      {/* Debug Section */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 165, 0, 0.3)'
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
            width: '100%'
          }}
        >
          Load Database Info
        </button>

        {dbInfo && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            <div><strong>DB Size:</strong> {dbInfo.db_size} games</div>
            <div><strong>Plugin Dir:</strong> {dbInfo.plugin_dir || 'Not set'}</div>
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
      // Remove game page patch
      unpatch();
    },
  };
}
