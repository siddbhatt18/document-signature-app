import { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import api from '../utils/axiosConfig'; // FIX: Use centralized API
import toast from 'react-hot-toast'; // FIX: Use Toast notifications

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const DocumentViewer = ({ docData, token, onClose, onRefresh }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [signaturePos, setSignaturePos] = useState({ x: 150, y: 150 });
  const pageRef = useRef(null);

  // FIX: Dynamically generate the static file URL based on environment variables
  const backendBaseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000';
    
  const fileUrl = `${backendBaseUrl}/uploads/${docData.fileName}`;

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleDragEnd = (e) => {
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      setSignaturePos({ x, y });
    }
  };

  const handleSaveSignature = async () => {
    try {
      await api.post('/signatures', {
        documentId: docData._id,
        x: Math.round(signaturePos.x),
        y: Math.round(signaturePos.y),
        page: pageNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Signature position saved successfully!');
    } catch (error) {
      console.error('Error saving signature', error);
      toast.error('Failed to save signature position');
    }
  };

  const handleFinalize = async () => {
    try {
      await api.post('/signatures/finalize', {
        documentId: docData._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Document finalized and signed successfully!');
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      console.error('Error finalizing document', error);
      toast.error(error.response?.data?.message || 'Failed to finalize document');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="bg-white px-4 py-3 flex justify-between items-center border-b">
          <div className="text-gray-700 font-medium">
            Page {pageNumber} of {numPages || '--'}
          </div>
          <div className="space-x-2 flex items-center">
            <button 
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(pageNumber - 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 transition-opacity"
            >
              Prev
            </button>
            <button 
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber(pageNumber + 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 transition-opacity"
            >
              Next
            </button>
            
            {/* Show actions only if document is pending */}
            {docData.status === 'Pending' && (
              <>
                <button 
                  onClick={handleSaveSignature}
                  className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium ml-4 transition-colors"
                >
                  Save Signature
                </button>
                <button 
                  onClick={handleFinalize}
                  className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 font-medium transition-colors"
                >
                  Finalize Document
                </button>
              </>
            )}
            
            <button 
              onClick={onClose}
              className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 font-medium ml-2 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* PDF Document Viewer */}
        <div className="flex-1 overflow-auto flex justify-center p-4">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="text-gray-500 mt-10">Loading PDF...</div>}
          >
            <div ref={pageRef} className="relative shadow-lg inline-block">
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={false} 
                renderAnnotationLayer={false}
                width={600} 
              />
              
              {docData.status === 'Pending' && (
                <div
                  draggable
                  onDragEnd={handleDragEnd}
                  className="absolute bg-blue-100 border-2 border-dashed border-blue-600 text-blue-800 font-semibold px-6 py-2 cursor-move opacity-90 flex items-center justify-center shadow-md hover:bg-blue-200 transition-colors"
                  style={{
                    left: `${signaturePos.x}px`,
                    top: `${signaturePos.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  Drag Signature Here
                </div>
              )}
            </div>
          </Document>
        </div>
        
      </div>
    </div>
  );
};

export default DocumentViewer;