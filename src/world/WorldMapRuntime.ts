import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
  type Object3D,
} from 'three';
import { disposeObject3D } from '../core/disposeObject3D';
import type { WorldProgress } from './WorldProgress';
import type { WorldRoute, WorldRouteNodeState } from './WorldRoute';
import { WorldMapVehicle, type WorldMapVehicleOptions } from './WorldMapVehicle';

interface NodeVisual {
  readonly pad: Mesh;
  readonly beacon: Mesh;
}

export class WorldMapRuntime {
  public readonly root = new Group();
  public readonly vehicle: WorldMapVehicle;
  private readonly nodeVisuals = new Map<string, NodeVisual>();
  private elapsedSeconds = 0;

  public constructor(
    parent: Object3D,
    private readonly route: WorldRoute,
    vehicleOptions: WorldMapVehicleOptions,
  ) {
    this.root.name = 'WorldMapRuntime';
    this.root.visible = false;
    parent.add(this.root);
    this.createEnvironment();
    this.vehicle = new WorldMapVehicle(vehicleOptions);
    this.root.add(this.vehicle.object);
  }

  public setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  public updateNodeStates(progress: WorldProgress): void {
    for (const node of this.route.nodes) {
      this.applyNodeState(node.id, progress.getNodeState(node.id));
    }
  }

  public update(deltaSeconds: number): void {
    this.elapsedSeconds += Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    const available = this.route.nodes.find((node) => {
      const visual = this.nodeVisuals.get(node.id);
      return visual?.beacon.visible === true;
    });
    if (available === undefined) {
      return;
    }
    const beacon = this.nodeVisuals.get(available.id)?.beacon;
    if (beacon !== undefined) {
      beacon.position.y = 0.72 + Math.sin(this.elapsedSeconds * 3.2) * 0.08;
      beacon.rotation.y += deltaSeconds * 0.8;
    }
  }

  public dispose(): void {
    this.vehicle.dispose();
    this.root.removeFromParent();
    disposeObject3D(this.root);
    this.root.clear();
  }

  private createEnvironment(): void {
    const island = new Mesh(
      new CylinderGeometry(6.1, 6.35, 0.48, 32),
      new MeshStandardMaterial({ color: 0x9eb67a, roughness: 0.92 }),
    );
    island.name = 'WorldMapIsland';
    island.scale.x = 1.48;
    island.position.y = -0.27;
    island.receiveShadow = true;
    this.root.add(island);

    const roadPoints = [
      new Vector3(-7.4, 0.015, 3.8),
      ...this.route.nodes.map(({ position }) => new Vector3(position.x, 0.015, position.z)),
    ];
    for (let index = 0; index < roadPoints.length - 1; index += 1) {
      this.root.add(this.createRoadSegment(roadPoints[index], roadPoints[index + 1]));
    }

    for (const node of this.route.nodes) {
      const group = new Group();
      group.name = `WorldMapNode:${node.id}`;
      group.position.set(node.position.x, node.position.y, node.position.z);
      const pad = new Mesh(
        new CylinderGeometry(0.72, 0.82, 0.18, 24),
        new MeshStandardMaterial({ color: 0x787f80, roughness: 0.72 }),
      );
      pad.position.y = 0.1;
      pad.receiveShadow = true;
      const beacon = new Mesh(
        new CylinderGeometry(0.14, 0.3, 0.62, 6),
        new MeshStandardMaterial({
          color: 0xf3c86b,
          emissive: 0x5e4317,
          roughness: 0.48,
        }),
      );
      beacon.position.y = 0.72;
      group.add(pad, beacon);
      this.root.add(group);
      this.nodeVisuals.set(node.id, { pad, beacon });
    }

    const treePositions = [
      [-7.7, -1.4], [-5.1, 4], [-3.7, 2.6], [-1.6, -3.4],
      [1.5, 4], [2.4, 2.8], [5.2, 4], [6.9, -2.5], [0.3, -4.2],
    ] as const;
    for (const [x, z] of treePositions) {
      this.root.add(this.createTree(x, z));
    }

    const home = new Group();
    home.name = 'WorldMapHome';
    home.position.set(-8, 0, 4.2);
    const homeBody = new Mesh(
      new BoxGeometry(1.25, 0.85, 1),
      new MeshStandardMaterial({ color: 0xd9b692, roughness: 0.82 }),
    );
    homeBody.position.y = 0.43;
    const roof = new Mesh(
      new CylinderGeometry(0.83, 0.83, 1.35, 3),
      new MeshStandardMaterial({ color: 0xb66f5d, roughness: 0.78 }),
    );
    roof.rotation.z = Math.PI / 2;
    roof.rotation.y = Math.PI / 2;
    roof.position.y = 1.02;
    home.add(homeBody, roof);
    home.traverse((object) => {
      if (object instanceof Mesh) object.castShadow = true;
    });
    this.root.add(home);
  }

  private createRoadSegment(start: Vector3, end: Vector3): Mesh {
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const length = start.distanceTo(end);
    const road = new Mesh(
      new BoxGeometry(0.72, 0.055, length),
      new MeshStandardMaterial({ color: 0xbaa88c, roughness: 0.96 }),
    );
    road.name = 'WorldMapRoad';
    road.position.copy(midpoint);
    road.rotation.y = Math.atan2(end.x - start.x, end.z - start.z);
    road.receiveShadow = true;
    return road;
  }

  private createTree(x: number, z: number): Group {
    const tree = new Group();
    tree.position.set(x, 0, z);
    const trunk = new Mesh(
      new CylinderGeometry(0.12, 0.17, 0.62, 8),
      new MeshStandardMaterial({ color: 0x8d6546, roughness: 0.9 }),
    );
    trunk.position.y = 0.31;
    const crown = new Mesh(
      new SphereGeometry(0.48, 12, 9),
      new MeshStandardMaterial({ color: 0x63865c, roughness: 0.92 }),
    );
    crown.position.y = 0.9;
    crown.castShadow = true;
    tree.add(trunk, crown);
    return tree;
  }

  private applyNodeState(nodeId: string, state: WorldRouteNodeState): void {
    const visual = this.nodeVisuals.get(nodeId);
    if (visual === undefined || !(visual.pad.material instanceof MeshStandardMaterial)) {
      return;
    }
    const color = state === 'completed'
      ? 0x6f9b74
      : state === 'available'
        ? 0xe7bd5f
        : 0x6f7779;
    visual.pad.material.color.setHex(color);
    visual.pad.material.emissive.setHex(state === 'available' ? 0x49330d : 0x000000);
    visual.beacon.visible = state === 'available';
  }
}
