"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import Image from "next/image";
import { Building2, User, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

interface InitAppDictionary {
  title: string;
  company: { title: string; label: string; desc: string };
  user: { title: string; label: string; desc: string };
  password: string;
  password_confirm: string;
  password_desc: string;
  submit: string;
  success: string;
  error_company: string;
  error_user: string;
  loading: string;
}

interface InitAppForm {
  company: string;
  user: string;
  password: string;
  passwordConfirm: string;
}

export default function InitApp({ dictionary }: { dictionary: InitAppDictionary }) {
  const form = useForm<InitAppForm>({ defaultValues: { company: "", user: "", password: "", passwordConfirm: "" } });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ company?: string; user?: string; password?: string; passwordConfirm?: string }>({});

  const handleSubmit = async (data: InitAppForm) => {
    setError(null);
    setSuccess(false);
    setPasswordError(null);
    setFieldErrors({});
    const errors: { company?: string; user?: string; password?: string; passwordConfirm?: string } = {};
    if (!data.company) errors.company = "Le nom de l'entreprise est requis.";
    if (!data.user) errors.user = "L'email utilisateur est requis.";
    if (!data.password) errors.password = "Le mot de passe est requis.";
    if (!data.passwordConfirm) errors.passwordConfirm = "La confirmation du mot de passe est requise.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (data.password !== data.passwordConfirm) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      // 1. Appel à l'init du service identity
      const identityRes = await fetch("/api/identity/init-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: { name: data.company },
          user: { email: data.user, password: data.password },
        }),
      });
      if (!identityRes.ok) throw new Error("Erreur lors de l'initialisation de l'identité");
      // 2. Appel à l'init du service guardian
      const guardianRes = await fetch("/api/guardian/init-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: { name: data.company },
          user: { email: data.user, password: data.password },
        }),
      });
      if (!guardianRes.ok) throw new Error("Erreur lors de l'initialisation de Guardian");
      setSuccess(true);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex flex-col items-center">
          <Image src="/waterfall_logo.svg" alt="Waterfall Logo" width={160} height={44} className="mb-2" />
          <CardTitle>{dictionary.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Card Entreprise */}
            <Card className="mb-4">
              <CardHeader>
                <div className="text-base text-waterfall-description text-center italic">
                  {dictionary.company.title}
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.company.label}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-waterfall-icon" />
                          <Input type="text" {...field} required placeholder={dictionary.company.desc} />
                        </div>
                      </FormControl>
                      {fieldErrors.company && <div className="text-red-500 text-sm mt-1">{fieldErrors.company}</div>}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            {/* Card Utilisateur */}
            <Card>
              <CardHeader>
                <div className="text-base text-waterfall-description text-center italic">
                  {dictionary.user.title}
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="user"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.user.label}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-waterfall-icon" />
                          <Input type="text" {...field} required placeholder={dictionary.user.desc} />
                        </div>
                      </FormControl>
                      {fieldErrors.user && <div className="text-red-500 text-sm mt-1">{fieldErrors.user}</div>}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.password}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-5 h-5 text-waterfall-icon" />
                          <Input type="password" {...field} required placeholder={dictionary.password_desc} />
                        </div>
                      </FormControl>
                      {fieldErrors.password && <div className="text-red-500 text-sm mt-1">{fieldErrors.password}</div>}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.password} {dictionary.password_confirm}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-5 h-5 text-waterfall-icon" />
                          <Input type="password" {...field} required placeholder={dictionary.password_desc} />
                        </div>
                      </FormControl>
                      {fieldErrors.passwordConfirm && <div className="text-red-500 text-sm mt-1">{fieldErrors.passwordConfirm}</div>}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? dictionary.loading : dictionary.submit}
            </Button>
            {passwordError && <div className="text-red-500 text-sm mt-2">{passwordError}</div>}
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            {success && <div className="text-green-600 text-sm mt-2">{dictionary.success}</div>}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
