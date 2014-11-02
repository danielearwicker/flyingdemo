/// <reference path="three.d.ts"/>

interface Touch {
    pageX: number; 
    pageY: number;
}

interface TouchEvent extends UIEvent {
    touches: Touch[];    
}

interface Element {
    innerHTML: string;
}

function touchArray(touches: Touch[]) {
    var ar: Touch[] = [];
    for (var n = 0; n < touches.length; n++) {
        ar.push({ pageX: touches[n].pageX, pageY: touches[n].pageY });
    }
    return ar;
}

function log(touches: Touch[], label: string) {
    
    return;
    var div = document.querySelector('.log');    
    div.innerHTML = '<p>' + label + '</p>' +  
        '<ul>' + 
            touches.map(t => 
                '<li>' + t.pageX + ', ' + t.pageY + '</li>'
            ).join('') +
        '</ul>';
}

function main() {

    var velocity = new THREE.Vector3(0, 0, 0),
        pitch = 0,
        roll = 0,
        yaw = 0;

    var scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2('black', 0.01);

    var hemiLight = new THREE.HemisphereLight(0xffffff, 1, 1);
    hemiLight.position.set(0, 1, 1);
    scene.add(hemiLight);

    var viewport = document.querySelector('.viewport');
    var renderer = new THREE.WebGLRenderer();
    
    renderer.setClearColor(0, 1);
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
    
    var count = 10;
    
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
    overviewCamera.position.z = 30;
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

    var previousTouches: { pageX: number; pageY: number; }[];
        
    document.addEventListener("touchstart", (ev: TouchEvent) => {
        ev.preventDefault();
        var touches = touchArray(ev.touches);
        log(touches, 'start');
        previousTouches = touches;
    });
    document.addEventListener("touchend", (ev: TouchEvent) => {
        ev.preventDefault();
        previousTouches = null;  
    });    
    document.addEventListener("touchmove", (ev: TouchEvent) => {        
        ev.preventDefault();
        var touches = touchArray(ev.touches);
        
        var label = 'move';
        
        if (previousTouches && previousTouches.length == ev.touches.length) {
            
            switch (touches.length) {
                case 1:
                    var o = previousTouches[0],
                        n = touches[0],
                        dx = n.pageX - o.pageX,
                        dy = n.pageY - o.pageY,
                        s = 0.0001;
                    
                    yaw -= dx * s;
                    pitch -= dy * s;
                    
                    label = dx + ', ' + dy;                    
                    break;
                
                case 2:
                    var o1 = previousTouches[0],
                        n1 = touches[0],
                        o2 = previousTouches[1],
                        n2 = touches[1],
                        ox = o1.pageX - o2.pageX,
                        oy = o1.pageY - o2.pageY,
                        nx = n1.pageX - n2.pageX,
                        ny = n1.pageY - n2.pageY,                        
                        oa = Math.atan2(oy, ox),
                        na = Math.atan2(ny, nx),
                        or = Math.sqrt((ox * ox) + (oy * oy)),
                        nr = Math.sqrt((nx * nx) + (ny * ny));
                        
                    label = oa + ', ' + na + ' = ' + (na - oa);
                    
                    var a = (na - oa);
                    if (Math.abs(a) > Math.PI) {
                        if (a > 0) {
                            a -= 2*Math.PI;
                        } else {
                            a += 2*Math.PI;
                        }
                    }
                    
                    roll -= a * 0.05;
                    
                    var accelleration = new THREE.Vector3(0, 0, (nr - or) * -0.0002);
                    accelleration.applyQuaternion(orientation);
                    velocity.add(accelleration);                    
                    break;
            }
        }
        
        log(touches, label);
        
        previousTouches = touches;        
    });
    
    function render() {

        roll *= 0.95;
        pitch *= 0.95;
        yaw *= 0.95;
        
        velocity.multiplyScalar(0.97);
        
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