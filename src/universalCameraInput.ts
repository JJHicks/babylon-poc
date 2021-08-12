import { ICameraInput, UniversalCamera, FreeCamera, Tools } from "babylonjs";

export class UniversalCameraInput implements ICameraInput<FreeCamera>{
    // the input manager will fill the parent camera
    public camera: FreeCamera;
    
    private _keys: number[];
    private _keysLeft: number[];
    private _keysRight: number[];
    private _sensibility: number;
    private _noPreventDefault: boolean;

    constructor(){
        this._keysLeft = [65, 37];
        this._keysRight = [68, 39];
        this._sensibility = 0.01;
    }

    //this function must return the class name of the camera, it could be used for serializing your scene
    public getClassName(): string{
        return "UniversalCameraInput";
    }

    //this function must return the simple name that will be injected in the input manager as short hand
    //for example "mouse" will turn into camera.inputs.attached.mouse
    public getSimpleName(): string{
        return "CameraInput";
    }

    //this function must activate your input, event if your input does not need a DOM element
    public attachControl(noPreventDefault?: boolean): void{
        this._noPreventDefault = noPreventDefault ?? false;
        var engine = this.camera.getEngine();
        var element = engine.getInputElement();

        if (!this._onKeyDown) {

            element.tabIndex = 1;

            element.addEventListener("keydown", this._onKeyDown, false);
            element.addEventListener("keyup", this._onKeyUp, false);
            Tools.RegisterTopRootEvents(window, [{ name: "blur", handler: this._onLostFocus }]);
        }
    }

    //detach control must deactivate your input and release all pointers, closures or event listeners
    public detachControl(): void{
        var engine = this.camera.getEngine();
        var element = engine.getInputElement();
        if (this._onKeyDown) {
          element.removeEventListener("keydown", this._onKeyDown);
          element.removeEventListener("keyup", this._onKeyUp);
          Tools.UnregisterTopRootEvents(window, [{ name: "blur", handler: this._onLostFocus }]);
          this._keys = [];
          this._onKeyDown = null;
          this._onKeyUp = null;
        }
    }

    //this optional function will get called for each rendered frame, if you want to synchronize your input to rendering,
    //no need to use requestAnimationFrame. It's a good place for applying calculations if you have to
    public checkInputs(): void{
        if (this._onKeyDown) {
            var camera = this.camera;
            // Keyboard
            for (var index = 0; index < this._keys.length; index++) {
              var keyCode = this._keys[index];
              if (this._keysLeft.indexOf(keyCode) !== -1) {
                camera.cameraRotation.y += this._sensibility;
              } else if (this._keysRight.indexOf(keyCode) !== -1) {
                camera.cameraRotation.y -= this._sensibility;
              }
            }
          }
    }

    private _onLostFocus(){
        this._keys = [];
    }

    private _onKeyDown(evt : KeyboardEvent){
        if (this._keysLeft.indexOf(evt.keyCode) !== -1 || this._keysRight.indexOf(evt.keyCode) !== -1) {
            var index = this._keys.indexOf(evt.keyCode);
            if (index === -1) {
                this._keys.push(evt.keyCode);
            }
            if (!this._noPreventDefault) {
                evt.preventDefault();
            }
        }
    }

    private _onKeyUp(evt: KeyboardEvent){
        if (this._keysLeft.indexOf(evt.keyCode) !== -1 || this._keysRight.indexOf(evt.keyCode) !== -1) {
            var index = this._keys.indexOf(evt.keyCode);
            if (index >= 0) {
                this._keys.splice(index, 1);
            }
            if (!this._noPreventDefault) {
                evt.preventDefault();
            }
        }
    }
}