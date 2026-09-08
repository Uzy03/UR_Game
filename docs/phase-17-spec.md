# Phase 17 — Visual Style Rollout & Scene Identity

Phase 17は、Phase 16で確立した「Warm Miniature Memory」のvisual languageを全Campaign locationへ展開する。Sceneごとの識別はpalette、composition、visual-only primitive propsで作り、gameplayやStory schemaは変更しない。

## Scene direction

- Bedroom: warm cream、blush、light wood。bed、desk lamp、rug、plantで安全で親密な始まりを表現し、中央からPhone導線は空ける。
- Cafe: Phase 16のreference sceneを変更せず維持する。
- Park: sage、muted sky blue、sand、natural wood。tree、bench、flower、rockとfloor pathで開放感を作り、Reach target周辺は空ける。
- Prep Space: cream、dusty blue、warm wood、terracotta。左右のfloor zoningと背面shelfで作業場らしくし、Processing／Placement stationを主役に保つ。
- Viewpoint: amber、muted purple、dusty blue、warm stone。railing、rock、lantern-like lamp、platform rugで目的地感を作り、Assembly／Placement導線を維持する。
- Ending Room: Bedroom／Cafeのcreamとwoodへrose／goldを加える。table setting、gift、lamp、fictional wall frame、flowerで控えめに祝祭感を出す。

completed/resume variantは同じlocationの`visualStyle`と`decorations`をそのまま再利用する。

## Visual system

`StageDecorationKind`へ、scene identityに必要な8種だけを追加する。

- `bed`: Bedroomを一目で室内と判断できる主役prop
- `bench`: Parkの休息場所を示すsilhouette
- `tree`: Parkの開放的な自然環境を作る大型prop
- `flower-cluster`: ParkとEndingで使える小型accent
- `rock`: ParkとViewpointの自然な境界／奥行き表現
- `lamp`: Bedroom、Viewpoint、Endingを暖かい光源形状で結ぶ共有prop
- `railing`: Viewpointの高所／目的地らしい輪郭
- `gift`: Endingだけに必要な祝祭の明確な記号

primitive生成は`createStageDecoration`へ分離する。生成物はThree.jsの描画Objectだけで、Collider、Interactable、Task、ID、Save stateを持たない。

## 維持する境界

- global camera、lighting、CharacterVisual、CharacterAnimatorの設定は変更しない
- Scene／Checkpoint／Task／Item／NPC IDを変更しない
- Task条件、duration、Event順、Audio cueを変更しない
- `ur-game:save:v1`と`ur-game:phone-progress:v1`を変更しない
- Campaign Story schemaと`public/private/`境界を変更しない
- GLTF、asset registry、theme engine、post-processingを追加しない

## Phase 18 production asset候補

期待visual value順の候補は次のとおり。

1. Player／Companionのproduction chibi character pair
2. Cafe／Prepで共有できるhero counter・station set
3. Bedroomのbed／desk／lamp hero set
4. Park／Viewpointで共有できるtree・foliage・rock kit
5. Ending用のgift／table-setting／fictional photo-frame accent set

導入時も一括asset pipeline化せず、代表Sceneでscale、pivot、material、shadow、performanceを検証してから展開する。
