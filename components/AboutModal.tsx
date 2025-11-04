'use client';

import { useState, useEffect } from 'react';
import { Info, Server } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface ServiceVersion {
  service: string;
  version: string;
  status: 'loading' | 'success' | 'error';
}

interface AboutModalProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

export default function AboutModal({ children, className, testId }: AboutModalProps) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<ServiceVersion[]>([
    { service: 'Auth Service', version: '', status: 'loading' },
    { service: 'Identity Service', version: '', status: 'loading' },
    { service: 'Guardian Service', version: '', status: 'loading' },
  ]);

  // Fetch versions when modal opens
  useEffect(() => {
    if (!open) return;
    
    const fetchVersions = async () => {
      const endpoints = [
        { name: 'Auth Service', url: '/api/auth/version' },
        { name: 'Identity Service', url: '/api/identity/version' },
        { name: 'Guardian Service', url: '/api/guardian/version' },
      ];

      const updatedServices = await Promise.all(
        endpoints.map(async ({ name, url }) => {
          try {
            const response = await fetchWithAuth(url);
            const data = await response.json();
            return {
              service: name,
              version: data.version || 'Unknown',
              status: 'success' as const,
            };
          } catch (error) {
            console.error(`Failed to fetch version for ${name}:`, error);
            return {
              service: name,
              version: 'Error',
              status: 'error' as const,
            };
          }
        })
      );

      setServices(updatedServices);
    };
    
    fetchVersions();
  }, [open]);



  const getStatusIcon = (status: ServiceVersion['status']) => {
    switch (status) {
      case 'loading':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '❔';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className={className}
          {...(testId && { 'data-testid': testId })}
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info size={20} />
            About Waterfall
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Application Info */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Application</h3>
            <div className="flex justify-between items-center">
              <span className="text-sm">Waterfall Web</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">v0.1.0</span>
            </div>
          </div>

          {/* Backend Services */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Server size={16} />
              Backend Services
            </h3>
            <div className="space-y-2">
              {services.map((service) => (
                <div key={service.service} className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{getStatusIcon(service.status)}</span>
                    <span className="text-sm">{service.service}</span>
                  </div>
                  <span 
                    className={`text-sm font-mono px-2 py-1 rounded text-xs ${
                      service.status === 'success' 
                        ? 'bg-green-100 text-green-800' 
                        : service.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {service.version || 'Loading...'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            © 2025 Waterfall Project Management
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}