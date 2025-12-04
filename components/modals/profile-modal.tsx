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

import { useState, useEffect, useRef } from 'react';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import type { ErrorMessages } from '@/lib/hooks/useErrorHandler';
import { User, Save, Camera, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { IDENTITY_ROUTES } from "@/lib/api-routes/identity";
import { testId, PROFILE_TEST_IDS } from '@/lib/test-ids';

interface ProfileDictionary {
  modal_title: string;
  modal_avatar_hint: string;
  modal_language: string;
  modal_saving: string;
  modal_save_changes: string;
  modal_phone_number: string;
  modal_enter_first_name: string;
  modal_enter_last_name: string;
  modal_enter_email: string;
  modal_enter_phone: string;
  modal_file_type_error: string;
  modal_file_size_error: string;
  profile_avatar: string;
  profile_cancel: string;
  profile_first_name: string;
  profile_last_name: string;
  profile_email: string;
  errors: ErrorMessages;
}

interface ProfileModalProps {
  children: React.ReactNode;
  className?: string;
  dictionary?: ProfileDictionary;
  userInfo?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    avatarUrl?: string;
    company?: string;
    position?: string;
    language?: string;
  };
}

export default function ProfileModal({ children, className, dictionary, userInfo }: ProfileModalProps) {
  const { handleError } = useErrorHandler({ messages: dictionary?.errors || {} as ErrorMessages });
  const [open, setOpen] = useState(false);
  const [isLoading, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    language: 'en'
  });

  // Initialize form data when userInfo changes or modal opens
  useEffect(() => {
    if (userInfo && open) {
      setFormData({
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        email: userInfo.email || '',
        phoneNumber: userInfo.phoneNumber || '',
        language: userInfo.language || 'en'
      });
      // Load existing avatar from endpoint
      if (userInfo.id) {
        setAvatarPreview(`/api/identity/users/${userInfo.id}/avatar?t=${Date.now()}`);
      } else {
        setAvatarPreview(null);
      }
      setAvatarFile(null);
    }
  }, [userInfo, open]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        handleError(new Error(dictionary?.modal_file_type_error || 'Please select a valid image file'));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        handleError(new Error(dictionary?.modal_file_size_error || 'File size must be less than 5MB'));
        return;
      }

      // Store the file for upload
      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!userInfo?.id) return;
    
    setSaving(true);
    try {
      // Use FormData if we have an avatar file to upload
      if (avatarFile) {
        const formDataPayload = new FormData();
        formDataPayload.append('first_name', formData.firstName);
        formDataPayload.append('last_name', formData.lastName);
        formDataPayload.append('email', formData.email);
        formDataPayload.append('phone_number', formData.phoneNumber);
        formDataPayload.append('language', formData.language);
        formDataPayload.append('avatar', avatarFile);

        const response = await fetchWithAuth(IDENTITY_ROUTES.user(userInfo.id), {
          method: 'PATCH',
          body: formDataPayload
        });

        if (response.ok) {
          // Refresh the page to update the UI
          globalThis.window.location.reload();
        } else {
          const _errorData = await response.text();
          handleError(new Error(`Failed to update profile: ${response.status}`));
        }
      } else {
        // Use JSON for simple updates without avatar
        const updateData: {
          first_name: string;
          last_name: string;
          email: string;
          phone_number: string;
          language: string;
        } = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          language: formData.language
        };

        const response = await fetchWithAuth(IDENTITY_ROUTES.user(userInfo.id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          // Refresh the page to update the UI
          globalThis.window.location.reload();
        } else {
          const _errorData = await response.text();
          handleError(new Error(`Failed to update profile: ${response.status}`));
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className={className}
          {...testId(PROFILE_TEST_IDS.trigger)}
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" {...testId(PROFILE_TEST_IDS.dialog)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" {...testId(PROFILE_TEST_IDS.title)}>
            <User size={20} />
            {dictionary?.modal_title || 'Edit Your Profile'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-3 pb-4 border-b" {...testId(PROFILE_TEST_IDS.avatarContainer)}>
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center" {...testId(PROFILE_TEST_IDS.avatarPreview)}>
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-gray-400" />
                )}
              </div>
              <button
                type="button"
                onClick={triggerAvatarUpload}
                className="absolute -bottom-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors"
                disabled={isLoading}
                {...testId(PROFILE_TEST_IDS.avatarCameraButton)}
              >
                <Camera size={14} />
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={triggerAvatarUpload}
              disabled={isLoading}
              className="flex items-center gap-2"
              {...testId(PROFILE_TEST_IDS.avatarUploadButton)}
            >
              <Upload size={16} />
              {dictionary?.profile_avatar || 'Change Avatar'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              {...testId(PROFILE_TEST_IDS.avatarFileInput)}
            />
            <p className="text-xs text-gray-500" {...testId(PROFILE_TEST_IDS.avatarHint)}>
              {dictionary?.modal_avatar_hint || 'JPG, PNG or GIF. Max 5MB.'}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium" {...testId(PROFILE_TEST_IDS.firstNameLabel)}>
                  {dictionary?.profile_first_name || 'First Name'}
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder={dictionary?.modal_enter_first_name || 'Enter first name'}
                  {...testId(PROFILE_TEST_IDS.firstNameInput)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium" {...testId(PROFILE_TEST_IDS.lastNameLabel)}>
                  {dictionary?.profile_last_name || 'Last Name'}
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder={dictionary?.modal_enter_last_name || 'Enter last name'}
                  {...testId(PROFILE_TEST_IDS.lastNameInput)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {dictionary?.profile_email || 'Email'}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={dictionary?.modal_enter_email || 'Enter email address'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                {dictionary?.modal_phone_number || 'Phone Number'}
              </Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder={dictionary?.modal_enter_phone || 'Enter phone number'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium">
                {dictionary?.modal_language || 'Language'}
              </Label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {dictionary?.profile_cancel || 'Cancel'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {isLoading ? (dictionary?.modal_saving || 'Saving...') : (dictionary?.modal_save_changes || 'Save Changes')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}