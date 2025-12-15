import { afterPatch, ServerAPI, wrapReactType } from 'decky-frontend-lib';
import React, { ReactElement, useEffect, useState } from 'react';
import { GFNLogo } from '../components/GFNLogo';
import { GFNSettings, GFNAvailability } from '../types';

interface SettingsManager {
  getSettings(): GFNSettings;
  updateSettings(settings: GFNSettings): void;
}

// GFN Indicator Component
function GFNIndicator({
  id,
  appid,
  serverAPI,
  settingsManager,
}: {
  id?: string;
  appid: string;
  serverAPI: ServerAPI;
  settingsManager: SettingsManager;
}) {
  const [gfnStatus, setGfnStatus] = useState<GFNAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const settings = settingsManager.getSettings();

  useEffect(() => {
    if (!appid || !settings.enabled) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const checkAvailability = async () => {
      try {
        setLoading(true);
        const result = await serverAPI.callPluginMethod<
          { appid: string },
          GFNAvailability
        >('check_gfn_availability', { appid });

        if (mounted && result.success) {
          setGfnStatus(result.result);
        }
      } catch (error) {
        console.error('GFN: Error checking availability:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAvailability();

    return () => {
      mounted = false;
    };
  }, [appid, settings.enabled]);

  if (loading || gfnStatus === null || !settings.enabled) {
    return null;
  }

  return <GFNLogo available={gfnStatus.available} settings={settings} />;
}

export function patchGamePage(
  serverAPI: ServerAPI,
  settingsManager: SettingsManager
): () => void {
  if (!serverAPI.routerHook) {
    console.error('GFN: routerHook not available');
    return () => {};
  }

  try {
    const patch = serverAPI.routerHook.addPatch(
      '/library/app/:appid',
      (props: { path: string; children: ReactElement }) => {
        afterPatch(
          props.children.props,
          'renderFunc',
          (_: Record<string, unknown>[], ret1: ReactElement) => {
            // Extract app ID from the route
            const appid = ret1.props.children.props.overview.appid;

            // Wrap the component before patching
            wrapReactType(ret1.props.children);

            afterPatch(
              ret1.props.children.type,
              'type',
              (_1: Record<string, unknown>[], ret2: ReactElement) => {
                // Navigate to the correct component array - note the [1] index
                const componentToSplice =
                  ret2.props.children?.[1]?.props.children.props.children;

                if (!Array.isArray(componentToSplice)) {
                  console.log('GFN: Could not find injection point');
                  return ret2;
                }

                // Check if we already inserted our component
                const gfnComponentIndex = componentToSplice.findIndex(
                  (child: any) => child?.props?.id === 'gfn-for-deck-indicator'
                );

                // Find where to splice - before the main game content
                const spliceIndex = componentToSplice.findIndex(
                  (child: any) => {
                    return (
                      child?.props?.childFocusDisabled !== undefined &&
                      child?.props?.navRef !== undefined &&
                      child?.props?.children?.props?.details !== undefined &&
                      child?.props?.children?.props?.overview !== undefined &&
                      child?.props?.children?.props?.bFastRender !== undefined
                    );
                  }
                );

                const gfnComponent = (
                  <GFNIndicator
                    id="gfn-for-deck-indicator"
                    appid={String(appid)}
                    serverAPI={serverAPI}
                    settingsManager={settingsManager}
                  />
                );

                if (gfnComponentIndex < 0) {
                  // Component doesn't exist yet, insert it
                  if (spliceIndex > -1) {
                    componentToSplice.splice(spliceIndex, 0, gfnComponent);
                  } else {
                    console.error('GFN: Could not find where to splice');
                  }
                } else {
                  // Component exists, replace it
                  componentToSplice.splice(gfnComponentIndex, 1, gfnComponent);
                }

                return ret2;
              }
            );

            return ret1;
          }
        );

        return props;
      }
    );

    console.log('GFN: Game page patch registered');

    return () => {
      try {
        serverAPI.routerHook.removePatch('/library/app/:appid', patch);
        console.log('GFN: Game page patch removed');
      } catch (error) {
        console.error('GFN: Error removing patch:', error);
      }
    };
  } catch (error) {
    console.error('GFN: Error registering patch:', error);
    return () => {};
  }
}
