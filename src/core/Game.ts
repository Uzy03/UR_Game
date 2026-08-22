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
import { DialogueManager } from '../dialogue/DialogueManager';
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
import { Phase2DemoController } from './Phase2DemoController';

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
  private readonly phase2Demo: Phase2DemoController;
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
    this.phase2Demo = new Phase2DemoController(
      {
        input: this.input,
        player: this.player,
        interaction: this.interaction,
        carry,
        items: stage.pickableItems,
        placePoints: stage.placePoints,
        npc: this.npc,
        dialogue: new DialogueManager(new DialogueUI(requireElement('dialogue-window'))),
        taskManager,
        placementTask,
        taskHud: new TaskHUD(requireElement('task-hud')),
        resultOverlay: new ResultOverlay(requireElement('result-overlay')),
        speechBubble: new SpeechBubble(requireElement('speech-bubble'), container),
      },
      {
        introDialogue: GAME_CONFIG.phase2.introDialogue,
        retryPlayerPosition: GAME_CONFIG.phase2.retryPlayerPosition,
        retryPlayerFacing: GAME_CONFIG.phase2.retryPlayerFacing,
        npcTaskPosition: GAME_CONFIG.npc.taskPosition,
        successSpeech: GAME_CONFIG.phase2.successSpeech,
        speechDurationSeconds: GAME_CONFIG.phase2.speechDurationSeconds,
      },
    );

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
    this.phase2Demo.dispose();
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
    this.phase2Demo.update(deltaSeconds);
    this.followCamera.update(deltaSeconds);
    this.phase2Demo.updatePresentation(this.camera, deltaSeconds);
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
