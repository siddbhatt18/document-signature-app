import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/axiosConfig'; // FIX: Use centralized API
import DocumentViewer from './DocumentViewer';

const PublicSign = () => {
  const { token } = useParams();
  const [docData, setDocData] = useState(null);
  const [signerEmail, setSignerEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicDocument = async () => {
      try {
        const response = await api.get(`/docs/public/${token}`);
        setDocData(response.data.document);
        setSignerEmail(response.data.signerEmail);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired link.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicDocument();
  }, [token]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading secure document...</div>;
  
  if (error) return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-md text-center">
      <div className="text-red-500 text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
      <p className="text-gray-600">{error}</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Signature Request</h2>
        <p className="text-gray-600 mt-2">
          You have been requested to sign <span className="font-semibold text-gray-800">{docData.title}</span>.
        </p>
        <p className="text-sm text-gray-500 mt-1">Signing as: {signerEmail}</p>
      </div>

      <div className="relative h-[700px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        <DocumentViewer 
          docData={docData} 
          token={token}
          onClose={() => alert('You can close this tab now.')} 
        />
      </div>
    </div>
  );
};

export default PublicSign;