import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/brand
 * Fetch brand by slug or id
 * 
 * Query params:
 * - slug: Brand slug (e.g., 'open-session')
 * - id: Brand UUID
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    if (!slug && !id) {
      return NextResponse.json(
        { error: 'Either slug or id parameter is required' },
        { status: 400 }
      );
    }

    let query = supabase.from('brands').select('*');

    if (slug) {
      query = query.eq('slug', slug);
    } else if (id) {
      query = query.eq('id', id);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching brand:', error);
      return NextResponse.json(
        { error: 'Failed to fetch brand' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/brand:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

