/**
 * GET  /api/admin/blog        — list all posts
 * POST /api/admin/blog        — create a new post
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabase, TABLES } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const published = searchParams.get('published');

  const supabase = getSupabase();
  let query = supabase
    .from(TABLES.blogPosts)
    .select('id, slug, title, excerpt, author, category, tags, published, featured, publish_date, created_at, updated_at, read_time, image', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (published === 'true') query = query.eq('published', true);
  if (published === 'false') query = query.eq('published', false);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data, total: count ?? 0, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role === 'readonly') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json() as {
      slug: string;
      title: string;
      excerpt?: string;
      content?: string;
      author?: string;
      category?: string;
      tags?: string[];
      image?: string;
      meta_description?: string;
      read_time?: string;
      featured?: boolean;
      published?: boolean;
      publish_date?: string;
    };

    if (!body.slug || !body.title) {
      return NextResponse.json({ error: 'slug and title are required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLES.blogPosts)
      .insert({
        ...body,
        tags: body.tags || [],
        created_by: session.email,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
