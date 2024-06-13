'use server'

import { createClient } from '@/utils/supabase/server';

// const SERVER_URL = "http://127.0.0.1:5000";
const SERVER_URL = "http://localhost:5000";

export async function createEpisode(req) {
    const response = await fetch(`${SERVER_URL}/create_episode`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            req: req,
        }),
    });
    return response.json();
}

export async function getEpisodes() {
    const { data, error } = await createClient().from('episodes').select('*');
    if (error) {
        return { error };
    }
    return { data };
}

export async function getEpisode(id) {
    const { data, error } = await createClient().from('episodes').select('*').eq('id', id).single();
    if (error) {
        return { error };
    }
    return { data };
}

export async function getEpisodeDetails(episodeId) {
    const supabase = createClient();

    // Fetch episode details
    const { data: episodeData, error: episodeError } = await supabase
        .from('episodes')
        .select('*')
        .eq('id', episodeId)
        .single();

    if (episodeError) {
        return { error: episodeError };
    }

    // Fetch clips for the episode
    const { data: clipsData, error: clipsError } = await supabase
        .from('clips')
        .select('*')
        .eq('episode', episodeId)
        .order('index', { ascending: true });

    if (clipsError) {
        return { error: clipsError };
    }

    // Fetch transitions for the episode
    const { data: transitionsData, error: transitionsError } = await supabase
        .from('transitions')
        .select('*')
        .eq('episode', episodeId)
        .order('index', { ascending: true });

    if (transitionsError) {
        return { error: transitionsError };
    }

    // Fetch transitions for the episode
    const { data: introsData, error: introsError } = await supabase
        .from('intros')
        .select('*')
        .eq('episode', episodeId)
        .single();

    if (introsError) {
        return { error: introsError };
    }

    // Combine clips and transitions with transitions first
    const clipsAndTransitions = [];
    const maxLength = Math.max(clipsData.length, transitionsData.length, introsData ? 1 : 0);

    for (let i = 0; i < maxLength; i++) {
        if (i === 0 && introsData) {
            clipsAndTransitions.push({
                ...introsData,
                type: 'intro',
            });
        }
        if (i < clipsData.length) {
            clipsAndTransitions.push({
                ...clipsData[i],
                type: 'clip',
            });
        }
        if (i < transitionsData.length) {
            clipsAndTransitions.push({
                ...transitionsData[i],
                type: 'transition',
            });
        }
    }

    return {
        data: {
            episode: episodeData,
            clips: clipsAndTransitions,
        },
    };
}
