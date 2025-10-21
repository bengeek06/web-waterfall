"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, User, KeyRound } from "lucide-react";
import Image from "next/image";

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
import { ICON_SIZES, ICON_COLORS, COLOR_CLASSES, SPACING } from "@/lib/design-tokens";

// ==================== TYPES ====================
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

// ==================== CONSTANTS ====================
const API_ERROR_MESSAGES = {
  IDENTITY_ERROR: "Erreur lors de l'initialisation de l'identité",
  GUARDIAN_ERROR: "Erreur lors de l'initialisation de Guardian",
} as const;

// ==================== COMPONENT ====================
export default function InitApp({ dictionary }: { dictionary: InitAppDictionary }) {
  // Form with Zod validation
  const form = useZodForm({
    schema: initAppSchema,
    defaultValues: {
      companyName: "",
      userName: "",
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
      className="w-full max-w-md"
      {...testId(AUTH_TEST_IDS.initApp.card)}
    >
      <CardHeader>
        <div className="flex flex-col items-center">
          <Image 
            src="/waterfall_logo.svg" 
            alt="Waterfall Logo" 
            width={160} 
            height={44} 
            className="mb-2"
            {...testId(AUTH_TEST_IDS.initApp.logo)}
          />
          <CardTitle {...testId(AUTH_TEST_IDS.initApp.title)}>
            {dictionary.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(handleSubmit)} 
            className={SPACING.component.md}
            {...testId(AUTH_TEST_IDS.initApp.form)}
          >
            {/* Card Entreprise */}
            <Card 
              className="mb-4"
              {...testId(AUTH_TEST_IDS.initApp.companyCard)}
            >
              <CardHeader>
                <div className="text-base text-waterfall-description text-center italic">
                  {dictionary.company.title}
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.company.label}</FormLabel>
                      <FormControl>
                        <div className={`flex items-center ${SPACING.gap.sm}`}>
                          <Building2 
                            className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`}
                            {...testId(AUTH_TEST_IDS.initApp.companyIcon)}
                          />
                          <Input 
                            id="company" 
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
            {/* Card Utilisateur */}
            <Card {...testId(AUTH_TEST_IDS.initApp.userCard)}>
              <CardHeader>
                <div className="text-base text-waterfall-description text-center italic">
                  {dictionary.user.title}
                </div>
              </CardHeader>
              <CardContent>
                {/* User Name Input */}
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <div className={`flex items-center ${SPACING.gap.sm}`}>
                          <User 
                            className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`}
                            {...testId(AUTH_TEST_IDS.initApp.userIcon)}
                          />
                          <Input 
                            id="userName" 
                            type="text" 
                            {...field} 
                            placeholder="Nom de l'utilisateur"
                            {...testId(AUTH_TEST_IDS.initApp.userNameInput)}
                          />
                        </div>
                      </FormControl>
                      {form.formState.errors.userName && (
                        <div 
                          className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}
                          {...testId(AUTH_TEST_IDS.initApp.userError)}
                        >
                          {form.formState.errors.userName.message}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
                
                {/* Email Input */}
                <FormField
                  control={form.control}
                  name="userEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.user.label}</FormLabel>
                      <FormControl>
                        <div className={`flex items-center ${SPACING.gap.sm}`}>
                          <User 
                            className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`}
                          />
                          <Input 
                            id="userEmail" 
                            type="email" 
                            {...field} 
                            placeholder={dictionary.user.desc}
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
                
                {/* Password Input */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.password}</FormLabel>
                      <FormControl>
                        <div className={`flex items-center ${SPACING.gap.sm}`}>
                          <KeyRound 
                            className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`}
                            {...testId(AUTH_TEST_IDS.initApp.passwordIcon)}
                          />
                          <Input 
                            id="password" 
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
                
                {/* Password Confirmation Input */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.password} {dictionary.password_confirm}</FormLabel>
                      <FormControl>
                        <div className={`flex items-center ${SPACING.gap.sm}`}>
                          <KeyRound 
                            className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`}
                            {...testId(AUTH_TEST_IDS.initApp.confirmPasswordIcon)}
                          />
                          <Input 
                            id="confirmPassword" 
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
              id="submit" 
              type="submit" 
              className="w-full" 
              disabled={form.formState.isSubmitting}
              {...testId(AUTH_TEST_IDS.initApp.submitButton)}
            >
              {form.formState.isSubmitting ? dictionary.loading : dictionary.submit}
            </Button>
            
            {/* General Error */}
            {error && (
              <div 
                className={`${COLOR_CLASSES.text.destructive} text-sm mt-2`}
                {...testId(AUTH_TEST_IDS.initApp.errorMessage)}
              >
                {error}
              </div>
            )}
            
            {/* Success Message */}
            {success && (
              <div 
                className="text-green-600 text-sm mt-2"
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
