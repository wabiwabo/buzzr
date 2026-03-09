import React from 'react';
import { Bell, MapPin, Check, ChevronDown } from 'lucide-react';
import { useLiveOpsStore } from '../store';

const severityStyles = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-700' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700' },
};

export const AlertFeed: React.FC = () => {
  const { alerts, acknowledgeAlert, selectVehicle, selectTps, isAlertPanelOpen, toggleAlertPanel } = useLiveOpsStore();

  const unacknowledged = alerts.filter((a) => !a.acknowledged);

  if (!isAlertPanelOpen) {
    return (
      <button
        onClick={toggleAlertPanel}
        className="absolute bottom-2 right-2 z-40 bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 hover:bg-gray-50"
      >
        <Bell className="h-4 w-4" />
        {unacknowledged.length > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {unacknowledged.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="absolute bottom-2 right-2 z-40 w-80 max-h-[50vh] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold">Peringatan</span>
          {unacknowledged.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unacknowledged.length}
            </span>
          )}
        </div>
        <button onClick={toggleAlertPanel} className="p-1 hover:bg-gray-100 rounded">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400">
            Tidak ada peringatan
          </div>
        ) : (
          alerts
            .filter((a) => !a.acknowledged)
            .map((alert) => {
              const style = severityStyles[alert.severity];
              return (
                <div
                  key={alert.id}
                  className={`px-3 py-2.5 border-b ${style.bg} ${style.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${style.text}`}>{alert.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {alert.latitude != null && (
                        <button
                          onClick={() => {
                            if (alert.sourceType === 'vehicle') selectVehicle(alert.sourceId);
                            else if (alert.sourceType === 'tps') selectTps(alert.sourceId);
                          }}
                          className="p-1 hover:bg-white/50 rounded"
                          title="Fokus di peta"
                        >
                          <MapPin className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="p-1 hover:bg-white/50 rounded"
                        title="Tandai sudah dibaca"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
