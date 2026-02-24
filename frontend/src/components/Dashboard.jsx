import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import DocumentViewer from './DocumentViewer';
import AuditTrailModal from './AuditTrailModal';

const Dashboard = ({ token }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewingDoc, setViewingDoc] = useState(null); 
  const [auditingDoc, setAuditingDoc] = useState(null); 
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get('/docs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchDocuments();
  }, [token, fetchDocuments]);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return toast.error('Only PDF files are allowed.');

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace('.pdf', ''));

    try {
      await api.post('/docs/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Document uploaded successfully!');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const handleShare = async (docId) => {
    const email = window.prompt("Enter the email address of the signer:");
    if (!email) return;

    try {
      const response = await api.post(`/docs/${docId}/share`, { email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Shareable link generated! Check backend terminal.`);
      fetchDocuments(); 
    } catch (error) {
      console.error('Error sharing document', error);
      toast.error('Failed to share document');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading documents...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Documents</h2>
        <div>
          <input 
            type="file" 
            accept="application/pdf" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleUpload}
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : '+ Upload Document'}
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg shadow-sm border border-gray-100">No documents uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div key={doc._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-800 truncate" title={doc.title}>{doc.title}</h3>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  doc.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {doc.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-6 truncate">File: {doc.fileName}</p>
              
              <div className="mt-auto space-y-2">
                <button 
                  onClick={() => setViewingDoc(doc)}
                  className="w-full bg-blue-50 text-blue-600 font-medium py-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  View PDF
                </button>
                
                <button 
                  onClick={() => setAuditingDoc(doc)}
                  className="w-full bg-gray-50 text-gray-600 font-medium py-2 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors flex justify-center items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Activity Log
                </button>
                
                {doc.status === 'Pending' && (
                  <button 
                    onClick={() => handleShare(doc._id)}
                    className="w-full bg-white border border-dashed border-gray-300 text-gray-600 font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Share for Signature
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingDoc && (
        <DocumentViewer 
          docData={viewingDoc} 
          token={token}
          onClose={() => setViewingDoc(null)} 
          onRefresh={fetchDocuments}
        />
      )}

      {auditingDoc && (
        <AuditTrailModal
          docData={auditingDoc}
          token={token}
          onClose={() => setAuditingDoc(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;