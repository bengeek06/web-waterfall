'use client';

import { clientFetch } from "@/lib/clientFetch";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

export default function LogoutButton({ children, className, testId }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await clientFetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Rediriger vers la page de login après le logout
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Même en cas d'erreur, rediriger vers login (tokens probablement expirés)
      router.push('/login');
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className={className}
      {...(testId && { 'data-testid': testId })}
    >
      {children}
    </button>
  );
}