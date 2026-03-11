import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !email) {
      setStatus({ type: 'error', message: 'Please provide both a file and an email address.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email_address', email);

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Get the API URL from environment variable, fallback to localhost for development
      const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const apiUrl = rawApiUrl.startsWith('http') ? rawApiUrl : `https://${rawApiUrl}`;
      const response = await axios.post(`${apiUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        setStatus({ type: 'success', message: 'Summary successfully generated and emailed!' });
        setFile(null);
        setEmail('');
        // Optional: clear file input DOM element
        document.getElementById('file-upload').value = '';
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'An error occurred during upload.';
      setStatus({ type: 'error', message: `Upload failed: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
          Upload Sales Data
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors">
          <div className="space-y-1 text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600 justify-center">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".csv, .xlsx"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">
              CSV or XLSX up to 5MB
            </p>
            {file && <p className="text-sm font-semibold text-indigo-600 mt-2">{file.name}</p>}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Recipient Email
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={handleEmailChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="executive@example.com"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Processing...
            </>
          ) : (
            'Generate Summary'
          )}
        </button>
      </div>

      {status.message && (
        <div className={`rounded-md p-4 mt-4 ${status.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {status.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {status.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default UploadForm;
