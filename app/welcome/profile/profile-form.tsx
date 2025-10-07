"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Update the Dictionary type to allow nested objects
type Dictionary = {
  [key: string]: string | Dictionary;
};



interface User {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
}

function ProfileForm({ dictionary, user }: { dictionary: Dictionary; user: User }) {
  const [email, setEmail] = useState(user.email || "");
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [phone, setPhone] = useState(user.phone_number || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
  const [error, setError] = useState<string | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAvatarUrl(URL.createObjectURL(e.dataTransfer.files[0]));
    }
  }
  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleCancel() {
    // Redirige ou reset le formulaire
    window.history.back();
  }

async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword && newPassword !== newPassword2) {
        setError(
          typeof dictionary.profile_password_mismatch === "string"
            ? dictionary.profile_password_mismatch
            : "Les nouveaux mots de passe ne correspondent pas."
        );
        return;
    }

    try {
        const payload: {
            email: string;
            first_name: string;
            last_name: string;
            phone_number: string;
            old_password?: string;
            new_password?: string;
        } = {
            email,
            first_name: firstName,
            last_name: lastName,
            phone_number: phone,
        };
        if (oldPassword) payload.old_password = oldPassword;
        if (newPassword) payload.new_password = newPassword;

        interface ApiResponse {
            error?: string;
            message?: string;
        }

        // Can't use checkSessionAndFetch here because it's client-side
        const res: Response = await fetch(`/api/identity/users/${user.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const data: ApiResponse = await res.json().catch(() => ({} as ApiResponse));
            setError(
                data.error ||
                data.message ||
                (typeof dictionary.profile_update_error === "string"
                    ? dictionary.profile_update_error
                    : "Erreur lors de la mise à jour.")
            );
            return;
        }

        // Affiche un message de succès au lieu de recharger la page
        setError(
          typeof dictionary.profile_update_success === "string"
            ? dictionary.profile_update_success
            : "Profil mis à jour avec succès."
        );
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
    }
    window.history.back();
}

  return (
    <form className="max-w-lg mx-auto space-y-6" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-bold mb-4">
        {typeof dictionary.profile_title === "string"
          ? dictionary.profile_title
          : "Mon profil"}
      </h1>
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-24 h-24 rounded-full border border-waterfall-icon flex items-center justify-center overflow-hidden mb-2 cursor-pointer bg-white"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" width={96} height={96} className="object-cover w-24 h-24" />
          ) : (
            <span className="text-waterfall-icon text-4xl">👤</span>
          )}
        </div>
        <label className="cursor-pointer text-sm text-waterfall-description">
          {typeof dictionary.profile_avatar === "string"
            ? dictionary.profile_avatar
            : "Changer l'avatar"}
          <Input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">{typeof dictionary.profile_email === "string" ? dictionary.profile_email : "Email"}</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">{typeof dictionary.profile_phone === "string" ? dictionary.profile_phone : "Téléphone"}</label>
          <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">{typeof dictionary.profile_first_name === "string" ? dictionary.profile_first_name : "Prénom"}</label>
          <Input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">{typeof dictionary.profile_last_name === "string" ? dictionary.profile_last_name : "Nom"}</label>
          <Input type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">
          {typeof dictionary.profile_old_password === "string"
            ? dictionary.profile_old_password
            : "Ancien mot de passe"}
        </label>
        <Input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">
            {typeof dictionary.profile_new_password === "string"
              ? dictionary.profile_new_password
              : "Nouveau mot de passe"}
          </label>
          <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">
            {typeof dictionary.profile_new_password2 === "string"
              ? dictionary.profile_new_password2
              : "Confirmer le nouveau mot de passe"}
          </label>
          <Input type="password" value={newPassword2} onChange={e => setNewPassword2(e.target.value)} />
        </div>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={handleCancel}>
          {typeof dictionary.profile_cancel === "string" ? dictionary.profile_cancel : "Abandonner"}
        </Button>
        <Button type="submit" variant="default">
          {typeof dictionary.profile_save === "string" ? dictionary.profile_save : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

export default ProfileForm;