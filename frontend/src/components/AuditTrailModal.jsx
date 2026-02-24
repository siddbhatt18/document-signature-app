import { useEffect, useState } from 'react';
import api from '../utils/axiosConfig'; // FIX: Use centralized API

const AuditTrailModal = ({ docData, token, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        const response = await api.get(`/audit/${docData._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(response.data);
      } catch (error) {
        console.error('Error fetching audit logs', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditTrail();
  }, [token, docData]);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Document Activity</h3>
            <p className="text-sm text-gray-500 truncate mt-1">File: {docData.title}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading activity history...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No activity recorded yet.</div>
          ) : (
            <div className="space-y-6">
              {logs.map((log, index) => (
                <div key={log._id} className="relative flex gap-4">
                  {/* Timeline Line */}
                  {index !== logs.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-gray-200"></div>
                  )}
                  
                  {/* Timeline Dot */}
                  <div className="relative mt-1">
                    <div className={`w-6 h-6 rounded-full border-4 border-white flex items-center justify-center ${
                      log.action === 'Document Finalized' ? 'bg-green-500' :
                      log.action === 'Signature Placed' ? 'bg-blue-500' :
                      log.action === 'Document Shared' ? 'bg-purple-500' : 'bg-gray-400'
                    }`}></div>
                  </div>

                  {/* Log Details */}
                  <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-800">{log.action}</span>
                      <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded shadow-sm">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <p><span className="font-medium">User ID:</span> {log.performedBy}</p>
                      <p><span className="font-medium">IP Address:</span> {log.ipAddress}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuditTrailModal;