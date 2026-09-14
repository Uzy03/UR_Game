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

export type CharacterWorkMode = 'none' | 'processing' | 'assembly';

const INTERACTION_DURATION_SECONDS = 0.22;
const DASH_FEEDBACK_DURATION_SECONDS = 0.2;
const THROW_FEEDBACK_DURATION_SECONDS = 0.28;
const IMPACT_FEEDBACK_DURATION_SECONDS = 0.18;
const CATCH_FEEDBACK_DURATION_SECONDS = 0.3;

function actionImpulse(remainingSeconds: number, durationSeconds: number): number {
  if (remainingSeconds <= 0) {
    return 0;
  }
  const progress = Math.min(1, Math.max(0, 1 - remainingSeconds / durationSeconds));
  return Math.sin(progress * Math.PI);
}

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
  private dashRemaining = 0;
  private throwRemaining = 0;
  private impactRemaining = 0;
  private catchRemaining = 0;
  private requestedWorkMode: CharacterWorkMode = 'none';
  private displayedWorkMode: Exclude<CharacterWorkMode, 'none'> = 'processing';
  private workBlend = 0;
  private workPhase = 0;
  private bumpRemaining = 0;
  private bumpDuration = 1;
  private bumpOffsetX = 0;
  private bumpOffsetZ = 0;

  public constructor(private readonly rig: CharacterRig) {}

  public triggerInteraction(): void {
    this.interactionRemaining = INTERACTION_DURATION_SECONDS;
  }

  public triggerDash(): void {
    this.dashRemaining = DASH_FEEDBACK_DURATION_SECONDS;
  }

  public triggerThrow(): void {
    this.throwRemaining = THROW_FEEDBACK_DURATION_SECONDS;
  }

  public triggerImpact(): void {
    this.impactRemaining = IMPACT_FEEDBACK_DURATION_SECONDS;
  }

  public triggerCatch(): void {
    this.catchRemaining = CATCH_FEEDBACK_DURATION_SECONDS;
  }

  public triggerBump(
    direction: Readonly<{ x: number; z: number }>,
    offset: number,
    recoverySeconds: number,
  ): void {
    const length = Math.hypot(direction.x, direction.z);
    if (
      !Number.isFinite(length)
      || length <= Number.EPSILON
      || !Number.isFinite(offset)
      || offset <= 0
      || !Number.isFinite(recoverySeconds)
      || recoverySeconds <= 0
    ) {
      return;
    }
    this.bumpOffsetX = direction.x / length * offset;
    this.bumpOffsetZ = direction.z / length * offset;
    this.bumpDuration = recoverySeconds;
    this.bumpRemaining = recoverySeconds;
  }

  public setWorkMode(mode: CharacterWorkMode): void {
    this.requestedWorkMode = mode;
    if (mode !== 'none') {
      this.displayedWorkMode = mode;
    }
  }

  public getPresentationOffset(target: import('three').Vector3): import('three').Vector3 {
    return target.set(this.rig.visualRoot.position.x, 0, this.rig.visualRoot.position.z);
  }

  public reset(): void {
    this.walkPhase = 0;
    this.idlePhase = 0;
    this.movementAmount = 0;
    this.interactionRemaining = 0;
    this.dashRemaining = 0;
    this.throwRemaining = 0;
    this.impactRemaining = 0;
    this.catchRemaining = 0;
    this.requestedWorkMode = 'none';
    this.displayedWorkMode = 'processing';
    this.workBlend = 0;
    this.workPhase = 0;
    this.bumpRemaining = 0;
    this.bumpDuration = 1;
    this.bumpOffsetX = 0;
    this.bumpOffsetZ = 0;
    this.applyPose(sampleCharacterPose(0, 0, 0), false, 0, 0, 0, 0, 0, 0);
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
    this.dashRemaining = Math.max(0, this.dashRemaining - delta);
    this.throwRemaining = Math.max(0, this.throwRemaining - delta);
    this.impactRemaining = Math.max(0, this.impactRemaining - delta);
    this.catchRemaining = Math.max(0, this.catchRemaining - delta);
    const workTarget = this.requestedWorkMode === 'none'
      ? 0
      : Math.max(0, 1 - speedRatio * 3.2);
    this.workBlend += (workTarget - this.workBlend) * (1 - Math.exp(-10 * delta));
    this.workPhase += delta * (this.displayedWorkMode === 'processing' ? 9 : 6.4);
    const interactionImpulse = actionImpulse(
      this.interactionRemaining,
      INTERACTION_DURATION_SECONDS,
    );
    const dashImpulse = actionImpulse(this.dashRemaining, DASH_FEEDBACK_DURATION_SECONDS);
    const throwImpulse = actionImpulse(this.throwRemaining, THROW_FEEDBACK_DURATION_SECONDS);
    const impactImpulse = actionImpulse(this.impactRemaining, IMPACT_FEEDBACK_DURATION_SECONDS);
    const catchImpulse = actionImpulse(this.catchRemaining, CATCH_FEEDBACK_DURATION_SECONDS);
    const bumpAmount = this.bumpDuration > 0
      ? Math.min(1, Math.max(0, this.bumpRemaining / this.bumpDuration)) ** 2
      : 0;

    this.applyPose(
      sampleCharacterPose(this.walkPhase, this.idlePhase, this.movementAmount),
      input.carrying,
      interactionImpulse,
      dashImpulse,
      throwImpulse,
      impactImpulse,
      catchImpulse,
      bumpAmount,
    );
    this.bumpRemaining = Math.max(0, this.bumpRemaining - delta);
  }

  private applyPose(
    pose: CharacterPoseSample,
    carrying: boolean,
    interactionImpulse: number,
    dashImpulse: number,
    throwImpulse: number,
    impactImpulse: number,
    catchImpulse: number,
    bumpAmount: number,
  ): void {
    const carryBlend = carrying ? 1 : 0;
    this.rig.visualRoot.position.set(
      this.bumpOffsetX * bumpAmount,
      pose.bodyBob
      + pose.idleBreath
      + interactionImpulse * 0.045
      + dashImpulse * 0.02
      + throwImpulse * 0.025
      + impactImpulse * 0.035
      + catchImpulse * 0.06,
      this.bumpOffsetZ * bumpAmount,
    );
    this.rig.visualRoot.scale.set(
      1 + interactionImpulse * 0.035 - dashImpulse * 0.04 + impactImpulse * 0.06,
      1 - interactionImpulse * 0.025 - dashImpulse * 0.08 - impactImpulse * 0.12,
      1 + interactionImpulse * 0.035 + dashImpulse * 0.12 + impactImpulse * 0.08,
    );
    const workPulse = Math.sin(this.workPhase);
    const workPress = (Math.sin(this.workPhase * 2) + 1) * 0.5;
    this.rig.visualRoot.rotation.x = (
      -dashImpulse * 0.12
      + throwImpulse * 0.05
      + catchImpulse * 0.06
      - this.workBlend * (this.displayedWorkMode === 'processing' ? 0.08 : 0.055)
    );
    this.rig.visualRoot.rotation.z = -this.bumpOffsetX * bumpAmount * 0.32;
    this.rig.body.rotation.x = (
      -dashImpulse * 0.18
      + throwImpulse * 0.12
      + catchImpulse * 0.1
      - this.workBlend * (this.displayedWorkMode === 'processing' ? 0.12 : 0.08)
    );
    this.rig.body.rotation.z = (
      Math.sin(this.walkPhase) * 0.035 * pose.movementAmount
      + workPulse * 0.025 * this.workBlend
      - this.bumpOffsetX * bumpAmount * 0.22
    );
    this.rig.head.position.y = 0.54 + pose.idleBreath * 0.45;
    this.rig.head.rotation.z = -this.rig.body.rotation.z * 0.45;

    const freeArmSwing = pose.limbSwing * 0.82;
    const carryArmAngle = -1.02;
    this.rig.leftArm.rotation.x = (
      freeArmSwing * (1 - carryBlend)
      + carryArmAngle * carryBlend
      - throwImpulse * 0.45
      - catchImpulse * 0.72
    );
    this.rig.rightArm.rotation.x = (
      -freeArmSwing * (1 - carryBlend)
      + carryArmAngle * carryBlend
      - throwImpulse * 1.15
      - catchImpulse * 0.72
    );
    this.rig.leftArm.rotation.z = -0.05 - carryBlend * 0.18;
    this.rig.rightArm.rotation.z = 0.05 + carryBlend * 0.18;

    if (this.workBlend > 0.0001) {
      if (this.displayedWorkMode === 'processing') {
        this.rig.leftArm.rotation.x -= (0.75 + workPulse * 0.34) * this.workBlend;
        this.rig.rightArm.rotation.x -= (0.75 - workPulse * 0.34) * this.workBlend;
        this.rig.leftArm.rotation.z += 0.14 * this.workBlend;
        this.rig.rightArm.rotation.z -= 0.14 * this.workBlend;
      } else {
        this.rig.leftArm.rotation.x -= (0.82 + workPress * 0.2) * this.workBlend;
        this.rig.rightArm.rotation.x -= (0.82 + (1 - workPress) * 0.2) * this.workBlend;
        this.rig.leftArm.rotation.z += 0.34 * this.workBlend;
        this.rig.rightArm.rotation.z -= 0.34 * this.workBlend;
      }
    }

    this.rig.leftLeg.rotation.x = -pose.limbSwing;
    this.rig.rightLeg.rotation.x = pose.limbSwing;

    const shadowScale = (
      1
      - pose.bodyBob * 0.5
      - interactionImpulse * 0.06
      - dashImpulse * 0.05
      - impactImpulse * 0.05
    );
    const shadowOpacity = (
      1
      - pose.bodyBob * 1.8
      - interactionImpulse * 0.18
      - dashImpulse * 0.08
      - impactImpulse * 0.1
    );
    this.rig.contactShadow.setStrength(shadowScale, shadowOpacity);
  }
}
