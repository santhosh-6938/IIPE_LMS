import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getConcurrentLoginRequests, 
  handleConcurrentLoginResponse,
  clearConcurrentLoginError 
} from '../../store/slices/authSlice';
import { Shield, AlertTriangle, Check, X, Clock, MapPin, Monitor } from 'lucide-react';

const ConcurrentLoginManager = ({ isVisible = true }) => {
  const dispatch = useDispatch();
  const { concurrentLogin } = useSelector(state => state.auth);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (isVisible) {
      dispatch(getConcurrentLoginRequests());
      // Poll for new requests every 10 seconds
      const interval = setInterval(() => {
        dispatch(getConcurrentLoginRequests());
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [dispatch, isVisible]);

  const handleResponse = async (requestId, response) => {
    dispatch(clearConcurrentLoginError());
    const result = await dispatch(handleConcurrentLoginResponse({ requestId, response }));
    
    if (result.type.endsWith('/fulfilled')) {
      setSelectedRequest(null);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getTimeRemaining = (expiresAt) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMins}:${diffSecs.toString().padStart(2, '0')}`;
  };

  if (!isVisible || concurrentLogin.requests.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Security Alert</h3>
              <p className="text-sm text-gray-600">Concurrent login attempts detected</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {concurrentLogin.requests.map((request) => (
              <div
                key={request.requestId}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedRequest?.requestId === request.requestId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        Login attempt from new device
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-2" />
                        <span>{request.ipAddress}</span>
                      </div>
                      <div className="flex items-center">
                        <Monitor className="w-3 h-3 mr-2" />
                        <span className="truncate">{request.userAgent}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-2" />
                        <span>{formatTime(request.requestedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Expires in</div>
                    <div className="text-sm font-mono text-orange-600">
                      {getTimeRemaining(request.expiresAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedRequest && (
            <div className="border-t pt-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Device Details</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <div>
                    <span className="font-medium">IP Address:</span> {selectedRequest.ipAddress}
                  </div>
                  <div>
                    <span className="font-medium">Device:</span> {selectedRequest.userAgent}
                  </div>
                  <div>
                    <span className="font-medium">Requested:</span> {formatTime(selectedRequest.requestedAt)}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleResponse(selectedRequest.requestId, 'approve')}
                  disabled={concurrentLogin.isLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {concurrentLogin.isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleResponse(selectedRequest.requestId, 'deny')}
                  disabled={concurrentLogin.isLoading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {concurrentLogin.isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Deny
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {concurrentLogin.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{concurrentLogin.error}</p>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>If you don't recognize this device, please deny the request and consider changing your password.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcurrentLoginManager;
