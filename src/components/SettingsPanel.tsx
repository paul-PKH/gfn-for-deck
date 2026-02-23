import React, { VFC } from 'react';
import {
  PanelSection,
  PanelSectionRow,
  ToggleField,
  SliderField,
  DropdownItem,
  ButtonItem,
} from 'decky-frontend-lib';
import { GFNSettings } from '../types';

interface SettingsPanelProps {
  settings: GFNSettings;
  onSettingsChange: (settings: GFNSettings) => void;
  onClearCache: () => Promise<void>;
  onRefreshDatabase: () => Promise<void>;
}

export const SettingsPanel: VFC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onClearCache,
  onRefreshDatabase,
}) => {
  const updateSetting = <K extends keyof GFNSettings>(
    key: K,
    value: GFNSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const positionOptions = [
    { data: 0, label: 'Top Left' },
    { data: 1, label: 'Top Right' },
    { data: 2, label: 'Top Center' },
    { data: 3, label: 'Bottom Left' },
    { data: 4, label: 'Bottom Right' },
    { data: 5, label: 'Bottom Center' },
    { data: 6, label: 'Center Left' },
    { data: 7, label: 'Center Right' },
    { data: 8, label: 'Custom (X/Y)' },
  ];

  const positionValues = [
    'top-left',
    'top-right',
    'top-center',
    'bottom-left',
    'bottom-right',
    'bottom-center',
    'center-left',
    'center-right',
    'custom',
  ];

  return (
    <>
      <PanelSection title="Display Settings">
        <PanelSectionRow>
          <ToggleField
            label="Enable GFN Indicator"
            description="Show GeForce NOW availability on game pages"
            checked={settings.enabled}
            onChange={(value) => updateSetting('enabled', value)}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <ToggleField
            label="Hide Unavailable Games"
            description="Only show the badge when a game is on GeForce NOW"
            checked={settings.hideUnavailable}
            onChange={(value) => updateSetting('hideUnavailable', value)}
            disabled={!settings.enabled}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <SliderField
            label="Logo Size"
            description={`Current size: ${settings.logoSize}px`}
            value={settings.logoSize}
            min={32}
            max={128}
            step={8}
            onChange={(value) => updateSetting('logoSize', value)}
            disabled={!settings.enabled}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <SliderField
            label="Glow Intensity"
            description={`Current intensity: ${settings.glowIntensity}%`}
            value={settings.glowIntensity}
            min={0}
            max={100}
            step={10}
            onChange={(value) => updateSetting('glowIntensity', value)}
            disabled={!settings.enabled}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <DropdownItem
            label="Position"
            description="Logo position on game page"
            rgOptions={positionOptions}
            selectedOption={positionValues.indexOf(settings.position)}
            onChange={(selected) =>
              updateSetting('position', positionValues[selected.data] as any)
            }
            disabled={!settings.enabled}
          />
        </PanelSectionRow>

        {settings.position === 'custom' && (
          <>
            <PanelSectionRow>
              <SliderField
                label="Custom X Position"
                description={`Horizontal position: ${settings.customX || 16}px from left`}
                value={settings.customX || 16}
                min={0}
                max={1920}
                step={16}
                onChange={(value) => updateSetting('customX', value)}
                disabled={!settings.enabled}
              />
            </PanelSectionRow>

            <PanelSectionRow>
              <SliderField
                label="Custom Y Position"
                description={`Vertical position: ${settings.customY || 16}px from top`}
                value={settings.customY || 16}
                min={0}
                max={1080}
                step={16}
                onChange={(value) => updateSetting('customY', value)}
                disabled={!settings.enabled}
              />
            </PanelSectionRow>
          </>
        )}
      </PanelSection>

      <PanelSection title="Database">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={onRefreshDatabase}
          >
            Refresh Database
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '-8px' }}>
            Fetch latest games from Steam curator pages
          </div>
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Cache">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={onClearCache}
          >
            Clear Cache
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </>
  );
};
