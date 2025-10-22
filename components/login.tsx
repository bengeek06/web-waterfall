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
import { ICON_SIZES, ICON_COLORS, COLOR_CLASSES, SPACING } from "@/lib/design-tokens";

// Validation
import { useZodForm } from "@/lib/hooks";
import { loginSchema, LoginFormData } from "@/lib/validation";

// ==================== TYPES ====================
interface LoginProps {
	dictionary: {
		login: string;
		email: string;
		password: string;
		submit: string;
		register: string;
		invalid_email: string;
		login_failed: string;
	};
}

// ==================== COMPONENT ====================
export default function Login({ dictionary }: LoginProps) {
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

			router.push("/welcome");
		} catch (err) {
			setError(dictionary.login_failed);
			console.error(err);
		}
	};

	// ==================== RENDER ====================
	return (
		<div>
			<Card 
				className="w-full max-w-sm"
				{...testId(AUTH_TEST_IDS.login.card)}
			>
				<CardHeader>
					<CardTitle {...testId(AUTH_TEST_IDS.login.title)}>
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
									className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`}
									{...testId(AUTH_TEST_IDS.login.emailIcon)}
								/>
								<Input
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
									className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`}
									{...testId(AUTH_TEST_IDS.login.passwordIcon)}
								/>
								<Input
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
							type="submit" 
							className="w-full"
							disabled={isSubmitting}
							{...testId(AUTH_TEST_IDS.login.submitButton)}
						>
							{isSubmitting ? "Loading..." : dictionary.submit}
						</Button>
					</form>

					{/* Error Message */}
					{error && (
						<div 
							className={`${COLOR_CLASSES.text.destructive} ${SPACING.component.md} text-center`}
							{...testId(AUTH_TEST_IDS.login.errorMessage)}
						>
							{error}
						</div>
					)}

					{/* Register Button */}
					<Button
						type="button"
						variant="outline"
						className="w-full mt-4"
						disabled={isSubmitting}
						{...testId(AUTH_TEST_IDS.login.registerButton)}
					>
						{dictionary.register}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}