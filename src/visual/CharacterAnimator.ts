import type { Group } from 'three';
import type { ContactShadow } from './ContactShadow';

export interface CharacterRig {
  readonly visualRoot: Group;
  readonly body: Group;
  readonly head: Group;
  readonly leftArm: Group;
  readonly rightArm: Group;
  readonly leftLeg: Group;
  readonly rightLeg: Group;
  readonly contactShadow: ContactShadow;
}

export interface CharacterAnimationInput {
  readonly actualSpeed: number;
  readonly maximumSpeed: number;
  readonly carrying: boolean;
}

export interface CharacterPoseSample {
  readonly movementAmount: number;
  readonly bodyBob: number;
  readonly limbSwing: number;
  readonly idleBreath: number;
}

const INTERACTION_DURATION_SECONDS = 0.22;

export function sampleCharacterPose(
  walkPhase: number,
  idlePhase: number,
  movementAmount: number,
): CharacterPoseSample {
  const safeMovement = Math.min(1, Math.max(0, movementAmount));
  return {
    movementAmount: safeMovement,
    bodyBob: Math.abs(Math.sin(walkPhase * 2)) * 0.055 * safeMovement,
    limbSwing: Math.sin(walkPhase) * 0.58 * safeMovement,
    idleBreath: Math.sin(idlePhase) * 0.012 * (1 - safeMovement),
  };
}

export class CharacterAnimator {
  private walkPhase = 0;
  private idlePhase = 0;
  private movementAmount = 0;
  private interactionRemaining = 0;

  public constructor(private readonly rig: CharacterRig) {}

  public triggerInteraction(): void {
    this.interactionRemaining = INTERACTION_DURATION_SECONDS;
  }

  public reset(): void {
    this.walkPhase = 0;
    this.idlePhase = 0;
    this.movementAmount = 0;
    this.interactionRemaining = 0;
    this.applyPose(sampleCharacterPose(0, 0, 0), false, 0);
  }

  public update(deltaSeconds: number, input: CharacterAnimationInput): void {
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    const speedRatio = input.maximumSpeed <= 0
      ? 0
      : Math.min(1, Math.max(0, input.actualSpeed / input.maximumSpeed));
    const smoothing = 1 - Math.exp(-12 * delta);
    this.movementAmount += (speedRatio - this.movementAmount) * smoothing;
    this.walkPhase += input.actualSpeed * delta * 4.6;
    this.idlePhase += delta * 2.1;

    this.interactionRemaining = Math.max(0, this.interactionRemaining - delta);
    const interactionProgress = this.interactionRemaining <= 0
      ? 0
      : 1 - this.interactionRemaining / INTERACTION_DURATION_SECONDS;
    const interactionImpulse = Math.sin(interactionProgress * Math.PI);

    this.applyPose(
      sampleCharacterPose(this.walkPhase, this.idlePhase, this.movementAmount),
      input.carrying,
      interactionImpulse,
    );
  }

  private applyPose(
    pose: CharacterPoseSample,
    carrying: boolean,
    interactionImpulse: number,
  ): void {
    const carryBlend = carrying ? 1 : 0;
    this.rig.visualRoot.position.y = pose.bodyBob + pose.idleBreath + interactionImpulse * 0.045;
    this.rig.visualRoot.scale.set(
      1 + interactionImpulse * 0.035,
      1 - interactionImpulse * 0.025,
      1 + interactionImpulse * 0.035,
    );
    this.rig.body.rotation.z = Math.sin(this.walkPhase) * 0.035 * pose.movementAmount;
    this.rig.head.position.y = 0.54 + pose.idleBreath * 0.45;
    this.rig.head.rotation.z = -this.rig.body.rotation.z * 0.45;

    const freeArmSwing = pose.limbSwing * 0.82;
    const carryArmAngle = -1.02;
    this.rig.leftArm.rotation.x = freeArmSwing * (1 - carryBlend) + carryArmAngle * carryBlend;
    this.rig.rightArm.rotation.x = -freeArmSwing * (1 - carryBlend) + carryArmAngle * carryBlend;
    this.rig.leftArm.rotation.z = -0.05 - carryBlend * 0.18;
    this.rig.rightArm.rotation.z = 0.05 + carryBlend * 0.18;

    this.rig.leftLeg.rotation.x = -pose.limbSwing;
    this.rig.rightLeg.rotation.x = pose.limbSwing;

    const shadowScale = 1 - pose.bodyBob * 0.5 - interactionImpulse * 0.06;
    const shadowOpacity = 1 - pose.bodyBob * 1.8 - interactionImpulse * 0.18;
    this.rig.contactShadow.setStrength(shadowScale, shadowOpacity);
  }
}
