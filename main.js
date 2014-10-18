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

function getKeyStates() {
    var keyStates = [];

    document.addEventListener('keydown', function (ev) {
        keyStates[ev.keyCode] = true;
    });

    document.addEventListener('keyup', function (ev) {
        keyStates[ev.keyCode] = false;
    });

    return function (key) {
        return keyStates[key];
    };
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

    for (var x = -20; x < 20; x++) {
        for (var y = -20; y < 20; y++) {
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
        0, 0, -1,
        -1, -0.3, 1,
        0, 0.6, 1,
        1, -0.3, 1
    ];
    var indices = [
        2, 1, 0,
        0, 3, 2,
        1, 3, 0,
        2, 3, 1
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

    var keyStates = getKeyStates();

    function render() {
        if (keyStates(65 /* A */)) {
            roll -= 0.0001;
        } else if (keyStates(83 /* S */)) {
            roll += 0.0001;
        }

        if (keyStates(40 /* down */)) {
            pitch -= 0.0001;
        } else if (keyStates(38 /* up */)) {
            pitch += 0.0001;
        }

        if (keyStates(37 /* left */)) {
            yaw -= 0.0001;
        } else if (keyStates(39 /* right */)) {
            yaw += 0.0001;
        }

        if (keyStates(88 /* X */)) {
            var accelleration = new THREE.Vector3(0, 0, -0.0001);
            accelleration.applyQuaternion(orientation);
            velocity.add(accelleration);
        } else if (keyStates(90 /* Z */)) {
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
