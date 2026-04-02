// app/api/analyses/[id]/route.js
// DELETE /api/analyses/:id — Delete a specific analysis

import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabase-server.js';
import logger from '../../../../lib/logger.js';
import { requireAuth } from '../../../../lib/middleware/auth.js';
import { applyRateLimit } from '../../../../lib/middleware/rateLimit.js';

export async function DELETE(request, { params }) {
  const { id } = params;

  const { user, errorResponse: authError } = await requireAuth(request);
  if (authError) return authError;

  const rateLimitError = applyRateLimit(request, user.id, 'general');
  if (rateLimitError) return rateLimitError;

  try {
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Enforce ownership

    if (error) throw error;

    logger.info('Analysis deleted', { analysisId: id, userId: user.id });
    return NextResponse.json({ success: true, message: 'Analysis deleted' });
  } catch (err) {
    logger.error('Delete failed', { id, userId: user.id, error: err.message });
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
