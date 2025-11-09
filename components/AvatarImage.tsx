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

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

interface AvatarImageProps {
  userId: string;
  size?: number;
  className?: string;
  iconSize?: number;
  iconColor?: string;
  testId?: Record<string, string>;
}

export default function AvatarImage({ 
  userId, 
  size = 40, 
  className = '',
  iconSize = 24,
  iconColor = 'text-waterfall-icon',
  testId
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <User 
        size={iconSize}
        className={iconColor}
        {...testId}
      />
    );
  }

  return (
    <Image
      src={`/api/identity/users/${userId}/avatar`}
      alt="Avatar"
      width={size}
      height={size}
      unoptimized
      className={className}
      onError={() => setHasError(true)}
      {...testId}
    />
  );
}
