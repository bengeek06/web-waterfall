/**
 * Copyright (c) 2025 Waterfall
 * 
 * This source code is dual-licensed under:
 * - GNU Affero General Public License v3.0 (AGPLv3) for open source use
 * - Commercial License for proprietary use
 * 
 * See LICENSE and LICENSE.md files in the root directory for full license text.
 * For commercial licensing inquiries, contact: benjamin@waterfall-project.pro
 */

'use client';

import { useState, useEffect } from 'react';
import { Info, Server, Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { ABOUT_TEST_IDS, testId } from '@/lib/test-ids';
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";
import { Dictionary } from '@/lib/utils/dictionaries';

// ==================== TYPES ====================

interface ServiceVersion {
  service: string;
  version: string;
  status: 'loading' | 'success' | 'error';
}

interface BackendService {
  name: string;
  endpoint: string;
}

interface AboutModalProps {
  children: React.ReactNode;
  className?: string;
  dictionary: Dictionary;
}

// ==================== COMPONENT ====================

export default function AboutModal({ children, className, dictionary }: AboutModalProps) {
  // State
  const [open, setOpen] = useState(false);
  const [webVersion, setWebVersion] = useState<ServiceVersion>({
    service: 'Web Frontend',
    version: '',
    status: 'loading',
  });
  const [services, setServices] = useState<ServiceVersion[]>([]);

  // Dictionary
  const dict = dictionary.about;

  // Fetch versions when modal opens
  useEffect(() => {
    if (!open) return;

    // Fetch web frontend version (no auth needed)
    const fetchWebVersion = async () => {
      try {
        const response = await fetch('/api/version');
        const data = await response.json();
        setWebVersion({
          service: 'Web Frontend',
          version: data.version || dict.unknown,
          status: 'success',
        });
      } catch {
        setWebVersion({
          service: 'Web Frontend',
          version: dict.error,
          status: 'error',
        });
      }
    };
    
    const fetchServiceVersions = async () => {
      // First, get the list of services from the API
      let backendServices: BackendService[] = [];
      try {
        const servicesResponse = await fetch('/api/services');
        const servicesData = await servicesResponse.json();
        backendServices = servicesData.services || [];
      } catch {
        return;
      }

      // Initialize services with loading state
      setServices(backendServices.map(s => ({
        service: s.name,
        version: '',
        status: 'loading' as const,
      })));

      // Fetch version for each service
      const updatedServices = await Promise.all(
        backendServices.map(async ({ name, endpoint }) => {
          try {
            const response = await fetchWithAuth(endpoint);
            const data = await response.json();
            return {
              service: name,
              version: data.version || dict.unknown,
              status: 'success' as const,
            };
          } catch {
            return {
              service: name,
              version: dict.error,
              status: 'error' as const,
            };
          }
        })
      );

      setServices(updatedServices);
    };

    fetchWebVersion();
    fetchServiceVersions();
  }, [open, dict.unknown, dict.error]);

  // Render helpers
  const getStatusIcon = (status: ServiceVersion['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className={`${ICON_SIZES.sm} ${COLOR_CLASSES.text.warning} animate-spin`} />;
      case 'success':
        return <CheckCircle className={`${ICON_SIZES.sm} ${COLOR_CLASSES.text.success}`} />;
      case 'error':
        return <XCircle className={`${ICON_SIZES.sm} ${COLOR_CLASSES.text.error}`} />;
      default:
        return null;
    }
  };

  const getVersionClassName = (status: ServiceVersion['status']) => {
    const base = 'font-mono px-2 py-1 rounded text-xs';
    switch (status) {
      case 'success':
        return `${base} ${COLOR_CLASSES.statusBadge.success}`;
      case 'error':
        return `${base} ${COLOR_CLASSES.statusBadge.error}`;
      default:
        return `${base} ${COLOR_CLASSES.statusBadge.warning}`;
    }
  };

  // Render
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className={className}
          {...testId(ABOUT_TEST_IDS.trigger)}
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" {...testId(ABOUT_TEST_IDS.dialog)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" {...testId(ABOUT_TEST_IDS.title)}>
            <Info className={ICON_SIZES.md} />
            {dict.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Application Info */}
          <div className="border-b pb-4" {...testId(ABOUT_TEST_IDS.applicationSection)}>
            <h3 className={`font-semibold text-sm ${COLOR_CLASSES.text.muted} mb-2`}>
              {dict.application}
            </h3>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span {...testId(ABOUT_TEST_IDS.webVersionStatus)}>
                  {getStatusIcon(webVersion.status)}
                </span>
                <span className="text-sm">{dict.app_name}</span>
              </div>
              <span 
                className={getVersionClassName(webVersion.status)}
                {...testId(ABOUT_TEST_IDS.webVersion)}
              >
                {webVersion.version ? `v${webVersion.version}` : dict.loading}
              </span>
            </div>
          </div>

          {/* Backend Services */}
          <div {...testId(ABOUT_TEST_IDS.servicesSection)}>
            <h3 className={`font-semibold text-sm ${COLOR_CLASSES.text.muted} mb-3 flex items-center gap-2`}>
              <Server className={ICON_SIZES.sm} />
              {dict.backend_services}
            </h3>
            <div className="space-y-2">
              {services.map((service) => (
                <div 
                  key={service.service} 
                  className="flex justify-between items-center py-1"
                  {...testId(ABOUT_TEST_IDS.serviceItem(service.service))}
                >
                  <div className="flex items-center gap-2">
                    <span {...testId(ABOUT_TEST_IDS.serviceStatus(service.service))}>
                      {getStatusIcon(service.status)}
                    </span>
                    <span className="text-sm">{service.service}</span>
                  </div>
                  <span className={getVersionClassName(service.status)}>
                    {service.version || dict.loading}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div 
            className={`text-xs ${COLOR_CLASSES.text.muted} pt-2 border-t`}
            {...testId(ABOUT_TEST_IDS.footer)}
          >
            {dict.copyright}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}