"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { User, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function Login({ dictionary }: LoginProps) {
		const [login, setLogin] = useState("");
		const [password, setPassword] = useState("");
		const [error, setError] = useState<string | null>(null);
		const router = useRouter();

		const handleSubmit = async (e: React.FormEvent) => {
			e.preventDefault();
			setError(null);
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(login)) {
				setError(dictionary.invalid_email);
				return;
			}
			try {
				const res = await fetch("/api/auth/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email: login, password }),
				});
				if (!res.ok) throw new Error(dictionary.login_failed);
				router.push("/welcome");
			} catch (err) {
				setError(dictionary.login_failed);
				console.error(err);
			}
		};

		return (
			<div>
				<Card className="w-full max-w-sm">
					<CardHeader>
						<CardTitle>{dictionary.login}</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="flex items-center gap-2">
								<User className="w-5 h-5 text-waterfall-icon" />
								<Input
									type="text"
									id="email"
									placeholder={dictionary.email}
									value={login}
									onChange={(e) => setLogin(e.target.value)}
									required
								/>
							</div>
							<div className="flex items-center gap-2">
								<KeyRound className="w-5 h-5 text-waterfall-icon" />
								<Input
									type="password"
									id="password"
									placeholder={dictionary.password}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</div>
							<Button id="submit" type="submit" className="w-full">
								{dictionary.submit}
							</Button>
						</form>
						{error && <div className="text-red-500 text-sm mt-2">{error}</div>}
						<Button
							type="button"
							variant="outline"
							className="w-full mt-4"
						>
							{dictionary.register}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}