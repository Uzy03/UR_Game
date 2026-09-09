# Phase 19: World Map & Route Progression Foundation

Phase 19は、既存Campaign stage runtimeとは別のtop-level modeとしてWorld Mapを追加する。production asset、実在地理、完了stage replay、分岐、星評価、private Story拡張は行わない。

## Architecture

- `WorldRoute`: node定義のID、label、座標、entry sequence、completion checkpoint、canonical spawnを検証する。
- `WorldProgress`: 完了済みnode prefixと次のavailable nodeを管理する。
- `WorldProgressStore`: World専用v1データだけをlocalStorageへ保存する。
- `WorldMapController`: map表示、入力、node entry、stageとのmode遷移、専用FollowCameraを調停する。
- `WorldMapRuntime`: primitive製island、road、node、vehicleのThree.js rootを所有する。
- `WorldMapVehicle`: wheel physicsを使わない単純な平面移動と向きを担当する。
- `SceneManager`はWorld MapをSceneとして扱わず、map activation時に現在Campaign runtimeを明示的にunloadする。

EventRunnerには狭い`world_map` eventだけを追加する。

- `{ type: 'world_map', action: 'show', bgmId? }`
- `{ type: 'world_map', action: 'complete_node', nodeId }`

Event中のcontrol restoreがmap activationを上書きしないよう、event完了後にpending transitionをcommitする。
Continue用の`show`だけは既存BGM IDを任意指定し、単一の即時event内で再生要求とmap遷移を行う。

## Route

| Label | Stable node ID | Stage | Completion checkpoint |
|---|---|---|---|
| 1-1 | `campaign-route-meeting` | Cafe / Meeting | `campaign-after-meeting` |
| 1-2 | `campaign-route-outing` | Park / Outing | `campaign-after-outing` |
| 1-3 | `campaign-route-preparation` | Prep Space / Preparation | `campaign-after-preparation` |
| 1-4 | `campaign-route-journey` | Viewpoint / Journey | `campaign-before-ending` |
| 1-5 | `campaign-route-ending` | Ending Room | `campaign-complete` |

各nodeは`locked / available / completed`のいずれかで、完了済みIDは必ずroute先頭からのprefixとなる。入力対象はavailable nodeだけなので、locked／completed nodeはentryできない。

## Vehicle and camera

- movement speed: `5.2 units/s`
- acceleration: `15 units/s²`
- deceleration: `22 units/s²`
- turn sharpness: `12`
- node interaction radius: `1.55 units`
- `WASD`だけで移動し、InputManagerが正規化したplanar inputを使う。
- `Space` Dash、`Q` Throw、Phoneはmap loopで更新しない。
- bodyはneutral gray、windowはdark、wheelは4個。badge、plate、実在model固有形状を持たない。
- World Map専用FollowCameraを持ち、mode activation時にtargetへsnapしてstage側velocityを引き継がない。

## Sequence

```text
New Game -> Bedroom Prologue -> show World Map
available node E -> node entry sequence -> stage
stage story/task -> set checkpoint -> complete node -> World Map
```

Meeting transition／Cafe scene changeはPrologue末尾から`1-1` entryへ移した。各stageのstory、dialogue、task、unlock内容は元のsegment配列を保ち、route entry sequenceはその単一のauthoritative配列から生成する。

## Persistence and compatibility

World専用key:

`ur-game:world-progress:v1`

```ts
{
  version: 1,
  completedNodeIds: string[]
}
```

既知node IDの正しいprefixだけを受理する。車両座標、camera、hover、stage replay状態は保存しない。

既存`ur-game:save:v1`の`{ version: 1, checkpointId }`と`ur-game:phone-progress:v1`、Campaign Story schemaは変更しない。Continue時はGame Save checkpointを正としてWorld進行を再構築する。

- `campaign-start`: none
- `campaign-after-meeting`: 1-1
- `campaign-after-outing`: 1-1〜1-2
- `campaign-after-preparation`: 1-1〜1-3
- `campaign-before-ending`: 1-1〜1-4
- `campaign-complete`: 1-1〜1-5

World storeが欠損・破損・checkpointより遅れていても、この対応から上書き復元する。Reset ProgressはGame Save、既存Phone reset、World store clearを行う。

## Lifecycle

- map activationはEventRunner cleanup後にcommitする。
- activation時にSceneManagerがStage、NPC、Task、Carry、Throw、Interactableをcleanupし、Playerを非表示・停止する。
- node entryはmap control/rootを先に停止してからentry sequenceを開始する。
- stage `change_scene`時にPlayerを再表示し、stage FollowCameraをsnapする。
- World Map active中はstage update loopを実行しない。

## Non-goals

完了stage replay、branching、multiple worlds、stars/ranks、GLTF、実在車再現、実在地図、Phone map対応、新Task、gamepad、private Story fieldsはPhase 19に含めない。
