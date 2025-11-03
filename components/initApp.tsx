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

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, KeyRound, Mail } from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";

// Validation
import { useZodForm } from "@/lib/hooks";
import { initAppSchema, InitAppFormData } from "@/lib/validation";

// Constants
import { IDENTITY_ROUTES, GUARDIAN_ROUTES } from "@/lib/api-routes";
import { AUTH_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, COLOR_CLASSES, SPACING } from "@/lib/design-tokens";

// ==================== TYPES ====================
interface InitAppDictionary {
  title: string;
  company: { title: string; label: string; desc: string };
  user: { 
    title: string; 
    email_label: string; 
    email_desc: string; 
  };
  password: string;
  password_confirm: string;
  password_desc: string;
  submit: string;
  success: string;
  error_company: string;
  error_user: string;
  loading: string;
}

// ==================== CONSTANTS ====================
const FORM_IDS = {
  COMPANY_INPUT: "company",
  EMAIL_INPUT: "userEmail",
  PASSWORD_INPUT: "password",
  CONFIRM_PASSWORD_INPUT: "confirmPassword",
  SUBMIT_BUTTON: "submit",
} as const;

const API_ERROR_MESSAGES = {
  IDENTITY_ERROR: "Erreur lors de l'initialisation de l'identité",
  GUARDIAN_ERROR: "Erreur lors de l'initialisation de Guardian",
} as const;

// ==================== COMPONENT ====================
export default function InitApp({ dictionary }: { readonly dictionary: InitAppDictionary }) {
  // Form with Zod validation
  const form = useZodForm({
    schema: initAppSchema,
    defaultValues: {
      companyName: "",
      userEmail: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Router
  const router = useRouter();
  
  // State
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ==================== HANDLERS ====================
  const handleSubmit = async (data: InitAppFormData) => {
    setError(null);
    setSuccess(false);
    
    try {
      // 1. Appel à l'init du service identity
      const identityRes = await fetch(IDENTITY_ROUTES.initApp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: { name: data.companyName },
          user: { email: data.userEmail, password: data.password },
        }),
      });
      
      if (!identityRes.ok) throw new Error(API_ERROR_MESSAGES.IDENTITY_ERROR);
      
      const identityData = await identityRes.json();
      const company_id = identityData.company.id;
      const user_id = identityData.user.id;
      
      // 2. Appel à l'init du service guardian
      const guardianRes = await fetch(GUARDIAN_ROUTES.initApp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: { name: data.companyName, company_id },
          user: { email: data.userEmail, password: data.password, user_id },
        }),
      });
      
      if (!guardianRes.ok) throw new Error(API_ERROR_MESSAGES.GUARDIAN_ERROR);
      
      setSuccess(true);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // ==================== RENDER ====================
  return (
    <Card 
      className={`w-full shadow-lg border-0 ${COLOR_CLASSES.bg.waterfallGradient}`}
      {...testId(AUTH_TEST_IDS.initApp.card)}
    >
      <CardHeader className="pt-8 pb-6 rounded-t-[10px]">
        <CardTitle 
          className={`text-2xl font-bold ${COLOR_CLASSES.text.waterfallPrimaryDark} text-center`}
          {...testId(AUTH_TEST_IDS.initApp.title)}
        >
          {dictionary.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(handleSubmit)} 
            className={SPACING.component.md}
            {...testId(AUTH_TEST_IDS.initApp.form)}
          >
            {/* Section Entreprise */}
            <div className={`text-base font-semibold ${COLOR_CLASSES.text.waterfallPrimaryDark} text-center mb-4`}>
              {dictionary.company.title}
            </div>

            {/* Card Entreprise */}
            <Card 
              className={`mb-3 border-l-4 ${COLOR_CLASSES.border.waterfallCompany} ${COLOR_CLASSES.bg.waterfallLight} shadow-sm hover:shadow-md transition-shadow`}
              {...testId(AUTH_TEST_IDS.initApp.companyCard)}
            >
              <CardContent className="pt-4 pb-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.company.label}</FormLabel>
                      <FormControl>
                        <div className={`flex items-center ${SPACING.gap.sm}`}>
                          <Building2 
                            className={`${ICON_SIZES.md} ${COLOR_CLASSES.text.waterfallCompany}`}
                            {...testId(AUTH_TEST_IDS.initApp.companyIcon)}
                          />
                          <Input 
                            id={FORM_IDS.COMPANY_INPUT}
                            type="text" 
                            {...field} 
                            placeholder={dictionary.company.desc}
                            {...testId(AUTH_TEST_IDS.initApp.companyInput)}
                          />
                        </div>
                      </FormControl>
                      {form.formState.errors.companyName && (
                        <div 
                          className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}
                          {...testId(AUTH_TEST_IDS.initApp.companyError)}
                        >
                          {form.formState.errors.companyName.message}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            {/* Section Utilisateur */}
            <div className={`text-base font-semibold ${COLOR_CLASSES.text.waterfallPrimaryDark} text-center mb-4 mt-6`}>
              {dictionary.user.title}
            </div>

            {/* Email Card */}
            <Card className={`mb-3 border-l-4 ${COLOR_CLASSES.border.waterfallUser} ${COLOR_CLASSES.bg.waterfallLight} shadow-sm hover:shadow-md transition-shadow`}>
              <CardContent className="pt-4 pb-4">
                <FormField
                  control={form.control}
                  name="userEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.user.email_label}</FormLabel>
                      <FormControl>
                        <div className={`flex items-center ${SPACING.gap.sm}`}>
                          <Mail 
                            className={`${ICON_SIZES.md} ${COLOR_CLASSES.text.waterfallUser}`}
                          />
                          <Input 
                            id={FORM_IDS.EMAIL_INPUT}
                            type="email" 
                            {...field} 
                            placeholder={dictionary.user.email_desc}
                          />
                        </div>
                      </FormControl>
                      {form.formState.errors.userEmail && (
                        <div 
                          className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}
                        >
                          {form.formState.errors.userEmail.message}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Password Card */}
            <Card className={`mb-4 border-l-4 ${COLOR_CLASSES.border.waterfallUser} ${COLOR_CLASSES.bg.waterfallLight} shadow-sm hover:shadow-md transition-shadow`} {...testId(AUTH_TEST_IDS.initApp.userCard)}>
              <CardContent className="pt-4 pb-4 space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.password}</FormLabel>
                      <FormControl>
                        <div className={`flex items-center ${SPACING.gap.sm}`}>
                          <KeyRound 
                            className={`${ICON_SIZES.md} ${COLOR_CLASSES.text.waterfallUser}`}
                            {...testId(AUTH_TEST_IDS.initApp.passwordIcon)}
                          />
                          <Input 
                            id={FORM_IDS.PASSWORD_INPUT}
                            type="password" 
                            {...field} 
                            placeholder={dictionary.password_desc}
                            {...testId(AUTH_TEST_IDS.initApp.passwordInput)}
                          />
                        </div>
                      </FormControl>
                      {form.formState.errors.password && (
                        <div 
                          className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}
                          {...testId(AUTH_TEST_IDS.initApp.passwordError)}
                        >
                          {form.formState.errors.password.message}
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.password} {dictionary.password_confirm}</FormLabel>
                      <FormControl>
                        <div className={`flex items-center ${SPACING.gap.sm}`}>
                          <KeyRound 
                            className={`${ICON_SIZES.md} ${COLOR_CLASSES.text.waterfallUser}`}
                            {...testId(AUTH_TEST_IDS.initApp.confirmPasswordIcon)}
                          />
                          <Input 
                            id={FORM_IDS.CONFIRM_PASSWORD_INPUT}
                            type="password" 
                            {...field} 
                            placeholder={dictionary.password_desc}
                            {...testId(AUTH_TEST_IDS.initApp.confirmPasswordInput)}
                          />
                        </div>
                      </FormControl>
                      {form.formState.errors.confirmPassword && (
                        <div 
                          className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}
                          {...testId(AUTH_TEST_IDS.initApp.confirmPasswordError)}
                        >
                          {form.formState.errors.confirmPassword.message}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            {/* Submit Button */}
            <Button 
              id={FORM_IDS.SUBMIT_BUTTON}
              type="submit" 
              className={`w-full ${COLOR_CLASSES.bg.waterfallPrimaryDark} hover:bg-[var(--waterfall-primary-hover)] text-white font-semibold py-6 text-lg shadow-md hover:shadow-lg transition-all`}
              disabled={form.formState.isSubmitting}
              {...testId(AUTH_TEST_IDS.initApp.submitButton)}
            >
              {form.formState.isSubmitting ? dictionary.loading : dictionary.submit}
            </Button>
            
            {/* General Error */}
            {error && (
              <div 
                className="bg-[#f8d7da] border border-[#f5c6cb] text-[#721c24] px-4 py-3 rounded text-sm mt-4"
                {...testId(AUTH_TEST_IDS.initApp.errorMessage)}
              >
                {error}
              </div>
            )}
            
            {/* Success Message */}
            {success && (
              <div 
                className="bg-[#d4edda] border border-[#c3e6cb] text-[#155724] px-4 py-3 rounded text-sm mt-4"
                {...testId(AUTH_TEST_IDS.initApp.successMessage)}
              >
                {dictionary.success}
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
