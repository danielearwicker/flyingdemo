/// <reference path="three.d.ts"/>
var KeyCode;
(function (KeyCode) {
    KeyCode[KeyCode["left"] = 37] = "left";
    KeyCode[KeyCode["up"] = 38] = "up";
    KeyCode[KeyCode["right"] = 39] = "right";
    KeyCode[KeyCode["down"] = 40] = "down";
    KeyCode[KeyCode["space"] = 32] = "space";
    KeyCode[KeyCode["A"] = 65] = "A";
    KeyCode[KeyCode["S"] = 83] = "S";
    KeyCode[KeyCode["X"] = 88] = "X";
    KeyCode[KeyCode["Z"] = 90] = "Z";
})(KeyCode || (KeyCode = {}));
var Control;
(function (Control) {
    Control[Control["YawLeft"] = 0] = "YawLeft";
    Control[Control["YawRight"] = 1] = "YawRight";
    Control[Control["RollLeft"] = 2] = "RollLeft";
    Control[Control["RollRight"] = 3] = "RollRight";
    Control[Control["PitchUp"] = 4] = "PitchUp";
    Control[Control["PitchDown"] = 5] = "PitchDown";
    Control[Control["MainForward"] = 6] = "MainForward";
    Control[Control["MainReverse"] = 7] = "MainReverse";
})(Control || (Control = {}));
var controls = [
    { key: 37 /* left */, selector: '.thruster.yaw.left', control: 0 /* YawLeft */ },
    { key: 39 /* right */, selector: '.thruster.yaw.right', control: 1 /* YawRight */ },
    { key: 65 /* A */, selector: '.thruster.roll.left', control: 2 /* RollLeft */ },
    { key: 83 /* S */, selector: '.thruster.roll.right', control: 3 /* RollRight */ },
    { key: 38 /* up */, selector: '.thruster.pitch.up', control: 4 /* PitchUp */ },
    { key: 40 /* down */, selector: '.thruster.pitch.down', control: 5 /* PitchDown */ },
    { key: 90 /* Z */, selector: '.thruster.main.left', control: 6 /* MainForward */ },
    { key: 88 /* X */, selector: '.thruster.main.right', control: 7 /* MainReverse */ },
];
function getControlStates() {
    var controlStates = {};
    var controlsByKeyCode = {};
    var elementsByControl = {};
    function update(ctrl, state) {
        controlStates[ctrl] = state;
        var el = elementsByControl[ctrl];
        if (state) {
            if (el.className.indexOf('firing') === -1) {
                el.className += ' firing';
            }
        }
        else {
            el.className = el.className.replace(/firing/, '');
        }
    }
    document.addEventListener('keydown', function (ev) {
        update(controlsByKeyCode[ev.keyCode], true);
    });
    document.addEventListener('keyup', function (ev) {
        update(controlsByKeyCode[ev.keyCode], false);
    });
    controls.forEach(function (def) {
        controlsByKeyCode[def.key] = def.control;
        var el = document.querySelector(def.selector);
        elementsByControl[def.control] = el;
        el.addEventListener("touchstart", function () {
            update(def.control, true);
        });
        el.addEventListener("touchend", function () {
            update(def.control, false);
        });
    });
    return function (ctrl) { return controlStates[ctrl]; };
}
;
function main() {
    var velocity = new THREE.Vector3(0, 0, 0), pitch = 0, roll = 0, yaw = 0;
    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('black', 0.01);
    var hemiLight = new THREE.HemisphereLight(0xffffff, 1, 1);
    hemiLight.position.set(0, 1, 1);
    scene.add(hemiLight);
    var viewport = document.querySelector('.viewport');
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.autoClear = false;
    viewport.appendChild(renderer.domElement);
    var material = new THREE.MeshPhongMaterial({
        ambient: 0x030303,
        color: 0xdddddd,
        specular: 0x000099,
        shininess: 30,
        shading: THREE.FlatShading
    });
    var count = 20;
    for (var x = -count; x < count; x++) {
        for (var y = -count; y < count; y++) {
            var height = 0.2 + (Math.random() * 2.5);
            var geometry = new THREE.BoxGeometry(0.2, height, 0.2);
            var cube = new THREE.Mesh(geometry, material);
            cube.position.x = x;
            cube.position.y = (height / 2) - 2;
            cube.position.z = y;
            scene.add(cube);
        }
    }
    // Ship-shape!
    var vertices = [
        0,
        0,
        -1,
        -1,
        -0.3,
        1,
        0,
        0.6,
        1,
        1,
        -0.3,
        1
    ];
    var indices = [
        2,
        1,
        0,
        0,
        3,
        2,
        1,
        3,
        0,
        2,
        3,
        1
    ];
    var ship = new THREE.Mesh(new THREE.PolyhedronGeometry(vertices, indices, 2, 0), material);
    scene.add(ship);
    var camera = new THREE.PerspectiveCamera(75, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    var overviewSize = 300;
    var overviewCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    overviewCamera.position.z = 50;
    overviewCamera.position.y = 10;
    renderer.enableScissorTest(true);
    var orientation = new THREE.Quaternion();
    orientation.setFromEuler(camera.rotation);
    var rollAxis = new THREE.Vector3(0, 0, -1), pitchAxis = new THREE.Vector3(-1, 0, 0), yawAxis = new THREE.Vector3(0, -1, 0);
    function rotate(q, axis, angle) {
        var r = new THREE.Quaternion();
        r.setFromAxisAngle(axis, angle);
        q.multiply(r);
    }
    var controlStates = getControlStates();
    function render() {
        if (controlStates(2 /* RollLeft */)) {
            roll -= 0.0001;
        }
        else if (controlStates(3 /* RollRight */)) {
            roll += 0.0001;
        }
        if (controlStates(5 /* PitchDown */)) {
            pitch -= 0.0001;
        }
        else if (controlStates(4 /* PitchUp */)) {
            pitch += 0.0001;
        }
        if (controlStates(0 /* YawLeft */)) {
            yaw -= 0.0001;
        }
        else if (controlStates(1 /* YawRight */)) {
            yaw += 0.0001;
        }
        if (controlStates(6 /* MainForward */)) {
            var accelleration = new THREE.Vector3(0, 0, -0.0001);
            accelleration.applyQuaternion(orientation);
            velocity.add(accelleration);
        }
        else if (controlStates(7 /* MainReverse */)) {
            var accelleration = new THREE.Vector3(0, 0, 0.0001);
            accelleration.applyQuaternion(orientation);
            velocity.add(accelleration);
        }
        rotate(orientation, rollAxis, roll);
        rotate(orientation, pitchAxis, pitch);
        rotate(orientation, yawAxis, yaw);
        camera.rotation.setFromQuaternion(orientation);
        camera.position.add(velocity);
        ship.rotation.copy(camera.rotation);
        ship.position.copy(camera.position);
        requestAnimationFrame(render);
        var w = viewport.clientWidth, h = viewport.clientHeight, ol = w - (overviewSize + 10), ot = h - (overviewSize + 10);
        renderer.setViewport(0, 10, w, h);
        renderer.setScissor(0, 10, w, h);
        renderer.clear();
        ship.visible = false;
        renderer.render(scene, camera);
        renderer.setViewport(ol, ot, overviewSize, overviewSize);
        renderer.setScissor(ol, ot, overviewSize, overviewSize);
        renderer.clear();
        ship.visible = true;
        renderer.render(scene, overviewCamera);
    }
    render();
}
