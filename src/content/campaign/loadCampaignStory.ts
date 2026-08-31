import type { CampaignStoryDefinition } from './CampaignStoryTypes';
import { parseCampaignStoryDefinition } from './CampaignStoryValidation';
import { FICTIONAL_CAMPAIGN_STORY } from './fictionalCampaignStory';

export const PRIVATE_CAMPAIGN_STORY_PATH = '/private/campaign-story.json';

export interface CampaignStoryResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type CampaignStoryFetch = (
  path: string,
  request: RequestInit,
) => Promise<CampaignStoryResponse>;

export async function loadCampaignStory(
  fetchStory: CampaignStoryFetch = (path, request) => fetch(path, request),
): Promise<CampaignStoryDefinition> {
  // A JSON-only Accept header prevents Vite's SPA fallback from rewriting a missing
  // private file request to index.html with a misleading 200 response.
  const response = await fetchStory(PRIVATE_CAMPAIGN_STORY_PATH, {
    headers: { Accept: 'application/json' },
  });
  if (response.status === 404) {
    return FICTIONAL_CAMPAIGN_STORY;
  }
  if (!response.ok) {
    throw new Error(`Private Campaign Story request failed with status ${response.status}.`);
  }

  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new Error('Private Campaign Story is invalid: malformed JSON.');
  }

  try {
    return parseCampaignStoryDefinition(value);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'unknown validation error';
    throw new Error(`Private Campaign Story is invalid: ${detail}`);
  }
}
