import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { FollowCamera } from '../camera/FollowCamera';
import { GAME_CONFIG } from '../config/gameConfig';
import { PHASE3_DEMO_SEQUENCE } from '../content/demo/phase3DemoSequence';
import { DialogueManager } from '../dialogue/DialogueManager';
import { EventRunner } from '../events/EventRunner';
import { PlacementTaskEventBinding } from '../events/PlacementTaskEventBinding';
import { InputManager } from '../input/InputManager';
import { KeyboardInput } from '../input/KeyboardInput';
import { CarrySystem } from '../interaction/CarrySystem';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { NPCController } from '../npc/NPCController';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { PlayerController } from '../player/PlayerController';
import { Stage } from '../stage/Stage';
import { CountdownTimer } from '../task/CountdownTimer';
import { PlacementTask } from '../task/PlacementTask';
import { TaskManager } from '../task/TaskManager';
import { DialogueUI } from '../ui/DialogueUI';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { ResultOverlay } from '../ui/ResultOverlay';
import { SpeechBubble } from '../ui/SpeechBubble';
import { TaskHUD } from '../ui/TaskHUD';

function requireElement(id: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`#${id}`);
  if (element === null) {
    throw new Error(`Required UI element #${id} was not found.`);
  }
  return element;
}

export class Game {
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly renderer: WebGLRenderer;
  private readonly input: InputManager;
  private readonly physics: PhysicsWorld;
  private readonly player: PlayerController;
  private readonly npc: NPCController;
  private readonly interaction: InteractionSystem;
  private readonly eventRunner: EventRunner;
  private readonly speechBubble: SpeechBubble;
  private readonly followCamera: FollowCamera;
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;

  private constructor(
    private readonly container: HTMLElement,
    physics: PhysicsWorld,
  ) {
    this.physics = physics;
    this.scene.background = new Color(GAME_CONFIG.renderer.clearColor);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.domElement.tabIndex = 0;
    container.append(this.renderer.domElement);

    this.camera = new PerspectiveCamera(
      GAME_CONFIG.camera.fov,
      1,
      GAME_CONFIG.camera.near,
      GAME_CONFIG.camera.far,
    );

    this.input = new InputManager([new KeyboardInput(window)]);
    const stage = new Stage(this.scene, this.physics, GAME_CONFIG.stage);

    const character = this.physics.createKinematicCharacter({
      position: GAME_CONFIG.player.spawn,
      radius: GAME_CONFIG.player.collider.radius,
      halfHeight: GAME_CONFIG.player.collider.halfHeight,
      offset: GAME_CONFIG.physics.characterOffset,
    });
    this.player = new PlayerController(this.input, character, {
      speed: GAME_CONFIG.player.speed,
      turnSharpness: GAME_CONFIG.player.turnSharpness,
      groundProbeSpeed: GAME_CONFIG.physics.groundProbeSpeed,
    });
    this.scene.add(this.player.object);

    const carry = new CarrySystem(
      this.player.carryAnchor,
      stage.object,
      stage.pickableItems,
      (position, item, allItems) => stage.isFloorDropPositionValid(
        position,
        item,
        allItems,
        GAME_CONFIG.interaction.floorItemSpacing,
      ),
    );
    this.interaction = new InteractionSystem(
      this.input,
      this.player.object,
      carry,
      [...stage.pickableItems, ...stage.placePoints],
      new InteractionPrompt(requireElement('interaction-prompt')),
      GAME_CONFIG.interaction,
    );

    this.npc = new NPCController({
      id: GAME_CONFIG.npc.id,
      displayName: GAME_CONFIG.npc.displayName,
      position: GAME_CONFIG.npc.spawn,
      moveSpeed: GAME_CONFIG.npc.moveSpeed,
      turnSharpness: GAME_CONFIG.npc.turnSharpness,
    });
    this.scene.add(this.npc.object);
    this.interaction.register(this.npc);

    const taskManager = new TaskManager();
    const placementTask = new PlacementTask(new CountdownTimer(), {
      id: GAME_CONFIG.phase2.placementTask.id,
      label: GAME_CONFIG.phase2.placementTask.label,
      requiredItemIds: GAME_CONFIG.phase2.placementTask.requiredItemIds,
      targetPlacePoints: stage.getPlacePoints(
        GAME_CONFIG.phase2.placementTask.targetPlacePointIds,
      ),
      durationSeconds: GAME_CONFIG.phase2.taskDurationSeconds,
    });
    const dialogue = new DialogueManager(new DialogueUI(requireElement('dialogue-window')));
    const taskHud = new TaskHUD(requireElement('task-hud'));
    const resultOverlay = new ResultOverlay(requireElement('result-overlay'));
    this.speechBubble = new SpeechBubble(requireElement('speech-bubble'), container);
    const taskBinding = new PlacementTaskEventBinding({
      task: placementTask,
      carry,
      interaction: this.interaction,
      items: stage.pickableItems,
      placePoints: stage.placePoints,
      player: this.player,
      playerStartPosition: GAME_CONFIG.phase2.retryPlayerPosition,
      playerStartFacing: GAME_CONFIG.phase2.retryPlayerFacing,
      resultOverlay,
      speechBubble: this.speechBubble,
    });
    this.eventRunner = new EventRunner(
      {
        input: this.input,
        player: this.player,
        interaction: this.interaction,
        dialogue,
        taskManager,
        taskHud,
        resultOverlay,
        speechBubble: this.speechBubble,
        npcs: new Map([[this.npc.id, this.npc]]),
        tasks: new Map([[placementTask.id, taskBinding]]),
      },
      {
        successResultDurationSeconds: GAME_CONFIG.phase3.successResultDurationSeconds,
      },
    );
    this.npc.setInteractionHandler(() => this.eventRunner.start(PHASE3_DEMO_SEQUENCE));

    this.followCamera = new FollowCamera(this.camera, this.player.object, {
      offset: new Vector3(
        GAME_CONFIG.camera.offset.x,
        GAME_CONFIG.camera.offset.y,
        GAME_CONFIG.camera.offset.z,
      ),
      lookAtOffset: new Vector3(
        GAME_CONFIG.camera.lookAtOffset.x,
        GAME_CONFIG.camera.lookAtOffset.y,
        GAME_CONFIG.camera.lookAtOffset.z,
      ),
      positionSharpness: GAME_CONFIG.camera.positionSharpness,
      lookAtSharpness: GAME_CONFIG.camera.lookAtSharpness,
    });

    this.addLights();
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  public static async create(container: HTMLElement): Promise<Game> {
    const physics = await PhysicsWorld.create(GAME_CONFIG.physics.gravity);
    return new Game(container, physics);
  }

  public start(): void {
    if (this.animationFrameId !== null) {
      return;
    }

    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.frame);
    this.renderer.domElement.focus();
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.resize);
    this.npc.setInteractionHandler(null);
    this.eventRunner.dispose();
    this.interaction.dispose();
    this.input.dispose();
    this.physics.dispose();

    this.scene.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        material.dispose();
      }
    });

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private readonly frame = (timestamp: number): void => {
    const unboundedDelta = (timestamp - this.lastFrameTime) / 1000;
    const deltaSeconds = Math.min(unboundedDelta, GAME_CONFIG.loop.maxDeltaSeconds);
    this.lastFrameTime = timestamp;

    // Controllers submit movement before the physics step; visuals only read the resolved pose afterward.
    this.input.update();
    this.npc.update(deltaSeconds);
    this.player.updateBeforePhysics(deltaSeconds);
    this.physics.step(deltaSeconds);
    this.player.updateAfterPhysics(deltaSeconds);
    this.interaction.update();
    this.eventRunner.update(deltaSeconds);
    this.followCamera.update(deltaSeconds);
    this.speechBubble.update(this.camera, deltaSeconds);
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.frame);
  };

  private readonly resize = (): void => {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio, GAME_CONFIG.renderer.maxPixelRatio);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
  };

  private addLights(): void {
    const ambient = new AmbientLight(0xffffff, 1.9);
    this.scene.add(ambient);

    const sun = new DirectionalLight(0xfff3df, 3.2);
    sun.position.set(-8, 14, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 35;
    this.scene.add(sun);
  }
}
