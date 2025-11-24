import React from "react";
import { getUserData } from "@/lib/server/user";
import { getUserLanguage } from "@/lib/utils/locale";
import { getDictionary } from "@/lib/utils/dictionaries";
import { COLOR_CLASSES } from "@/lib/design-tokens";
import { HomeCards } from "@/components/cards/HomeCards";

export default async function WelcomePage() {
  const user = await getUserData();
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);
  
  // Middleware ensures user is authenticated - if user is null, redirect happens
  if (!user) {
    return null; // Should never happen due to middleware, but TypeScript safety
  }
  
  const displayName = user.first_name || user.email;
  
  return (
    <div>
      {/* Welcome message */}
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className={`text-3xl font-bold ${COLOR_CLASSES.text.waterfallPrimaryDark}`}>
          {dictionary.welcome_page.greeting} {displayName}!
        </h1>
      </div>
      
      {/* Cards avec gestion des permissions */}
      <HomeCards dictionary={dictionary.welcome_page} />
    </div>
  );
}
