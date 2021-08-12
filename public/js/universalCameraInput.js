"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalCameraInput = void 0;
const babylonjs_1 = require("babylonjs");
class UniversalCameraInput {
    constructor() {
        this._keysLeft = [65, 37];
        this._keysRight = [68, 39];
        this._sensibility = 0.01;
    }
    //this function must return the class name of the camera, it could be used for serializing your scene
    getClassName() {
        return "UniversalCameraInput";
    }
    //this function must return the simple name that will be injected in the input manager as short hand
    //for example "mouse" will turn into camera.inputs.attached.mouse
    getSimpleName() {
        return "CameraInput";
    }
    //this function must activate your input, event if your input does not need a DOM element
    attachControl(noPreventDefault) {
        this._noPreventDefault = noPreventDefault !== null && noPreventDefault !== void 0 ? noPreventDefault : false;
        var engine = this.camera.getEngine();
        var element = engine.getInputElement();
        if (!this._onKeyDown) {
            element.tabIndex = 1;
            element.addEventListener("keydown", this._onKeyDown, false);
            element.addEventListener("keyup", this._onKeyUp, false);
            babylonjs_1.Tools.RegisterTopRootEvents(window, [{ name: "blur", handler: this._onLostFocus }]);
        }
    }
    //detach control must deactivate your input and release all pointers, closures or event listeners
    detachControl() {
        var engine = this.camera.getEngine();
        var element = engine.getInputElement();
        if (this._onKeyDown) {
            element.removeEventListener("keydown", this._onKeyDown);
            element.removeEventListener("keyup", this._onKeyUp);
            babylonjs_1.Tools.UnregisterTopRootEvents(window, [{ name: "blur", handler: this._onLostFocus }]);
            this._keys = [];
            this._onKeyDown = null;
            this._onKeyUp = null;
        }
    }
    //this optional function will get called for each rendered frame, if you want to synchronize your input to rendering,
    //no need to use requestAnimationFrame. It's a good place for applying calculations if you have to
    checkInputs() {
        if (this._onKeyDown) {
            var camera = this.camera;
            // Keyboard
            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];
                if (this._keysLeft.indexOf(keyCode) !== -1) {
                    camera.cameraRotation.y += this._sensibility;
                }
                else if (this._keysRight.indexOf(keyCode) !== -1) {
                    camera.cameraRotation.y -= this._sensibility;
                }
            }
        }
    }
    _onLostFocus() {
        this._keys = [];
    }
    _onKeyDown(evt) {
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
    _onKeyUp(evt) {
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
exports.UniversalCameraInput = UniversalCameraInput;
//# sourceMappingURL=universalCameraInput.js.map