import Texture from "./Texture";

export default class CubeMap extends Texture {
  private sidesLoaded: number;

  constructor(
    gl: WebGL2RenderingContext,
    useMipMap: boolean = true,
    internalFormat: number = gl.RGBA,
    format: number = gl.RGBA,
    dataStorageType: number = gl.UNSIGNED_BYTE,
    textureTarget: number = gl.TEXTURE_CUBE_MAP
  ) {
    super(
      gl,
      useMipMap,
      internalFormat,
      format,
      dataStorageType,
      textureTarget
    );

    this.setTexParameterI(this.gl.TEXTURE_WRAP_R, gl.REPEAT);
    this.sidesLoaded = 0;
  }

  /**
   *
   * @param data - the data to set for the texture
   * @param width - width of the texture
   * @param height - height of the texture
   * @param face - cubemap face to set, leave empty to set data for all faces
   */
  setTextureData(
    data: Uint8Array,
    width: number,
    height: number,
    face?: number
  ) {
    this.width = width;
    this.height = height;
    this.gl.bindTexture(this.textureTarget, this.texture);

    if (face == undefined) {
      // Face not specified, set the data for all sides
      for (let i = 0; i < 6; i++) {
        this.gl.texImage2D(
          this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
          0,
          this.internalFormat,
          this.width,
          this.height,
          0,
          this.format,
          this.dataStorageType,
          data
        );
      }
    } else {
      // Face specified, set data for the specified face
      this.gl.texImage2D(
        face,
        0,
        this.internalFormat,
        this.width,
        this.height,
        0,
        this.format,
        this.dataStorageType,
        data
      );
    }

    // Unbind texture
    this.gl.bindTexture(this.textureTarget, null);
  }

  loadCubemap(URLs: [string, string, string, string, string, string]) {
    for (let i = 0; i < URLs.length; i++) {
      let image = new Image();
      image.crossOrigin = "";
      image.src = URLs[i];
      let self = this;
      image.addEventListener("load", function () {
        // Now that the image has loaded copy it to the texture and save the width/height.
        self.width = image.width;
        self.height = image.height;
        self.gl.bindTexture(self.textureTarget, self.texture);
        self.gl.texImage2D(
          self.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
          0,
          self.internalFormat,
          self.format,
          self.dataStorageType,
          image
        );
        self.sidesLoaded++;
        if (self.sidesLoaded >= 6) {
          self.loadedFromFile = true;
          if (self.useMipMap) {
            self.gl.generateMipmap(self.textureTarget);
            self.gl.texParameteri(
              self.textureTarget,
              self.gl.TEXTURE_MIN_FILTER,
              self.gl.LINEAR_MIPMAP_LINEAR
            );
          }
        }
      });
    }
  }
}
