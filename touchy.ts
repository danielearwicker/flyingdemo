
interface TouchEvent extends UIEvent {
    touches: { pageX: number; pageY: number; }[];    
}

interface Element {
    innerHTML: string;
}

function log(touches: { pageX: number; pageY: number; }[]) {
    var ar = [];
    for (var n = 0; n < touches.length; n++) {
        ar.push(touches[n]);
    }
    touches = ar;
    
    var div = document.querySelector('.viewport');    
    div.innerHTML = 
        '<ul>' + 
            touches.map(t => 
                '<li>' + t.pageX + ', ' + t.pageY + '</li>'
            ).join('') +
        '</ul>';
}

function touchy() {
    document.addEventListener("touchstart", (ev: TouchEvent) => {
        log(ev.touches);
        ev.preventDefault();
    });
    document.addEventListener("touchend", (ev: TouchEvent) => {
        log(ev.touches);
        ev.preventDefault();    
    });    
    document.addEventListener("touchmove", (ev: TouchEvent)=> {
        log(ev.touches);
        ev.preventDefault();
    });
    
}
