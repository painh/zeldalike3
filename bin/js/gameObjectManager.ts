class GameObjectManager {
  static list: GameObject[] = [];
  static game: Game;
  static sprName: string = "gamesprite";
  static checkedList: boolean[] = [];
  static objMoved: boolean;

  static MakeKey(obj1: GameObject, obj2: GameObject) {
    // let less, greater;
    // if (obj1.idx < obj2.idx) {
    //   less = obj1.idx;
    //   greater = obj2.idx;
    // } else {
    //   less = obj2.idx;
    //   greater = obj1.idx;
    // }

    const less = obj1.idx;
    const greater = obj2.idx;

    return `${less}-${greater}`;
  }

  static RegisterCollisionChecked(obj1: GameObject, obj2: GameObject) {
    const key = GameObjectManager.MakeKey(obj1, obj2);
    GameObjectManager.checkedList[key] = true;
  }

  static CollisionChecked(obj1: GameObject, obj2: GameObject): boolean {
    const key = GameObjectManager.MakeKey(obj1, obj2);
    return GameObjectManager.checkedList[key];
  }

  static GetNameCnt(name: string): number {
    let cnt: number = 0;

    GameObjectManager.list.forEach((e) => {
      if (e.name == name) cnt++;
    });
    return cnt;
  }

  static Init(game: Game) {
    GameObjectManager.game = game;
  }
  static Add(
    objX: number,
    objY: number,
    width: number,
    height: number,
    name: string,
    type: string,
    frame: number,
    owner: GameObject
  ): GameObject {
    let obj = null;

    switch (name) {
      case "player":
        obj = new Player(
          GameObjectManager.game.game,
          objX,
          objY,
          width,
          height,
          name,
          type,
          frame,
          owner
        );
        break;

      case "playerAttack":
        obj = new PlayerAttack(
          GameObjectManager.game.game,
          objX,
          objY,
          width,
          height,
          name,
          type,
          frame,
          owner
        );
        break;

      case "goblin":
        obj = new Goblin(
          GameObjectManager.game.game,
          objX,
          objY,
          width,
          height,
          name,
          type,
          frame,
          owner
        );
        break;

      default:
        obj = new GameObject(
          GameObjectManager.game.game,
          objX,
          objY,
          width,
          height,
          name,
          type,
          frame,
          owner
        );

        break;
    }
    GameObjectManager.list.push(obj);

    return obj;
  }

  static Update() {
    GameObjectManager.checkedList = [];
    InputControl.Update();

    let moveList = [];
    GameObjectManager.list.forEach((e, k, list) => {
      e.Update();
      if (e.isDead) {
        e.Release();
        list.splice(k, 1);
      } else {
        moveList.push(e);
      }
    });
  }

  static Move(gameObj: GameObject): boolean {
    if (gameObj.isDead) return false;
    if (gameObj.moved) return false;
    if (gameObj.GetMag() == 0) return false;
    if (gameObj.weight == 255) return false;

    let fx = gameObj.force.x;
    let fy = gameObj.force.y;
    let newRect;
    const moveVector = new Vector(fx, fy);
    if (moveVector.getMagnitude() >= 1) moveVector.setMagnitude(1);

    if (gameObj.MoveableObjectType())
      newRect = gameObj.GetRect(moveVector.x, moveVector.y);
    else newRect = gameObj.GetRect(0, 0);

    const colList: GameObject[] = GameObjectManager.CheckCollision(
      newRect,
      gameObj,
      true
    );

    const alreadCollied: GameObject[] = GameObjectManager.CheckCollision(
      gameObj.GetRect(0, 0),
      gameObj,
      true
    );

    // colList.forEach((e, k, list) => {
    //   alreadCollied.forEach((e2) => {
    //     if (e == e2) {
    //       list.splice(k, 1);
    //       // console.log("이미 겹쳐짐", e.name);
    //     }
    //   });
    // });

    if (colList.length == 0) {
      if (gameObj.MoveableObjectType()) {
        gameObj.x += Math.floor(moveVector.x);
        gameObj.y += Math.floor(moveVector.y);
        gameObj.spr.x = gameObj.x;
        gameObj.spr.y = gameObj.y;

        gameObj.moved = true;
        GameObjectManager.objMoved = true;
      }
      // console.log(this.name);

      return true;
    } else {
      // gameObj.force.setMagnitude(0);
    }

    for (let i in colList) {
      const targetObj: GameObject = colList[i];

      if (!GameObjectManager.CollisionChecked(targetObj, gameObj)) {
        GameObjectManager.RegisterCollisionChecked(targetObj, gameObj);
        targetObj.AddForce(fx, fy, gameObj, "checkCollision", false);
        // console.log(
        //   `${gameObj.name} -> ${targetObj.name}`,
        //   moveVector.x,
        //   moveVector.y
        // );

        gameObj.force.setMagnitude(0);
        // GameObjectManager.Move(targetObj);
      }
    }

    return false;
  }

  static PUpdate() {
    while (true) {
      GameObjectManager.objMoved = false;

      GameObjectManager.list.forEach((srcObj: GameObject) => {
        GameObjectManager.Move(srcObj);
      });

      if (GameObjectManager.objMoved) continue;
      break;
    }

    GameObjectManager.list.forEach((gameObj) => {
      const thismag = gameObj.force.getMagnitude();
      let mag: number = thismag - gameObj.weight;

      gameObj.colRect.x = Math.round(gameObj.x - TILE_SIZE / 2);
      gameObj.colRect.y = Math.round(gameObj.y - TILE_SIZE / 2);

      if (mag <= 0.5) {
        mag = 0;
      }
      gameObj.force.setMagnitude(mag);

      // if (thismag > 0) console.log(gameObj.name, gameObj.type, thismag, mag);
    });
  }

  static AfterUpdate() {
    GameObjectManager.list.forEach((e, k, list) => {
      e.AfterUpdate();
    });
  }

  static CheckCollision(
    checkRect: any,
    me: GameObject,
    checkOwner: boolean
  ): GameObject[] {
    const list = [];
    this.list.forEach((e) => {
      if (e == me) return;
      if (checkOwner && (me.owner == e || e.owner == me)) {
        // console.log(e.name, me.name, "owner!");
        return;
      }
      if (CheckCollision(checkRect, e.GetRect(0, 0))) list.push(e);
    });

    return list;
  }
}
