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
import { User, KeyRound } from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Constants
import { AUTH_ROUTES } from "@/lib/api-routes";
import { AUTH_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, COLOR_CLASSES, SPACING } from "@/lib/design-tokens";

// Validation
import { useZodForm } from "@/lib/hooks";
import { loginSchema, LoginFormData } from "@/lib/validation";

// Token refresh scheduler
import { initTokenRefresh } from "@/lib/tokenRefreshScheduler";

// ==================== TYPES ====================
interface LoginProps {
	dictionary: {
		login: string;
		email: string;
		password: string;
		submit: string;
		invalid_email: string;
		login_failed: string;
	};
}

// ==================== CONSTANTS ====================
const FORM_IDS = {
	EMAIL_INPUT: "email",
	PASSWORD_INPUT: "password",
	SUBMIT_BUTTON: "submit",
} as const;

// ==================== COMPONENT ====================
export default function Login({ dictionary }: Readonly<LoginProps>) {
	// Router
	const router = useRouter();

	// State
	const [error, setError] = useState<string | null>(null);

	// Form with Zod validation
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useZodForm({
		schema: loginSchema,
		defaultValues: {
			email: "",
			password: "",
		},
	});

	// ==================== HANDLERS ====================
	const onSubmit = async (data: LoginFormData) => {
		setError(null);

		try {
			const res = await fetch(AUTH_ROUTES.login, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!res.ok) throw new Error(dictionary.login_failed);

			// Initialiser le refresh automatique du token après connexion réussie
			await initTokenRefresh();

			router.push("/home");
		} catch (err) {
			setError(dictionary.login_failed);
			console.error(err);
		}
	};

	// ==================== RENDER ====================
	return (
		<Card 
			className="w-full shadow-lg border-0 bg-white"
			{...testId(AUTH_TEST_IDS.login.card)}
		>
			<CardHeader className="pt-8 pb-6 rounded-t-[10px]">
				<CardTitle 
					className={`text-2xl font-bold ${COLOR_CLASSES.text.waterfallPrimaryDark} text-center`}
					{...testId(AUTH_TEST_IDS.login.title)}
				>
					{dictionary.login}
				</CardTitle>
			</CardHeader>
				<CardContent>
					<form 
						onSubmit={handleSubmit(onSubmit)} 
						className={SPACING.component.md}
						{...testId(AUTH_TEST_IDS.login.form)}
					>
						{/* Email Input */}
						<div>
							<div className={`flex items-center ${SPACING.gap.sm}`}>
								<User 
									className={`${ICON_SIZES.md} ${COLOR_CLASSES.text.waterfallUser}`}
									{...testId(AUTH_TEST_IDS.login.emailIcon)}
								/>
								<Input
									id={FORM_IDS.EMAIL_INPUT}
									type="email"
									placeholder={dictionary.email}
									disabled={isSubmitting}
									required
									{...register("email")}
									{...testId(AUTH_TEST_IDS.login.emailInput)}
								/>
							</div>
							{errors.email && (
								<div className={`${COLOR_CLASSES.text.destructive} text-sm mt-1 ml-8`}>
									{errors.email.message}
								</div>
							)}
						</div>

						{/* Password Input */}
						<div>
							<div className={`flex items-center ${SPACING.gap.sm}`}>
								<KeyRound 
									className={`${ICON_SIZES.md} ${COLOR_CLASSES.text.waterfallUser}`}
									{...testId(AUTH_TEST_IDS.login.passwordIcon)}
								/>
								<Input
									id={FORM_IDS.PASSWORD_INPUT}
									type="password"
									placeholder={dictionary.password}
									disabled={isSubmitting}
									required
									{...register("password")}
									{...testId(AUTH_TEST_IDS.login.passwordInput)}
								/>
							</div>
							{errors.password && (
								<div className={`${COLOR_CLASSES.text.destructive} text-sm mt-1 ml-8`}>
									{errors.password.message}
								</div>
							)}
						</div>

						{/* Submit Button */}
						<Button 
							id={FORM_IDS.SUBMIT_BUTTON}
							type="submit" 
							className={`w-full ${COLOR_CLASSES.bg.waterfallPrimaryDark} hover:bg-[var(--waterfall-primary-hover)] text-white font-semibold py-6 text-lg shadow-md hover:shadow-lg transition-all`}
							disabled={isSubmitting}
							{...testId(AUTH_TEST_IDS.login.submitButton)}
						>
							{isSubmitting ? "Loading..." : dictionary.submit}
						</Button>
					</form>

					{/* Error Message */}
					{error && (
						<div 
							className={`${COLOR_CLASSES.bg.destructive} ${COLOR_CLASSES.border.destructive} ${COLOR_CLASSES.text.destructive} px-4 py-3 rounded text-sm text-center mt-4`}
							{...testId(AUTH_TEST_IDS.login.errorMessage)}
						>
							{error}
						</div>
					)}
				</CardContent>
		</Card>
	);
}