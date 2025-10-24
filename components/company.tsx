"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Constants
import { IDENTITY_ROUTES } from "@/lib/api-routes";
import { COLOR_CLASSES, SPACING } from "@/lib/design-tokens";

// Utils
import { clientSessionFetch } from "@/lib/clientFetch";

// Types
type Company = {
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
    };
    messages: {
      save_success: string;
      save_error: string;
      load_error: string;
    };
    validation: {
      name_required: string;
    };
  };
};

// ==================== COMPONENT ====================
export default function Company({ companyId, dictionary }: CompanyProps) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      setError(null);

      try {
        const res = await clientSessionFetch(IDENTITY_ROUTES.company(companyId));

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          setError(dictionary.messages.load_error);
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
        console.error("Error loading company:", err);
        setError(dictionary.messages.load_error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompany();
  }, [companyId, router, dictionary.messages.load_error]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setError(null);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

      const res = await clientSessionFetch(IDENTITY_ROUTES.company(companyId), {
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
        setError(errorData.message || dictionary.messages.save_error);
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
      console.error("Error saving company:", err);
      setError(dictionary.messages.save_error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className={COLOR_CLASSES.text.destructive}>{error}</p>
      </div>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className={SPACING.component.md}>
          {/* Success Message */}
          {successMessage && (
            <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            {!isEditing ? (
              <Button type="button" onClick={handleEdit}>
                Modifier
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  {dictionary.form.cancel}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Enregistrement..." : dictionary.form.save}
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
