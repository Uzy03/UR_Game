import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { AudioContentRegistry } from '../audio/AudioContentRegistry';
import { AudioManager } from '../audio/AudioManager';
import { BrowserAudioMediaFactory } from '../audio/BrowserAudioMediaFactory';
import { FollowCamera } from '../camera/FollowCamera';
import { GAME_CONFIG } from '../config/gameConfig';
import { clampFrameDeltaSeconds } from './FrameDelta';
import {
  PHASE5_DEMO_SEQUENCE,
  PHASE5_GARDEN_TALK_SEQUENCE,
} from '../content/demo/phase5DemoSequence';
import {
  PHASE5_GARDEN_SCENE_ID,
  PHASE5_HELPER_NPC_ID,
  PHASE5_INITIAL_SCENE_ID,
} from '../content/demo/phase5Scenes';
import {
  createCampaignContent,
  type CampaignContentBundle,
} from '../content/campaign/campaignContent';
import { loadCampaignStory } from '../content/campaign/loadCampaignStory';
import { DialogueManager } from '../dialogue/DialogueManager';
import { EventRunner } from '../events/EventRunner';
import type { TaskEventBinding } from '../events/TaskEventBinding';
import { InputManager } from '../input/InputManager';
import { KeyboardInput } from '../input/KeyboardInput';
import { CarrySystem } from '../interaction/CarrySystem';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { NPCController } from '../npc/NPCController';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { PhoneContentRegistry } from '../phone/PhoneContentRegistry';
import { PhoneController } from '../phone/PhoneController';
import { PhoneProgress } from '../phone/PhoneProgress';
import { PhoneProgressStore } from '../phone/PhoneProgressStore';
import type { PhoneStoryActions } from '../phone/PhoneTypes';
import { PlayerController } from '../player/PlayerController';
import { CheckpointRegistry } from '../save/CheckpointRegistry';
import type { CheckpointActions } from '../save/CheckpointTypes';
import { GameProgressController } from '../save/GameProgressController';
import { GameSaveStore } from '../save/GameSaveStore';
import { SceneContentRegistry } from '../scene/SceneContentRegistry';
import { SceneManager, type SceneActions } from '../scene/SceneManager';
import { SceneRuntime } from '../scene/SceneRuntime';
import { TaskManager } from '../task/TaskManager';
import { DialogueUI } from '../ui/DialogueUI';
import { AudioMuteButton } from '../ui/AudioMuteButton';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { ResultOverlay } from '../ui/ResultOverlay';
import { SpeechBubble } from '../ui/SpeechBubble';
import { StartMenu } from '../ui/StartMenu';
import { TaskHUD } from '../ui/TaskHUD';
import { TransitionOverlay } from '../ui/TransitionOverlay';
import { PhoneUI } from '../ui/phone/PhoneUI';

function requireElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.querySelector<T>(`#${id}`);
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
  private readonly carry: CarrySystem;
  private readonly interaction: InteractionSystem;
  private readonly eventRunner: EventRunner;
  private readonly audio: AudioManager;
  private readonly audioMediaFactory: BrowserAudioMediaFactory;
  private readonly audioMuteButton: AudioMuteButton;
  private readonly sceneManager: SceneManager;
  private readonly phone: PhoneController;
  private readonly progress: GameProgressController;
  private readonly speechBubble: SpeechBubble;
  private readonly followCamera: FollowCamera;
  private readonly npcs = new Map<string, NPCController>();
  private readonly tasks = new Map<string, TaskEventBinding>();
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;

  private constructor(
    private readonly container: HTMLElement,
    physics: PhysicsWorld,
    content: CampaignContentBundle,
  ) {
    this.physics = physics;
    this.scene.background = new Color(GAME_CONFIG.renderer.clearColor);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = GAME_CONFIG.renderer.exposure;
    this.renderer.domElement.tabIndex = 0;
    container.append(this.renderer.domElement);

    this.camera = new PerspectiveCamera(
      GAME_CONFIG.camera.fov,
      1,
      GAME_CONFIG.camera.near,
      GAME_CONFIG.camera.far,
    );

    this.input = new InputManager([new KeyboardInput(window)]);
    const sceneContent = new SceneContentRegistry(content.scenes);
    const initialScene = sceneContent.getScene(content.initialSceneId);
    if (initialScene === undefined) {
      throw new Error(`Initial Scene "${content.initialSceneId}" is not registered.`);
    }

    const character = this.physics.createKinematicCharacter({
      position: initialScene.playerSpawn.position,
      radius: GAME_CONFIG.player.collider.radius,
      halfHeight: GAME_CONFIG.player.collider.halfHeight,
      offset: GAME_CONFIG.physics.characterOffset,
    });
    this.player = new PlayerController(this.input, character, {
      speed: GAME_CONFIG.player.speed,
      acceleration: GAME_CONFIG.player.acceleration,
      deceleration: GAME_CONFIG.player.deceleration,
      turnSharpness: GAME_CONFIG.player.turnSharpness,
      groundProbeSpeed: GAME_CONFIG.physics.groundProbeSpeed,
    });
    this.scene.add(this.player.object);

    this.carry = new CarrySystem(this.player.carryAnchor);
    const carry = this.carry;
    this.interaction = new InteractionSystem(
      this.input,
      this.player.object,
      carry,
      [],
      new InteractionPrompt(requireElement('interaction-prompt')),
      GAME_CONFIG.interaction,
      () => this.player.triggerInteraction(),
    );

    const taskManager = new TaskManager();
    const dialogue = new DialogueManager(new DialogueUI(requireElement('dialogue-window')));
    const taskHud = new TaskHUD(requireElement('task-hud'));
    const resultOverlay = new ResultOverlay(requireElement('result-overlay'));
    const transition = new TransitionOverlay(requireElement('transition-overlay'));
    this.speechBubble = new SpeechBubble(requireElement('speech-bubble'), container);
    const phoneContent = new PhoneContentRegistry(content.phoneContent);
    const phoneProgress = new PhoneProgress(phoneContent, new PhoneProgressStore());
    const audioContent = new AudioContentRegistry(content.audioContent);
    this.audioMediaFactory = new BrowserAudioMediaFactory();
    this.audio = new AudioManager(audioContent, {
      unlockTarget: window,
      unlockMedia: () => this.audioMediaFactory.unlock(),
      createMedia: (src) => this.audioMediaFactory.create(src),
      defaultFadeSeconds: GAME_CONFIG.audio.defaultBgmFadeSeconds,
    });
    this.audioMuteButton = new AudioMuteButton(
      requireElement<HTMLButtonElement>('audio-mute'),
    );
    this.audioMuteButton.setMuted(this.audio.isMuted);
    this.audioMuteButton.setToggleHandler(() => {
      this.audioMuteButton.setMuted(this.audio.toggleMuted());
    });
    const checkpointRegistry = new CheckpointRegistry(
      content.checkpoints,
      sceneContent,
      phoneContent,
      audioContent,
    );
    let sceneManagerTarget: SceneManager | null = null;
    let progressTarget: GameProgressController | null = null;
    let phoneTarget: PhoneController | null = null;
    const sceneActions: SceneActions = {
      loadScene: (sceneId): void => {
        if (sceneManagerTarget === null) {
          throw new Error('SceneManager is not ready.');
        }
        sceneManagerTarget.loadScene(sceneId);
      },
    };
    const checkpointActions: CheckpointActions = {
      setCheckpoint: (checkpointId): void => {
        if (progressTarget === null) {
          throw new Error('GameProgressController is not ready.');
        }
        progressTarget.setCheckpoint(checkpointId);
      },
    };
    const phoneStoryActions: PhoneStoryActions = {
      presentStoryCard: (card, onComplete): boolean => {
        if (phoneTarget === null) {
          throw new Error('PhoneController is not ready.');
        }
        return phoneTarget.presentStoryCard(card, onComplete);
      },
      cancelStoryPresentation: (): void => {
        phoneTarget?.cancelStoryPresentation();
      },
    };
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
        npcs: this.npcs,
        tasks: this.tasks,
        phoneProgress,
        phoneStory: phoneStoryActions,
        scenes: sceneActions,
        checkpoints: checkpointActions,
        transition,
        audio: this.audio,
      },
      {
        successResultDurationSeconds: GAME_CONFIG.phase3.successResultDurationSeconds,
      },
    );

    this.sceneManager = new SceneManager({
      worldRoot: this.scene,
      content: sceneContent,
      player: this.player,
      carry,
      interaction: this.interaction,
      npcs: this.npcs,
      tasks: this.tasks,
      speechBubble: this.speechBubble,
      resultOverlay,
      floorItemSpacing: GAME_CONFIG.interaction.floorItemSpacing,
      createRuntime: (definition) => SceneRuntime.create(definition, {
        physics: this.physics,
        player: this.player,
        carry,
        interaction: this.interaction,
        resultOverlay,
        speechBubble: this.speechBubble,
        createNpcInteractionHandler: (sceneId, npcId) => {
          if (npcId !== PHASE5_HELPER_NPC_ID) {
            return null;
          }
          if (sceneId === PHASE5_INITIAL_SCENE_ID) {
            return () => this.eventRunner.start(PHASE5_DEMO_SEQUENCE);
          }
          if (sceneId === PHASE5_GARDEN_SCENE_ID) {
            return () => this.eventRunner.start(PHASE5_GARDEN_TALK_SEQUENCE);
          }
          return null;
        },
      }),
    });
    sceneManagerTarget = this.sceneManager;
    this.sceneManager.loadScene(content.initialSceneId);

    this.phone = new PhoneController({
      input: this.input,
      player: this.player,
      interaction: this.interaction,
      progress: phoneProgress,
      content: phoneContent,
      ui: new PhoneUI(requireElement('phone-overlay')),
      canOpen: () => (
        progressTarget?.isGameActive === true
        && this.eventRunner.state !== 'running'
      ),
      focusTarget: this.renderer.domElement,
    });
    phoneTarget = this.phone;

    this.progress = new GameProgressController({
      initialCheckpointId: content.initialCheckpointId,
      checkpoints: checkpointRegistry,
      saveStore: new GameSaveStore(),
      sceneManager: this.sceneManager,
      eventRunner: this.eventRunner,
      phoneProgress,
      phone: this.phone,
      player: this.player,
      interaction: this.interaction,
      npcs: this.npcs,
      menu: new StartMenu(requireElement('start-menu')),
      focusTarget: this.renderer.domElement,
    });
    progressTarget = this.progress;

    // Story sequences remain idle until the player explicitly chooses New Game or Continue.
    this.progress.boot();

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
      velocitySharpness: GAME_CONFIG.camera.velocitySharpness,
      lookAheadSeconds: GAME_CONFIG.camera.lookAheadSeconds,
      maxLookAhead: GAME_CONFIG.camera.maxLookAhead,
      teleportSnapDistance: GAME_CONFIG.camera.teleportSnapDistance,
    });

    this.addLights();
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  public static async create(container: HTMLElement): Promise<Game> {
    const story = await loadCampaignStory();
    const content = createCampaignContent(story);
    const physics = await PhysicsWorld.create(GAME_CONFIG.physics.gravity);
    return new Game(container, physics, content);
  }

  public start(): void {
    if (this.animationFrameId !== null) {
      return;
    }

    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.frame);
    if (this.progress.isGameActive) {
      this.renderer.domElement.focus();
    }
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.resize);
    this.progress.dispose();
    this.eventRunner.dispose();
    this.audioMuteButton.dispose();
    this.audio.dispose();
    this.audioMediaFactory.dispose();
    this.phone.dispose();
    this.sceneManager.dispose();
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
    const deltaSeconds = clampFrameDeltaSeconds(
      unboundedDelta,
      GAME_CONFIG.loop.maxDeltaSeconds,
    );
    this.lastFrameTime = timestamp;

    // Controllers submit movement before the physics step; visuals only read the resolved pose afterward.
    this.input.update();
    this.phone.update();
    for (const npc of this.npcs.values()) {
      npc.update(deltaSeconds);
    }
    this.player.updateBeforePhysics(deltaSeconds);
    this.physics.step(deltaSeconds);
    this.player.setCarrying(this.carry.hasItem);
    this.player.updateAfterPhysics(deltaSeconds);
    this.interaction.update(deltaSeconds);
    this.eventRunner.update(deltaSeconds);
    this.audio.update(deltaSeconds);
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
    const hemisphere = new HemisphereLight(
      GAME_CONFIG.lighting.hemisphereSkyColor,
      GAME_CONFIG.lighting.hemisphereGroundColor,
      GAME_CONFIG.lighting.hemisphereIntensity,
    );
    this.scene.add(hemisphere);

    const ambient = new AmbientLight(
      GAME_CONFIG.lighting.ambientColor,
      GAME_CONFIG.lighting.ambientIntensity,
    );
    this.scene.add(ambient);

    const sun = new DirectionalLight(
      GAME_CONFIG.lighting.keyColor,
      GAME_CONFIG.lighting.keyIntensity,
    );
    sun.position.set(
      GAME_CONFIG.lighting.keyPosition.x,
      GAME_CONFIG.lighting.keyPosition.y,
      GAME_CONFIG.lighting.keyPosition.z,
    );
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 35;
    sun.shadow.bias = -0.00012;
    sun.shadow.normalBias = 0.025;
    this.scene.add(sun);
  }
}
