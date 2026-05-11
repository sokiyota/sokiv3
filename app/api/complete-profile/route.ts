import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, wallet, bio, games, music, forums } = body;

    if (!id || typeof id !== 'string' || !UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid profile id' }, { status: 400 });
    }

    if (!wallet || !bio) {
      return NextResponse.json({ error: 'wallet and bio are required' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const gamesArr = Array.isArray(games)
      ? games
      : String(games)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);

    const musicArr = Array.isArray(music)
      ? music
      : String(music)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);

    const forumsArr = Array.isArray(forums)
      ? forums
      : String(forums)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        wallet,
        bio,
        games: gamesArr,
        music: musicArr,
        forums: forumsArr,
      })
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('complete-profile:', error);
      return NextResponse.json(
        { error: 'Update failed', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
