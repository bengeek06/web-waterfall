"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Building2, User, KeyRound } from "lucide-react";
import Image from "next/image";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";

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

interface InitAppForm {
  company: string;
  user: string;
  password: string;
  passwordConfirm: string;
}

interface FieldErrors {
  company?: string;
  user?: string;
  password?: string;
  passwordConfirm?: string;
}

// ==================== CONSTANTS ====================
const VALIDATION_MESSAGES = {
  COMPANY_REQUIRED: "Le nom de l'entreprise est requis.",
  USER_REQUIRED: "L'email utilisateur est requis.",
  PASSWORD_REQUIRED: "Le mot de passe est requis.",
  PASSWORD_CONFIRM_REQUIRED: "La confirmation du mot de passe est requise.",
  PASSWORD_MISMATCH: "Les mots de passe ne correspondent pas.",
  IDENTITY_ERROR: "Erreur lors de l'initialisation de l'identité",
  GUARDIAN_ERROR: "Erreur lors de l'initialisation de Guardian",
} as const;

// ==================== COMPONENT ====================
export default function InitApp({ dictionary }: { dictionary: InitAppDictionary }) {
  // Form
  const form = useForm<InitAppForm>({ 
    defaultValues: { company: "", user: "", password: "", passwordConfirm: "" } 
  });
  
  // Router
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // ==================== HANDLERS ====================
  const handleSubmit = async (data: InitAppForm) => {
    setError(null);
    setSuccess(false);
    setPasswordError(null);
    setFieldErrors({});
    
    // Validation
    const errors: FieldErrors = {};
    if (!data.company) errors.company = VALIDATION_MESSAGES.COMPANY_REQUIRED;
    if (!data.user) errors.user = VALIDATION_MESSAGES.USER_REQUIRED;
    if (!data.password) errors.password = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    if (!data.passwordConfirm) errors.passwordConfirm = VALIDATION_MESSAGES.PASSWORD_CONFIRM_REQUIRED;
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    if (data.password !== data.passwordConfirm) {
      setPasswordError(VALIDATION_MESSAGES.PASSWORD_MISMATCH);
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Appel à l'init du service identity
      const identityRes = await fetch(IDENTITY_ROUTES.initApp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: { name: data.company },
          user: { email: data.user, password: data.password },
        }),
      });
      
      if (!identityRes.ok) throw new Error(VALIDATION_MESSAGES.IDENTITY_ERROR);
      
      const identityData = await identityRes.json();
      const company_id = identityData.company.id;
      const user_id = identityData.user.id;
      
      // 2. Appel à l'init du service guardian
      const guardianRes = await fetch(GUARDIAN_ROUTES.initApp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: { name: data.company, company_id },
          user: { email: data.user, password: data.password, user_id },
        }),
      });
      
      if (!guardianRes.ok) throw new Error(VALIDATION_MESSAGES.GUARDIAN_ERROR);
      
      setSuccess(true);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
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
                  name="company"
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
                      {fieldErrors.company && (
                        <div 
                          className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}
                          {...testId(AUTH_TEST_IDS.initApp.companyError)}
                        >
                          {fieldErrors.company}
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
                {/* Email Input */}
                <FormField
                  control={form.control}
                  name="user"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.user.label}</FormLabel>
                      <FormControl>
                        <div className={`flex items-center ${SPACING.gap.sm}`}>
                          <User 
                            className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`}
                            {...testId(AUTH_TEST_IDS.initApp.userIcon)}
                          />
                          <Input 
                            id="user" 
                            type="text" 
                            {...field} 
                            placeholder={dictionary.user.desc}
                            {...testId(AUTH_TEST_IDS.initApp.userNameInput)}
                          />
                        </div>
                      </FormControl>
                      {fieldErrors.user && (
                        <div 
                          className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}
                          {...testId(AUTH_TEST_IDS.initApp.userError)}
                        >
                          {fieldErrors.user}
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
                      {fieldErrors.password && (
                        <div 
                          className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}
                          {...testId(AUTH_TEST_IDS.initApp.passwordError)}
                        >
                          {fieldErrors.password}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
                
                {/* Password Confirmation Input */}
                <FormField
                  control={form.control}
                  name="passwordConfirm"
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
                            id="passwordConfirm" 
                            type="password" 
                            {...field} 
                            placeholder={dictionary.password_desc}
                            {...testId(AUTH_TEST_IDS.initApp.confirmPasswordInput)}
                          />
                        </div>
                      </FormControl>
                      {fieldErrors.passwordConfirm && (
                        <div 
                          className={`${COLOR_CLASSES.text.destructive} text-sm mt-1`}
                          {...testId(AUTH_TEST_IDS.initApp.confirmPasswordError)}
                        >
                          {fieldErrors.passwordConfirm}
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
              disabled={loading}
              {...testId(AUTH_TEST_IDS.initApp.submitButton)}
            >
              {loading ? dictionary.loading : dictionary.submit}
            </Button>
            
            {/* Password Mismatch Error */}
            {passwordError && (
              <div 
                className={`${COLOR_CLASSES.text.destructive} text-sm mt-2`}
                {...testId(AUTH_TEST_IDS.initApp.passwordMismatchError)}
              >
                {passwordError}
              </div>
            )}
            
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
