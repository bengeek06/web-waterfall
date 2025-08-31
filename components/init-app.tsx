"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import Image from "next/image";

interface InitAppDictionary {
  title: string;
  company: string;
  company_desc: string;
  user: string;
  user_desc: string;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = async (data: InitAppForm) => {
    setError(null);
    setSuccess(false);
    setPasswordError(null);
    if (data.password !== data.passwordConfirm) {
      setPasswordError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      // 1. Créer la company
      const companyRes = await fetch("/api/identity/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.company }),
      });
      if (!companyRes.ok) throw new Error(dictionary.error_company);
      const companyData = await companyRes.json();
      const company_id = companyData.id;
      // 2. Créer l'utilisateur avec le company_id
      const userRes = await fetch("/api/identity/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: data.user, password: data.password, company_id }),
      });
      if (!userRes.ok) throw new Error(dictionary.error_user);
      setSuccess(true);
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
          <Image src="/fr/waterfall_logo.svg" alt="Waterfall Logo" width={120} height={32} className="mb-2" />
          <CardTitle>{dictionary.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>{dictionary.company}</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} required placeholder={dictionary.company_desc} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary.user}</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} required placeholder={dictionary.user_desc} />
                  </FormControl>
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
                    <Input type="password" {...field} required placeholder={dictionary.password_desc} />
                  </FormControl>
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
                    <Input type="password" {...field} required placeholder={dictionary.password_desc} />
                  </FormControl>
                </FormItem>
              )}
            />
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
