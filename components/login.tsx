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
	};
}

export default function Login({ dictionary }: LoginProps) {
		const [login, setLogin] = useState("");
		const [password, setPassword] = useState("");
		const router = useRouter();

		const handleSubmit = async (e: React.FormEvent) => {
			e.preventDefault();
			try {
				const res = await fetch("/api/auth/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email: login, password }),
				});
				if (!res.ok) throw new Error("Login failed");
				router.push("/welcome");
			} catch (err) {
				// Gérer l'erreur (affichage, etc.)
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
									placeholder={dictionary.password}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</div>
							<Button type="submit" className="w-full">
								{dictionary.submit}
							</Button>
						</form>
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