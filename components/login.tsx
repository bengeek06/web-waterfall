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

// ==================== CONSTANTS ====================
const VALIDATION = {
	EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// ==================== COMPONENT ====================
export default function Login({ dictionary }: LoginProps) {
	// Router
	const router = useRouter();

	// State
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// ==================== HANDLERS ====================
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Validate email
		if (!VALIDATION.EMAIL_REGEX.test(email)) {
			setError(dictionary.invalid_email);
			return;
		}

		setIsLoading(true);

		try {
			const res = await fetch(AUTH_ROUTES.login, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (!res.ok) throw new Error(dictionary.login_failed);

			router.push("/welcome");
		} catch (err) {
			setError(dictionary.login_failed);
			console.error(err);
		} finally {
			setIsLoading(false);
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
						onSubmit={handleSubmit} 
						className={SPACING.component.md}
						{...testId(AUTH_TEST_IDS.login.form)}
					>
						{/* Email Input */}
						<div className={`flex items-center ${SPACING.gap.sm}`}>
							<User 
								className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`}
								{...testId(AUTH_TEST_IDS.login.emailIcon)}
							/>
							<Input
								type="email"
								placeholder={dictionary.email}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={isLoading}
								required
								{...testId(AUTH_TEST_IDS.login.emailInput)}
							/>
						</div>

						{/* Password Input */}
						<div className={`flex items-center ${SPACING.gap.sm}`}>
							<KeyRound 
								className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`}
								{...testId(AUTH_TEST_IDS.login.passwordIcon)}
							/>
							<Input
								type="password"
								placeholder={dictionary.password}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isLoading}
								required
								{...testId(AUTH_TEST_IDS.login.passwordInput)}
							/>
						</div>

						{/* Submit Button */}
						<Button 
							type="submit" 
							className="w-full"
							disabled={isLoading}
							{...testId(AUTH_TEST_IDS.login.submitButton)}
						>
							{isLoading ? "Loading..." : dictionary.submit}
						</Button>
					</form>

					{/* Error Message */}
					{error && (
						<div 
							className={`${COLOR_CLASSES.text.destructive} text-sm mt-2`}
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
						disabled={isLoading}
						{...testId(AUTH_TEST_IDS.login.registerButton)}
					>
						{dictionary.register}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}