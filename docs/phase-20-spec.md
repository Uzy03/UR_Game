# Phase 20: Interaction Feel & Assist

Phase 20は、既存のThrow、Dash、Processing、Assemblyのgameplay truthを変えず、操作補助とprocedural presentationを追加する。新Task／GameEvent、NPC inventory、rigid-body item、IK、asset pipeline、World Map拡張は行わない。

## Throw Assist

`ItemThrowSystem`は最初にPhase 18と同じ有効なfloor landingを求め、そのendpointとaim lineの近くにある`ThrowReceiver`候補を列挙する。候補はflight開始時に1つだけ決定・予約され、飛行中にretargetしない。

優先順位は次のとおり。

1. eligible `PlacePoint`
2. eligible `ProcessingStation` / `AssemblyStation`
3. stationary Scene `NPCController`
4. `kind: table`から導出した`TableThrowSurface`
5. 元のfloor landing fallback

同じpriorityではunassisted endpointとのXZ距離、最後にstable receiver IDで決定する。

Tuning:

- endpoint assist radius: `1.05 units`
- late blend start: flight progress `0.60`
- minimum forward dot: `0.28`
- maximum lateral offset from aim line: `1.10 units`
- NPC assist radius: `0.72 units`
- NPC presentation hold: `0.24 s`
- NPC safe release distance: `0.92 units`
- table item edge inset: footprint + `0.06 units`

飛行前半は通常軌道のまま、後半だけsmoothstepでreceiver offsetを足し、終点では厳密に予約targetへ収束する。teleport、bounce、gravity simulation、dynamic rigid bodyは使用しない。

PlacePointとStationはmanual interactionと同じauthoritative occupancy/stateへ着地させる。Processingは`loaded/processed`、Assemblyは`one-loaded/ready`までで、ThrowはProcess／Combineを開始しない。Table着地はpickup可能な`world` stateのままにする。

NPC catchはcarry anchorへの短いpresentation attachmentだけで、safe floorへ自動解放する。NPC root、dialogue、Story、Task、Checkpointは変更しない。scripted move中、unsafe release、予約中のNPCは候補にならない。

## Dash Bump

`DashBumpSystem`はPlayerのRapier解決後に、実際に解決されたXZ移動区間とNPCの最短距離を調べる。`PlayerController.dashFrameMotion`はDashの最終active sliceも保持するため、`DashState.isActive`が同frameでfalseになってもhitを失わない。

Tuning:

- combined radius: `0.84 units`
- NPC visual knockback: `0.40 units`
- recovery: `0.36 s`

同じNPCは1 Dashにつき1回だけ反応し、最初のhitで残りDashをcancelする。NPCのauthoritative rootは動かさず、`CharacterAnimator`内部のvisual rootだけをoffset／tiltしてゼロへ戻す。walking、damage、stun、ragdoll、NPC colliderは追加しない。

## Work Motion

`WorkMotionSystem`は`ProcessingStation.state === 'processing'`または`AssemblyStation.state === 'combining'`だけをpresentation sourceとして読む。

- Player interaction radius: `1.70 units`
- Player maximum work-pose speed: `0.40 units/s`

Processingは小さなstation pulseとitem shake、交互の腕動作を使う。Assemblyは2 inputのconverging motionと両腕のpress動作を使い、異なるrhythmにする。Playerが移動中・carry中・範囲外ならposeをfadeし、Station timerは継続する。

Processing完了はitemのsmall pop、Assembly完了は既存output activation／settleを利用する。animationはTask duration、progress、successを一切更新しない。

## Cleanup and compatibility

`ItemThrowSystem.cancelAll()`はflight reservationとNPC transient receiveを解放する。Retry bindingはこれを先に呼び、NPC／Player work presentation、Station、Itemを順にresetする。Scene unload／World Map遷移／disposeは`SceneManager`の既存unbindから同じ境界を通る。

次を変更しない。

- Game Save v1 / Phone Progress v1 / World Progress v1
- Story/private JSON schemaと`public/private/`境界
- Scene / Checkpoint / Task / Item / NPC ID
- Processing `1.8 s` / Assembly `1.8 s` station duration
- Phase 18 Dash `0.18 s`, `8.8 units/s`, cooldown `0.42 s`
- Phase 18 Throw `3.6 units`, `0.42 s`, arc height `1.25`
- Phase 19 World Map routeとcontrols
