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

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Globe } from "lucide-react";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// API Routes
import { IDENTITY_ROUTES } from "@/lib/api-routes";

// Test IDs
import { DASHBOARD_TEST_IDS } from "@/lib/test-ids";

// Utils
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// ==================== TYPES ====================
type Locale = "fr" | "en";

interface User {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  has_avatar?: boolean;
  avatar_file_id?: string;
  language?: string;
}

type Dictionary = {
  [key: string]: string | Dictionary;
};

interface ProfileProps {
  user: User;
  dictionary: Dictionary;
}

// ==================== CONSTANTS ====================
const LANGUAGE_LABELS: Record<Locale, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇬🇧" },
  fr: { name: "Français", flag: "🇫🇷" },
};

const LOCALES: Locale[] = ["fr", "en"];

// ==================== COMPONENT ====================
export default function Profile({ user, dictionary }: ProfileProps) {
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState(user.email || "");
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [phone, setPhone] = useState(user.phone_number || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user.has_avatar ? `/api/identity/users/${user.id}/avatar?t=${Date.now()}` : ""
  );
  const [language, setLanguage] = useState<Locale>((user.language as Locale) || "fr");
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==================== HANDLERS ====================
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleCancel() {
    window.history.back();
  }

  async function handleLanguageChange(newLanguage: Locale) {
    if (newLanguage === language || isUpdatingLanguage) return;

    setIsUpdatingLanguage(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        IDENTITY_ROUTES.user(user.id),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: newLanguage }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error ||
            data.message ||
            "Erreur lors de la mise à jour de la langue"
        );
      }

      // Update local state
      setLanguage(newLanguage);
      localStorage.setItem("userLanguage", newLanguage);

      // Refresh page to reload with new language (using Next.js router for Server Component revalidation)
      router.refresh();
    } catch (err) {
      console.error("Error updating language:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour"
      );
    } finally {
      setIsUpdatingLanguage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (newPassword && newPassword !== newPassword2) {
      setError(
        typeof dictionary.profile_password_mismatch === "string"
          ? dictionary.profile_password_mismatch
          : "Les nouveaux mots de passe ne correspondent pas."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // Use FormData if we have an avatar file to upload
      if (avatarFile) {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("first_name", firstName);
        formData.append("last_name", lastName);
        formData.append("phone_number", phone);
        formData.append("language", language);
        formData.append("avatar", avatarFile);
        
        if (oldPassword) formData.append("old_password", oldPassword);
        if (newPassword) formData.append("new_password", newPassword);

        const res = await fetchWithAuth(IDENTITY_ROUTES.user(user.id), {
          method: "PATCH",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(
            data.error ||
              data.message ||
              (typeof dictionary.profile_update_error === "string"
                ? dictionary.profile_update_error
                : "Erreur lors de la mise à jour.")
          );
          return;
        }
      } else {
        // Use JSON for simple updates without avatar
        const payload: {
          email: string;
          first_name: string;
          last_name: string;
          phone_number: string;
          language: string;
          old_password?: string;
          new_password?: string;
        } = {
          email,
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          language,
        };

        if (oldPassword) payload.old_password = oldPassword;
        if (newPassword) payload.new_password = newPassword;

        const res = await fetchWithAuth(IDENTITY_ROUTES.user(user.id), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(
            data.error ||
              data.message ||
              (typeof dictionary.profile_update_error === "string"
                ? dictionary.profile_update_error
                : "Erreur lors de la mise à jour.")
          );
          return;
        }
      }

      // Success message
      setError(
        typeof dictionary.profile_update_success === "string"
          ? dictionary.profile_update_success
          : "Profil mis à jour avec succès."
      );

      // Go back after short delay
      setTimeout(() => {
        window.history.back();
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(
          err.message ||
            (typeof dictionary.profile_update_error === "string"
              ? dictionary.profile_update_error
              : "Erreur lors de la mise à jour.")
        );
      } else {
        setError(
          typeof dictionary.profile_update_error === "string"
            ? dictionary.profile_update_error
            : "Erreur lors de la mise à jour."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==================== RENDER ====================
  return (
    <form
      className="max-w-lg mx-auto space-y-6"
      onSubmit={handleSubmit}
      data-testid={DASHBOARD_TEST_IDS.profile.form}
    >
      {/* Header with Language Switcher */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {typeof dictionary.profile_title === "string"
            ? dictionary.profile_title
            : "Mon profil"}
        </h1>
        
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isUpdatingLanguage}
              data-testid="profile-language-switcher"
            >
              <Globe className="h-4 w-4" />
              <span>{LANGUAGE_LABELS[language].flag}</span>
              <span className="hidden sm:inline">
                {LANGUAGE_LABELS[language].name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LOCALES.map((loc) => (
              <DropdownMenuItem
                key={loc}
                onClick={() => handleLanguageChange(loc)}
                className="gap-2 cursor-pointer"
                disabled={isUpdatingLanguage}
                data-testid={`profile-language-option-${loc}`}
              >
                <span>{LANGUAGE_LABELS[loc].flag}</span>
                <span>{LANGUAGE_LABELS[loc].name}</span>
                {loc === language && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-24 h-24 rounded-full border border-waterfall-icon flex items-center justify-center overflow-hidden mb-2 cursor-pointer bg-white"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          data-testid="profile-avatar"
        >
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt="Avatar"
              width={96}
              height={96}
              className="object-cover w-24 h-24"
            />
          ) : (
            <span className="text-waterfall-icon text-4xl">👤</span>
          )}
        </div>
        <label className="cursor-pointer text-sm text-waterfall-description">
          {typeof dictionary.profile_avatar === "string"
            ? dictionary.profile_avatar
            : "Changer l'avatar"}
          <Input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            data-testid="profile-avatar-input"
          />
        </label>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email" className="block text-sm mb-1">
            {typeof dictionary.profile_email === "string"
              ? dictionary.profile_email
              : "Email"}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid={DASHBOARD_TEST_IDS.profile.emailInput}
          />
        </div>
        <div>
          <Label htmlFor="phone" className="block text-sm mb-1">
            {typeof dictionary.profile_phone === "string"
              ? dictionary.profile_phone
              : "Téléphone"}
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            data-testid="profile-phone-input"
          />
        </div>
        <div>
          <Label htmlFor="firstName" className="block text-sm mb-1">
            {typeof dictionary.profile_first_name === "string"
              ? dictionary.profile_first_name
              : "Prénom"}
          </Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            data-testid={DASHBOARD_TEST_IDS.profile.nameInput}
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="block text-sm mb-1">
            {typeof dictionary.profile_last_name === "string"
              ? dictionary.profile_last_name
              : "Nom"}
          </Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            data-testid="profile-lastname-input"
          />
        </div>
      </div>

      {/* Password Change */}
      <div>
        <Label htmlFor="oldPassword" className="block text-sm mb-1">
          {typeof dictionary.profile_old_password === "string"
            ? dictionary.profile_old_password
            : "Ancien mot de passe"}
        </Label>
        <Input
          id="oldPassword"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          data-testid="profile-old-password-input"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="newPassword" className="block text-sm mb-1">
            {typeof dictionary.profile_new_password === "string"
              ? dictionary.profile_new_password
              : "Nouveau mot de passe"}
          </Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            data-testid="profile-new-password-input"
          />
        </div>
        <div>
          <Label htmlFor="newPassword2" className="block text-sm mb-1">
            {typeof dictionary.profile_new_password2 === "string"
              ? dictionary.profile_new_password2
              : "Confirmer le nouveau mot de passe"}
          </Label>
          <Input
            id="newPassword2"
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            data-testid="profile-confirm-password-input"
          />
        </div>
      </div>

      {/* Error/Success Message */}
      {error && (
        <div
          className={`text-sm ${
            error.includes("succès") || error.includes("success")
              ? "text-green-600"
              : "text-red-500"
          }`}
          data-testid="profile-message"
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
          data-testid={DASHBOARD_TEST_IDS.profile.cancelButton}
        >
          {typeof dictionary.profile_cancel === "string"
            ? dictionary.profile_cancel
            : "Abandonner"}
        </Button>
        <Button
          type="submit"
          variant="default"
          disabled={isSubmitting}
          data-testid={DASHBOARD_TEST_IDS.profile.saveButton}
        >
          {isSubmitting
            ? "..."
            : typeof dictionary.profile_save === "string"
            ? dictionary.profile_save
            : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
