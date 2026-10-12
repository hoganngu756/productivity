import { useEffect, useId, useState, type ReactNode } from 'react';
import { PHASE_LABELS, PHASES } from '../logic/phases';
import { DURATION_LIMITS, INTERVAL_LIMITS, type TimerSettings } from '../logic/settings';
import { notificationPermission, requestNotificationPermission, type PermissionState } from '../services/notify';
import { TabPreview } from './TabPreview';

interface Props {
  settings: TimerSettings;
  title: string;
  onChange: (patch: Partial<TimerSettings>) => void;
}

export function SettingsPanel({ settings, title, onChange }: Props) {
  const [permission, setPermission] = useState<PermissionState>(notificationPermission);

  const setNotifications = async (on: boolean) => {
    if (!on) return onChange({ notifications: false });
    const result = await requestNotificationPermission();
    setPermission(result);
    onChange({ notifications: result === 'granted' });
  };

  return (
    <section className="settings" aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="settings__heading">
        Settings
      </h2>

      <fieldset className="settings__group">
        <legend>Browser tab</legend>
        <Toggle
          checked={settings.hideCountdownInTab}
          onChange={(v) => onChange({ hideCountdownInTab: v })}
          label="Hide the countdown in the tab"
          hint="The tab shows only the phase name, so a glance at your tabs never shows how long is left."
        />
        <TabPreview title={title} />
      </fieldset>

      <fieldset className="settings__group">
        <legend>Durations (minutes)</legend>
        <div className="settings__grid">
          {PHASES.map((phase) => (
            <NumberField
              key={phase}
              label={PHASE_LABELS[phase]}
              value={settings.durations[phase]}
              {...DURATION_LIMITS}
              onCommit={(v) => onChange({ durations: { ...settings.durations, [phase]: v } })}
            />
          ))}
          <NumberField
            label="Long break every"
            suffix="focus sessions"
            value={settings.longBreakInterval}
            {...INTERVAL_LIMITS}
            onCommit={(v) => onChange({ longBreakInterval: v })}
          />
        </div>
      </fieldset>

      <fieldset className="settings__group">
        <legend>When a session ends</legend>
        <Toggle checked={settings.chime} onChange={(v) => onChange({ chime: v })} label="Play a chime" />
        <Toggle
          checked={settings.notifications}
          onChange={(v) => void setNotifications(v)}
          label="Show a desktop notification"
          hint={
            permission === 'denied'
              ? 'Notifications are blocked for this site. Allow them in your browser settings.'
              : permission === 'unsupported'
                ? 'This browser does not support notifications.'
                : undefined
          }
          disabled={permission === 'unsupported'}
        />
        <Toggle
          checked={settings.autoStartNext}
          onChange={(v) => onChange({ autoStartNext: v })}
          label="Auto-start the next session"
        />
      </fieldset>
    </section>
  );
}

function Toggle(props: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="toggle">
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="toggle__input"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.checked)}
        aria-describedby={props.hint ? `${id}-hint` : undefined}
      />
      <label htmlFor={id} className="toggle__label">
        {props.label}
      </label>
      {props.hint && (
        <p id={`${id}-hint`} className="toggle__hint">
          {props.hint}
        </p>
      )}
    </div>
  );
}

/** Keeps a local draft so the field can be empty mid-edit; commits only valid integers in range. */
function NumberField(props: {
  label: string;
  suffix?: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(props.value));
  useEffect(() => setDraft(String(props.value)), [props.value]);

  const parse = (text: string) => {
    const n = Number(text);
    return text.trim() !== '' && Number.isInteger(n) && n >= props.min && n <= props.max ? n : null;
  };

  return (
    <div className="number-field">
      <label htmlFor={id}>{props.label}</label>
      <div className="number-field__row">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={props.min}
          max={props.max}
          step={1}
          value={draft}
          aria-invalid={parse(draft) == null}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = parse(e.target.value);
            if (n != null && n !== props.value) props.onCommit(n);
          }}
          onBlur={() => setDraft(String(props.value))}
        />
        {props.suffix && <span className="number-field__suffix">{props.suffix}</span>}
      </div>
    </div>
  );
}
