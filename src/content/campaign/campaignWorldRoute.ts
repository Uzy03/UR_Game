import type { WorldRouteDefinition } from '../../world/WorldRoute';
import type { CampaignSequences } from './campaignSequences';
import {
  CAMPAIGN_AFTER_MEETING_CHECKPOINT_ID,
  CAMPAIGN_AFTER_OUTING_CHECKPOINT_ID,
  CAMPAIGN_AFTER_PREPARATION_CHECKPOINT_ID,
  CAMPAIGN_BEFORE_ENDING_CHECKPOINT_ID,
  CAMPAIGN_COMPLETE_CHECKPOINT_ID,
  CAMPAIGN_INITIAL_CHECKPOINT_ID,
} from './campaignIds';

export const CAMPAIGN_ROUTE_MEETING_ID = 'campaign-route-meeting';
export const CAMPAIGN_ROUTE_OUTING_ID = 'campaign-route-outing';
export const CAMPAIGN_ROUTE_PREPARATION_ID = 'campaign-route-preparation';
export const CAMPAIGN_ROUTE_JOURNEY_ID = 'campaign-route-journey';
export const CAMPAIGN_ROUTE_ENDING_ID = 'campaign-route-ending';

export const CAMPAIGN_ROUTE_NODE_IDS = [
  CAMPAIGN_ROUTE_MEETING_ID,
  CAMPAIGN_ROUTE_OUTING_ID,
  CAMPAIGN_ROUTE_PREPARATION_ID,
  CAMPAIGN_ROUTE_JOURNEY_ID,
  CAMPAIGN_ROUTE_ENDING_ID,
] as const;

export function createCampaignWorldRoute(
  sequences: CampaignSequences,
): WorldRouteDefinition {
  return {
    initialCheckpointId: CAMPAIGN_INITIAL_CHECKPOINT_ID,
    initialVehicleSpawn: { x: -7.4, y: 0, z: 3.8 },
    nodes: [
      {
        id: CAMPAIGN_ROUTE_MEETING_ID,
        label: '1-1',
        stageLabel: 'Cafe / Meeting',
        position: { x: -6.1, y: 0, z: 2.35 },
        vehicleSpawn: { x: -7.15, y: 0, z: 3.25 },
        completionCheckpointId: CAMPAIGN_AFTER_MEETING_CHECKPOINT_ID,
        entrySequence: sequences.routeEntries.meeting,
      },
      {
        id: CAMPAIGN_ROUTE_OUTING_ID,
        label: '1-2',
        stageLabel: 'Park / Outing',
        position: { x: -3.1, y: 0, z: -0.6 },
        vehicleSpawn: { x: -4.15, y: 0, z: 0.3 },
        completionCheckpointId: CAMPAIGN_AFTER_OUTING_CHECKPOINT_ID,
        entrySequence: sequences.routeEntries.outing,
      },
      {
        id: CAMPAIGN_ROUTE_PREPARATION_ID,
        label: '1-3',
        stageLabel: 'Prep Space / Preparation',
        position: { x: 0.1, y: 0, z: 1.55 },
        vehicleSpawn: { x: -0.95, y: 0, z: 2.45 },
        completionCheckpointId: CAMPAIGN_AFTER_PREPARATION_CHECKPOINT_ID,
        entrySequence: sequences.routeEntries.preparation,
      },
      {
        id: CAMPAIGN_ROUTE_JOURNEY_ID,
        label: '1-4',
        stageLabel: 'Viewpoint / Journey',
        position: { x: 3.55, y: 0, z: -1.2 },
        vehicleSpawn: { x: 2.5, y: 0, z: -0.3 },
        completionCheckpointId: CAMPAIGN_BEFORE_ENDING_CHECKPOINT_ID,
        entrySequence: sequences.routeEntries.journey,
      },
      {
        id: CAMPAIGN_ROUTE_ENDING_ID,
        label: '1-5',
        stageLabel: 'Ending Room',
        position: { x: 6.45, y: 0, z: 2.15 },
        vehicleSpawn: { x: 5.35, y: 0, z: 3.05 },
        completionCheckpointId: CAMPAIGN_COMPLETE_CHECKPOINT_ID,
        entrySequence: sequences.routeEntries.ending,
      },
    ],
  };
}
