/// <reference path="three.d.ts"/>

enum KeyCode {
    left = 37,
    up = 38,
    right = 39,
    down = 40,
    space = 32,
    A = 65,
    S = 83,
    X = 88,
    Z = 90
}

enum Control {
    YawLeft,
    YawRight,
    RollLeft,
    RollRight,
    PitchUp,
    PitchDown,
    MainForward,
    MainReverse
}

var controls = [
    { key: KeyCode.left,    selector: '.thruster.yaw.left',     control: Control.YawLeft        },
    { key: KeyCode.right,   selector: '.thruster.yaw.right',    control: Control.YawRight       },
    { key: KeyCode.A,       selector: '.thruster.roll.left',    control: Control.RollLeft       },
    { key: KeyCode.S,       selector: '.thruster.roll.right',   control: Control.RollRight      },
    { key: KeyCode.up,      selector: '.thruster.pitch.up',     control: Control.PitchUp        },
    { key: KeyCode.down,    selector: '.thruster.pitch.down',   control: Control.PitchDown      },
    { key: KeyCode.Z,       selector: '.thruster.main.left',    control: Control.MainForward    },
    { key: KeyCode.X,       selector: '.thruster.main.right',   control: Control.MainReverse    },
];

function getControlStates(): (control: Control) => boolean {
    
    var controlStates: { [c: number]: boolean } = {};
    var controlsByKeyCode: { [k: number]: Control } = {};
    var elementsByControl: { [c: number]: Element } = {};
    
    function update(ctrl: Control, state: boolean) {
        controlStates[ctrl] = state;
        var el = <any>elementsByControl[ctrl];        
        if (state) {
            if (el.className.indexOf('firing') === -1) {
                el.className += ' firing';
            }
        } else {
            el.className = el.className.replace(/firing/, '');
        }
    }
    
    document.addEventListener('keydown', function(ev) {
        update(controlsByKeyCode[ev.keyCode], true);
    });

    document.addEventListener('keyup', function(ev) {
        update(controlsByKeyCode[ev.keyCode], false);
    });

    controls.forEach(function(def) {
        controlsByKeyCode[def.key] = def.control;
        var el = document.querySelector(def.selector);
        elementsByControl[def.control] = el;        
        el.addEventListener("touchstart", function() {
            update(def.control, true);
        });
        el.addEventListener("touchend", function() {
            update(def.control, false);
        });
    });
    
    return ctrl => controlStates[ctrl];
};

function main() {

    var velocity = new THREE.Vector3(0, 0, 0),
        pitch = 0,
        roll = 0,
        yaw = 0;

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
        0, 0, -1,
        -1, -0.3, 1,   
        0, 0.6, 1,    
        1, -0.3,  1
    ];
    var indices = [
         2,  1,  0,
         0,  3,  2,
         1,  3,  0,
         2,  3,  1
    ];
    var ship = new THREE.Mesh(new THREE.PolyhedronGeometry(vertices, indices, 2, 0), material);
    scene.add(ship);

    var camera = new THREE.PerspectiveCamera(75, 
        viewport.clientWidth / viewport.clientHeight, 0.1, 1000);

    camera.position.z = 5;
    
    var overviewSize = 300;
    var overviewCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    overviewCamera.position.z = 50;
    overviewCamera.position.y = 10;
    
    renderer.enableScissorTest(true);
    
    var orientation = new THREE.Quaternion();
    orientation.setFromEuler(camera.rotation);

    var rollAxis = new THREE.Vector3(0, 0, -1),
        pitchAxis = new THREE.Vector3(-1, 0, 0),
        yawAxis = new THREE.Vector3(0, -1, 0);

    function rotate(q: THREE.Quaternion, axis: THREE.Vector3, angle: number) {
        var r = new THREE.Quaternion();
        r.setFromAxisAngle(axis, angle);
        q.multiply(r); 
    }

    var controlStates = getControlStates();
    
    function render() {

        if (controlStates(Control.RollLeft)) {
            roll -= 0.0001;
        } else if (controlStates(Control.RollRight)) {
            roll += 0.0001;
        }
        
        if (controlStates(Control.PitchDown)) {
            pitch -= 0.0001;
        } else if (controlStates(Control.PitchUp)) {
            pitch += 0.0001;
        }

        if (controlStates(Control.YawLeft)) {
            yaw -= 0.0001;
        } else if (controlStates(Control.YawRight)) {
            yaw += 0.0001;
        }

        if (controlStates(Control.MainForward)) {
            var accelleration = new THREE.Vector3(0, 0, -0.0001);
            accelleration.applyQuaternion(orientation);
            velocity.add(accelleration);
            
        } else if (controlStates(Control.MainReverse)) {
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
        
        var w = viewport.clientWidth, 
            h = viewport.clientHeight,
            ol = w - (overviewSize + 10),
            ot = h - (overviewSize + 10);  
        
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