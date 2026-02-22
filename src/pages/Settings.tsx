import React, { useMemo, useState } from 'react';
import { Bell, Shield, Globe, RefreshCw, Save, ToggleLeft, ToggleRight } from 'lucide-react';

const defaultNotifications = {
  bookingAlerts: true,
  disputeEscalations: true,
  instructorReminders: false,
  weeklyDigest: true
};

const defaultPolicies = {
  autoApproveInstructors: false,
  requireTimesheets: true,
  allowStudentMessaging: true
};

const defaultRegional = {
  timezone: 'America/Denver',
  currency: 'USD',
  units: 'imperial'
};

export function SettingsPage() {
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [policies, setPolicies] = useState(defaultPolicies);
  const [regional, setRegional] = useState(defaultRegional);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const summary = useMemo(() => {
    const enabledNotifs = Object.values(notifications).filter(Boolean).length;
    return {
      notificationCoverage: `${enabledNotifs}/${Object.keys(notifications).length} active`,
      policyStatus: policies.requireTimesheets ? 'Compliance mode' : 'Flexible mode'
    };
  }, [notifications, policies]);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePolicy = (key: keyof typeof policies) => {
    setPolicies((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // In the reference implementation we just simulate persistence. Hook up to Firebase later.
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
    setLastSavedAt(new Date());
  };

  const handleReset = () => {
    setNotifications(defaultNotifications);
    setPolicies(defaultPolicies);
    setRegional(defaultRegional);
    setLastSavedAt(null);
  };

  const renderToggle = (enabled: boolean) =>
    enabled ? (
      <ToggleRight className="w-10 h-10 text-blue-600" />
    ) : (
      <ToggleLeft className="w-10 h-10 text-gray-400" />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
            Admin Controls
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Platform Settings</h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Everything the sidebar promises: notification rules, policy toggles, and resort-level
            preferences—kept in one layout so navigation feels coherent across roles.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Notification coverage</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{summary.notificationCoverage}</p>
          <p className="text-sm text-gray-500 mt-2">
            Keep booking alerts on so operations stays in lockstep with sales.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Policy status</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{summary.policyStatus}</p>
          <p className="text-sm text-gray-500 mt-2">
            Toggle rules to match how strictly you want to run payroll and messaging.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Last saved</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {lastSavedAt ? lastSavedAt.toLocaleTimeString() : 'Not yet'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Changes persist instantly once you wire this up.</p>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">Alert the right person at the right time.</p>
            </div>
          </div>
          {Object.entries(notifications).map(([key, value]) => (
            <button
              key={key}
              onClick={() => toggleNotification(key as keyof typeof notifications)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-200 transition"
            >
              <div className="text-left">
                <p className="font-medium text-gray-900">
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (char) => char.toUpperCase())}
                </p>
                <p className="text-sm text-gray-500">
                  {value ? 'Enabled' : 'Disabled'} · tap to toggle
                </p>
              </div>
              {renderToggle(value)}
            </button>
          ))}
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Policies</h2>
              <p className="text-sm text-gray-500">Controls that keep operations tight.</p>
            </div>
          </div>
          {Object.entries(policies).map(([key, value]) => (
            <button
              key={key}
              onClick={() => togglePolicy(key as keyof typeof policies)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-200 transition"
            >
              <div className="text-left">
                <p className="font-medium text-gray-900">
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (char) => char.toUpperCase())}
                </p>
                <p className="text-sm text-gray-500">
                  {value ? 'Required' : 'Optional'} · tap to toggle
                </p>
              </div>
              {renderToggle(value)}
            </button>
          ))}
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Regional</h2>
              <p className="text-sm text-gray-500">Define timezone and currency defaults.</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <p className="text-sm text-gray-500 mb-1">Timezone</p>
              <select
                value={regional.timezone}
                onChange={(event) =>
                  setRegional((prev) => ({ ...prev, timezone: event.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="America/Denver">America/Denver (Mountain)</option>
                <option value="America/Los_Angeles">America/Los Angeles (Pacific)</option>
                <option value="America/New_York">America/New York (Eastern)</option>
              </select>
            </label>

            <label className="block">
              <p className="text-sm text-gray-500 mb-1">Currency</p>
              <select
                value={regional.currency}
                onChange={(event) =>
                  setRegional((prev) => ({ ...prev, currency: event.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD · US Dollar</option>
                <option value="CAD">CAD · Canadian Dollar</option>
                <option value="EUR">EUR · Euro</option>
              </select>
            </label>

            <label className="block">
              <p className="text-sm text-gray-500 mb-1">Units</p>
              <select
                value={regional.units}
                onChange={(event) =>
                  setRegional((prev) => ({ ...prev, units: event.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="imperial">Imperial (ft, mi)</option>
                <option value="metric">Metric (m, km)</option>
              </select>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;






