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

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import type { ErrorMessages } from "@/lib/hooks/useErrorHandler";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Icons
import { ArrowLeft } from "lucide-react";

// Constants
import { IDENTITY_ROUTES } from "@/lib/api-routes";
import { COLOR_CLASSES, SPACING, ICON_SIZES } from "@/lib/design-tokens";
import { COMPANY_TEST_IDS, testId } from "@/lib/test-ids";

// Utils
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";

// Types
type CompanyData = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  siret?: string;
  vat_number?: string;
  created_at?: string;
  updated_at?: string;
};

type CompanyProps = {
  companyId: string;
  dictionary: {
    title: string;
    description: string;
    form: {
      name: string;
      address: string;
      city: string;
      postal_code: string;
      country: string;
      phone: string;
      email: string;
      website: string;
      siret: string;
      vat_number: string;
      save: string;
      cancel: string;
      back: string;
      edit: string;
    };
    dialog: {
      unsaved_changes_title: string;
      unsaved_changes_description: string;
      keep_editing: string;
      discard_changes: string;
    };
    messages: {
      loading: string;
      saving: string;
      save_success: string;
      save_error: string;
      load_error: string;
    };
    validation: {
      name_required: string;
    };
    errors: ErrorMessages;
  };
};

// ==================== COMPONENT ====================
export default function Company({ companyId, dictionary }: CompanyProps) {
  const router = useRouter();
  const { handleError } = useErrorHandler({ messages: dictionary.errors });
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    siret: "",
    vat_number: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load company data
  useEffect(() => {
    const loadCompany = async () => {
      setIsLoading(true);

      try {
        const res = await fetchWithAuth(IDENTITY_ROUTES.company(companyId));

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          handleError(new Error(dictionary.messages.load_error));
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setCompany(data);
        setFormData({
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          postal_code: data.postal_code || "",
          country: data.country || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          siret: data.siret || "",
          vat_number: data.vat_number || "",
        });
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, router]);

  const handleEdit = () => {
    setIsEditing(true);
    setSuccessMessage(null);
  };

  // Check if form has unsaved changes
  const hasUnsavedChanges = (): boolean => {
    if (!isEditing || !company) return false;
    return (
      formData.name !== (company.name || "") ||
      formData.address !== (company.address || "") ||
      formData.city !== (company.city || "") ||
      formData.postal_code !== (company.postal_code || "") ||
      formData.country !== (company.country || "") ||
      formData.phone !== (company.phone || "") ||
      formData.email !== (company.email || "") ||
      formData.website !== (company.website || "") ||
      formData.siret !== (company.siret || "") ||
      formData.vat_number !== (company.vat_number || "")
    );
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      router.push("/home/settings");
    }
  };

  const handleConfirmLeave = () => {
    setShowUnsavedDialog(false);
    router.push("/home/settings");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setSuccessMessage(null);
    // Reset form data to current company data
    if (company) {
      setFormData({
        name: company.name || "",
        address: company.address || "",
        city: company.city || "",
        postal_code: company.postal_code || "",
        country: company.country || "",
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        siret: company.siret || "",
        vat_number: company.vat_number || "",
      });
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = dictionary.validation.name_required;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    setIsSaving(true);

    try {
      // Prepare payload - remove empty strings
      const payload: Record<string, string> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value.trim()) {
          payload[key] = value.trim();
        }
      });

      const res = await fetchWithAuth(IDENTITY_ROUTES.company(companyId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        handleError(new Error(errorData.message || dictionary.messages.save_error));
        setIsSaving(false);
        return;
      }

      const updatedCompany = await res.json();
      setCompany(updatedCompany);
      setIsEditing(false);
      setSuccessMessage(dictionary.messages.save_success);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">{dictionary.messages.loading}</p>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <>
      <Card className="max-w-3xl mx-auto" {...testId(COMPANY_TEST_IDS.card)}>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label={dictionary.form.back}
              {...testId(COMPANY_TEST_IDS.backButtonHeader)}
            >
              <ArrowLeft className={`${ICON_SIZES.md}`} />
            </Button>
            <div>
              <CardTitle>{dictionary.title}</CardTitle>
              <CardDescription>{dictionary.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit} className={SPACING.component.md}>
          {/* Success Message */}
          {successMessage && (
            <div 
              className="p-3 mb-4 bg-green-50 border border-green-200 rounded-md"
              {...testId(COMPANY_TEST_IDS.successMessage)}
            >
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {/* Company Name */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="name">{dictionary.form.name} *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={!isEditing}
              className={errors.name ? "border-red-500" : ""}
              {...testId(COMPANY_TEST_IDS.nameInput)}
            />
            {errors.name && (
              <p className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Address */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="address">{dictionary.form.address}</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
              disabled={!isEditing}
              {...testId(COMPANY_TEST_IDS.addressInput)}
            />
          </div>

          {/* City & Postal Code */}
          <div className="grid grid-cols-2 gap-4">
            <div className={SPACING.component.xs}>
              <Label htmlFor="city">{dictionary.form.city}</Label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                disabled={!isEditing}
                {...testId(COMPANY_TEST_IDS.cityInput)}
              />
            </div>
            <div className={SPACING.component.xs}>
              <Label htmlFor="postal_code">{dictionary.form.postal_code}</Label>
              <Input
                id="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={(e) => updateField("postal_code", e.target.value)}
                disabled={!isEditing}
                {...testId(COMPANY_TEST_IDS.postalCodeInput)}
              />
            </div>
          </div>

          {/* Country */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="country">{dictionary.form.country}</Label>
            <Input
              id="country"
              type="text"
              value={formData.country}
              onChange={(e) => updateField("country", e.target.value)}
              disabled={!isEditing}
              {...testId(COMPANY_TEST_IDS.countryInput)}
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className={SPACING.component.xs}>
              <Label htmlFor="phone">{dictionary.form.phone}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={!isEditing}
                {...testId(COMPANY_TEST_IDS.phoneInput)}
              />
            </div>
            <div className={SPACING.component.xs}>
              <Label htmlFor="email">{dictionary.form.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={!isEditing}
                {...testId(COMPANY_TEST_IDS.emailInput)}
              />
            </div>
          </div>

          {/* Website */}
          <div className={SPACING.component.xs}>
            <Label htmlFor="website">{dictionary.form.website}</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => updateField("website", e.target.value)}
              disabled={!isEditing}
              {...testId(COMPANY_TEST_IDS.websiteInput)}
            />
          </div>

          {/* SIRET & VAT Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className={SPACING.component.xs}>
              <Label htmlFor="siret">{dictionary.form.siret}</Label>
              <Input
                id="siret"
                type="text"
                value={formData.siret}
                onChange={(e) => updateField("siret", e.target.value)}
                disabled={!isEditing}
                {...testId(COMPANY_TEST_IDS.siretInput)}
              />
            </div>
            <div className={SPACING.component.xs}>
              <Label htmlFor="vat_number">{dictionary.form.vat_number}</Label>
              <Input
                id="vat_number"
                type="text"
                value={formData.vat_number}
                onChange={(e) => updateField("vat_number", e.target.value)}
                disabled={!isEditing}
                {...testId(COMPANY_TEST_IDS.vatNumberInput)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              {...testId(COMPANY_TEST_IDS.backButton)}
            >
              <ArrowLeft className={`${ICON_SIZES.sm} mr-2`} />
              {dictionary.form.back}
            </Button>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button 
                  type="button" 
                  onClick={handleEdit}
                  {...testId(COMPANY_TEST_IDS.editButton)}
                >
                  {dictionary.form.edit}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    {...testId(COMPANY_TEST_IDS.cancelButton)}
                  >
                    {dictionary.form.cancel}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    {...testId(COMPANY_TEST_IDS.saveButton)}
                  >
                    {isSaving ? dictionary.messages.saving : dictionary.form.save}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>

    {/* Unsaved Changes Confirmation Dialog */}
    <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
      <DialogContent {...testId(COMPANY_TEST_IDS.unsavedChangesDialog)}>
        <DialogHeader>
          <DialogTitle>{dictionary.dialog.unsaved_changes_title}</DialogTitle>
          <DialogDescription>
            {dictionary.dialog.unsaved_changes_description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowUnsavedDialog(false)}
            {...testId(COMPANY_TEST_IDS.keepEditingButton)}
          >
            {dictionary.dialog.keep_editing}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmLeave}
            {...testId(COMPANY_TEST_IDS.discardChangesButton)}
          >
            {dictionary.dialog.discard_changes}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
