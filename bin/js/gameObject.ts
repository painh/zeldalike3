const enum DIR {
  DOWN = 0,
  LEFT = 1,
  UP = 2,
  RIGHT = 3,
}

const enum OBJ_STATE {
  IDLE = 0,
  ATTACK = 1,
  MOVE = 2,
  DEAD = 3,
}

class Force extends Vector {
  giver: GameObject;
  reason: string;
  constructor(x: number, y: number, owner: GameObject, reason: string) {
    super(x, y);
    this.giver = owner;
    this.reason = reason;
  }
}

class GameObject {
  x: number;
  y: number;
  spd: number;
  tx: number;
  ty: number;
  spr: Phaser.Sprite;
  colRect: Phaser.Graphics;
  // forces: Force[] = [];
  force: Force;
  weight: number;
  rect: number[] = [];
  name: string;
  type: string;
  createAt: number;
  lifeTimeMS: number = 0;
  isDead: boolean = false;
  dir: DIR = DIR.DOWN;
  state: OBJ_STATE = OBJ_STATE.IDLE;
  moved: boolean = false;

  static sidx: number = 0;
  idx: number = 0;
  owner: GameObject;

  constructor(
    game: Phaser.Game,
    objX: number,
    objY: number,
    width: number,
    height: number,
    name: string,
    type: string,
    frame: number,
    owner: GameObject
  ) {
    this.idx = GameObject.sidx++;
    this.owner = owner;

    this.force = new Force(0, 0, this, "init");

    this.name = name;
    this.type = type;

    if (this.type == "wall") {
      this.x = objX;
      this.y = objY;
    } else {
      this.x = objX + TILE_SIZE / 2;
      this.y = objY - TILE_SIZE / 2;
    }

    if (this.type != "wall") {
      this.spr = game.add.sprite(this.x, this.y, GameObjectManager.sprName);
      this.spr.frame = frame;
      this.spr.anchor.set(0.5);
      this.spr.smoothed = false;
    }

    let staticData = STATIC_OBJ[name];

    if (!staticData) {
      // throw Error(`invalid name ${name}`);
      staticData = {};
      staticData.weight = 10;
    }

    this.weight = staticData.weight;
    // this.rect = staticData.rect;
    if (this.type == "wall")
      this.rect = [0 + TILE_SIZE / 2, 0 + TILE_SIZE / 2, width, height];
    else this.rect = [0, 0, width, height];

    this.colRect = game.add.graphics(this.x, this.y);

    this.DrawColRect(0x00ff00);
    this.createAt = Date.now();
  }

  DrawColRect(color) {
    this.colRect.clear();
    this.colRect.lineStyle(1, color, 1);

    this.colRect.drawRect(
      // this.rect[0],
      // this.rect[1],
      // this.rect[2],
      // this.rect[3]
      // this.rect[0] + 0.5,
      // this.rect[1] + 0.5,
      // this.rect[2] - 1,
      // this.rect[3] - 1

      Math.round(this.rect[0]),
      Math.round(this.rect[1]),
      this.rect[2] - 1,
      this.rect[3] - 1
    );
  }

  Release() {
    this.spr.destroy();
    this.colRect.destroy();
  }

  SetDir(dir: DIR) {
    this.dir = dir;
    switch (dir) {
      case DIR.DOWN:
        return (this.spr.angle = 0);
      case DIR.LEFT:
        return (this.spr.angle = 90);
      case DIR.UP:
        return (this.spr.angle = 180);
      case DIR.RIGHT:
        return (this.spr.angle = -90);
    }
  }

  GetRect(fx, fy) {
    if (!this.CanMove()) {
      fx = 0;
      fy = 0;
    }
    return {
      x: this.x + this.rect[0] + fx,
      y: this.y + this.rect[1] + fy,
      width: this.rect[2],
      height: this.rect[3],
    };
  }

  AddForce(
    x: number,
    y: number,
    forceGiver: GameObject,
    reason: string,
    setOp: boolean
  ) {
    if (this.weight == 255) return;
    // console.log(`${x}, ${y} ${forceGiver.name} -> ${this.name} ${reason}`);
    if (!this.MoveableObjectType()) return;

    if (setOp) {
      this.force.x = x;
      this.force.y = y;
    } else {
      this.force.x += x;
      this.force.y += y;
      // console.log(
      //   `${x}, ${y} ${forceGiver.name} -> ${this.name} ${reason} ${this.force.x} ${this.force.y}`
      // );
    }

    // this.SetState(OBJ_STATE.MOVE);
  }

  GetMag(): number {
    return this.force.getMagnitude();
  }

  Moveable(): boolean {
    if (this.weight == 255) return false;

    let fx = this.force.x;
    let fy = this.force.y;

    const newRect = this.GetRect(fx, fy);

    const list: GameObject[] = GameObjectManager.CheckCollision(
      newRect,
      this,
      true
    );

    if (list.length == 0) return true;
    let moveable = true;
    list.forEach((e) => {
      if (e.weight == 255) moveable = false;
    });

    return moveable;
  }

  SetState(state: OBJ_STATE) {
    if (this.state == state) return;

    // console.log(
    //   GameObjectManager.game.frame,
    //   this.idx,
    //   this.name,
    //   this.idx,
    //   state
    // );
    this.state = state;
    switch (state) {
      case OBJ_STATE.IDLE:
        this.DrawColRect(0x00ff00);
        break;
      case OBJ_STATE.MOVE:
        this.DrawColRect(0x0000ff);
        break;
      case OBJ_STATE.ATTACK:
        this.DrawColRect(0xff0000);
        break;
      case OBJ_STATE.DEAD:
        this.DrawColRect(0x333333);
        break;
    }
  }

  Update() {
    if (this.isDead) {
      return false;
    }
    this.moved = false;

    if (this.lifeTimeMS != 0) {
      if (Date.now() - this.createAt >= this.lifeTimeMS) {
        this.isDead = true;
        this.SetState(OBJ_STATE.DEAD);
        return true;
      }
    }

    return true;

    // console.log("player", this.force.getMagnitude(), this.state);
  }

  AfterUpdate() {
    if (this.moved == true) {
      this.SetState(OBJ_STATE.MOVE);
    } else {
      this.SetState(OBJ_STATE.IDLE);
    }
  }

  CanAttack() {
    if (this.state == OBJ_STATE.IDLE || this.state == OBJ_STATE.MOVE)
      return true;

    return false;
  }

  CanMove() {
    if (this.type == "wall") return false;

    if (this.state == OBJ_STATE.IDLE || this.state == OBJ_STATE.MOVE)
      return true;

    return false;
  }

  MoveableObjectType() {
    if (this.type == "wall") return false;

    return true;
  }

  GetAttackX() {
    const rect = this.GetRect(0, 0);
    switch (this.dir) {
      case DIR.DOWN:
      case DIR.UP:
        return rect.x;
      case DIR.LEFT:
        return rect.x - rect.width / 2;

      case DIR.RIGHT:
        return rect.x + rect.width / 2;
    }
  }

  GetAttackY() {
    const rect = this.GetRect(0, 0);
    switch (this.dir) {
      case DIR.LEFT:
      case DIR.RIGHT:
        return rect.y + rect.height;
      case DIR.UP:
        return rect.y + rect.height / 2;

      case DIR.DOWN:
        return rect.y + rect.height + rect.height / 2;
    }
  }

  GetDirXY() {
    switch (this.dir) {
      case DIR.DOWN:
        return [0, 1];
      case DIR.UP:
        return [0, -1];
      case DIR.LEFT:
        return [-1, 0];
      case DIR.RIGHT:
        return [1, 0];
    }
  }
}
