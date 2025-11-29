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

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const versionPath = path.join(process.cwd(), 'VERSION');
    const version = fs.readFileSync(versionPath, 'utf-8').trim();

    return NextResponse.json({ version });
  } catch (error) {
    return NextResponse.json(
      { error: 'Version file not found', version: 'Unknown' },
      { status: 500 }
    );
  }
}
