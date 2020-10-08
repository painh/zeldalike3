class Goblin extends GameObject {
  toLine: Phaser.Graphics;
  tx: number;
  ty: number;
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
    super(game, objX, objY, width, height, name, type, frame, owner);

    this.tx = this.x;
    this.ty = this.y;

    this.toLine = game.add.graphics(0, 0);
    this.DrawTargetLine(0x00ff00);
  }

  Update() {
    let prevMoved = this.moved;
    if (!super.Update()) return false;

    if (this.tx == this.x && this.ty == this.y) {
      prevMoved = false;
    }

    if (prevMoved == false) {
      const dir = getRandomInt(0, 4);
      let x = 0;
      let y = 0;
      switch (dir) {
        case DIR.DOWN:
          y = 5;
          this.SetDir(DIR.DOWN);
          break;
        case DIR.LEFT:
          x = -5;
          this.SetDir(DIR.LEFT);
          break;
        case DIR.RIGHT:
          x = 5;
          this.SetDir(DIR.RIGHT);
          break;
        case DIR.UP:
          y = -5;
          this.SetDir(DIR.UP);
          break;
      }

      x *= TILE_SIZE;
      y *= TILE_SIZE;
      x += this.x;
      y += this.y;
      this.tx = x;
      this.ty = y;

      this.DrawTargetLine(0x0000ff);
    }

    this.AddForce(
      this.GetDirXY()[0],
      this.GetDirXY()[1],
      this,
      "move to ",
      false
    );

    return true;
  }

  DrawTargetLine(color) {
    // console.log("draw line", this.x, this.y, this.tx, this.ty);
    this.toLine.clear();
    this.toLine.lineStyle(1, color, 1);

    this.toLine.moveTo(this.x, this.y);
    this.toLine.lineTo(this.tx, this.ty);
  }
}
